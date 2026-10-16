"use server";

import { refresh } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, optional, success, text, type FormState } from "@/lib/admin/forms";

/** Saves the follow-up status and internal notes of an inquiry. */
export async function updateInquiry(id: number, _previous: FormState, form: FormData): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("This inquiry does not exist.");

  try {
    await adminApi(`/v1/admin/inquiries/${id}`, {
      method: "PATCH",
      body: { status: text(form, "status"), notes: optional(form, "notes") },
    });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success("Inquiry updated.");
}
