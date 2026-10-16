"use server";

import { refresh } from "next/cache";
import { ApiError } from "@/lib/api";
import { customerApi, setUiState } from "@/lib/account/session";
import type { Address, Checkout, Order } from "@/lib/account/types";
import { checked, errorState, failure, optional, success, text, type FormState } from "@/lib/forms";

/** Checkout data for another address or destination country (freight estimates change with it). */
export async function checkoutFor(addressId: number | null, country: string | null): Promise<Checkout | null> {
  try {
    return await customerApi<Checkout>("/v1/account/checkout", {
      query: { address_id: addressId ?? undefined, country: country ?? undefined },
    });
  } catch (error) {
    console.error("Checkout data could not be loaded", error);
    return null;
  }
}

/** Places the order from the cart; a new delivery address is saved to the address book first. */
export async function placeOrder(_previous: FormState, form: FormData): Promise<FormState> {
  let addressId = Number(text(form, "address_id"));
  const newAddress = text(form, "address_id") === "new";
  if (newAddress) {
    try {
      const address = await customerApi<Address>("/v1/account/addresses", {
        method: "POST",
        body: {
          company: text(form, "company"),
          contact_name: text(form, "contact_name"),
          phone: text(form, "phone"),
          email: optional(form, "email"),
          line1: text(form, "line1"),
          line2: optional(form, "line2"),
          city: text(form, "city"),
          state: optional(form, "state"),
          postal_code: optional(form, "postal_code"),
          country_code: text(form, "country_code"),
          tax_id: optional(form, "tax_id"),
        },
      });
      addressId = address.id;
    } catch (error) {
      return errorState(error);
    }
  }
  if (!addressId) return failure("Choose a delivery address.", { address_id: "Choose a delivery address." });

  const expected = Number(text(form, "expected_total_cents"));
  let order: Order;
  try {
    order = await customerApi<Order>("/v1/account/orders", {
      method: "POST",
      body: {
        address_id: addressId,
        shipping_mode: text(form, "shipping_mode"),
        forwarder_name: optional(form, "forwarder_name"),
        forwarder_contact: optional(form, "forwarder_contact"),
        addons: form.getAll("addons").map(Number).filter((id) => id > 0),
        buyer_reference: optional(form, "buyer_reference"),
        notes: optional(form, "notes"),
        accept_terms: checked(form, "accept_terms"),
        expected_total_cents: Number.isFinite(expected) && expected > 0 ? expected : undefined,
      },
      timeoutMs: 30_000,
    });
  } catch (error) {
    // A new address was saved even though the order was not: reload the checkout so it shows in the list.
    if (newAddress) refresh();
    if (error instanceof ApiError && error.status === 409) {
      // The cart or prices changed: show the message and reload the checkout with fresh numbers.
      refresh();
      return failure(error.message);
    }
    if (error instanceof ApiError && error.status === 403) return failure(error.message);
    return errorState(error);
  }

  await setUiState({ signedIn: true, cartCount: 0 });
  return { status: "success", redirectTo: `/account/orders/${order.order_no}?placed=1` };
}

export async function cancelOrder(orderNo: string, _previous: FormState, form: FormData): Promise<FormState> {
  try {
    await customerApi(`/v1/account/orders/${encodeURIComponent(orderNo)}/cancel`, { method: "POST", body: { reason: optional(form, "reason") } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    return errorState(error);
  }
  refresh();
  return success("Your order was cancelled.");
}

/** Reports a bank transfer, with an optional slip (photo or PDF). */
export async function submitPayment(orderNo: string, _previous: FormState, form: FormData): Promise<FormState> {
  const amount = Number(text(form, "amount").replace(/[,\s$]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return failure("Please check the highlighted fields.", { amount: "Enter the amount you sent, e.g. 1250.00" });
  }

  const body = new FormData();
  body.set("transaction_id", text(form, "transaction_id"));
  body.set("amount_cents", String(Math.round(amount * 100)));
  body.set("transferred_on", text(form, "transferred_on"));
  body.set("payer_name", text(form, "payer_name"));
  body.set("payer_bank", text(form, "payer_bank"));
  body.set("notes", text(form, "notes"));
  const slip = form.get("slip");
  if (slip instanceof File && slip.size > 0) {
    if (slip.size > 4 * 1024 * 1024) return failure("Please check the highlighted fields.", { slip: "The file is too large. The limit is 4 MB." });
    body.set("slip", slip, slip.name);
  }

  try {
    await customerApi(`/v1/account/orders/${encodeURIComponent(orderNo)}/payments`, { method: "POST", body, timeoutMs: 30_000 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return failure(error.message);
    if (error instanceof ApiError && error.status === 422) {
      // The form's field is "amount" (in dollars); the API checks "amount_cents".
      const { amount_cents: amountError, ...fields } = error.fields;
      return failure("Please check the highlighted fields.", amountError ? { ...fields, amount: amountError } : fields);
    }
    return errorState(error);
  }
  return { status: "success", redirectTo: `/account/orders/${orderNo}?payment=sent` };
}
