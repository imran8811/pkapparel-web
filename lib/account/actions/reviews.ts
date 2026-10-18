"use server";

import { refresh } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { clientIp, customerApi } from "@/lib/account/session";
import { errorState, failure, number, success, text, type FormState } from "@/lib/forms";

/* Reviews of delivered orders: from the emailed link (no login) or from the buyer's order page. */

const THANKS = "Thank you! We read every review before it appears on the website.";

function review(form: FormData) {
  return { rating: number(form, "rating"), body: text(form, "body"), show_as: text(form, "show_as") };
}

function reviewError(error: unknown): FormState {
  if (error instanceof ApiError && error.status === 409) return failure(error.message);
  if (error instanceof ApiError && error.status === 422 && error.fields?.rating) return failure("Please check the highlighted fields.", { ...error.fields, rating: "Choose 1 to 5 stars." });
  return errorState(error);
}

export async function submitReviewByToken(token: string, _previous: FormState, form: FormData): Promise<FormState> {
  if (!/^[a-f0-9]{64}$/.test(token)) return failure("This link does not work. You can write the review from your order page.");
  try {
    await api(`/v1/reviews/${token}`, { method: "POST", body: review(form), clientIp: await clientIp() });
  } catch (error) {
    return reviewError(error);
  }
  return success(THANKS);
}

export async function submitOrderReview(orderNo: string, _previous: FormState, form: FormData): Promise<FormState> {
  try {
    await customerApi(`/v1/account/orders/${orderNo}/review`, { method: "POST", body: review(form) });
  } catch (error) {
    return reviewError(error);
  }
  refresh();
  return success(THANKS);
}
