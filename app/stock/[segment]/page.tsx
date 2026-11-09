import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/site/page-hero";
import { StockGrid } from "@/components/stock/stock-card";
import { StockFilterBar, stockFiltersFrom } from "@/components/stock/stock-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { findRedirect } from "@/lib/redirects";
import { pageMetadata } from "@/lib/seo";
import { filterStock, isStockSegment, stockFacets, stockSegmentInfo, stockSegments, stockUrl, type StockSegment } from "@/lib/stock";
import { getStockStyles } from "@/lib/stock-catalog";

// The address is read before anything streams, so a redirect or a 404 keeps its HTTP status. Both sections are
// prerendered (generateStaticParams); only the filtered list renders on request.
export const instant = false;

export function generateStaticParams() {
  return stockSegments.map((segment) => ({ segment: segment.slug }));
}

const INTROS: Record<StockSegment, string> = {
  men: "Men's jeans ready in stock, in sets of the waist sizes shown on each style. See the sets in stock for every color and order on WhatsApp.",
  boys: "Boys' jeans ready in stock, in sets of the sizes shown on each style. See the sets in stock for every color and order on WhatsApp.",
};

export async function generateMetadata({ params }: PageProps<"/stock/[segment]">): Promise<Metadata> {
  const { segment } = await params;
  if (!isStockSegment(segment)) return {};
  const info = stockSegmentInfo(segment);
  return pageMetadata({
    title: `${info.title} in stock, sold by set`,
    description: `${INTROS[segment]} Sent by cargo to your city.`,
    path: stockUrl(segment),
  });
}

export default async function StockSegmentPage({ params, searchParams }: PageProps<"/stock/[segment]">) {
  const { segment } = await params;
  if (!isStockSegment(segment)) {
    const moved = await findRedirect(stockUrl(segment));
    if (moved) permanentRedirect(moved);
    notFound();
  }
  const info = stockSegmentInfo(segment);

  return (
    <>
      <PageHero
        eyebrow="Ready stock"
        title={info.title}
        intro={INTROS[segment]}
        crumbs={[{ label: info.title, href: stockUrl(segment) }]}
        crumbRoot={{ label: "Stock", href: "/stock" }}
      />
      <section className="py-12 sm:py-16">
        <Container>
          {/* Keeps the heading order (h1, h2, then the styles' h3) for screen readers. */}
          <h2 className="sr-only">Styles</h2>
          <Suspense fallback={<ResultsSkeleton />}>
            <Results segment={segment} searchParams={searchParams} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}

async function Results({ segment, searchParams }: { segment: StockSegment; searchParams: PageProps<"/stock/[segment]">["searchParams"] }) {
  const filters = stockFiltersFrom(await searchParams);
  const styles = await getStockStyles(segment);
  const { sizes, fits } = stockFacets(styles.filter((style) => style.sets_in_stock > 0));
  const shown = filterStock(styles, filters);
  const filtered = Boolean(filters.size || filters.fit || filters.stretch);
  const path = stockUrl(segment);

  if (styles.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed bg-white/60 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">New stock is on its way</p>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Ask us on WhatsApp what is ready now.</p>
      </div>
    );
  }

  return (
    <>
      <StockFilterBar path={path} filters={filters} sizes={sizes} fits={fits} />
      <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
        {shown.length} style{shown.length === 1 ? "" : "s"}
        {filters.size ? ` with size ${filters.size}` : ""}
      </p>
      {shown.length > 0 ? (
        <StockGrid styles={shown} className="mt-6" />
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed bg-white/60 px-6 py-16 text-center">
          <p className="font-heading text-xl font-semibold">No styles match these filters</p>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {filtered ? (
              <Link href={path} className="font-medium text-denim-600 underline-offset-2 hover:underline">
                See all {stockSegmentInfo(segment).title.toLowerCase()}
              </Link>
            ) : null}
          </p>
        </div>
      )}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading styles">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-14 rounded-full" />
        ))}
      </div>
      <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index}>
            <Skeleton className="aspect-[2/3] rounded-3xl" />
            <Skeleton className="mt-4 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
