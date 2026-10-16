import { NextResponse, type NextRequest } from "next/server";

/*
 * Quick check for admin pages: without the login cookie, go straight to the login page.
 * This is only a shortcut; the real check is the API, which validates the token on every call.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/session-ended"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.includes(pathname) || request.cookies.has("pk_admin")) {
    return NextResponse.next();
  }

  const login = new URL("/admin/login", request.url);
  if (pathname !== "/admin") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
