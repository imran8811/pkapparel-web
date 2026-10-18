"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";
import type { AdminColor, AdminProduct } from "@/lib/admin/types";

/*
 * Styles of the wholesale shop and their colors. Prices are typed in dollars and sent
 * in cents; carton sizes in cm and kg are sent in mm and grams.
 */

/** "5.20" → 520, "" → null */
function cents(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

/** Multiplies a decimal field (cm → mm, kg → g); empty stays empty. */
function scaled(form: FormData, name: string, factor: number): number | null {
  const value = number(form, name);
  return value === null ? null : Math.round(value * factor);
}

/** Field names in the form differ from the API's where units differ. */
const FIELD_NAMES: Record<string, string> = {
  price_cents: "price",
  sample_price_cents: "sample_price",
  carton_length_mm: "carton_length",
  carton_width_mm: "carton_width",
  carton_height_mm: "carton_height",
  carton_weight_g: "carton_weight",
};

function renameFields(state: FormState): FormState {
  if (!state.fields) return state;
  const fields: Record<string, string> = {};
  for (const [name, message] of Object.entries(state.fields)) {
    fields[name.startsWith("tiers") ? "tiers" : (FIELD_NAMES[name] ?? name)] = message;
  }
  return { ...state, fields };
}

export async function saveProduct(_previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  const price = cents(text(form, "price"));
  const samplePrice = cents(text(form, "sample_price"));
  if (Number.isNaN(price) || Number.isNaN(samplePrice)) {
    return failure("Please check the highlighted fields.", {
      ...(Number.isNaN(price) ? { price: "Enter a price like 5.20" } : {}),
      ...(Number.isNaN(samplePrice) ? { sample_price: "Enter a price like 50.00" } : {}),
    });
  }

  const tiers = jsonList<{ min_qty: string; price: string }>(form, "tiers")
    .filter((tier) => String(tier.min_qty ?? "").trim() !== "" || String(tier.price ?? "").trim() !== "")
    .map((tier) => ({ min_qty: Number(tier.min_qty), price_cents: cents(String(tier.price ?? "")) }));

  const body = {
    name: text(form, "name"),
    slug: optional(form, "slug"),
    style_no: optional(form, "style_no"),
    segment: text(form, "segment"),
    product_type: text(form, "product_type"),
    status: text(form, "status") || "draft",
    is_featured: checked(form, "is_featured"),
    sort_order: number(form, "sort_order") ?? 0,
    fit: optional(form, "fit"),
    fabric: optional(form, "fabric"),
    composition: optional(form, "composition"),
    fabric_weight: optional(form, "fabric_weight"),
    stretch: optional(form, "stretch"),
    wash: optional(form, "wash"),
    closure: optional(form, "closure"),
    description_html: text(form, "description_html"),
    features: text(form, "features").split("\n"),
    sizes: text(form, "sizes").split(/[,;\n]/).map((size) => size.trim()).filter(Boolean),
    size_chart_id: number(form, "size_chart_id"),
    price_cents: price,
    tiers,
    moq_per_color: number(form, "moq_per_color"),
    set_pcs_per_size: number(form, "set_pcs_per_size"),
    min_pcs_per_size: number(form, "min_pcs_per_size"),
    lead_time_days: number(form, "lead_time_days"),
    sample_price_cents: samplePrice,
    piece_weight_g: number(form, "piece_weight_g"),
    pcs_per_carton: number(form, "pcs_per_carton"),
    carton_length_mm: scaled(form, "carton_length", 10),
    carton_width_mm: scaled(form, "carton_width", 10),
    carton_height_mm: scaled(form, "carton_height", 10),
    carton_weight_g: scaled(form, "carton_weight", 1000),
    seo_title: optional(form, "seo_title"),
    seo_description: optional(form, "seo_description"),
  };

  let product: AdminProduct;
  try {
    product = await adminApi<AdminProduct>(id ? `/v1/admin/products/${id}` : "/v1/admin/products", { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return renameFields(errorState(error));
  }

  updateTag("products");
  updateTag(`product:${product.slug}`);
  const previousSlug = text(form, "original_slug");
  if (previousSlug && previousSlug !== product.slug) updateTag(`product:${previousSlug}`);

  if (!id) return { ...success("Style created. Now add its colors and photos."), redirectTo: `/admin/products/${product.id}` };
  return success(product.status === "active" ? "Style saved and shown in the shop." : "Style saved.");
}

export async function deleteProduct(id: number, slug: string): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This style does not exist.");
  try {
    await adminApi(`/v1/admin/products/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  updateTag("products");
  updateTag(`product:${slug}`);
  redirect("/admin/products");
}

export async function saveColor(productId: number, productSlug: string, _previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  const price = cents(text(form, "price"));
  if (Number.isNaN(price)) return failure("Please check the highlighted fields.", { price: "Enter a price like 5.20, or leave it empty." });

  const body = {
    code: text(form, "code"),
    name: text(form, "name"),
    hex: optional(form, "hex"),
    price_cents: price,
    is_active: checked(form, "is_active"),
    sort_order: number(form, "sort_order"),
    spec_overrides: {
      fabric: optional(form, "spec_fabric"),
      composition: optional(form, "spec_composition"),
      fabric_weight: optional(form, "spec_fabric_weight"),
      stretch: optional(form, "spec_stretch"),
      wash: optional(form, "spec_wash"),
      closure: optional(form, "spec_closure"),
    },
    images: jsonList<{ path: string; alt: string }>(form, "images"),
  };

  let color: AdminColor;
  try {
    color = await adminApi<AdminColor>(id ? `/v1/admin/product-colors/${id}` : `/v1/admin/products/${productId}/colors`, {
      method: id ? "PUT" : "POST",
      body,
    });
  } catch (error) {
    const state = errorState(error);
    if (state.fields?.price_cents) state.fields.price = state.fields.price_cents;
    return state;
  }

  updateTag("products");
  updateTag(`product:${productSlug}`);
  return success(id ? `${color.name} saved.` : `${color.name} added.`);
}

export async function deleteColor(id: number, productSlug: string): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This color does not exist.");
  try {
    await adminApi(`/v1/admin/product-colors/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  updateTag("products");
  updateTag(`product:${productSlug}`);
  return success("Color deleted.");
}
