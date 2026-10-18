"use server";

import { refresh } from "next/cache";
import { ApiError } from "@/lib/api";
import { chosenAddress } from "@/lib/account/address-form";
import { customerApi } from "@/lib/account/session";
import type { Order } from "@/lib/account/types";
import { checked, errorState, failure, number, optional, text, type FormState } from "@/lib/forms";
import { decodeItems, type SampleItem, type SampleQuote } from "@/lib/samples";

/* Sample orders: the prices for an address, and placing the order. */

/** A custom-design sample only counts its pieces for the courier quote; its text is checked when the order is placed. */
const PRICING_PLACEHOLDER = "Custom-design sample";

/** Prices and courier of the chosen samples for a saved address, or for the country of a new one. */
export async function quoteSamples(items: SampleItem[], customQty: number | null, addressId: number | null, country: string | null): Promise<SampleQuote | { error: string }> {
  try {
    return await customerApi<SampleQuote>("/v1/account/sample-orders/quote", {
      method: "POST",
      body: {
        items,
        custom: customQty ? { description: PRICING_PLACEHOLDER, qty: customQty } : null,
        address_id: addressId ?? undefined,
        country: country ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 422 || error.status === 409)) {
      return { error: Object.values(error.fields ?? {})[0] ?? error.message };
    }
    console.error("Sample quote failed", error);
    return { error: "The prices could not be loaded. Please try again." };
  }
}

/** Places the sample order; a new delivery address is saved to the address book first. */
export async function placeSampleOrder(_previous: FormState, form: FormData): Promise<FormState> {
  let addressId: number;
  let newAddress: boolean;
  try {
    ({ id: addressId, created: newAddress } = await chosenAddress(form));
  } catch (error) {
    return errorState(error);
  }
  if (!addressId) return failure("Choose a delivery address.", { address_id: "Choose a delivery address." });

  const custom = checked(form, "custom")
    ? {
        product: optional(form, "custom_product"),
        description: text(form, "custom_description"),
        qty: number(form, "custom_qty") ?? 1,
        files: form.getAll("files").filter((token): token is string => typeof token === "string" && token !== ""),
      }
    : null;
  const expected = number(form, "expected_total_cents");

  let order: Order;
  try {
    order = await customerApi<Order>("/v1/account/sample-orders", {
      method: "POST",
      body: {
        items: decodeItems(form.getAll("items").map(String)),
        custom,
        address_id: addressId,
        buyer_reference: optional(form, "buyer_reference"),
        notes: optional(form, "notes"),
        accept_terms: checked(form, "accept_terms"),
        expected_total_cents: expected && expected > 0 ? expected : undefined,
      },
      timeoutMs: 30_000,
    });
  } catch (error) {
    // A new address was saved even though the order was not: reload so it shows in the list.
    if (newAddress) refresh();
    if (error instanceof ApiError && error.status === 409) {
      refresh();
      return failure(error.message);
    }
    if (error instanceof ApiError && error.status === 403) return failure(error.message);
    if (error instanceof ApiError && error.status === 422) {
      // The API names the custom sample's fields "custom.…"; the form calls them custom_….
      const renames: Record<string, string> = { "custom.description": "custom_description", "custom.qty": "custom_qty", "custom.files": "files" };
      const fields = Object.fromEntries(Object.entries(error.fields ?? {}).map(([name, message]) => [renames[name] ?? name, message]));
      return failure(fields.items ?? "Please check the highlighted fields.", fields);
    }
    return errorState(error);
  }

  return { status: "success", redirectTo: `/account/orders/${order.order_no}?placed=1` };
}
