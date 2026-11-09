/*
 * The header's display state (logged in, cart counts), kept in the readable cookie pk_ui so static pages
 * can show it without a server round trip. It is only a hint for the display: the API decides who is logged in.
 */

export const UI_COOKIE = "pk_ui";

/** Fired after a server action changed the state (the cookie itself does not notify anyone). */
export const UI_EVENT = "pk-ui-change";

/** cartCount: colors in the wholesale cart; stockCartCount: colors in the stock cart (the stock pages' header). */
export type UiState = { signedIn: boolean; cartCount: number; stockCartCount: number };

export const SIGNED_OUT: UiState = { signedIn: false, cartCount: 0, stockCartCount: 0 };

const count = (value: number) => String(Math.max(0, Math.floor(value)));

/** "u=1&c=3&s=2" ⇄ { signedIn: true, cartCount: 3, stockCartCount: 2 }; an empty string for the default state. */
export function writeUiState({ signedIn, cartCount, stockCartCount }: UiState): string {
  if (!signedIn && cartCount <= 0 && stockCartCount <= 0) return "";
  const params = new URLSearchParams({ u: signedIn ? "1" : "0", c: count(cartCount) });
  if (stockCartCount > 0) params.set("s", count(stockCartCount));
  return params.toString();
}

export function readUiState(value: string | null | undefined): UiState {
  if (!value) return SIGNED_OUT;
  const params = new URLSearchParams(value);
  const read = (key: string) => {
    const number = Number(params.get(key));
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
  };
  return { signedIn: params.get("u") === "1", cartCount: read("c"), stockCartCount: read("s") };
}

/** The raw cookie value from document.cookie (browser only). */
export function uiCookieValue(cookieString: string): string {
  for (const part of cookieString.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === UI_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return "";
}
