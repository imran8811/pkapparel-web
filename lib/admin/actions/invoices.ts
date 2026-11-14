"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";
import type { AdminCustomer, AdminCustomerDetail, Invoice, InvoiceParty, InvoiceType } from "@/lib/admin/types";

/* Admin → Invoices: invoices made by hand for buyers outside the website (sales staff and admins). */

/** "1,250.50" or "$1250.5" → 125050; null when empty or not a number. */
const toCents = (value: string): number | null => {
  const amount = Number(value.replace(/[,\s$€£]/g, ""));
  return value.trim() === "" || !Number.isFinite(amount) ? null : Math.round(amount * 100);
};

/** API field → form field, so errors show next to the right input. */
const RENAMES: Record<string, string> = { shipping_cents: "shipping", discount_cents: "discount", received_cents: "received" };

type LineInput = { description: string; details: string; hs_code: string; qty: string; unit: string; price: string };

function party(form: FormData, prefix: "buyer" | "consignee"): Record<string, string | null> {
  const field = (name: string) => optional(form, `${prefix}.${name}`);
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

/** Creates (id null) or saves an invoice, then opens its page. */
export async function saveInvoice(id: number | null, type: InvoiceType, _previous: FormState, form: FormData): Promise<FormState> {
  const fieldErrors: Record<string, string> = {};
  const money = (name: string): number => {
    const value = text(form, name);
    const cents = toCents(value);
    if (value !== "" && (cents === null || cents < 0)) fieldErrors[name] = "Enter an amount, e.g. 85.00";
    return cents ?? 0;
  };
  const lines = jsonList<LineInput>(form, "lines").map((line, index) => {
    const price = toCents(line.price ?? "");
    if (price === null || price < 0) fieldErrors[`lines.${index}.price`] = "Enter the price, e.g. 100.00";
    return {
      description: line.description?.trim() ?? "",
      details: line.details?.trim() || null,
      hs_code: line.hs_code?.trim() || null,
      qty: Number(line.qty) || 0,
      unit: line.unit?.trim() || "pcs",
      unit_price_cents: price ?? 0,
    };
  });
  const body = {
    ...(id === null ? { type } : {}),
    customer_id: number(form, "customer_id"),
    buyer: party(form, "buyer"),
    consignee: checked(form, "ship_elsewhere") ? party(form, "consignee") : null,
    currency: text(form, "currency"),
    issue_date: text(form, "issue_date"),
    due_date: optional(form, "due_date"),
    buyer_reference: optional(form, "buyer_reference"),
    incoterm: optional(form, "incoterm"),
    shipping_method: optional(form, "shipping_method"),
    delivery_time: optional(form, "delivery_time"),
    lines,
    shipping_cents: money("shipping"),
    discount_cents: money("discount"),
    received_cents: money("received"),
    deposit_percent: type === "proforma" ? number(form, "deposit_percent") : null,
    notes: optional(form, "notes"),
    terms: optional(form, "terms"),
    staff_notes: optional(form, "staff_notes"),
  };
  if (Object.keys(fieldErrors).length > 0) return failure("Please check the highlighted fields.", fieldErrors);

  let saved: Invoice;
  try {
    saved = await adminApi<Invoice>(id === null ? "/v1/admin/invoices" : `/v1/admin/invoices/${id}`, { method: id === null ? "POST" : "PUT", body, timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    const state = errorState(error);
    for (const [name, message] of Object.entries(state.fields ?? {})) {
      const renamed = RENAMES[name] ?? name.replace(/^(lines\.\d+)\.unit_price_cents$/, "$1.price");
      if (renamed !== name && state.fields) state.fields[renamed] = message;
    }
    return state;
  }
  refresh();
  return { ...success(id === null ? `${saved.type_label} ${saved.invoice_no} created.` : `${saved.invoice_no} saved.`), redirectTo: `/admin/invoices/${saved.id}` };
}

/** Calls the API, refreshes the page and turns the result into a form message. */
async function run(path: string, body: unknown, message: (invoice: Invoice) => string, timeoutMs = 15_000): Promise<FormState> {
  let invoice: Invoice;
  try {
    invoice = await adminApi<Invoice>(path, { method: "POST", body, timeoutMs });
  } catch (error) {
    // 409: not allowed in this status; 502: the email could not be sent.
    if (error instanceof ApiError && (error.status === 409 || error.status === 502)) return failure(error.message);
    return errorState(error);
  }
  refresh();
  return success(message(invoice));
}

export async function sendInvoice(id: number, _previous: FormState, form: FormData): Promise<FormState> {
  // Making the PDF and talking to the mail server can take a while.
  return run(`/v1/admin/invoices/${id}/send`, { to: text(form, "to"), message: optional(form, "message") }, (invoice) => `Emailed to ${invoice.sent_to}.`, 45_000);
}

export async function markInvoicePaid(id: number, _previous: FormState, form: FormData): Promise<FormState> {
  return run(`/v1/admin/invoices/${id}/paid`, { paid_on: text(form, "paid_on"), payment_reference: optional(form, "payment_reference") }, (invoice) => `${invoice.invoice_no} is marked as paid.`);
}

export async function markInvoiceUnpaid(id: number): Promise<FormState> {
  return run(`/v1/admin/invoices/${id}/unpaid`, undefined, (invoice) => `${invoice.invoice_no} is open again.`);
}

export async function cancelInvoice(id: number): Promise<FormState> {
  return run(`/v1/admin/invoices/${id}/cancel`, undefined, (invoice) => `${invoice.invoice_no} is cancelled.`);
}

/** A new invoice from this one (optionally of another type), opened for editing. */
export async function duplicateInvoice(id: number, type: InvoiceType): Promise<FormState> {
  let copy: Invoice;
  try {
    copy = await adminApi<Invoice>(`/v1/admin/invoices/${id}/duplicate`, { method: "POST", body: { type }, timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    return errorState(error);
  }
  redirect(`/admin/invoices/${copy.id}/edit?created=1`);
}

/* Filling the buyer from an account */

export type BuyerMatch = { id: number; company_name: string; contact_name: string; email: string; country_code: string };

export async function searchBuyers(query: string): Promise<BuyerMatch[]> {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const customers = await adminApi<AdminCustomer[]>("/v1/admin/customers", { query: { q, per_page: 8 } });
  return customers.map(({ id, company_name, contact_name, email, country_code }) => ({ id, company_name, contact_name, email, country_code }));
}

/** The account's details and its default delivery address, as an invoice's buyer. */
export async function buyerFromAccount(id: number): Promise<{ customerId: number; buyer: InvoiceParty } | null> {
  try {
    return accountToBuyer(await adminApi<AdminCustomerDetail>(`/v1/admin/customers/${id}`));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

function accountToBuyer(customer: AdminCustomerDetail): { customerId: number; buyer: InvoiceParty } {
  const address = customer.addresses.find((a) => a.is_default) ?? customer.addresses[0];
  const lines = address
    ? [address.line1, address.line2, [address.postal_code, address.city].filter(Boolean).join(" ") + (address.state ? `, ${address.state}` : "")].filter(Boolean)
    : customer.city
      ? [customer.city]
      : [];
  return {
    customerId: customer.id,
    buyer: {
      company: customer.company_name,
      contact_name: customer.contact_name,
      email: customer.email,
      phone: customer.phone,
      address: lines.join("\n") || null,
      country_code: address?.country_code ?? customer.country_code,
      tax_id: address?.tax_id ?? null,
    },
  };
}
