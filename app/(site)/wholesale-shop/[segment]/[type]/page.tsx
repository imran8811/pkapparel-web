import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { CategoryIntro } from "@/components/shop/category-intro";
import { MadeToOrderPanel, ProductGrid } from "@/components/shop/product-grid";
import { getProducts, getShopCategories } from "@/lib/catalog";
import { isProductType, isSegment, segmentInfo, segments, shopUrl, typeInfo, typesFor, type ProductType, type Segment } from "@/lib/nav";
import { pageMetadata } from "@/lib/seo";

/**
 * Always served as a complete static page. After staff change the content, the next visitor waits
 * for the fresh page instead of getting the generic fallback shell with the old content.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return segments.flatMap((segment) => typesFor(segment.slug).map((type) => ({ segment: segment.slug, type: type.slug })));
}

async function categoryPage(segment: string, type: string) {
  if (!isSegment(segment) || !isProductType(type) || !typesFor(segment).some((t) => t.slug === type)) return null;
  const categories = await getShopCategories();
  return categories.find((c) => c.segment === segment && c.product_type === type) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/wholesale-shop/[segment]/[type]">): Promise<Metadata> {
  const { segment, type } = await params;
  const page = await categoryPage(segment, type);
  if (!page) return {};
  return {
    ...pageMetadata({
      title: page.seo_title ?? `Wholesale ${page.title.toLowerCase()}`,
      description: page.seo_description ?? page.intro_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
      path: shopUrl(page.segment, page.product_type as ProductType),
    }),
    ...(page.style_count === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params }: PageProps<"/wholesale-shop/[segment]/[type]">) {
  const { segment, type } = await params;
  const page = await categoryPage(segment, type);
  if (!page) notFound();
  const segmentSlug = segment as Segment;
  const typeSlug = type as ProductType;
  const { items } = await getProducts({ segment: segmentSlug, type: typeSlug });
  const faqs = page.faq.map((faq, index) => ({ id: index + 1, category: "shop", ...faq }));

  return (
    <>
      <PageHero
        eyebrow={`Wholesale ${typeInfo(typeSlug).label.toLowerCase()}`}
        title={page.title}
        intro={<CategoryIntro html={page.intro_html} />}
        crumbs={[
          { label: "Wholesale shop", href: "/wholesale-shop" },
          { label: segmentInfo(segmentSlug).label, href: shopUrl(segmentSlug) },
          { label: typeInfo(typeSlug).label, href: shopUrl(segmentSlug, typeSlug) },
        ]}
      />

      <section className="py-12 sm:py-16">
        <Container>
          {items.length > 0 ? (
            <ProductGrid products={items} />
          ) : (
            <MadeToOrderPanel
              title={`${page.title}, made to your design`}
              body="There are no styles online yet in this category. Send us a design, a photo or a sample and we will quote it, from the fabric to the labels."
            />
          )}
        </Container>
      </section>

      {faqs.length > 0 ? (
        <section className="pb-8">
          <Container className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading eyebrow="Questions" title="Good to know" align="stack" />
            </div>
            <FaqList faqs={faqs} structuredData className="lg:col-span-8" />
          </Container>
        </section>
      ) : null}

      <CtaPanel
        title="Need a different fit or wash?"
        body="We make to your specification too: fabric, wash, fit, trims, labels and packaging."
        primary={{ href: "/request-quote", label: "Request a quote" }}
        secondary={{ href: "/samples", label: "Order a sample" }}
      />
    </>
  );
}
