import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiWithMeta, ApiError } from "@/lib/api";
import { UI_COOKIE, writeUiState } from "@/lib/account/ui-state";
import type { Cart, Customer } from "@/lib/account/types";

/*
 * Buyer sessions. The API token lives in the HttpOnly cookie pk_session; a guest's cart is found by
 * the token in pk_cart. Neither reaches browser JavaScript: only the server talks to the API.
 * pk_ui is a display-only cookie (logged in yes/no, cart count) that the static header reads in the
 * browser; it holds nothing secret, and the API checks every request.
 */

export const SESSION_COOKIE = "pk_session";
export const CART_COOKIE = "pk_cart";

/** Where a rejected session cookie is cleared before going back to the login page. */
export const SESSION_ENDED = "/account/session-ended";

const secure = process.env.NODE_ENV === "production";

type ApiRequest = NonNullable<Parameters<typeof apiWithMeta>[1]>;
type BuyerRequest = Omit<ApiRequest, "token">;

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value || undefined;
}

export async function guestCartToken(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value || undefined;
}

/** The visitor's IP address, forwarded to the API for its rate limits. */
export async function clientIp(): Promise<string | undefined> {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || undefined;
}

/** Calls a buyer account endpoint. Without a session it goes to the login page; a rejected session is ended. */
export async function customerApiWithMeta<T, M = Record<string, unknown>>(path: string, request: BuyerRequest = {}): Promise<{ data: T; meta: M }> {
  const token = await sessionToken();
  if (!token) redirect("/login");
  try {
    return await apiWithMeta<T, M>(path, { ...request, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(SESSION_ENDED);
    throw error;
  }
}

export async function customerApi<T>(path: string, request: BuyerRequest = {}): Promise<T> {
  return (await customerApiWithMeta<T>(path, request)).data;
}

/** Calls a cart endpoint: as the buyer when logged in, otherwise with the guest's cart cookie. */
export async function cartApiWithMeta<T, M = Record<string, unknown>>(path: string, request: BuyerRequest = {}): Promise<{ data: T; meta: M }> {
  const token = await sessionToken();
  const cartToken = token ? undefined : await guestCartToken();
  try {
    return await apiWithMeta<T, M>(path, { ...request, token, headers: cartToken ? { "X-Cart-Token": cartToken } : undefined });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(SESSION_ENDED);
    throw error;
  }
}

/** The logged-in buyer, or null (looked up once per request). */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const token = await sessionToken();
  if (!token) return null;
  try {
    return (await apiWithMeta<Customer>("/v1/account", { token })).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

/** The logged-in buyer; pages that need an account send everyone else to the login page. */
export async function requireCustomer(): Promise<Customer> {
  const token = await sessionToken();
  if (!token) redirect("/login");
  const customer = await getCustomer();
  if (!customer) redirect(SESSION_ENDED);
  return customer;
}

/** The current cart (an empty one for visitors without a cart). */
export async function getCart(): Promise<Cart> {
  return (await cartApiWithMeta<Cart>("/v1/cart")).data;
}

/* Cookie writers: only usable in server actions and route handlers. */

export async function startSession(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: new Date(expiresAt) });
  // The guest cart was merged into the account by the API.
  store.delete(CART_COOKIE);
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(UI_COOKIE);
}

export async function rememberGuestCart(token: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 90 * 24 * 3600 });
}

/** Updates the header's display cookie (logged in, number of colors in the cart). */
export async function setUiState(state: { signedIn: boolean; cartCount: number }): Promise<void> {
  const store = await cookies();
  const value = writeUiState(state);
  if (value === "") {
    store.delete(UI_COOKIE);
  } else {
    store.set(UI_COOKIE, value, { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 90 * 24 * 3600 });
  }
}
