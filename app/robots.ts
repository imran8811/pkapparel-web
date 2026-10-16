import type { MetadataRoute } from "next";

/** Search engines may only index the live site (SITE_INDEXABLE=true). */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (process.env.SITE_INDEXABLE !== "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/cart", "/checkout", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
