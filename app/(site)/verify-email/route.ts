import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/account/session";

/**
 * The link in the "confirm your email" message. It confirms the address, then opens the account
 * (or the login page when this browser is not logged in) with a message. Links from the old site
 * (?email=…) carry no token and simply lead to the login page.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const loggedIn = request.cookies.has(SESSION_COOKIE);

  let confirmed = false;
  if (/^[a-f0-9]{64}$/.test(token)) {
    confirmed = await api("/v1/account/verify-email", { method: "POST", body: { token } })
      .then(() => true)
      .catch(() => false);
  }

  const target = loggedIn ? "/account" : "/login";
  const query = confirmed ? "verified=1" : "verify=failed";
  return NextResponse.redirect(new URL(`${target}?${query}`, request.url), 303);
}
