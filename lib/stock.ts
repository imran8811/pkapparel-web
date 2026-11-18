/*
 * Stock: ready clothes from stock on hand, sold by set (one set per style), priced per set. Every style is in a
 * department (Men, Women, Boys…) and a category (Jeans, Cotton pants…), both kept by staff in Admin → Stock categories.
 * Types and helpers shared by server and client components. Amounts are in paisa (rupees × 100), like every amount
 * from the API.
 */

import type { Address } from "@/lib/account/types";
import type { CatalogDefinitions, CatalogSpec } from "@/lib/admin/types";
import type { ProductImage, SpecField, Specs } from "@/lib/shop";

/** A stock department (Men, Women, Boys…) or category (Jeans, Cotton pants…). Styles name theirs by slug. */
export type StockSection = { slug: string; name: string };

/** The departments and categories in staff order (GET /v1/stock/sections). */
export type StockSections = { departments: StockSection[]; categories: StockSection[] };

/**
 * The department listed at /stock itself: the stock pages open on the men's (owner decision 2026-11-09). Mirrors the
 * API's StockDepartment::HOME, which staff cannot delete.
 */
export const DEFAULT_STOCK_SEGMENT = "men";

/** A department's listing (/stock for the men's, /stock/boys) or a style (/stock/men/{style}). */
export function stockUrl(segment?: string, slug?: string): string {
  if (!slug && (!segment || segment === DEFAULT_STOCK_SEGMENT)) return "/stock";
  return ["/stock", segment, slug].filter(Boolean).join("/");
}

/** A department's listing of one category: /stock/boys?category=cotton-pants. */
export function stockCategoryUrl(segment: string, category?: string): string {
  return category ? `${stockUrl(segment)}?category=${encodeURIComponent(category)}` : stockUrl(segment);
}

/** "Men's", "Women's", "Boys'": a department's name before what it sells. */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

/** A name inside a sentence: "cotton pants", but "T-shirts" keeps its capital. */
export function inSentence(name: string): string {
  return /^\p{Lu}\p{Ll}/u.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

/** "Men's cotton pants": a category in a department. */
export function sectionTitle(department: string, category: string): string {
  return `${possessive(department)} ${inSentence(category)}`;
}

/** "jeans", "jeans and cotton pants", "jeans, shorts and cotton pants" */
function joinNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * A department's title, from the categories it has styles in (all of them while it has none): "Men's jeans", "Men's
 * jeans and cotton pants", or "Men's clothing" beyond three categories.
 */
export function departmentTitle(department: StockSection, categories: StockSection[], styles: { segment: string; category: string }[]): string {
  const stocked = categories.filter((category) => styles.some((style) => style.segment === department.slug && style.category === category.slug));
  const names = (stocked.length > 0 ? stocked : categories).map((category) => inSentence(category.name));
  return `${possessive(department.name)} ${names.length > 0 && names.length <= 3 ? joinNames(names) : "clothing"}`;
}

/** What a department's listing says under its title, and the start of its search description. */
export function stockIntro(title: string): string {
  return `${title} ready in stock, in sets of the sizes shown on each style. See the sets in stock for every color, then order online or on WhatsApp.`;
}

export const stockInfoLinks = [
  { href: "/stock/how-to-order", label: "How to order" },
  { href: "/stock/contact", label: "Contact" },
] as const;

export const stockLegalLinks = [
  { href: "/stock/terms", label: "Terms and returns" },
  { href: "/stock/privacy", label: "Privacy" },
] as const;

/** Details only stock listings have, after their category's specs. Mirrors the API's StockStyle::OWN_SPECS. */
const STOCK_OWN_SPECS: CatalogSpec[] = [{ key: "label", label: "Label", max: 80, suggestions: [], per_color: false }];

/**
 * The specs of a stock listing, in display order: those of its category's product type (as in the wholesale shop:
 * jeans pants for jeans, chino pants for cotton pants), then the stock's own (the label).
 */
export function stockSpecs(catalog: CatalogDefinitions, productType: string): CatalogSpec[] {
  return [...(catalog.types.find((type) => type.slug === productType)?.specs ?? []), ...STOCK_OWN_SPECS];
}

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
  /** The slugs of its department and category, and their names. */
  segment: string;
  category: string;
  department_name: string;
  category_name: string;
  fit: string | null;
  stretch: "stretch" | "non-stretch" | null;
  /** The sizes of the set, smallest first. */
  sizes: string[];
  set_pieces: number;
  /** Prices are per piece; a set costs its pieces times this (set_price_cents). 0: no price yet. */
  piece_price_cents: number;
  set_price_cents: number;
  sets_in_stock: number;
  /** For the "Featured" order: featured first, then lower numbers first. */
  is_featured: boolean;
  sort_order: number;
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
  segment: string;
  category: string;
  department_name: string;
  category_name: string;
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
  /** A category's slug. */
  category?: string;
  size?: string;
  fit?: string;
  stretch?: "stretch" | "non-stretch";
  sort?: StockSort;
};

/**
 * The orders of the stock pages. The newest listings come first unless buyers choose another (owner request
 * 2026-11-18); listings in stock come before sold-out ones except by price.
 */
export const STOCK_SORTS = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type StockSort = (typeof STOCK_SORTS)[number]["value"];

/** The order when none is chosen; it is left out of the address. */
export const DEFAULT_STOCK_SORT: StockSort = "newest";

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

/**
 * The styles that match the filters, sorted. They come from the API in stock first, the newest first in each ("Newest");
 * "Featured" keeps those in stock first, then puts featured ones first and follows the staff order.
 */
export function filterStock(styles: StockCard[], filters: StockFilters): StockCard[] {
  const matching = styles.filter(
    (style) =>
      (!filters.category || style.category === filters.category) &&
      (!filters.size || style.sizes.includes(filters.size)) &&
      (!filters.fit || style.fit?.toLowerCase() === filters.fit.toLowerCase()) &&
      (!filters.stretch || style.stretch === filters.stretch),
  );
  // By the price per piece; listings without a price yet come last either way.
  const price = (style: StockCard, none: number) => (style.piece_price_cents > 0 ? style.piece_price_cents : none);
  if (filters.sort === "price-asc") return [...matching].sort((a, b) => price(a, Number.MAX_SAFE_INTEGER) - price(b, Number.MAX_SAFE_INTEGER));
  if (filters.sort === "price-desc") return [...matching].sort((a, b) => price(b, -1) - price(a, -1));
  if (filters.sort === "featured") {
    const inStock = (style: StockCard) => (style.sets_in_stock > 0 ? 1 : 0);
    // Sorting is stable: styles that tie stay newest first.
    return [...matching].sort((a, b) => inStock(b) - inStock(a) || Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order);
  }
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
  style: { slug: string; name: string; style_no: string | null; segment: string; category: string };
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
