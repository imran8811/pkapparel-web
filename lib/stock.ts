/*
 * Stock: ready jeans from stock on hand, sold by set (one set per style), priced per set.
 * Types and helpers shared by server and client components. Amounts are in paisa (rupees × 100), like every amount
 * from the API.
 */

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

/** /stock, /stock/men or /stock/men/{style} */
export function stockUrl(segment?: string, slug?: string): string {
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
  if (filters.sort === "price-asc") return [...matching].sort((a, b) => a.set_price_cents - b.set_price_cents);
  if (filters.sort === "price-desc") return [...matching].sort((a, b) => b.set_price_cents - a.set_price_cents);
  return matching;
}

/** Every size and fit among the styles, for the filters. */
export function stockFacets(styles: StockCard[]): { sizes: string[]; fits: string[] } {
  const sizes = [...new Set(styles.flatMap((style) => style.sizes))].sort((a, b) => Number(a) - Number(b));
  const fits = [...new Set(styles.map((style) => style.fit).filter((fit): fit is string => Boolean(fit)))].sort();
  return { sizes, fits };
}
