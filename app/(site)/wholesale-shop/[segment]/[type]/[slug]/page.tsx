import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { SectionHeading } from "@/components/site/section-heading";
import { ProductDetails } from "@/components/shop/product-details";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductView } from "@/components/shop/product-view";
import { findLegacyProduct, getProduct, getProducts } from "@/lib/catalog";
import { mediaSrc } from "@/lib/content";
import { segmentInfo, shopUrl, typeInfo, type ProductType } from "@/lib/nav";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { productUrl, type Product } from "@/lib/shop";
import { getSite } from "@/lib/site";

/**
 * Always served as a complete static page. After staff change the content, the next visitor waits
 * for the fresh page instead of getting the generic fallback shell with the old content.
 */
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const { items } = await getProducts();
  return items.map((product) => ({ segment: product.segment, type: product.product_type, slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/wholesale-shop/[segment]/[type]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const image = product.colors[0]?.images[0];
  return pageMetadata({
    title: product.seo_title ?? `${product.name}, wholesale`,
    description: product.seo_description ?? description(product),
    path: productUrl(product),
    image: image ? mediaSrc(image.path) : undefined,
  });
}

export default async function ProductPage({ params }: PageProps<"/wholesale-shop/[segment]/[type]/[slug]">) {
  const { segment, type, slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    // Old product URLs end with the article number: …/men-sky-blue-stretch-zipper-jeans-pant-1051
    const article = /-(\d{3,})$/.exec(slug)?.[1];
    const target = article ? await findLegacyProduct(article) : null;
    if (target?.slug) {
      permanentRedirect(productUrl({ segment: target.segment, product_type: target.product_type, slug: target.slug }, target.color ?? undefined));
    }
    if (target) permanentRedirect(shopUrl(target.segment as never, target.product_type as ProductType));
    notFound();
  }
  if (product.segment !== segment || product.product_type !== type) permanentRedirect(productUrl(product));

  const site = await getSite();
  const segmentLabel = segmentInfo(product.segment).label;
  const typeLabel = typeInfo(product.product_type).label;

  return (
    <>
      <section className="pt-6 pb-16 sm:pt-8">
        <Container>
          <Breadcrumbs
            tone="dark"
            className="mb-8"
            items={[
              { label: "Wholesale shop", href: "/wholesale-shop" },
              { label: segmentLabel, href: shopUrl(product.segment) },
              { label: typeLabel, href: shopUrl(product.segment, product.product_type) },
              { label: product.name, href: productUrl(product) },
            ]}
          />
          <ProductView product={product} whatsapp={site.contact.whatsapp} />
        </Container>
      </section>

      <ProductDetails product={product} />

      {product.related.length > 0 ? (
        <section className="border-t border-border py-16 sm:py-20">
          <Container>
            <SectionHeading eyebrow="More styles" title="You may also like" align="stack" />
            <ProductGrid products={product.related} className="mt-10" />
          </Container>
        </section>
      ) : null}

      <JsonLd data={structuredData(product, site.commerce.currency)} />
    </>
  );
}

function description(product: Product): string {
  const text = product.description_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return (text || `${product.name}, made to order in Lahore, Pakistan.`).slice(0, 160);
}

/** Product structured data: made to order, priced per piece, minimum quantity per color. */
function structuredData(product: Product, currency: string) {
  const money = (cents: number) => (cents / 100).toFixed(2);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: description(product),
    url: absoluteUrl(productUrl(product)),
    image: product.colors.flatMap((color) => color.images.slice(0, 1).map((image) => absoluteUrl(mediaSrc(image.path)))),
    sku: product.style_no ?? product.colors[0]?.code,
    brand: { "@type": "Brand", name: "PK Apparel" },
    color: product.colors.map((color) => color.name).join(", "),
    ...(product.specs.composition ? { material: product.specs.composition } : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: money(product.price_from_cents),
      highPrice: money(product.price_to_cents),
      offerCount: product.colors.length,
      availability: "https://schema.org/MadeToOrder",
      eligibleQuantity: { "@type": "QuantitativeValue", minValue: product.rules.moq_per_color, unitText: "pieces per color" },
      url: absoluteUrl(productUrl(product)),
    },
  };
}
