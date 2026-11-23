/**
 * Site navigation. Shop URLs keep the old site's pattern
 * (/wholesale-shop/{department}/{category}) so existing Google rankings carry over.
 * The shop's departments and categories are kept by staff (Admin → Shop categories): see getShopSections() in
 * lib/catalog.ts and the helpers in lib/shop.ts.
 */

export const shopUrl = (department?: string, category?: string): string =>
  ["/wholesale-shop", department, category].filter(Boolean).join("/");

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
