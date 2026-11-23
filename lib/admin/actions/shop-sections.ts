"use server";

import { refresh, updateTag } from "next/cache";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, number, optional, success, text, type FormState } from "@/lib/admin/forms";

/*
 * The wholesale shop's departments and categories (Admin → Shop categories, owner request 2026-11-23). Adding one adds
 * shop pages and removing one removes them (their addresses then redirect), so each change refreshes the shop's menus
 * and pages ("categories"), its styles ("products": a style's details follow its category) and the redirects.
 */

type SectionKind = "departments" | "categories";

/** Adds a department or category (its web address is made from the name unless one is typed), or changes one. */
async function saveSection(kind: SectionKind, form: FormData, fields: Record<string, unknown>): Promise<FormState> {
  const id = number(form, "id");
  const body = { name: text(form, "name"), ...(id ? {} : { slug: optional(form, "slug") }), sort_order: number(form, "sort_order"), ...fields };

  let saved: { name: string };
  try {
    saved = await adminApi<{ name: string }>(id ? `/v1/admin/shop/${kind}/${id}` : `/v1/admin/shop/${kind}`, { method: id ? "PUT" : "POST", body });
  } catch (error) {
    return errorState(error);
  }
  refreshShop();
  return success(`${saved.name} ${id ? "saved" : "added"}.`);
}

async function deleteSection(kind: SectionKind, id: number): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("Not found.");
  try {
    await adminApi(`/v1/admin/shop/${kind}/${id}`, { method: "DELETE" });
  } catch (error) {
    // 409: it has styles, it is the last one, a category is only sold in this department, or an add-on is only for it.
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    return errorState(error);
  }
  refreshShop();
  return success(kind === "departments" ? "Department deleted." : "Category deleted.");
}

function refreshShop(): void {
  updateTag("categories");
  updateTag("products");
  updateTag("redirects");
  refresh();
}

/** A department also has its name in titles ("Men's"); left empty, the API makes it from the name. */
export async function saveShopDepartment(_previous: FormState, form: FormData): Promise<FormState> {
  return saveSection("departments", form, { possessive: optional(form, "possessive") });
}

export async function deleteShopDepartment(id: number): Promise<FormState> {
  return deleteSection("departments", id);
}

/** A category also has the kind whose details and sizes its styles have, and the departments that sell it. */
export async function saveShopCategory(_previous: FormState, form: FormData): Promise<FormState> {
  const departments = form.getAll("departments").filter((value): value is string => typeof value === "string");
  return saveSection("categories", form, { kind: text(form, "kind"), departments });
}

export async function deleteShopCategory(id: number): Promise<FormState> {
  return deleteSection("categories", id);
}
