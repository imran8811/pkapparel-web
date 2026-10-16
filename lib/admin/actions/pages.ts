"use server";

import { updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, optional, success, text, type FormState } from "@/lib/admin/forms";

export async function savePage(slug: string, _previous: FormState, form: FormData): Promise<FormState> {
  if (!/^[a-z0-9-]+$/.test(slug)) return failure("This page does not exist.");

  try {
    await adminApi(`/v1/admin/pages/${slug}`, {
      method: "PUT",
      body: {
        title: text(form, "title"),
        body_html: text(form, "body_html"),
        seo_title: optional(form, "seo_title"),
        seo_description: optional(form, "seo_description"),
        is_published: checked(form, "is_published"),
      },
    });
  } catch (error) {
    return errorState(error);
  }
  updateTag("pages");
  updateTag(`page:${slug}`);
  return success("Page saved.");
}
