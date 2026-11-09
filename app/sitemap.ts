import type { MetadataRoute } from "next";
import { getProducts, getShopCategories } from "@/lib/catalog";
import { getPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import { productUrl } from "@/lib/shop";
import { DEFAULT_STOCK_SEGMENT, stockSegments, stockUrl } from "@/lib/stock";
import { getStockStyles } from "@/lib/stock-catalog";

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

const STOCK_PAGES: { path: string; priority: number }[] = [
  { path: "/stock", priority: 0.9 },
  { path: "/stock/how-to-order", priority: 0.6 },
  { path: "/stock/contact", priority: 0.5 },
  { path: "/stock/terms", priority: 0.2 },
  { path: "/stock/privacy", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, { items: products }, stock] = await Promise.all([getPosts(100), getShopCategories(), getProducts(), getStockStyles()]);

  return [
    ...PAGES.map((page) => ({ url: absoluteUrl(page.path), priority: page.priority })),
    // The stock pages (only reachable from the stock countries, but crawlers may index them: owner decision 2026-11-09).
    ...STOCK_PAGES.map((page) => ({ url: absoluteUrl(page.path), priority: page.priority })),
    // The men's jeans are /stock itself (listed above).
    ...stockSegments.filter((segment) => segment.slug !== DEFAULT_STOCK_SEGMENT).map((segment) => ({ url: absoluteUrl(stockUrl(segment.slug)), priority: 0.8 })),
    ...stock.map((style) => ({ url: absoluteUrl(stockUrl(style.segment, style.slug)), priority: 0.7 })),
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
