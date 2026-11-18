"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";
import { QUOTATION_COST_KEYS, amountToCents } from "@/lib/admin/quotation-price";
import type { FabricUnit, Quotation, QuotationCostKey, QuotationStatus } from "@/lib/admin/types";

/* Admin → Quotations: styles costed per piece for buyers who sent artwork and asked for prices (sales staff and admins). */

/** A style as the form sends it: everything as typed, amounts in rupees. */
export type QuotationStyleInput = {
  article_no: string;
  description: string;
  fabric: string;
  colors: string;
  sizes: string;
  details: string;
  qty: string;
  fabric_rate: string;
  fabric_unit: FabricUnit;
  fabric_consumption: string;
  extra_label: string;
  profit_type: "percent" | "amount";
  profit_percent: string;
  profit_amount: string;
} & Record<QuotationCostKey, string>;

function buyer(form: FormData): Record<string, string | null> {
  const field = (name: string) => optional(form, `buyer.${name}`);
  return {
    company: field("company"),
    contact_name: field("contact_name"),
    email: field("email"),
    phone: field("phone"),
    address: field("address"),
    country_code: field("country_code"),
    tax_id: field("tax_id"),
  };
}

/** The API's name of a field → the form's (shipping_cents → shipping, styles.0.cutting_cents → styles.0.cutting). */
function formField(name: string): string {
  if (name === "shipping_cents") return "shipping";
  return name.replace(/^(styles\.\d+)\.profit_cents$/, "$1.profit_amount").replace(/^(styles\.\d+\.[a-z_]+)_cents$/, "$1");
}

/** Creates (id null) or saves a quotation, then opens its page. */
export async function saveQuotation(id: number | null, _previous: FormState, form: FormData): Promise<FormState> {
  const fieldErrors: Record<string, string> = {};
  const rupees = (value: string | undefined, field: string): number => {
    const paisa = amountToCents(value ?? "");
    if (paisa === null) fieldErrors[field] = "Enter an amount in rupees, e.g. 120 or 85.50.";
    return paisa ?? 0;
  };
  const styles = jsonList<QuotationStyleInput>(form, "styles").map((style, index) => {
    const at = (name: string) => `styles.${index}.${name}`;
    const qty = (style.qty ?? "").replace(/[,\s]/g, "");
    if (qty !== "" && !/^\d+$/.test(qty)) fieldErrors[at("qty")] = "Enter a whole number of pieces, or leave it empty.";
    const cleanText = (value: string | undefined) => value?.trim() || null;
    return {
      article_no: cleanText(style.article_no),
      description: cleanText(style.description),
      fabric: cleanText(style.fabric),
      colors: cleanText(style.colors),
      sizes: cleanText(style.sizes),
      details: cleanText(style.details),
      qty: qty === "" ? null : Number(qty),
      fabric_rate_cents: rupees(style.fabric_rate, at("fabric_rate")),
      fabric_unit: style.fabric_unit,
      fabric_consumption: cleanText(style.fabric_consumption),
      ...Object.fromEntries(QUOTATION_COST_KEYS.map((key) => [`${key}_cents`, rupees(style[key], at(key))])),
      extra_label: cleanText(style.extra_label),
      profit_type: style.profit_type,
      profit_percent: style.profit_type === "percent" ? cleanText(style.profit_percent) : null,
      profit_cents: style.profit_type === "amount" ? rupees(style.profit_amount, at("profit_amount")) : 0,
    };
  });
  const currency = text(form, "currency");
  const shipping = amountToCents(text(form, "shipping"));
  if (shipping === null) fieldErrors.shipping = "Enter the shipping cost, e.g. 850 or 850.50, or leave it empty.";
  const body = {
    customer_id: number(form, "customer_id"),
    inquiry_id: number(form, "inquiry_id"),
    buyer: buyer(form),
    currency,
    exchange_rate: currency === "PKR" ? null : (optional(form, "exchange_rate")?.replace(/rs\.?|[,\s]/gi, "") ?? null),
    issue_date: text(form, "issue_date"),
    valid_until: optional(form, "valid_until"),
    buyer_reference: optional(form, "buyer_reference"),
    incoterm: optional(form, "incoterm"),
    delivery_time: optional(form, "delivery_time"),
    shipping_cents: shipping ?? 0,
    styles,
    notes: optional(form, "notes"),
    terms: optional(form, "terms"),
    staff_notes: optional(form, "staff_notes"),
  };
  if (Object.keys(fieldErrors).length > 0) return failure("Please check the highlighted fields.", fieldErrors);

  let saved: Quotation;
  try {
    saved = await adminApi<Quotation>(id === null ? "/v1/admin/quotations" : `/v1/admin/quotations/${id}`, { method: id === null ? "POST" : "PUT", body, timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    const state = errorState(error);
    if (state.fields) state.fields = Object.fromEntries(Object.entries(state.fields).map(([name, message]) => [formField(name), message]));
    return state;
  }
  refresh();
  return { ...success(id === null ? `Quotation ${saved.quotation_no} created.` : `${saved.quotation_no} saved.`), redirectTo: `/admin/quotations/${saved.id}` };
}

/** Calls the API, refreshes the page and turns the result into a form message. */
async function run(path: string, body: unknown, message: (quotation: Quotation) => string, timeoutMs = 15_000): Promise<FormState> {
  let quotation: Quotation;
  try {
    quotation = await adminApi<Quotation>(path, { method: "POST", body, timeoutMs });
  } catch (error) {
    // 409: not allowed in this status; 502: the email could not be sent.
    if (error instanceof ApiError && (error.status === 409 || error.status === 502)) return failure(error.message);
    return errorState(error);
  }
  refresh();
  return success(message(quotation));
}

export async function sendQuotation(id: number, _previous: FormState, form: FormData): Promise<FormState> {
  // Making the PDF and talking to the mail server can take a while.
  return run(`/v1/admin/quotations/${id}/send`, { to: text(form, "to"), message: optional(form, "message") }, (quotation) => `Emailed to ${quotation.sent_to}.`, 45_000);
}

const STATUS_MESSAGES: Record<QuotationStatus, string> = { open: "is open again", accepted: "is marked as accepted", declined: "is marked as declined" };

export async function setQuotationStatus(id: number, status: QuotationStatus): Promise<FormState> {
  return run(`/v1/admin/quotations/${id}/status`, { status }, (quotation) => `${quotation.quotation_no} ${STATUS_MESSAGES[status]}.`);
}

/** A revised quotation from this one, dated today and opened for editing. */
export async function duplicateQuotation(id: number): Promise<FormState> {
  let copy: Quotation;
  try {
    copy = await adminApi<Quotation>(`/v1/admin/quotations/${id}/duplicate`, { method: "POST", timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    return errorState(error);
  }
  redirect(`/admin/quotations/${copy.id}/edit?created=1`);
}
