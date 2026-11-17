"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, firstColor, firstColorField, firstColorProblems, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";
import type { AdminStockColor, AdminStockDepartment, AdminStockStyle, StockCopied, StockImportResult, StockListingImportResult } from "@/lib/admin/types";
import { setsInStock } from "@/lib/stock";

/*
 * Stock listings (one color each), their color and its stock, and the departments and categories they are in. Prices
 * are typed in rupees and sent in paisa (rupees × 100).
 */

/** "6,000" → 600000, "" → null */
function paisa(value: string): number | null {
  const cleaned = value.replace(/^rs\.?/i, "").replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

/** The API's "specs.fit" is the form's "spec_fit", and its "piece_price_cents" the form's "piece_price". */
function renameFields(state: FormState): FormState {
  if (!state.fields) return state;
  const fields: Record<string, string> = {};
  for (const [name, message] of Object.entries(state.fields)) {
    const spec = /^specs\.(\w+)$/.exec(name)?.[1];
    fields[firstColorField(name) ?? (spec ? `spec_${spec}` : name === "piece_price_cents" ? "piece_price" : name)] = message;
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
  // Prices are per piece; the API makes the set's price from its pieces.
  const price = paisa(text(form, "piece_price"));
  const badPrice = price === null || Number.isNaN(price);
  // A new listing is shown on the stock pages as soon as it is created, so it needs its color with a photo.
  const colorProblems = id ? null : firstColorProblems(form);
  if (badPrice || colorProblems) {
    return failure("Please check the highlighted fields.", {
      ...colorProblems,
      ...(badPrice ? { piece_price: "Enter the price of one piece in rupees, like 980." } : {}),
    });
  }

  const body = {
    name: text(form, "name"),
    slug: optional(form, "slug"),
    style_no: optional(form, "style_no"),
    segment: text(form, "segment"),
    category: text(form, "category"),
    specs: specFields(form),
    description_html: text(form, "description_html"),
    set_sizes: jsonList<{ size: string; pcs: number }>(form, "set_sizes"),
    piece_price_cents: price,
    seo_title: optional(form, "seo_title"),
    seo_description: optional(form, "seo_description"),
    status: optional(form, "status") ?? undefined,
    is_featured: checked(form, "is_featured"),
    sort_order: number(form, "sort_order") ?? 0,
    // A new listing's color with its photos and stock, if filled in.
    ...(id ? {} : { color: firstColor(form) }),
  };

  let style: AdminStockStyle;
  try {
    style = await adminApi<AdminStockStyle>(id ? `/v1/admin/stock/styles/${id}` : "/v1/admin/stock/styles", { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return renameFields(errorState(error));
  }

  refreshStock(style.slug, text(form, "original_slug"));
  if (!id) {
    const message =
      style.status === "active" ? "Listing created and shown on the stock pages." : "Listing created as a draft. Add its color with a photo, then show it on the stock pages.";
    // Back to the stock list, where the new listing now shows.
    return { ...success(message), redirectTo: "/admin/stock" };
  }
  // Renamed: a web address made from the name follows it.
  const previousSlug = text(form, "original_slug");
  const moved = previousSlug && previousSlug !== style.slug ? ` New web address: ${style.slug}.` : "";
  return success(`${style.status === "active" ? "Listing saved and shown on the stock pages." : "Listing saved."}${moved}`);
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

export type StockListingImportOutcome = { ok: true; result: StockListingImportResult } | { ok: false; message: string };

/** Reads a file of new listings: the listings it would create, and its problems. Nothing is created yet. */
export async function previewStockListingImport(csv: string): Promise<StockListingImportOutcome> {
  return stockListingImport(csv, false);
}

/** Creates the file's listings, as drafts (only when no line has a problem). */
export async function applyStockListingImport(csv: string): Promise<StockListingImportOutcome> {
  const outcome = await stockListingImport(csv, true);
  if (outcome.ok && outcome.result.applied) {
    updateTag("stock");
    refresh();
  }
  return outcome;
}

async function stockListingImport(csv: string, apply: boolean): Promise<StockListingImportOutcome> {
  if (csv.trim() === "") return { ok: false, message: "The file is empty." };
  try {
    return {
      ok: true,
      result: await adminApi<StockListingImportResult>("/v1/admin/stock/import-listings", { method: "POST", body: { csv, apply }, timeoutMs: 60_000 }),
    };
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

/* ----- Departments and categories ----- */

type SectionKind = "departments" | "categories";

/** Adds a department or category (its web address is made from the name unless one is typed), or renames one. */
async function saveSection(kind: SectionKind, form: FormData, fields: Record<string, unknown>): Promise<FormState> {
  const id = number(form, "id");
  const body = { name: text(form, "name"), ...(id ? {} : { slug: optional(form, "slug") }), sort_order: number(form, "sort_order"), ...fields };

  let saved: AdminStockDepartment;
  try {
    saved = await adminApi<AdminStockDepartment>(id ? `/v1/admin/stock/${kind}/${id}` : `/v1/admin/stock/${kind}`, { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return errorState(error);
  }
  // The stock pages' menus, titles and filters change with it.
  updateTag("stock");
  refresh();
  return success(`${saved.name} ${id ? "saved" : "added"}.`);
}

async function deleteSection(kind: SectionKind, id: number): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("Not found.");
  try {
    await adminApi(`/v1/admin/stock/${kind}/${id}`, { method: "DELETE" });
  } catch (error) {
    // 409: it has listings, it is the stock home page, or it is the last one.
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    return errorState(error);
  }
  updateTag("stock");
  refresh();
  return success(kind === "departments" ? "Department deleted." : "Category deleted.");
}

export async function saveStockDepartment(_previous: FormState, form: FormData): Promise<FormState> {
  return saveSection("departments", form, {});
}

export async function deleteStockDepartment(id: number): Promise<FormState> {
  return deleteSection("departments", id);
}

/** A category also has the product type whose specs its listings have. */
export async function saveStockCategory(_previous: FormState, form: FormData): Promise<FormState> {
  return saveSection("categories", form, { product_type: text(form, "product_type") });
}

export async function deleteStockCategory(id: number): Promise<FormState> {
  return deleteSection("categories", id);
}
