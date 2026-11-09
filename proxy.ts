import { NextResponse, type NextRequest } from "next/server";

/*
 * Quick checks before rendering: admin pages need the staff cookie, buyer account pages, checkout
 * and the sample order need the buyer cookie; without it, go straight to the matching login page.
 * These are only shortcuts; the real check is the API, which validates the token on every call.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/session-ended"];
const PUBLIC_ACCOUNT_PATHS = ["/account/session-ended", "/stock/account/session-ended"];
const ACCOUNT_PATHS = ["/account", "/checkout", "/samples/order"];
/** The stock pages' account and checkout: their login page is /stock/login. */
const STOCK_ACCOUNT_PATHS = ["/stock/account", "/stock/checkout"];

/*
 * Countries whose visitors get "not available in your region" instead of the site (owner decision, 2026-10-29).
 * BLOCKED_COUNTRIES (comma-separated ISO codes, e.g. "IN,CN,BD,NP") replaces this list without a code change.
 * The country comes from the host: Vercel's x-vercel-ip-country, or Cloudflare's cf-ipcountry if it sits in front.
 * Locally there is no such header, so nothing is blocked (see DEV_VISITOR_COUNTRY below).
 */
const DEFAULT_BLOCKED_COUNTRIES = ["IN", "CN", "BD"];

/*
 * Countries whose visitors see only the stock pages (owner decision, 2026-11-09): every other address sends them to
 * /stock, and everyone else is sent from /stock to the wholesale shop. STOCK_COUNTRIES (comma-separated ISO codes)
 * replaces this list. A stock country is never blocked, even when BLOCKED_COUNTRIES lists it too.
 */
const DEFAULT_STOCK_COUNTRIES = ["PK"];

function countryList(value: string | undefined, fallback: string[]): Set<string> {
  return new Set(
    (value?.trim() ? value.split(",") : fallback).map((code) => code.trim().toUpperCase()).filter(Boolean),
  );
}

const blockedCountries = countryList(process.env.BLOCKED_COUNTRIES, DEFAULT_BLOCKED_COUNTRIES);
const stockCountries = countryList(process.env.STOCK_COUNTRIES, DEFAULT_STOCK_COUNTRIES);

/*
 * Never blocked or sent elsewhere: the admin panel (staff work from the factory), the API's cache refresh, the
 * /uploads proxy and the files search engines read.
 */
const UNBLOCKED_PREFIXES = ["/admin", "/api/", "/uploads/"];
const UNBLOCKED_PATHS = [
  "/robots.txt",
  "/sitemap.xml",
  "/icon.svg",
  "/apple-icon.png",
  "/favicon.ico",
  // Search Console ownership file: Google re-checks it, and its verifier is not in CRAWLERS below.
  "/googleb7b78cc690a74553.html",
];

/*
 * Search engine crawlers are let through wherever they crawl from, so rankings are untouched.
 * Google and Bing crawl mostly from the US, which sees the same pages; Baidu crawls from China.
 * A visitor can fake this user agent, which only shows them the public pages.
 */
const CRAWLERS =
  /googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|mediapartners-google|apis-google|bingbot|adidxbot|bingpreview|msnbot|duckduckbot|yandex(bot|images)|baiduspider|applebot|slurp|petalbot|facebookexternalhit|linkedinbot|twitterbot|whatsapp/i;

/**
 * The visitor's country. In development only, DEV_VISITOR_COUNTRY (e.g. in .env.local) stands in for the host's
 * header, to try the stock pages or the block locally.
 */
function visitorCountry(request: NextRequest): string | undefined {
  const header = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");
  const country = header ?? (process.env.NODE_ENV === "development" ? process.env.DEV_VISITOR_COUNTRY : undefined);
  return country?.trim().toUpperCase() || undefined;
}

/**
 * Blocks or redirects a visitor by country: stock countries stay within /stock, blocked countries get the 403 page,
 * and everyone else is kept out of /stock. Returns null when the visitor may see the page they asked for.
 */
function routeByCountry(request: NextRequest, pathname: string): NextResponse | null {
  if (UNBLOCKED_PATHS.includes(pathname) || UNBLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;
  const country = visitorCountry(request);
  if (!country || CRAWLERS.test(request.headers.get("user-agent") ?? "")) return null;

  const inStock = matches(pathname, "/stock");
  if (stockCountries.has(country)) return inStock ? null : countryRedirect(request, "/stock");
  if (blockedCountries.has(country)) return blockedResponse();
  return inStock ? countryRedirect(request, "/wholesale-shop") : null;
}

/** Temporary and never cached: the next visitor to the same address may be in another country. */
function countryRedirect(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), 307);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
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
<title>Not available</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; box-sizing: border-box;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #fafafa; color: #18181b; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 .75rem; }
  p { margin: 0; color: #52525b; max-width: 32rem; line-height: 1.5; }
</style>
</head>
<body>
<main>
<h1>Not available</h1>
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

  const routed = routeByCountry(request, pathname);
  if (routed) return routed;

  if (matches(pathname, "/admin")) {
    if (PUBLIC_ADMIN_PATHS.includes(pathname) || request.cookies.has("pk_admin")) return NextResponse.next();
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const stockAccount = STOCK_ACCOUNT_PATHS.some((base) => matches(pathname, base));
  if (!stockAccount && !ACCOUNT_PATHS.some((base) => matches(pathname, base))) return NextResponse.next();
  if (PUBLIC_ACCOUNT_PATHS.includes(pathname) || request.cookies.has("pk_session")) return NextResponse.next();
  const login = new URL(stockAccount ? "/stock/login" : "/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Every page (for the country check), but not the build's static files or the image optimizer.
  matcher: ["/((?!_next/static|_next/image|_next/data).*)"],
};
