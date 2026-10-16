/*
 * The header's display state (logged in, cart count), kept in the readable cookie pk_ui so static pages
 * can show it without a server round trip. It is only a hint for the display: the API decides who is logged in.
 */

export const UI_COOKIE = "pk_ui";

/** Fired after a server action changed the state (the cookie itself does not notify anyone). */
export const UI_EVENT = "pk-ui-change";

export type UiState = { signedIn: boolean; cartCount: number };

export const SIGNED_OUT: UiState = { signedIn: false, cartCount: 0 };

/** "u=1&c=3" ⇄ { signedIn: true, cartCount: 3 }; an empty string for the default state. */
export function writeUiState({ signedIn, cartCount }: UiState): string {
  if (!signedIn && cartCount <= 0) return "";
  return new URLSearchParams({ u: signedIn ? "1" : "0", c: String(Math.max(0, Math.floor(cartCount))) }).toString();
}

export function readUiState(value: string | null | undefined): UiState {
  if (!value) return SIGNED_OUT;
  const params = new URLSearchParams(value);
  const count = Number(params.get("c"));
  return { signedIn: params.get("u") === "1", cartCount: Number.isFinite(count) && count > 0 ? Math.floor(count) : 0 };
}

/** The raw cookie value from document.cookie (browser only). */
export function uiCookieValue(cookieString: string): string {
  for (const part of cookieString.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === UI_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return "";
}
