"use client";

import { useSyncExternalStore } from "react";
import { readUiState, UI_EVENT, uiCookieValue, type UiState } from "@/lib/account/ui-state";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(UI_EVENT, onChange);
  // Another tab may have logged in or changed the cart.
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(UI_EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}

/** The header's display state, read from the pk_ui cookie after hydration (static pages render the logged-out state). */
export function useUiState(): UiState {
  const value = useSyncExternalStore(subscribe, () => uiCookieValue(document.cookie), () => "");
  return readUiState(value);
}

/** Tell the header that a server action changed the cookie. */
export function notifyUiChange(): void {
  window.dispatchEvent(new Event(UI_EVENT));
}
