/*
 * Stock: ready jeans from stock on hand, sold by set (one set per style), priced per set.
 * Types and helpers shared by server and client components. Amounts are in paisa (rupees × 100), like every amount
 * from the API.
 */

import type { Address } from "@/lib/account/types";
import type { ProductImage, SpecField, Specs } from "@/lib/shop";

export const stockSegments = [
  { slug: "men", label: "Men", title: "Men's jeans" },
  { slug: "boys", label: "Boys", title: "Boys' jeans" },
] as const;

export type StockSegment = (typeof stockSegments)[number]["slug"];

export function isStockSegment(value: string): value is StockSegment {
  return stockSegments.some((segment) => segment.slug === value);
}

export const stockSegmentInfo = (slug: StockSegment) => stockSegments.find((segment) => segment.slug === slug)!;

/** The section listed at /stock itself: the stock pages open on the men's jeans (owner decision 2026-11-09). */
export const DEFAULT_STOCK_SEGMENT: StockSegment = "men";

/** A section's listing (/stock for the men's jeans, /stock/boys) or a style (/stock/men/{style}). */
export function stockUrl(segment?: string, slug?: string): string {
  if (!slug && (!segment || segment === DEFAULT_STOCK_SEGMENT)) return "/stock";
  return ["/stock", segment, slug].filter(Boolean).join("/");
}

export const stockInfoLinks = [
  { href: "/stock/how-to-order", label: "How to order" },
  { href: "/stock/contact", label: "Contact" },
] as const;

export const stockLegalLinks = [
  { href: "/stock/terms", label: "Terms and returns" },
  { href: "/stock/privacy", label: "Privacy" },
] as const;

/** Stock is jeans only: its specs (labels and suggestions) are those of the wholesale shop's jeans pants. */
export const STOCK_PRODUCT_TYPE = "jeans-pant";

/** Days after delivery to report an issue and return goods (owner decision 2026-11-09). */
export const RETURN_DAYS = 7;

export type StockSetSize = { size: string; pcs: number };

export type StockColorCard = {
  code: string;
  name: string;
  slug: string;
  hex: string | null;
  sets_in_stock: number;
  image: ProductImage | null;
  hover_image: ProductImage | null;
};

export type StockCard = {
  slug: string;
  name: string;
  style_no: string | null;
  segment: StockSegment;
  fit: string | null;
  stretch: "stretch" | "non-stretch" | null;
  /** The sizes of the set, smallest first. */
  sizes: string[];
  set_pieces: number;
  /** Prices are per piece; a set costs its pieces times this (set_price_cents). 0: no price yet. */
  piece_price_cents: number;
  set_price_cents: number;
  sets_in_stock: number;
  is_featured: boolean;
  colors: StockColorCard[];
};

export type StockColor = {
  id: number;
  code: string;
  name: string;
  slug: string;
  hex: string | null;
  sets_in_stock: number;
  images: ProductImage[];
};

export type StockStyle = {
  slug: string;
  name: string;
  style_no: string | null;
  segment: StockSegment;
  specs: Specs;
  spec_fields: SpecField[];
  description_html: string;
  set: { sizes: StockSetSize[]; pieces: number };
  /** Prices are per piece; a set costs its pieces times this (set_price_cents). 0: no price yet. */
  piece_price_cents: number;
  set_price_cents: number;
  sets_in_stock: number;
  colors: StockColor[];
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  related: StockCard[];
};

export type StockFilters = {
  size?: string;
  fit?: string;
  stretch?: "stretch" | "non-stretch";
  sort?: StockSort;
};

