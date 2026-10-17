"use server";

import { refresh } from "next/cache";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, optional, success, text, type FormState } from "@/lib/admin/forms";

/* The order workflow in the admin: payments (admins only), production, charges, shipping, holds, notes, documents. */

const toCents = (value: string): number | null => {
  const amount = Number(value.replace(/[,\s$]/g, ""));
  return value.trim() === "" || !Number.isFinite(amount) ? null : Math.round(amount * 100);
};

/** Calls the API, refreshes the page and turns the result into a form message. */
async function run(path: string, method: "POST" | "PUT" | "DELETE", body: unknown, message: string, renames: Record<string, string> = {}): Promise<FormState> {
  try {
    await adminApi(path, { method, body, timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    const state = errorState(error);
    for (const [apiName, formName] of Object.entries(renames)) {
      if (state.fields?.[apiName]) state.fields[formName] = state.fields[apiName];
    }
    return state;
  }
  refresh();
  return success(message);
}

/* Payments (the API allows admins only) */

export async function confirmPayment(paymentId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const received = toCents(text(form, "received"));
  if (received === null || received <= 0) return failure("Please check the highlighted fields.", { received: "Enter the amount that arrived, e.g. 1250.00" });
  return run(
    `/v1/admin/payments/${paymentId}/confirm`,
    "POST",
    { received_cents: received, received_on: text(form, "received_on"), start_anyway: checked(form, "start_anyway") },
    "Payment confirmed. The receipt was emailed to the buyer.",
    { received_cents: "received" },
  );
}

export async function rejectPayment(paymentId: number, _previous: FormState, form: FormData): Promise<FormState> {
  return run(`/v1/admin/payments/${paymentId}/reject`, "POST", { reason: text(form, "reason") }, "Payment rejected. The buyer was emailed the reason.");
}

export async function recordPayment(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const amount = toCents(text(form, "amount"));
  if (amount === null || amount <= 0) return failure("Please check the highlighted fields.", { amount: "Enter the amount that arrived, e.g. 1250.00" });
  return run(
    `/v1/admin/orders/${orderId}/payments`,
    "POST",
    {
      transaction_id: text(form, "transaction_id"),
      amount_cents: amount,
      transferred_on: text(form, "transferred_on"),
      received_on: optional(form, "received_on"),
      payer_name: text(form, "payer_name"),
      payer_bank: text(form, "payer_bank"),
      notes: optional(form, "notes"),
      start_anyway: checked(form, "start_anyway"),
    },
    "Payment recorded and confirmed. The receipt was emailed to the buyer.",
    { amount_cents: "amount" },
  );
}

/* Order workflow */

export async function holdOrder(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  return run(`/v1/admin/orders/${orderId}/hold`, "POST", { reason: text(form, "reason") }, "The order is on hold. The buyer was told.");
}

export async function resumeOrder(orderId: number): Promise<FormState> {
  return run(`/v1/admin/orders/${orderId}/resume`, "POST", undefined, "The order continues.");
}

export async function cancelOrderAsStaff(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  return run(`/v1/admin/orders/${orderId}/cancel`, "POST", { reason: text(form, "reason"), notify: checked(form, "notify") }, "The order was cancelled.");
}

export async function changeDueDate(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  return run(
    `/v1/admin/orders/${orderId}/due-date`,
    "PUT",
    { date: text(form, "date"), reason: text(form, "reason"), notify: checked(form, "notify") },
    "Ready date changed.",
  );
}

/** The final freight (empty: keep the estimate) and totals for "on request" add-ons. */
export async function saveCharges(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const body: { freight_cents?: number | null; addons: Record<string, number> } = { addons: {} };
  if (form.has("freight")) {
    const freight = toCents(text(form, "freight"));
    body.freight_cents = freight;
  }
  for (const [key, value] of form.entries()) {
    const match = /^addon_(\d+)$/.exec(key);
    if (match && typeof value === "string" && value.trim() !== "") {
      const cents = toCents(value);
      if (cents === null) return failure("Please check the highlighted fields.", { [key]: "Enter an amount, e.g. 120.00" });
      body.addons[match[1]] = cents;
    }
  }
  return run(`/v1/admin/orders/${orderId}/charges`, "PUT", body, "Charges saved.", { freight_cents: "freight" });
}

export async function readyToShip(orderId: number): Promise<FormState> {
  return run(`/v1/admin/orders/${orderId}/ready-to-ship`, "POST", undefined, "Ready to ship. The balance invoice was emailed to the buyer.");
}

export async function shipOrder(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const gross = text(form, "gross_kg");
  return run(
    `/v1/admin/orders/${orderId}/ship`,
    "POST",
    {
      carrier: text(form, "carrier"),
      tracking_no: optional(form, "tracking_no"),
      tracking_url: optional(form, "tracking_url"),
      shipped_on: text(form, "shipped_on"),
      cartons: optional(form, "cartons") === null ? null : Number(text(form, "cartons")),
      gross_kg: gross === "" ? null : Number(gross),
      note: optional(form, "note"),
      unpaid_reason: optional(form, "unpaid_reason"),
    },
    "Marked as shipped. The buyer was emailed the tracking details.",
  );
}

export async function deliverOrder(orderId: number): Promise<FormState> {
  return run(`/v1/admin/orders/${orderId}/deliver`, "POST", undefined, "Marked as delivered.");
}

export async function addOrderNote(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  return run(`/v1/admin/orders/${orderId}/notes`, "POST", { note: text(form, "note") }, "Note added.");
}

/* Production */

export async function updateStage(orderId: number, stage: string, action: "start" | "done" | "reset", _previous: FormState, form: FormData): Promise<FormState> {
  const done = action === "done" ? "done" : action === "start" ? "started" : "reset";
  return run(
    `/v1/admin/orders/${orderId}/stages/${stage}`,
    "PUT",
    { action, date: optional(form, "date"), note: optional(form, "note"), notify: checked(form, "notify") },
    `Stage ${done}.`,
  );
}

/** One photo per request (the website accepts at most 4.5 MB per request; photos are shrunk in the browser first). */
export async function uploadPhoto(orderId: number, form: FormData): Promise<FormState> {
  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return failure("Choose a photo.");
  const body = new FormData();
  body.set("photo", photo, photo.name);
  const stage = text(form, "stage");
  if (stage) body.set("stage", stage);
  const caption = text(form, "caption");
  if (caption) body.set("caption", caption);
  try {
    await adminApi(`/v1/admin/orders/${orderId}/photos`, { method: "POST", body, timeoutMs: 60_000 });
  } catch (error) {
    return errorState(error);
  }
  return success("Photo added.");
}

export async function deletePhoto(photoId: number): Promise<FormState> {
  return run(`/v1/admin/order-photos/${photoId}`, "DELETE", undefined, "Photo deleted.");
}

/* Documents */

export async function uploadDocument(orderId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return failure("Please check the highlighted fields.", { file: "Choose a file (PDF or photo)." });
  const body = new FormData();
  body.set("file", file, file.name);
  body.set("type", text(form, "type"));
  body.set("title", text(form, "title"));
  body.set("is_public", checked(form, "is_public") ? "1" : "0");
  try {
    await adminApi(`/v1/admin/orders/${orderId}/documents`, { method: "POST", body, timeoutMs: 60_000 });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success("Document added.");
}

export async function deleteDocument(documentId: number): Promise<FormState> {
  return run(`/v1/admin/order-documents/${documentId}`, "DELETE", undefined, "Document deleted.");
}
