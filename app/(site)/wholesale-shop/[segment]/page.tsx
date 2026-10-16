import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { CategoryIntro } from "@/components/shop/category-intro";
import { MadeToOrderPanel, ProductGrid } from "@/components/shop/product-grid";
import { getProducts, getShopCategories } from "@/lib/catalog";
import { isSegment, segmentInfo, segments, shopUrl, typesFor } from "@/lib/nav";
import { pageMetadata } from "@/lib/seo";

/**
 * Always served as a complete static page. After staff change the content, the next visitor waits
 * for the fresh page instead of getting the generic fallback shell with the old content.
 */
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return segments.map((segment) => ({ segment: segment.slug }));
}

async function segmentPage(segment: string) {
  if (!isSegment(segment)) return null;
  const categories = await getShopCategories();
  const page = categories.find((c) => c.segment === segment && c.product_type === "");
  return page ? { page, categories: categories.filter((c) => c.segment === segment && c.product_type !== "") } : null;
}

export async function generateMetadata({ params }: PageProps<"/wholesale-shop/[segment]">): Promise<Metadata> {
  const { segment } = await params;
  const found = await segmentPage(segment);
  if (!found) return {};
  const { page } = found;
  return {
    ...pageMetadata({
      title: page.seo_title ?? `Wholesale ${page.title.toLowerCase()}`,
      description: page.seo_description ?? plainText(page.intro_html).slice(0, 160),
      path: shopUrl(page.segment),
    }),
    // Pages without styles online yet stay out of search results.
    ...(page.style_count === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function SegmentPage({ params }: PageProps<"/wholesale-shop/[segment]">) {
  const { segment } = await params;
  const found = await segmentPage(segment);
  if (!found || !isSegment(segment)) notFound();
  const { page, categories } = found;
  const { items } = await getProducts({ segment });
  const info = segmentInfo(segment);

  return (
    <>
      <PageHero
        eyebrow="Wholesale shop"
        title={page.title}
        intro={<CategoryIntro html={page.intro_html} />}
        crumbs={[
          { label: "Wholesale shop", href: "/wholesale-shop" },
          { label: info.label, href: shopUrl(segment) },
        ]}
      />

      <section className="py-12 sm:py-16">
        <Container>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {typesFor(segment).map((type) => {
              const styles = categories.find((c) => c.product_type === type.slug)?.style_count ?? 0;
              return (
                <li key={type.slug}>
                  <Link
                    href={shopUrl(segment, type.slug)}
                    className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-denim-300"
                  >
                    <span className="font-heading text-[17px] leading-tight font-semibold">{type.label}</span>
                    <span className="flex items-center justify-between text-xs text-muted-foreground">
                      {styles > 0 ? `${styles} style${styles === 1 ? "" : "s"}` : "Made to order"}
                      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-16">
            {items.length > 0 ? (
              <>
                <SectionHeading eyebrow={`${info.possessive} styles`} title="Ready to order" align="stack" />
                <ProductGrid products={items} className="mt-10" />
              </>
            ) : (
              <MadeToOrderPanel
                title={`${info.possessive} denim, made to your design`}
                body="There are no styles online yet for this group. Send us a design, a photo or a sample and we will quote it, from the fabric to the labels."
              />
            )}
          </div>
        </Container>
      </section>

      <CtaPanel
        title="Want your own design?"
        body="We make jeans, jackets, shorts, cargos and chinos to your specification, with your labels and packaging."
        primary={{ href: "/request-quote", label: "Request a quote" }}
        secondary={{ href: "/samples", label: "Order a sample" }}
      />
    </>
  );
}

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
