import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin/session";

/** The API rejected the login token (expired, logged out elsewhere, account disabled): clear it and log in again. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login?ended=1", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, "", { path: "/admin", maxAge: 0 });
  return response;
}
