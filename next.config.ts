import type { NextConfig } from "next";

// The live addresses unless the environment says otherwise (locally: .env.local).
const apiUrl = new URL(process.env.API_URL || "https://api.pkapparel.com");

/** The old blog's posts. Earlier versions of the old site also served them at /{slug}, /posts/{slug} and /jeans-pants/{slug}. */
const OLD_POSTS = [
  "bulk-jeans",
  "jeans-manufacturers",
  "jeans-manufacturers-in-pakistan",
  "jeans-manufacturing-cost",
  "jeans-pants-manufacturers",
  "jeans-wholesale",
  "motorcycle-jeans-manufacturers",
  "wholesale-denim-jeans-suppliers",
  "wholesale-jeans-bulk",
  "wholesale-jeans-manufacturers",
  "wholesale-jeans-suppliers",
  "wholesale-women-jeans",
].join("|");

/** The live site runs on HTTPS; local copies (http://localhost) must not be pushed to HTTPS. */
const https = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pkapparel.com").startsWith("https://");

/*
 * Content-Security-Policy without per-request nonces, so pages stay static (see the Next.js CSP guide).
 * Everything the site loads comes from its own domain: fonts are self-hosted, images and files go through
 * /uploads and the route handlers, and there are no third-party scripts or frames.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(https ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,

  experimental: {
    // Admin image uploads go through a server action (the API limit is 10 MB; the admin allows 9 MB).
    serverActions: { bodySizeLimit: "10mb" },
  },

  async rewrites() {
    return {
      // Uploaded files (product photos, factory photos, blog images) live in the API's public/uploads.
      // Serving them through this domain keeps image URLs on pkapparel.com and works with an internal API address.
      // Before the routes, because the catch-all page (app/(site)/[...path]) would otherwise answer these URLs.
      beforeFiles: [{ source: "/uploads/:path*", destination: `${apiUrl.origin}/uploads/:path*` }],
      afterFiles: [],
      fallback: [],
    };
  },

  async redirects() {
    // URLs of the old pkapparel.com that no longer exist. Shop and blog URLs keep their old paths.
    return [
      { source: "/pkapparel", destination: "/", permanent: true },
      { source: "/men/jeans-pant", destination: "/wholesale-shop/men/jeans-pant", permanent: true },
      { source: "/women/jeans-pant", destination: "/wholesale-shop/women/jeans-pant", permanent: true },
      { source: "/men/chino-pant", destination: "/wholesale-shop/men/chino-pant", permanent: true },
      { source: "/post/denim-manufacturers", destination: "/post/jeans-manufacturers", permanent: true },
      { source: "/user-account", destination: "/account", permanent: true },
      { source: "/orders", destination: "/account/orders", permanent: true },
      { source: "/order-placed", destination: "/account/orders", permanent: true },
      { source: "/orders-invoice", destination: "/account/orders", permanent: true },
      { source: "/logout", destination: "/", permanent: true },
      // Blog addresses from earlier versions of the old site, still in Google's index.
      { source: `/:slug(${OLD_POSTS})`, destination: "/post/:slug", permanent: true },
      { source: `/jeans-pants/:slug(${OLD_POSTS})`, destination: "/post/:slug", permanent: true },
      { source: "/posts/:slug", destination: "/post/:slug", permanent: true },
      { source: "/denim-manufacturers", destination: "/post/jeans-manufacturers", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // One year; without includeSubDomains, so other subdomains (e.g. mail) are not forced onto HTTPS.
          ...(https ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
        ],
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
