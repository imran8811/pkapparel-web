import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { CategoryIntro } from "@/components/shop/category-intro";
import { MadeToOrderPanel, ProductGrid } from "@/components/shop/product-grid";
import { getProducts, getShopPages, getShopSections } from "@/lib/catalog";
import { shopUrl } from "@/lib/nav";
import { findRedirect } from "@/lib/redirects";
import { pageMetadata } from "@/lib/seo";
import { categoriesIn, findCategory, findDepartment, FORMER_DEPARTMENTS, sells } from "@/lib/shop";

/**
 * Always served as a complete static page. After staff change the content, the next visitor waits
 * for the fresh page instead of getting the generic fallback shell with the old content.
 */
export const ensureStatic = "navigation";
// The address is read before anything streams, so a redirect or a 404 keeps its HTTP status. Every category page is
// prerendered (generateStaticParams); one staff add later is made on its first visit, then served as static output.
export const instant = false;

/** Every category in every department that sells it: never empty, as the API keeps each category in a department. */
export async function generateStaticParams() {
  const sections = await getShopSections();
  return sections.departments.flatMap((department) =>
    categoriesIn(sections, department.slug).map((category) => ({ segment: department.slug, type: category.slug })),
  );
}

async function categoryPage(segment: string, type: string) {
  const [sections, pages] = await Promise.all([getShopSections(), getShopPages()]);
  const department = findDepartment(sections, segment);
  const category = findCategory(sections, type);
  const page = pages.find((c) => c.segment === segment && c.product_type === type);
  return department && category && page && sells(sections, segment, type) ? { department, category, page, sections } : null;
}

export async function generateMetadata({ params }: PageProps<"/wholesale-shop/[segment]/[type]">): Promise<Metadata> {
  const { segment, type } = await params;
  const found = await categoryPage(segment, type);
  if (!found) return {};
  const { page } = found;
  return {
    ...pageMetadata({
      title: page.seo_title ?? `Wholesale ${page.title.toLowerCase()}`,
      description: page.seo_description ?? page.intro_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
      path: shopUrl(page.segment, page.product_type),
    }),
    ...(page.style_count === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params }: PageProps<"/wholesale-shop/[segment]/[type]">) {
  const { segment, type } = await params;
  const found = await categoryPage(segment, type);
  if (!found) {
    const moved = await findRedirect(`/wholesale-shop/${segment}/${type}`);
    if (moved) permanentRedirect(moved);
    // The former boys' and girls' pages, while the shop has no such department: the same category for men or women,
    // or their department page when it doesn't sell it.
    const sections = await getShopSections();
    const former = FORMER_DEPARTMENTS[segment];
    if (former && !findDepartment(sections, segment) && findDepartment(sections, former)) {
      permanentRedirect(sells(sections, former, type) ? shopUrl(former, type) : shopUrl(former));
    }
    notFound();
  }
  const { department, category, page, sections } = found;
  const { items } = await getProducts({ segment, type });
  const faqs = page.faq.map((faq, index) => ({ id: index + 1, category: "shop", ...faq }));

  return (
    <>
      <PageHero
        eyebrow={`Wholesale ${category.name.toLowerCase()}`}
        title={page.title}
        intro={<CategoryIntro html={page.intro_html} />}
        crumbs={[
          { label: "Wholesale shop", href: "/wholesale-shop" },
          { label: department.name, href: shopUrl(segment) },
          { label: category.name, href: shopUrl(segment, type) },
        ]}
      />

      <section className="py-12 sm:py-16">
        <Container>
          {/* Keeps the heading order (h1, h2, then the styles' h3) for screen readers. */}
          <h2 className="sr-only">Styles</h2>
          {items.length > 0 ? (
            <ProductGrid products={items} sections={sections} />
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
