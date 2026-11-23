/* Shop types and helpers shared by server and client components. */

import { formatMoney, inSentence } from "@/lib/format";

export type ProductImage = { path: string; alt: string; width: number; height: number };

/*
 * The shop's departments (Men, Women…) and categories (Jeans pants, T-shirts…), kept by staff in Admin → Shop
 * categories (owner request 2026-11-23) and read with getShopSections() (lib/catalog.ts). A department's page is
 * /wholesale-shop/{department}; each category it sells has a page below it. A style's `segment` is its department's
 * slug and its `product_type` its category's.
 */

export type ShopDepartment = {
  slug: string;
  name: string;
  /** Its name in titles: "Men's" in "Men's jeans pants". */
  possessive: string;
};

export type ShopCategory = {
  slug: string;
  name: string;
  /** The kind of garment whose details and sizes its styles have (e.g. "jeans-short" for cargo shorts). */
  kind: string;
  /** Denim and twill have a stretch setting (and the shop's stretch filter); knit tops don't. */
  stretch: boolean;
  /** The departments that sell it, in their order: each gives it a page. */
  departments: string[];
};

/** In staff order: menus, filters and lists follow it. */
export type ShopSections = { departments: ShopDepartment[]; categories: ShopCategory[] };

export function findDepartment(sections: ShopSections, slug: string | undefined): ShopDepartment | undefined {
  return sections.departments.find((department) => department.slug === slug);
}

export function findCategory(sections: ShopSections, slug: string | undefined): ShopCategory | undefined {
  return sections.categories.find((category) => category.slug === slug);
}

/** The categories a department sells, in staff order. */
export function categoriesIn(sections: ShopSections, department: string): ShopCategory[] {
  return sections.categories.filter((category) => category.departments.includes(department));
}

/** Whether a department sells a category, i.e. /wholesale-shop/{department}/{category} is a page. */
export function sells(sections: ShopSections, department: string, category: string): boolean {
  return findCategory(sections, category)?.departments.includes(department) ?? false;
}

/**
 * The shop had boys' and girls' pages until 2026-10-20; they lead to Men and Women (owner decision) while the shop has
 * no such department. A department staff add at that address (e.g. Boys) takes it over.
 */
export const FORMER_DEPARTMENTS: Record<string, string> = { boys: "men", girls: "women" };

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
  segment: string;
  product_type: string;
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
  /** Every size ordered in a color needs at least this many pieces. */
  min_pcs_per_size: number;
  lead_time_days: number;
  sample_price_cents: number;
};

export type PriceTier = { min_qty: number; price_cents: number };

/**
 * A style's own packing, as staff entered it (owner request 2026-11-23: shown on its product page). Null where they left
 * it empty: the shop's default packing is only used for freight estimates, never shown as a style's.
 */
export type Packing = {
  piece_weight_g: number | null;
  pcs_per_carton: number | null;
  carton_length_mm: number | null;
  carton_width_mm: number | null;
  carton_height_mm: number | null;
  /** The empty carton. */
  carton_weight_g: number | null;
};

export type Product = {
  slug: string;
  name: string;
  style_no: string | null;
  segment: string;
  product_type: string;
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
  packing: Packing;
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

/** The text of a department page (product_type "") or a category page in a department, with its number of styles shown. */
export type ShopPage = {
  segment: string;
  /** "" for the department page itself (e.g. /wholesale-shop/men). */
  product_type: string;
  title: string;
  intro_html: string;
  faq: { question: string; answer: string }[];
  seo_title: string | null;
  seo_description: string | null;
  style_count: number;
};

export type ShopFilters = {
  segment?: string;
  type?: string;
  fit?: string;
  stretch?: "stretch" | "non-stretch";
  q?: string;
  sort?: ShopSort;
};

/** The shop's orders. The newest styles come first unless buyers choose another (owner request 2026-11-18). */
export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type ShopSort = (typeof SORTS)[number]["value"];

/** The order when none is chosen; it is left out of the address. */
export const DEFAULT_SORT: ShopSort = "newest";

export function productUrl(product: { segment: string; product_type: string; slug: string }, color?: string): string {
  const url = `/wholesale-shop/${product.segment}/${product.product_type}/${product.slug}`;
  return color ? `${url}?color=${encodeURIComponent(color)}` : url;
}

/** "$5.00" or "$5.00–5.50" */
export function priceRange(fromCents: number, toCents: number): string {
  if (fromCents === toCents) return formatMoney(fromCents);
  return `${formatMoney(fromCents)}–${formatMoney(toCents).replace("$", "")}`;
}

/** "Men's jeans pants", but "Men's T-shirts": the category's capital stays when it is more than a first letter. */
export function categoryLabel(sections: ShopSections, segment: string, type: string): string {
  const department = findDepartment(sections, segment)?.possessive ?? segment;
  return `${department} ${inSentence(findCategory(sections, type)?.name ?? type)}`;
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

/*
 * Sizes a buyer adds beyond a style's own, e.g. 38 for jeans listed in 26–36 (owner request 2026-11-21: the shop no
 * longer sells by set). The API checks the same (CartService::size) and writes waist and letter sizes the usual way.
 */

/** Sizes a buyer may add to one color (CartService::MAX_EXTRA_SIZES). */
export const MAX_ADDED_SIZES = 10;

/** The longest size a buyer may add (CartService::MAX_SIZE_LENGTH). */
export const MAX_SIZE_LENGTH = 20;

const SIZE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .\/+()'"-]*$/u;

/** A typed size with its spaces tidied: "  one   size " → "one size". */
export function tidySize(size: string): string {
  return size.trim().replace(/\s+/g, " ");
}

/** Why a typed (tidied) size cannot be added next to the sizes already shown, or null when it can. */
export function addedSizeProblem(size: string, shown: string[]): string | null {
  if (size === "") return "Enter the size.";
  if (size.length > MAX_SIZE_LENGTH || !SIZE_PATTERN.test(size)) {
    return `Write the size with up to ${MAX_SIZE_LENGTH} letters, numbers, spaces and . / - + ( ) ' "`;
  }
  const same = shown.find((other) => other.toLowerCase() === size.toLowerCase());
  return same === undefined ? null : `Size ${same} is already there: enter its pieces in that box.`;
}

const sizeCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** The sizes of a color's quantities that the style does not list (added by the buyer), in size order: 38 before 40. */
export function addedSizes(sizeQty: Record<string, number>, listed: string[]): string[] {
  return Object.keys(sizeQty)
    .filter((size) => !listed.includes(size))
    .sort(sizeCollator.compare);
}

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

/** A size to suggest when adding one: the next size up, e.g. "38" for waist sizes 26–36 or "XXL" for S–XL. */
export function nextSizeExample(system: SizeSystem, sizes: string[]): string {
  if (system === "waist") {
    const largest = Math.max(...sizes.map(Number).filter(Number.isFinite));
    return Number.isFinite(largest) ? String(largest + 2) : "38";
  }
  const largest = Math.max(...sizes.map((size) => LETTER_SIZES.indexOf(size)));
  return (largest >= 0 && LETTER_SIZES[largest + 1]) || "XXL";
}

/** Price per piece for a total quantity of the style, using volume tiers when there are any. */
export function unitPrice(baseCents: number, tiers: PriceTier[], totalPieces: number): number {
  let price = baseCents;
  for (const tier of tiers) {
    if (totalPieces >= tier.min_qty && tier.price_cents < price) price = tier.price_cents;
  }
  return price;
}
