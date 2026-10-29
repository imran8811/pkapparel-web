import { NextResponse, type NextRequest } from "next/server";

/*
 * Quick checks before rendering: admin pages need the staff cookie, buyer account pages, checkout
 * and the sample order need the buyer cookie; without it, go straight to the matching login page.
 * These are only shortcuts; the real check is the API, which validates the token on every call.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/session-ended"];
const PUBLIC_ACCOUNT_PATHS = ["/account/session-ended"];
const ACCOUNT_PATHS = ["/account", "/checkout", "/samples/order"];

/*
 * Countries whose visitors get "not available in your region" instead of the site (owner decision, 2026-10-29).
 * BLOCKED_COUNTRIES (comma-separated ISO codes, e.g. "PK,IN,CN,BD,NP") replaces this list without a code change.
 * The country comes from the host: Vercel's x-vercel-ip-country, or Cloudflare's cf-ipcountry if it sits in front.
 * Locally there is no such header, so nothing is blocked.
 */
const DEFAULT_BLOCKED_COUNTRIES = ["PK", "IN", "CN", "BD"];
const blockedCountries = new Set(
  (process.env.BLOCKED_COUNTRIES?.trim() ? process.env.BLOCKED_COUNTRIES.split(",") : DEFAULT_BLOCKED_COUNTRIES)
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean),
);

/*
 * Never blocked: the admin panel (staff work from the factory), the API's cache refresh, the /uploads proxy
 * and the files search engines read.
 */
const UNBLOCKED_PREFIXES = ["/admin", "/api/", "/uploads/"];
const UNBLOCKED_PATHS = ["/robots.txt", "/sitemap.xml", "/icon.svg", "/apple-icon.png", "/favicon.ico"];

/*
 * Search engine crawlers are let through wherever they crawl from, so rankings are untouched.
 * Google and Bing crawl mostly from the US, which sees the same pages; Baidu crawls from China.
 * A visitor can fake this user agent, which only shows them the public pages.
 */
const CRAWLERS =
  /googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|mediapartners-google|apis-google|bingbot|adidxbot|bingpreview|msnbot|duckduckbot|yandex(bot|images)|baiduspider|applebot|slurp|petalbot|facebookexternalhit|linkedinbot|twitterbot|whatsapp/i;

function isBlocked(request: NextRequest, pathname: string) {
  if (UNBLOCKED_PATHS.includes(pathname) || UNBLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  const country = (request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry"))?.toUpperCase();
  if (!country || !blockedCountries.has(country)) return false;
  return !CRAWLERS.test(request.headers.get("user-agent") ?? "");
}

/*
 * 403 rather than a redirect, so no other URL gets attached to the page. Never cached: the next visitor
 * to the same URL may be in another country. noindex in case a crawler ever receives it.
 */
const BLOCKED_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Not available in your region | PK Apparel</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; box-sizing: border-box;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #fafafa; color: #18181b; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 .75rem; }
  p { margin: 0; color: #52525b; max-width: 32rem; line-height: 1.5; }
</style>
</head>
<body>
<main>
<h1>Not available in your region</h1>
<p>Sorry, the PK Apparel website is not available in your country.</p>
</main>
</body>
</html>`;

function blockedResponse() {
  return new NextResponse(BLOCKED_PAGE, {
    status: 403,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(base + "/");

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBlocked(request, pathname)) return blockedResponse();

  if (matches(pathname, "/admin")) {
    if (PUBLIC_ADMIN_PATHS.includes(pathname) || request.cookies.has("pk_admin")) return NextResponse.next();
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (!ACCOUNT_PATHS.some((base) => matches(pathname, base))) return NextResponse.next();
  if (PUBLIC_ACCOUNT_PATHS.includes(pathname) || request.cookies.has("pk_session")) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Every page (for the country check), but not the build's static files or the image optimizer.
  matcher: ["/((?!_next/static|_next/image|_next/data).*)"],
};
