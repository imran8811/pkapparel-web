"use server";

import { unstable_rethrow } from "next/navigation";
import { apiWithMeta, ApiError } from "@/lib/api";
import { guestCartToken, rememberGuestCart, sessionToken, setUiState } from "@/lib/account/session";
import type { Cart } from "@/lib/account/types";

export type CartResult = { ok: true; cart: Cart } | { ok: false; message: string; sessionEnded?: boolean };

type CallResult = { ok: true; cart: Cart; newGuestToken?: string } | { ok: false; message: string; sessionEnded?: boolean };

type Quantities = Record<string, number>;

/**
 * Adds pieces of one or more colors to the cart (the product page's order panel).
 * A guest's first item creates their cart and its cookie.
 */
export async function addToCart(lines: { colorId: number; sizeQty: Quantities }[]): Promise<CartResult> {
  if (lines.length === 0) return { ok: false, message: "Enter the pieces you need first." };
  let cart: Cart | null = null;
  let newGuestToken: string | undefined;
  for (const line of lines) {
    // A cart created by the first line is used for the next ones (its cookie only reaches the browser with the response).
    const result = await cartCall("/v1/cart/lines", "POST", { color_id: line.colorId, size_qty: line.sizeQty }, newGuestToken);
    if (!result.ok) return result;
    cart = result.cart;
    newGuestToken ??= result.newGuestToken;
  }
  return cart === null ? { ok: false, message: "Enter the pieces you need first." } : { ok: true, cart };
}

/** Replaces a color's quantities (all zero removes it). */
export async function updateCartLine(colorId: number, sizeQty: Quantities): Promise<CartResult> {
  return withoutToken(await cartCall(`/v1/cart/lines/${colorId}`, "PUT", { size_qty: sizeQty }));
}

export async function removeCartLine(colorId: number): Promise<CartResult> {
  return withoutToken(await cartCall(`/v1/cart/lines/${colorId}`, "DELETE"));
}

function withoutToken(result: CallResult): CartResult {
  return result.ok ? { ok: true, cart: result.cart } : result;
}

async function cartCall(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown, knownGuestToken?: string): Promise<CallResult> {
  const token = await sessionToken();
  const guestToken = token ? undefined : (knownGuestToken ?? (await guestCartToken()));
  try {
    const { data, meta } = await apiWithMeta<Cart, { cart_token?: string }>(path, {
      method,
      body,
      token,
      headers: guestToken ? { "X-Cart-Token": guestToken } : undefined,
    });
    if (meta.cart_token) await rememberGuestCart(meta.cart_token);
    await setUiState({ signedIn: Boolean(token), cartCount: data.line_count });
    return { ok: true, cart: data, newGuestToken: meta.cart_token };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.status === 401) return { ok: false, message: "Your session has ended. Please log in again.", sessionEnded: true };
      if (error.status === 422) return { ok: false, message: Object.values(error.fields)[0] ?? error.message };
      if (error.status === 404) return { ok: false, message: "This color is no longer available. Please reload the page." };
    }
    console.error("Cart change failed", error);
    return { ok: false, message: "Your cart could not be updated. Please try again." };
  }
}
