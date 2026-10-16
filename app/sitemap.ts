import type { MetadataRoute } from "next";
import { getProducts, getShopCategories } from "@/lib/catalog";
import { getPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import { productUrl } from "@/lib/shop";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/wholesale-shop", priority: 0.9 },
  { path: "/factory", priority: 0.9 },
  { path: "/private-label", priority: 0.9 },
  { path: "/how-to-order", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/quality", priority: 0.7 },
  { path: "/shipping", priority: 0.7 },
  { path: "/samples", priority: 0.7 },
  { path: "/faq", priority: 0.6 },
  { path: "/contact", priority: 0.6 },
  { path: "/request-quote", priority: 0.6 },
  { path: "/blog", priority: 0.6 },
  { path: "/terms-of-sale", priority: 0.2 },
  { path: "/privacy", priority: 0.2 },
  { path: "/cookies", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, { items: products }] = await Promise.all([getPosts(100), getShopCategories(), getProducts()]);

  return [
    ...PAGES.map((page) => ({ url: absoluteUrl(page.path), priority: page.priority })),
    // Shop pages without styles online are "made to order" pages, kept out of search results.
    ...categories
      .filter((category) => category.style_count > 0)
      .map((category) => ({
        url: absoluteUrl(`/wholesale-shop/${category.segment}${category.product_type ? `/${category.product_type}` : ""}`),
        priority: category.product_type ? 0.8 : 0.85,
      })),
    ...products.map((product) => ({ url: absoluteUrl(productUrl(product)), priority: 0.7 })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/post/${post.slug}`),
      lastModified: post.updated_at ?? undefined,
      priority: 0.5,
    })),
  ];
}
