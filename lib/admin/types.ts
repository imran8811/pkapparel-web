/* Shapes returned by the admin API (/v1/admin/…). */

import type { Address, Site } from "@/lib/site";

export type Role = "admin" | "editor" | "sales" | "production";

export type Staff = { id: number; name: string; email: string; role: Role };

export type Pagination = { page: number; per_page: number; total: number; pages: number };

export type InquiryType = "contact" | "quote" | "sample";

export type InquiryStatus = "new" | "in_progress" | "quoted" | "won" | "lost" | "closed" | "spam";

export type InquirySummary = {
  id: number;
  reference: string;
  type: InquiryType;
  name: string;
  company: string | null;
  email: string;
  country_code: string | null;
  preview: string;
  status: InquiryStatus;
  created_at: string;
};

export type Inquiry = InquirySummary & {
  phone: string | null;
  message: string;
  details: Record<string, string>;
  source_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  handled_by: { id: number; name: string | null } | null;
  updated_at: string;
};

export type Dashboard = {
  inquiries?: { new: number; open: number; last_30_days: number; latest: InquirySummary[] };
  content?: {
    posts: { published: number; scheduled: number; drafts: number };
    faqs: number;
    testimonials: number;
    certifications: number;
  };
};

export type PostStatus = "draft" | "published";

/** Whether readers can see the post: "scheduled" = published with a future date. */
export type PostVisibility = "draft" | "scheduled" | "published";

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  status: PostStatus;
  visibility: PostVisibility;
  cover: { path: string; alt: string } | null;
  published_at: string | null;
  updated_at: string | null;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body_html: string;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  author_name: string;
  status: PostStatus;
  visibility: PostVisibility;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type PostCounts = { published: number; scheduled: number; drafts: number };

export type PageSummary = { slug: string; title: string; is_published: boolean; updated_at: string };

export type Page = PageSummary & { body_html: string; seo_title: string | null; seo_description: string | null };

export type Faq = {
  id: number;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
};

export type Testimonial = {
  id: number;
  author_name: string | null;
  author_role: string;
  company: string | null;
  country_code: string | null;
  quote: string;
  rating: number | null;
  sort_order: number;
  is_published: boolean;
};

export type Certification = {
  id: number;
  name: string;
  issuer: string | null;
  certificate_no: string | null;
  member_since: string | null;
  valid_until: string | null;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_published: boolean;
};

export type Department = {
  slug: string;
  name: string;
  summary: string;
  stats: { label: string; value: string }[];
  images: { path: string; alt: string }[];
  sort_order: number;
  is_published: boolean;
  updated_at: string;
};

export type FactoryFacts = {
  monthly_capacity?: string;
  machines?: string;
  workers?: string;
  qa_staff?: string;
  confirmed?: boolean;
};

export type AdminSettings = {
  company: Site["company"];
  contact: Site["contact"];
  addresses: Address[];
  social: Site["social"];
  commerce: Site["commerce"];
  factory_facts: FactoryFacts;
};

export type Upload = { path: string; width: number; height: number; size: number };
