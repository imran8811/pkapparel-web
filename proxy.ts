import { NextResponse, type NextRequest } from "next/server";

/*
 * Quick checks before rendering: admin pages need the staff cookie, buyer account pages, checkout
 * and the sample order need the buyer cookie; without it, go straight to the matching login page.
 * These are only shortcuts; the real check is the API, which validates the token on every call.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/session-ended"];
const PUBLIC_ACCOUNT_PATHS = ["/account/session-ended"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (PUBLIC_ADMIN_PATHS.includes(pathname) || request.cookies.has("pk_admin")) return NextResponse.next();
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (PUBLIC_ACCOUNT_PATHS.includes(pathname) || request.cookies.has("pk_session")) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*", "/checkout", "/samples/order"],
};
