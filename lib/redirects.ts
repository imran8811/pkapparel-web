import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { api } from "@/lib/api";

/*
 * Redirects staff manage in the admin (Admin → Redirects), including the ones added when a style or post changes
 * its address. They apply only where no page exists: the catch-all page and the shop and blog pages call
 * findRedirect() before showing "not found".
 */

/** Every redirect, keyed like the API stores them (decoded path, no trailing slash), in lowercase. */
async function getRedirects(): Promise<Record<string, string>> {
  "use cache";
  cacheLife("max");
  cacheTag("redirects");

  const rows = await api<{ from: string; to: string }[]>("/v1/redirects");
  return Object.fromEntries(rows.map((row) => [key(row.from), row.to]));
}

function key(path: string): string {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // A malformed escape: compare it as it is.
  }
  return (decoded.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/").toLowerCase();
}

/**
 * Where an address without a page should go. A redirect may lead to another redirected address; the visitor goes
 * straight to the end of the chain (a circle counts as no redirect).
 */
export async function findRedirect(path: string): Promise<string | null> {
  const redirects = await getRedirects();
  const seen = new Set<string>();
  let current = key(path);
  let target: string | null = null;
  while (redirects[current] !== undefined) {
    if (seen.has(current) || seen.size >= 10) return null;
    seen.add(current);
    target = redirects[current];
    // Another website, or a page of this one that does not redirect again.
    if (!target.startsWith("/")) break;
    current = key(target.split("?")[0]);
  }
  return target;
}
