import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/site/page-hero";
import { Prose } from "@/components/site/prose";
import { getPage } from "@/lib/content";
import { formatDate } from "@/lib/format";

/** A rich-text page of the stock pages (terms and returns, privacy), edited under Admin → Legal pages. */
export async function StockLegalPage({ slug, path }: { slug: "stock-terms" | "stock-privacy"; path: string }) {
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow={`Last updated ${formatDate(page.updated_at)}`}
        title={page.title}
        crumbs={[{ label: page.title, href: path }]}
        crumbRoot={{ label: "Stock", href: "/stock" }}
      />
      <section className="py-16 lg:py-20">
        <Container className="max-w-3xl">
          <Prose html={page.body_html} className="prose-base sm:prose-lg" />
        </Container>
      </section>
    </>
  );
}
