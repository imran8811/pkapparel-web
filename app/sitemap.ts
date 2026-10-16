import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
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
  const posts = await getPosts(100);

  return [
    ...PAGES.map((page) => ({ url: absoluteUrl(page.path), priority: page.priority })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/post/${post.slug}`),
      lastModified: post.updated_at ?? undefined,
      priority: 0.5,
    })),
  ];
}
