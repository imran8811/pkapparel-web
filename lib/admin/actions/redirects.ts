"use server";

import { refresh, updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, number, success, text, type FormState } from "@/lib/admin/forms";

/*
 * Redirects (Admin → Redirects) and the missing addresses the website reports. Saving or deleting a redirect
 * refreshes the website's copy at once; the API also calls the revalidate webhook.
 */

export async function saveRedirect(_previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  try {
    await adminApi(id ? `/v1/admin/redirects/${id}` : "/v1/admin/redirects", {
      method: id ? "PUT" : "POST",
      body: { from_path: text(form, "from_path"), to_path: text(form, "to_path") },
    });
  } catch (error) {
    return errorState(error);
  }
  updateTag("redirects");
  refresh();
  return success(id ? "Redirect updated." : "Redirect added. The old address now leads to the new one.");
}

export async function deleteRedirect(id: number): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("Not found.");
  try {
    await adminApi(`/v1/admin/redirects/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  updateTag("redirects");
  refresh();
  return success("Redirect deleted.");
}

async function setIgnored(id: number, ignored: boolean): Promise<FormState> {
  if (!Number.isInteger(id) || id <= 0) return failure("Not found.");
  try {
    await adminApi(`/v1/admin/missing-pages/${id}/${ignored ? "ignore" : "restore"}`, { method: "POST" });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success(ignored ? "Moved to Ignored." : "Back in the list.");
}

export async function ignoreMissingPage(id: number): Promise<FormState> {
  return setIgnored(id, true);
}

export async function restoreMissingPage(id: number): Promise<FormState> {
  return setIgnored(id, false);
}
