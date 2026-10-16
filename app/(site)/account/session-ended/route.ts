import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/account/session";
import { UI_COOKIE } from "@/lib/account/ui-state";

/** The API rejected the buyer's login (expired, logged out elsewhere, blocked): clear the cookies and log in again. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?ended=1", request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(UI_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
