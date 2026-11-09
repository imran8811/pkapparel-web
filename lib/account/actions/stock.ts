"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiWithMeta, ApiError } from "@/lib/api";
import { guestCartToken, rememberGuestCart, sessionToken, setUiState, stockCustomerApi } from "@/lib/account/session";
import type { Address, Order } from "@/lib/account/types";
import { checked, errorState, failure, optional, text, type FormState } from "@/lib/forms";
import { stockOrderUrl, type StockCart } from "@/lib/stock";

/*
 * The stock cart (sets of stock colors, for guests and buyers) and placing a stock order.
 * A guest's first set creates their cart and its cookie (the same cart as the wholesale one).
 */

export type StockCartResult = { ok: true; cart: StockCart } | { ok: false; message: string; sessionEnded?: boolean };

export async function addToStockCart(colorId: number, sets: number): Promise<StockCartResult> {
  return stockCartCall("/v1/stock/cart/lines", "POST", { color_id: colorId, sets });
}

/** Sets a color's number of sets (0 removes it). */
export async function updateStockCartLine(colorId: number, sets: number): Promise<StockCartResult> {
  return stockCartCall(`/v1/stock/cart/lines/${colorId}`, "PUT", { sets });
}

export async function removeStockCartLine(colorId: number): Promise<StockCartResult> {
  return stockCartCall(`/v1/stock/cart/lines/${colorId}`, "DELETE");
}

async function stockCartCall(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<StockCartResult> {
  const token = await sessionToken();
  const guestToken = token ? undefined : await guestCartToken();
  try {
    const { data, meta } = await apiWithMeta<StockCart, { cart_token?: string }>(path, {
      method,
      body,
      token,
      headers: guestToken ? { "X-Cart-Token": guestToken } : undefined,
    });
    if (meta.cart_token) await rememberGuestCart(meta.cart_token);
    await setUiState({ signedIn: Boolean(token), stockCartCount: data.line_count });
    return { ok: true, cart: data };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.status === 401) return { ok: false, message: "Your session has ended. Please log in again.", sessionEnded: true };
      if (error.status === 422) return { ok: false, message: Object.values(error.fields)[0] ?? error.message };
      if (error.status === 404) return { ok: false, message: "This color is no longer available. Please reload the page." };
    }
    console.error("Stock cart change failed", error);
    return { ok: false, message: "Your cart could not be updated. Please try again." };
  }
}

/** The cargo address chosen at checkout: a saved one, or a new one saved to the address book first. */
async function cargoAddress(form: FormData): Promise<{ id: number; created: boolean }> {
  if (text(form, "address_id") !== "new") {
    return { id: Number(text(form, "address_id")) || 0, created: false };
  }
  // No country: the API puts a stock buyer's address in the stock country.
  const address = await stockCustomerApi<Address>("/v1/account/addresses", {
    method: "POST",
    body: {
      company: text(form, "company"),
      contact_name: text(form, "contact_name"),
      phone: text(form, "phone"),
      line1: text(form, "line1"),
      line2: optional(form, "line2"),
      city: text(form, "city"),
    },
  });
  return { id: address.id, created: true };
}

/** Places the stock order from the cart: by cargo to a saved or new address, or collected by the buyer. */
export async function placeStockOrder(_previous: FormState, form: FormData): Promise<FormState> {
  const delivery = text(form, "delivery") === "pickup" ? "pickup" : "cargo";
  let addressId: number | undefined;
  let newAddress = false;
  if (delivery === "cargo") {
    try {
      ({ id: addressId, created: newAddress } = await cargoAddress(form));
    } catch (error) {
      return errorState(error);
    }
    if (!addressId) return failure("Choose where the cargo should go.", { address_id: "Choose where the cargo should go." });
  }

  const expected = Number(text(form, "expected_total_cents"));
  let order: Order;
  try {
    order = await stockCustomerApi<Order>("/v1/account/stock-orders", {
      method: "POST",
      body: {
        delivery,
        address_id: addressId,
        cargo_company: delivery === "cargo" ? optional(form, "cargo_company") : null,
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
      // The cart, prices or stock changed: show the message and reload the checkout with fresh numbers.
      refresh();
      return failure(error.message);
    }
    if (error instanceof ApiError && error.status === 403) return failure(error.message);
    return errorState(error);
  }

  await setUiState({ signedIn: true, stockCartCount: 0 });
  return { status: "success", redirectTo: `${stockOrderUrl(order.order_no)}?placed=1` };
}