export const STOCK_SORTS = [
  { value: "stock", label: "In stock first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type StockSort = (typeof STOCK_SORTS)[number]["value"];

const rupees = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "Rs 12,500" */
export function formatRupees(cents: number): string {
  return `Rs ${rupees.format(Math.round(cents / 100))}`;
}

/** "Rs 980" (a piece), or "Price on request" while a listing copied from the wholesale shop has no price yet. */
export function formatPiecePrice(cents: number): string {
  return cents > 0 ? formatRupees(cents) : "Price on request";
}

/** "28–36", or the one size */
export function sizeRange(sizes: string[]): string {
  if (sizes.length <= 1) return sizes[0] ?? "";
  return `${sizes[0]}–${sizes[sizes.length - 1]}`;
}

/** "28, 30 (2), 32 (2), 34": each size, with its pieces when a set has more than one of it. */
export function setContents(sizes: StockSetSize[]): string {
  return sizes.map(({ size, pcs }) => (pcs > 1 ? `${size} (${pcs})` : size)).join(", ");
}

/** "12 sets in stock", "1 set in stock" or "Sold out" */
export function setsInStock(sets: number): string {
  if (sets <= 0) return "Sold out";
  return `${sets} ${sets === 1 ? "set" : "sets"} in stock`;
}

/** The styles that match the filters, sorted (in stock first unless sorted by price). */
export function filterStock(styles: StockCard[], filters: StockFilters): StockCard[] {
  const matching = styles.filter(
    (style) =>
      (!filters.size || style.sizes.includes(filters.size)) &&
      (!filters.fit || style.fit?.toLowerCase() === filters.fit.toLowerCase()) &&
      (!filters.stretch || style.stretch === filters.stretch),
  );
  // By the price per piece; listings without a price yet come last either way.
  const price = (style: StockCard, none: number) => (style.piece_price_cents > 0 ? style.piece_price_cents : none);
  if (filters.sort === "price-asc") return [...matching].sort((a, b) => price(a, Number.MAX_SAFE_INTEGER) - price(b, Number.MAX_SAFE_INTEGER));
  if (filters.sort === "price-desc") return [...matching].sort((a, b) => price(b, -1) - price(a, -1));
  return matching;
}

/** Every size and fit among the styles, for the filters. */
export function stockFacets(styles: StockCard[]): { sizes: string[]; fits: string[] } {
  const sizes = [...new Set(styles.flatMap((style) => style.sizes))].sort((a, b) => Number(a) - Number(b));
  const fits = [...new Set(styles.map((style) => style.fit).filter((fit): fit is string => Boolean(fit)))].sort();
  return { sizes, fits };
}

/* ----- The stock cart and checkout (from /v1/stock/cart and /v1/account/stock-checkout) ----- */

export type StockCartLine = {
  color_id: number;
  code: string;
  name: string;
  slug: string;
  hex: string | null;
  image: ProductImage | null;
  style: { slug: string; name: string; style_no: string | null; segment: StockSegment };
  set: { sizes: StockSetSize[]; pieces: number };
  piece_price_cents: number;
  set_price_cents: number;
  sets: number;
  pieces: number;
  line_cents: number;
  sets_in_stock: number;
  /** False when the style or color is no longer shown, or sold out. */
  available: boolean;
  /** More sets in the cart than in stock. */
  short: boolean;
};

export type StockCart = {
  lines: StockCartLine[];
  line_count: number;
  total_sets: number;
  total_pieces: number;
  total_cents: number;
  currency: "PKR";
  min_sets_per_order: number;
  /** What blocks the checkout, in words. */
  issues: string[];
  can_checkout: boolean;
};

export type StockCheckout = {
  cart: StockCart;
  addresses: Address[];
  pickup: { address: string | null; hours: string | null };
  dispatch_days: number;
  payment_days: number;
  /** "Bank transfer", "JazzCash", "Easypaisa": the ways to pay that are set up. */
  payment_methods: string[];
  email_verified: boolean;
};

/** The stock order pages under the buyer's account. */
export const stockOrderUrl = (orderNo: string, page?: "confirm-payment") => `/stock/account/orders/${orderNo}${page ? `/${page}` : ""}`;
