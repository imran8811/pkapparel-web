import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { CategoryIntro } from "@/components/shop/category-intro";
import { MadeToOrderPanel, ProductGrid } from "@/components/shop/product-grid";
import { getProducts, getShopPages, getShopSections } from "@/lib/catalog";
import { shopUrl } from "@/lib/nav";
import { findRedirect } from "@/lib/redirects";
import { pageMetadata } from "@/lib/seo";
import { categoriesIn, findDepartment, FORMER_DEPARTMENTS } from "@/lib/shop";

/**
 * Always served as a complete static page. After staff change the content, the next visitor waits
 * for the fresh page instead of getting the generic fallback shell with the old content.
 */
export const ensureStatic = "navigation";
// The address is read before anything streams, so a redirect or a 404 keeps its HTTP status. Every department page is
// prerendered (generateStaticParams); one staff add later is made on its first visit, then served as static output.
export const instant = false;

export async function generateStaticParams() {
  const { departments } = await getShopSections();
  return departments.map((department) => ({ segment: department.slug }));
}

async function segmentPage(segment: string) {
  const [sections, pages] = await Promise.all([getShopSections(), getShopPages()]);
  const department = findDepartment(sections, segment);
  const page = pages.find((c) => c.segment === segment && c.product_type === "");
  return department && page ? { department, page, sections, categories: pages.filter((c) => c.segment === segment && c.product_type !== "") } : null;
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
  if (!found) {
    const moved = await findRedirect(`/wholesale-shop/${segment}`);
    if (moved) permanentRedirect(moved);
    // The former boys' and girls' pages, while the shop has no such department.
    const sections = await getShopSections();
    const former = FORMER_DEPARTMENTS[segment];
    if (former && !findDepartment(sections, segment) && findDepartment(sections, former)) permanentRedirect(shopUrl(former));
    notFound();
  }
  const { department, page, sections, categories } = found;
  const { items } = await getProducts({ segment });

  return (
    <>
      <PageHero
        eyebrow="Wholesale shop"
        title={page.title}
        intro={<CategoryIntro html={page.intro_html} />}
        crumbs={[
          { label: "Wholesale shop", href: "/wholesale-shop" },
          { label: department.name, href: shopUrl(segment) },
        ]}
      />

      <section className="py-12 sm:py-16">
        <Container>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categoriesIn(sections, segment).map((category) => {
              const styles = categories.find((c) => c.product_type === category.slug)?.style_count ?? 0;
              return (
                <li key={category.slug}>
                  <Link
                    href={shopUrl(segment, category.slug)}
                    className="group flex h-full flex-col justify-between gap-6 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-denim-300"
                  >
                    <span className="font-heading text-[17px] leading-tight font-semibold">{category.name}</span>
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
                <SectionHeading eyebrow={`${department.possessive} styles`} title="Ready to order" align="stack" />
                <ProductGrid products={items} sections={sections} className="mt-10" />
              </>
            ) : (
              <MadeToOrderPanel
                title={`${department.possessive} clothing, made to your design`}
                body="There are no styles online yet for this group. Send us a design, a photo or a sample and we will quote it, from the fabric to the labels."
              />
            )}
          </div>
        </Container>
      </section>

      <CtaPanel
        title="Want your own design?"
        body="We make your own designs, from jeans and jackets to T-shirts, hoodies and polo shirts, with your labels and packaging."
        primary={{ href: "/request-quote", label: "Request a quote" }}
        secondary={{ href: "/samples", label: "Order a sample" }}
      />
    </>
  );
}

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
