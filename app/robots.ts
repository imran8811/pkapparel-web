import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/** Search engines may only index the live site (SITE_INDEXABLE=true). */
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_INDEXABLE !== "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/cart", "/checkout", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
