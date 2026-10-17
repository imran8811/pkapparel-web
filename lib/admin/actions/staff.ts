"use server";

import { refresh } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, success, text, type FormState } from "@/lib/admin/forms";
import type { Staff } from "@/lib/admin/types";

/** A form result that can carry a generated password, shown once to the admin. */
export type PasswordState = FormState & { password?: string };

export async function createStaff(_previous: PasswordState, form: FormData): Promise<PasswordState> {
  try {
    const result = await adminApi<{ staff: Staff; password: string }>("/v1/admin/staff", {
      method: "POST",
      body: { name: text(form, "name"), email: text(form, "email"), role: text(form, "role") },
    });
    refresh();
    return { ...success(`Account created for ${result.staff.name}.`), password: result.password };
  } catch (error) {
    return errorState(error);
  }
}

export async function updateStaff(id: number, _previous: FormState, form: FormData): Promise<FormState> {
  try {
    await adminApi(`/v1/admin/staff/${id}`, {
      method: "PUT",
      body: { name: text(form, "name"), role: text(form, "role"), is_active: checked(form, "is_active") },
    });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success("Account saved.");
}

export async function resetStaffPassword(id: number): Promise<PasswordState> {
  try {
    const result = await adminApi<{ password: string }>(`/v1/admin/staff/${id}/reset-password`, { method: "POST" });
    refresh();
    return { ...success("New password made. The account was logged out everywhere."), password: result.password };
  } catch (error) {
    return errorState(error);
  }
}
