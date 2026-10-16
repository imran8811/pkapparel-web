import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api, ApiError, apiWithMeta } from "@/lib/api";

/*
 * Marketing content from the API. Everything is cached until the admin changes it:
 * the API then revalidates the matching tag (e.g. "faqs" or "post:bulk-jeans").
 */

export type Image = { path: string; alt: string };

export type Faq = { id: number; category: string; question: string; answer: string };

export type Testimonial = {
  id: number;
  author_name: string | null;
  author_role: string;
  company: string | null;
  country_code: string | null;
  quote: string;
  rating: number | null;
};

export type Certification = {
  id: number;
  name: string;
  issuer: string | null;
  certificate_no: string | null;
  member_since: string | null;
  valid_until: string | null;
  description: string | null;
  image: Image | null;
};

export type Department = {
  slug: string;
  name: string;
  summary: string;
  stats: { label: string; value: string }[];
  images: Image[];
};

export type FactoryFacts = {
  monthly_capacity?: string;
  machines?: string;
  workers?: string;
  qa_staff?: string;
};

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  cover: Image | null;
  author_name: string;
  published_at: string | null;
  updated_at: string | null;
};

export type Post = PostSummary & {
  body_html: string;
  seo_title: string | null;
  seo_description: string | null;
};

export type ContentPage = {
  slug: string;
  title: string;
  body_html: string;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

export async function getFaqs(): Promise<Faq[]> {
  "use cache";
  cacheLife("max");
  cacheTag("faqs");
  return api<Faq[]>("/v1/faqs");
}

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("max");
  cacheTag("testimonials");
  return api<Testimonial[]>("/v1/testimonials");
}

export async function getCertifications(): Promise<Certification[]> {
  "use cache";
  cacheLife("max");
  cacheTag("certifications");
  return api<Certification[]>("/v1/certifications");
}

export async function getFactory(): Promise<{ facts: FactoryFacts; departments: Department[] }> {
  "use cache";
  cacheLife("max");
  cacheTag("factory");
  return api("/v1/factory");
}

export async function getPosts(perPage = 24): Promise<PostSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");
  const { data } = await apiWithMeta<PostSummary[]>("/v1/posts", { query: { per_page: perPage } });
  return data;
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("max");
  cacheTag("posts", `post:${slug}`);
  try {
    return await api<Post>(`/v1/posts/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPage(slug: string): Promise<ContentPage | null> {
  "use cache";
  cacheLife("max");
  cacheTag("pages", `page:${slug}`);
  try {
    return await api<ContentPage>(`/v1/pages/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Headline factory numbers for a "number + label" layout (the label already says "pieces"). */
export function factoryNumbers(facts: FactoryFacts): { value: string; label: string }[] {
  return [
    { value: facts.monthly_capacity?.replace(/\s*pcs$/i, ""), label: "pieces a month" },
    { value: facts.machines, label: "stitching machines" },
    { value: facts.workers, label: "skilled workers" },
    { value: facts.qa_staff, label: "quality inspectors" },
  ].filter((item): item is { value: string; label: string } => Boolean(item.value));
}

export { mediaSrc } from "@/lib/media";
