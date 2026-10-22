"use server";

import { refresh, updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";

/* Size charts and the texts of the shop's category pages. */

export async function saveSizeChart(_previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  const body = {
    name: text(form, "name"),
    size_system: text(form, "size_system"),
    unit: text(form, "unit"),
    note: optional(form, "note"),
    measurements: jsonList<string>(form, "measurements"),
    size_rows: jsonList<{ size: string; values: string[] }>(form, "size_rows"),
  };

  try {
    await adminApi(id ? `/v1/admin/size-charts/${id}` : "/v1/admin/size-charts", { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return errorState(error);
  }
  updateTag("products");
  refresh(); // the list of charts is admin data
  return success(id ? "Size chart saved." : "Size chart added.");
}

export async function deleteSizeChart(id: number): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This size chart does not exist.");
  try {
    await adminApi(`/v1/admin/size-charts/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  updateTag("products");
  refresh();
  return success("Size chart deleted.");
}

export async function saveShopCategory(id: number, _previous: FormState, form: FormData): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This page does not exist.");

  try {
    await adminApi(`/v1/admin/categories/${id}`, {
      method: "PUT",
      body: {
        title: text(form, "title"),
        intro_html: text(form, "intro_html"),
        faq: jsonList<{ question: string; answer: string }>(form, "faq"),
        seo_title: optional(form, "seo_title"),
        seo_description: optional(form, "seo_description"),
      },
    });
  } catch (error) {
    return errorState(error);
  }
  updateTag("categories");
  return success("Page text saved.");
}
