import type { NextConfig } from "next";

const apiUrl = new URL(process.env.API_URL ?? "http://127.0.0.1:8080");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,

  experimental: {
    // Admin image uploads go through a server action (the API limit is 10 MB; the admin allows 9 MB).
    serverActions: { bodySizeLimit: "10mb" },
  },

  async rewrites() {
    return [
      // Uploaded files (product photos, factory photos, blog images) live in the API's public/uploads.
      // Serving them through this domain keeps image URLs on pkapparel.com and works with an internal API address.
      { source: "/uploads/:path*", destination: `${apiUrl.origin}/uploads/:path*` },
    ];
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
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
