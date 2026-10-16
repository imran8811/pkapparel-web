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

/* ----- Wholesale shop ----- */

export type ProductStatus = "draft" | "active" | "archived";

export type AdminProductSummary = {
  id: number;
  slug: string;
  name: string;
  style_no: string | null;
  segment: string;
  product_type: string;
  price_cents: number;
  status: ProductStatus;
  is_featured: boolean;
  color_count: number;
  thumbnail: string | null;
  updated_at: string;
};

export type ColorSpecs = Partial<Record<"fabric" | "composition" | "fabric_weight" | "stretch" | "wash" | "closure", string>>;

export type AdminProductImage = { path: string; alt: string; width: number; height: number };

export type AdminColor = {
  id: number;
  product_id: number;
  code: string;
  name: string;
  slug: string;
  hex: string | null;
  price_cents: number | null;
  spec_overrides: ColorSpecs;
  legacy_article_no: string | null;
  is_active: boolean;
  sort_order: number;
  images: AdminProductImage[];
};

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  style_no: string | null;
  segment: string;
  product_type: string;
  fit: string | null;
  fabric: string | null;
  composition: string | null;
  fabric_weight: string | null;
  stretch: "stretch" | "non-stretch" | null;
  wash: string | null;
  closure: string | null;
  description_html: string;
  features: string[];
  sizes: string[];
  size_chart_id: number | null;
  price_cents: number;
  moq_per_color: number | null;
  set_pcs_per_size: number | null;
  lead_time_days: number | null;
  sample_price_cents: number | null;
  piece_weight_g: number | null;
  pcs_per_carton: number | null;
  carton_length_mm: number | null;
  carton_width_mm: number | null;
  carton_height_mm: number | null;
  carton_weight_g: number | null;
  seo_title: string | null;
  seo_description: string | null;
  status: ProductStatus;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  colors: AdminColor[];
  tiers: { min_qty: number; price_cents: number }[];
};

export type AdminSizeChart = {
  id: number;
  name: string;
  unit: "in" | "cm";
  measurements: string[];
  size_rows: { size: string; values: string[] }[];
  note: string | null;
  updated_at: string;
  product_count: number;
};

export type AdminShopCategory = {
  id: number;
  segment: string;
  product_type: string;
  title: string;
  intro_html: string;
  faq: { question: string; answer: string }[];
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};
