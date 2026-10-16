"use server";

import { refresh } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, optional, success, text, type FormState } from "@/lib/admin/forms";

/** Blocks or unblocks a buyer account and saves the staff notes. Blocking also ends the buyer's sessions. */
export async function updateCustomer(id: number, _previous: FormState, form: FormData): Promise<FormState> {
  const status = text(form, "status");
  try {
    await adminApi(`/v1/admin/customers/${id}`, { method: "PATCH", body: { status, staff_notes: optional(form, "staff_notes") } });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success(status === "blocked" ? "Saved. The account is blocked and logged out everywhere." : "Saved.");
}
