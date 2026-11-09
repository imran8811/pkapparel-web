"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";
import type { AdminStockColor, AdminStockStyle, StockCopied, StockImportResult } from "@/lib/admin/types";
import { setsInStock } from "@/lib/stock";

/*
 * Stock listings (one color each), their color and its stock. Prices are typed in rupees and sent in paisa (rupees × 100).
 */

/** "6,000" → 600000, "" → null */
function paisa(value: string): number | null {
  const cleaned = value.replace(/^rs\.?/i, "").replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

/** The API's "specs.fit" is the form's "spec_fit", and its "set_price_cents" the form's "set_price". */
function renameFields(state: FormState): FormState {
  if (!state.fields) return state;
  const fields: Record<string, string> = {};
  for (const [name, message] of Object.entries(state.fields)) {
    const spec = /^specs\.(\w+)$/.exec(name)?.[1];
    fields[spec ? `spec_${spec}` : name === "set_price_cents" ? "set_price" : name] = message;
  }
  return { ...state, fields };
}

/** The form's spec_* fields as {key: value or null}. */
function specFields(form: FormData): Record<string, string | null> {
  const keys = new Set([...form.keys()].filter((key) => key.startsWith("spec_")));
  return Object.fromEntries([...keys].map((key) => [key.slice("spec_".length), optional(form, key)]));
}

function refreshStock(...slugs: string[]) {
  updateTag("stock");
  for (const slug of new Set(slugs.filter(Boolean))) updateTag(`stock:${slug}`);
}

export async function saveStockStyle(_previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  const price = paisa(text(form, "set_price"));
  if (price === null || Number.isNaN(price)) {
    return failure("Please check the highlighted fields.", { set_price: "Enter the price of one set in rupees, like 6000." });
  }

  const body = {
    name: text(form, "name"),
    slug: optional(form, "slug"),
    style_no: optional(form, "style_no"),
    segment: text(form, "segment"),
    specs: specFields(form),
    description_html: text(form, "description_html"),
    set_sizes: jsonList<{ size: string; pcs: number }>(form, "set_sizes"),
    set_price_cents: price,
    seo_title: optional(form, "seo_title"),
    seo_description: optional(form, "seo_description"),
    status: optional(form, "status") ?? undefined,
    is_featured: checked(form, "is_featured"),
    sort_order: number(form, "sort_order") ?? 0,
  };

  let style: AdminStockStyle;
  try {
    style = await adminApi<AdminStockStyle>(id ? `/v1/admin/stock/styles/${id}` : "/v1/admin/stock/styles", { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return renameFields(errorState(error));
  }

  refreshStock(style.slug, text(form, "original_slug"));
  if (!id) return { ...success("Style created. Now add its colors, photos and stock."), redirectTo: `/admin/stock/${style.id}` };
  return success(style.status === "active" ? "Style saved and shown on the stock pages." : "Style saved.");
}

export async function deleteStockStyle(id: number, slug: string): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This style does not exist.");
  try {
    await adminApi(`/v1/admin/stock/styles/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  refreshStock(slug);
  redirect("/admin/stock");
}

export async function saveStockColor(styleId: number, styleSlug: string, _previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  const body: Record<string, unknown> = {
    code: text(form, "code"),
    name: text(form, "name"),
    hex: optional(form, "hex"),
    is_active: checked(form, "is_active"),
    sort_order: number(form, "sort_order"),
    images: jsonList<{ path: string; alt: string }>(form, "images"),
  };
  if (!id) {
    const opening = number(form, "sets_in_stock");
    if (opening !== null && (!Number.isInteger(opening) || opening < 0)) {
      return failure("Please check the highlighted fields.", { sets_in_stock: "Enter a whole number of sets, or leave it empty." });
    }
    body.sets_in_stock = opening ?? 0;
  }

  let color: AdminStockColor;
  try {
    color = await adminApi<AdminStockColor>(id ? `/v1/admin/stock/colors/${id}` : `/v1/admin/stock/styles/${styleId}/colors`, {
      method: id ? "PUT" : "POST",
      body,
    });
  } catch (error) {
    return errorState(error);
  }

  refreshStock(styleSlug);
  return success(id ? `${color.name} saved.` : `${color.name} added.`);
}

export async function deleteStockColor(id: number, styleSlug: string): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This color does not exist.");
  try {
    await adminApi(`/v1/admin/stock/colors/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  refreshStock(styleSlug);
  return success("Color deleted.");
}

/** Sets received, returned, sold or damaged, or (a correction) the number of sets counted. */
export async function changeStock(colorId: number, styleSlug: string, _previous: FormState, form: FormData): Promise<FormState> {
  const sets = number(form, "sets");
  if (sets === null || !Number.isInteger(sets) || sets < 0) {
    return failure("Please check the highlighted fields.", { sets: "Enter a whole number of sets." });
  }

  let color: AdminStockColor;
  try {
    color = await adminApi<AdminStockColor>(`/v1/admin/stock/colors/${colorId}/stock`, {
      method: "POST",
      body: { reason: text(form, "reason"), sets, note: optional(form, "note") },
    });
  } catch (error) {
    return errorState(error);
  }

  refreshStock(styleSlug);
  return success(`${color.name}: ${setsInStock(color.sets_in_stock).toLowerCase()}.`);
}

export type StockImportOutcome = { ok: true; result: StockImportResult } | { ok: false; message: string };

/** Reads a stock count file: what it would change, and its problems. Nothing changes yet. */
export async function previewStockImport(csv: string): Promise<StockImportOutcome> {
  return stockImport(csv, false);
}

/** Makes the file's counts the stock (only when no line has a problem). */
export async function applyStockImport(csv: string): Promise<StockImportOutcome> {
  const outcome = await stockImport(csv, true);
  if (outcome.ok && outcome.result.applied) {
    // Every stock page shows the new counts (all style pages carry the "stock" tag too).
    updateTag("stock");
    refresh();
  }
  return outcome;
}

async function stockImport(csv: string, apply: boolean): Promise<StockImportOutcome> {
  if (csv.trim() === "") return { ok: false, message: "The file is empty." };
  try {
    return { ok: true, result: await adminApi<StockImportResult>("/v1/admin/stock/import", { method: "POST", body: { csv, apply }, timeoutMs: 30_000 }) };
  } catch (error) {
    const state = errorState(error);
    return { ok: false, message: Object.values(state.fields ?? {})[0] ?? state.message ?? "The file could not be read." };
  }
}

export type StockCopyOutcome = { ok: true; copied: StockCopied[] } | { ok: false; message: string };

/**
 * Copies the chosen wholesale colors into the stock, a listing each (shown, without a price or stock yet), and shows
 * earlier hidden copies.
 */
export async function copyFromWholesale(colorIds: number[]): Promise<StockCopyOutcome> {
  const ids = colorIds.filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return { ok: false, message: "Tick the colors to copy." };
  try {
    const { copied } = await adminApi<{ copied: StockCopied[] }>("/v1/admin/stock/from-wholesale", {
      method: "POST",
      body: { color_ids: ids },
      timeoutMs: 120_000,
    });
    // The copies are on the stock pages (all of them carry the "stock" tag).
    updateTag("stock");
    refresh();
    return { ok: true, copied };
  } catch (error) {
    const state = errorState(error);
    return { ok: false, message: Object.values(state.fields ?? {})[0] ?? state.message ?? "The colors could not be copied." };
  }
}
