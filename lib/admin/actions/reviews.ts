"use server";

import { refresh, updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, success, type FormState } from "@/lib/admin/forms";

/* Reviews buyers wrote about delivered orders. Approving or hiding one refreshes the product pages it shows on
   (the API calls the revalidate webhook with their tags); adding one to the home page, or hiding one that is
   there, refreshes the testimonials. */

async function run(path: string, message: string, tags: string[] = []): Promise<FormState> {
  try {
    await adminApi(path, { method: "POST" });
  } catch (error) {
    return errorState(error);
  }
  for (const tag of tags) updateTag(tag);
  refresh();
  return success(message);
}

export async function approveReview(id: number): Promise<FormState> {
  return run(`/v1/admin/reviews/${id}/approve`, "Review published on the product pages.");
}

export async function hideReview(id: number): Promise<FormState> {
  return run(`/v1/admin/reviews/${id}/hide`, "Review hidden from the website.", ["testimonials"]);
}

export async function featureReview(id: number): Promise<FormState> {
  return run(`/v1/admin/reviews/${id}/feature`, "Added to the home page reviews. You can edit or sort it there.", ["testimonials"]);
}
