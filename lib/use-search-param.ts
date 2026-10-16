"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * One query parameter of the current URL, read after hydration so the page itself can stay static
 * (null during prerendering and the first render).
 */
export function useSearchParam(name: string): string | null {
  return useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}

/** False while prerendering and during hydration, true afterwards (when the URL can be read). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
