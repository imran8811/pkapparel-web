import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { SectionHeading } from "@/components/site/section-heading";
import { StockGrid } from "@/components/stock/stock-card";
import { StockDetails } from "@/components/stock/stock-details";
import { StockStyleView } from "@/components/stock/stock-style-view";
import { mediaSrc } from "@/lib/media";
import { findRedirect } from "@/lib/redirects";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { setContents, sizeRange, stockSegmentInfo, stockUrl, type StockStyle } from "@/lib/stock";
import { getStockStyle, getStockStyles } from "@/lib/stock-catalog";

/**
 * Always served as a complete static page. After staff change the style or its stock, the next visitor waits
 * for the fresh page instead of getting the generic fallback shell with the old content.
 */
export const ensureStatic = "navigation";
// The address is read before anything streams, so a redirect or a 404 keeps its HTTP status. Every style is
// prerendered (generateStaticParams), so navigating to one still uses static output.
export const instant = false;

export async function generateStaticParams() {
  const styles = await getStockStyles();
  // Cache Components needs one value to prerender; styles added later render on their first visit.
  return styles.length > 0 ? styles.map((style) => ({ segment: style.segment, slug: style.slug })) : [{ segment: "men", slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/stock/[segment]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const style = await getStockStyle(slug);
  if (!style) return {};
  const image = style.colors[0]?.images[0];
  return pageMetadata({
    title: style.seo_title ?? `${listingName(style)}, in stock`,
    description: style.seo_description ?? description(style),
    path: stockUrl(style.segment, style.slug),
    image: image ? mediaSrc(image.path) : undefined,
  });
}

export default async function StockStylePage({ params }: PageProps<"/stock/[segment]/[slug]">) {
  const { segment, slug } = await params;
  const style = await getStockStyle(slug);

  if (!style) {
    // A redirect from the admin (e.g. the style's address changed).
    const moved = await findRedirect(stockUrl(segment, slug));
    if (moved) permanentRedirect(moved);
    notFound();
  }
  if (style.segment !== segment) permanentRedirect(stockUrl(style.segment, style.slug));

  const info = stockSegmentInfo(style.segment);

  return (
    <>
      <section className="pt-6 pb-16 sm:pt-8">
        <Container>
          <Breadcrumbs
            tone="dark"
            className="mb-8"
            root={{ label: info.title, href: stockUrl(style.segment) }}
            items={[{ label: listingName(style), href: stockUrl(style.segment, style.slug) }]}
          />
          <StockStyleView style={style} />
        </Container>
      </section>

      <StockDetails style={style} />

      {style.related.length > 0 ? (
        <section className="border-t border-border py-16 sm:py-20">
          <Container>
            <SectionHeading eyebrow="More in stock" title={`More ${info.title.toLowerCase()}`} align="stack" />
            <StockGrid styles={style.related} className="mt-10" />
          </Container>
        </section>
      ) : null}

      <JsonLd data={structuredData(style)} />
    </>
  );
}

/** "Men's slim stretch jeans in sky blue": a listing is one color, and listings of a style share its name. */
function listingName(style: StockStyle): string {
  return style.colors.length === 1 ? `${style.name} in ${style.colors[0].name.toLowerCase()}` : style.name;
}

function description(style: StockStyle): string {
  const text = style.description_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return (
    text ||
    `${style.name}, in stock and sold by set: ${style.set.pieces} pieces in waist sizes ${sizeRange(style.set.sizes.map((s) => s.size))}.`
  ).slice(0, 160);
}

/** Product structured data: sold by set, priced per set (no offer until it has a price), in stock or sold out. */
function structuredData(style: StockStyle) {
  const url = absoluteUrl(stockUrl(style.segment, style.slug));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listingName(style),
    description: description(style),
    url,
    image: style.colors.flatMap((color) => color.images.slice(0, 1).map((image) => absoluteUrl(mediaSrc(image.path)))),
    sku: style.style_no ?? style.colors[0]?.code,
    brand: { "@type": "Brand", name: "PK Apparel" },
    color: style.colors.map((color) => color.name).join(", "),
    size: setContents(style.set.sizes),
    ...(style.specs.composition ? { material: style.specs.composition } : {}),
    ...(style.set_price_cents > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "PKR",
            price: (style.set_price_cents / 100).toFixed(0),
            availability: style.sets_in_stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            eligibleQuantity: { "@type": "QuantitativeValue", value: style.set.pieces, unitText: "pieces per set" },
            url,
          },
        }
      : {}),
  };
}
