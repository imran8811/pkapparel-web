/* Shop types and helpers shared by server and client components. */

import { formatMoney } from "@/lib/format";
import { segmentInfo, typeInfo, type ProductType, type Segment } from "@/lib/nav";

export type ProductImage = { path: string; alt: string; width: number; height: number };

export type ColorCard = {
  code: string;
  name: string;
  slug: string;
  hex: string | null;
  image: ProductImage | null;
  hover_image: ProductImage | null;
};

export type ProductCard = {
  slug: string;
  name: string;
  style_no: string | null;
  segment: Segment;
  product_type: ProductType;
  fit: string | null;
  stretch: "stretch" | "non-stretch" | null;
  fabric_weight: string | null;
  price_from_cents: number;
  price_to_cents: number;
  is_featured: boolean;
  colors: ColorCard[];
};

/** A style's details by key (fit, rise, neckline…): which keys a type has comes from the API (`spec_fields`). */
export type Specs = Record<string, string | null | undefined>;

/** A spec of the style's type, labeled for that type (e.g. "Inseam" for jeans, "Finish" for T-shirts), in display order. */
export type SpecField = { key: string; label: string };

/** Waist sizes in inches, letter sizes (S, M, L…), or the style's own list. */
export type SizeSystem = "waist" | "letter" | "other";

export type ProductColor = {
  /** Used to add this color to the cart. */
  id: number;
  code: string;
  name: string;
  slug: string;
  hex: string | null;
  price_cents: number;
  specs: Specs;
  images: ProductImage[];
};

export type SizeChart = {
  name: string;
  unit: "in" | "cm";
  measurements: string[];
  rows: { size: string; values: string[] }[];
  note: string | null;
};

export type OrderRules = {
  moq_per_color: number;
  set_pcs_per_size: number;
  /** Every size ordered in a color needs at least this many pieces. */
  min_pcs_per_size: number;
  lead_time_days: number;
  sample_price_cents: number;
};

export type PriceTier = { min_qty: number; price_cents: number };

export type Product = {
  slug: string;
  name: string;
  style_no: string | null;
  segment: Segment;
  product_type: ProductType;
  specs: Specs;
  spec_fields: SpecField[];
  description_html: string;
  features: string[];
  size_system: SizeSystem;
  sizes: string[];
  size_chart: SizeChart | null;
  price_cents: number;
  price_from_cents: number;
  price_to_cents: number;
  tiers: PriceTier[];
  rules: OrderRules;
  piece_weight_g: number | null;
  colors: ProductColor[];
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  related: ProductCard[];
  /** Approved reviews of orders that included this style. */
  reviews: ProductReviews;
};

export type ProductReview = {
  rating: number;
  body: string;
  /** The buyer's company, or their business type ("Brand owner"). */
  name: string;
  country_code: string | null;
  date: string;
};

export type ProductReviews = { count: number; average: number | null; items: ProductReview[] };

export type ShopCategory = {
  segment: Segment;
  /** "" for the segment page itself (e.g. /wholesale-shop/men). */
  product_type: ProductType | "";
  title: string;
  intro_html: string;
  faq: { question: string; answer: string }[];
  seo_title: string | null;
  seo_description: string | null;
  style_count: number;
};

export type ShopFilters = {
  segment?: Segment;
  type?: ProductType;
  fit?: string;
  stretch?: "stretch" | "non-stretch";
  q?: string;
  sort?: ShopSort;
};

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type ShopSort = (typeof SORTS)[number]["value"];

export function productUrl(product: { segment: string; product_type: string; slug: string }, color?: string): string {
  const url = `/wholesale-shop/${product.segment}/${product.product_type}/${product.slug}`;
  return color ? `${url}?color=${encodeURIComponent(color)}` : url;
}

/** "$5.00" or "$5.00–5.50" */
export function priceRange(fromCents: number, toCents: number): string {
  if (fromCents === toCents) return formatMoney(fromCents);
  return `${formatMoney(fromCents)}–${formatMoney(toCents).replace("$", "")}`;
}

/** "Men's jeans pants" */
export function categoryLabel(segment: Segment, type: ProductType): string {
  return `${segmentInfo(segment).possessive} ${typeInfo(type).label.toLowerCase()}`;
}

export function specValue(key: string, value: string | null | undefined): string | null {
  if (!value) return null;
  if (key === "stretch") return value === "stretch" ? "Stretch" : "No stretch (rigid)";
  return value;
}

/** "Waist sizes 30, 32, 33 and 34 (inches)" or "Sizes S, M, L and XL" */
export function sizesText(system: SizeSystem, sizes: string[]): string {
  const list = sizes.length > 1 ? `${sizes.slice(0, -1).join(", ")} and ${sizes[sizes.length - 1]}` : (sizes[0] ?? "");
  return system === "waist" ? `Waist sizes ${list} (inches)` : `${sizes.length === 1 ? "Size" : "Sizes"} ${list}`;
}

/** Price per piece for a total quantity of the style, using volume tiers when there are any. */
export function unitPrice(baseCents: number, tiers: PriceTier[], totalPieces: number): number {
  let price = baseCents;
  for (const tier of tiers) {
    if (totalPieces >= tier.min_qty && tier.price_cents < price) price = tier.price_cents;
  }
  return price;
}
