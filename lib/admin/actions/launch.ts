"use server";

import { refresh } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, success, type FormState } from "@/lib/admin/forms";

/** Ticks or unticks a launch checklist item the website cannot check itself (admins). */
export async function tickLaunchItem(key: string, done: boolean): Promise<FormState> {
  if (!/^[a-z_]+$/.test(key)) return failure("Not found.");
  try {
    await adminApi(`/v1/admin/launch-checklist/${key}`, { method: "PUT", body: { done } });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success(done ? "Marked as done." : "Marked as not done.");
}
