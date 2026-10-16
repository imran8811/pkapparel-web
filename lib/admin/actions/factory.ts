"use server";

import { updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, jsonList, number, success, text, type FormState } from "@/lib/admin/forms";

/** Saves a factory department: text, numbers and photos. */
export async function saveDepartment(slug: string, _previous: FormState, form: FormData): Promise<FormState> {
  if (!/^[a-z0-9-]+$/.test(slug)) return failure("This department does not exist.");

  try {
    await adminApi(`/v1/admin/factory/departments/${slug}`, {
      method: "PUT",
      body: {
        name: text(form, "name"),
        summary: text(form, "summary"),
        sort_order: number(form, "sort_order") ?? 0,
        is_published: checked(form, "is_published"),
        stats: jsonList<{ label: string; value: string }>(form, "stats"),
        images: jsonList<{ path: string; alt: string }>(form, "images"),
      },
    });
  } catch (error) {
    return errorState(error);
  }
  updateTag("factory");
  return success("Department saved.");
}
