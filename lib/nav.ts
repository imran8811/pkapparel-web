/**
 * Site navigation. Shop URLs keep the old site's pattern
 * (/wholesale-shop/{segment}/{type}) so existing Google rankings carry over.
 */

export const segments = [
  { slug: "men", label: "Men", possessive: "Men's" },
  { slug: "women", label: "Women", possessive: "Women's" },
  { slug: "boys", label: "Boys", possessive: "Boys'" },
  { slug: "girls", label: "Girls", possessive: "Girls'" },
] as const;

export const productTypes = [
  { slug: "jeans-pant", label: "Jeans pants" },
  { slug: "denim-jacket", label: "Denim jackets" },
  { slug: "jeans-short", label: "Jeans shorts" },
  { slug: "cargo-trouser", label: "Cargo trousers", segments: ["men"] },
  { slug: "chino-pant", label: "Chino pants", segments: ["men"] },
  { slug: "denim-skirt", label: "Denim skirts", segments: ["women", "girls"] },
] as const;

export type Segment = (typeof segments)[number]["slug"];
export type ProductType = (typeof productTypes)[number]["slug"];

/** Product types sold in a segment (cargo and chino are men only, skirts women and girls only; owner rules). */
export function typesFor(segment: Segment) {
  return productTypes.filter((type) => !("segments" in type) || (type.segments as readonly string[]).includes(segment));
}

export function isSegment(value: string): value is Segment {
  return segments.some((segment) => segment.slug === value);
}

export function isProductType(value: string): value is ProductType {
  return productTypes.some((type) => type.slug === value);
}

export const segmentInfo = (slug: Segment) => segments.find((segment) => segment.slug === slug)!;
export const typeInfo = (slug: ProductType) => productTypes.find((type) => type.slug === slug)!;

export const shopUrl = (segment?: Segment, type?: ProductType): string =>
  ["/wholesale-shop", segment, type].filter(Boolean).join("/");

export const manufacturingLinks = [
  { href: "/factory", label: "Our factory", description: "Cutting, stitching, washing and QC under one roof." },
  { href: "/quality", label: "Quality & compliance", description: "Inline and final inspections on every order." },
  { href: "/private-label", label: "Private label", description: "Your brand, labels and packaging, our production." },
  { href: "/samples", label: "Samples", description: "Check fit, fabric and wash before you order." },
] as const;

export const mainLinks = [
  { href: "/how-to-order", label: "How to order" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

export const buyerLinks = [
  { href: "/how-to-order", label: "How to order" },
  { href: "/shipping", label: "Shipping: air & sea" },
  { href: "/samples", label: "Samples" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const companyLinks = [
  { href: "/about", label: "About us" },
  { href: "/factory", label: "Our factory" },
  { href: "/quality", label: "Quality & compliance" },
  { href: "/private-label", label: "Private label" },
  { href: "/blog", label: "Blog" },
] as const;

export const legalLinks = [
  { href: "/terms-of-sale", label: "Terms of sale" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
] as const;
