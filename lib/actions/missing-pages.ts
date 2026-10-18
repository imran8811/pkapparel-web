"use server";

import { headers } from "next/headers";
import { api } from "@/lib/api";

/**
 * Reports an address that showed "page not found", so staff see it in Admin → Redirects. Best effort: the API
 * drops bot probes and limits reports per visitor, and a failure is never shown.
 */
export async function reportMissingPage(path: string, referrer: string | null): Promise<void> {
  if (typeof path !== "string" || !path.startsWith("/") || path.length > 2000) return;
  const requestHeaders = await headers();
  try {
    await api("/v1/missing-pages", {
      method: "POST",
      body: { path, referrer: typeof referrer === "string" && referrer !== "" ? referrer.slice(0, 2000) : null },
      clientIp: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || undefined,
    });
  } catch {
    // Nothing to tell the visitor.
  }
}
