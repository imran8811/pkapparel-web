import { Suspense } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { StockGrid } from "@/components/stock/stock-card";
import { ActiveFilters, activeFilterCount, StockFilterPanel, stockFiltersFrom, stockHref } from "@/components/stock/stock-filters";
import { StockFiltersSheet } from "@/components/stock/stock-filters-sheet";
import { StockSortSelect } from "@/components/stock/stock-sort-select";
import { Skeleton } from "@/components/ui/skeleton";
import { filterStock, stockFacets, stockSegmentInfo, stockSegments, stockUrl, type StockSegment } from "@/lib/stock";
import { getStockStyles } from "@/lib/stock-catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** What a section's listing says under its title, and the start of its search description. */
export const STOCK_INTROS: Record<StockSegment, string> = {
  men: "Men's jeans ready in stock, in sets of the waist sizes shown on each style. See the sets in stock for every color, then order online or on WhatsApp.",
  boys: "Boys' jeans ready in stock, in sets of the sizes shown on each style. See the sets in stock for every color, then order online or on WhatsApp.",
};

const GRID = "lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-12";

/**
 * A jeans section's listing (/stock for men's jeans, /stock/boys): the filters in a sidebar, behind a "Filters" button
 * on phones, and the styles beside them. The heading is prerendered; the list follows the filters in the address and
 * renders on request. On the stock home only a breadcrumb is shown above the list, without a title or intro (owner
 * request 2026-11-09); its title stays for screen readers.
 */
export function StockListingPage({ segment, searchParams, home = false }: { segment: StockSegment; searchParams: SearchParams; home?: boolean }) {
  const title = stockSegmentInfo(segment).title;
  const listing = (
    <Suspense fallback={<ListingSkeleton />}>
      <Listing segment={segment} searchParams={searchParams} />
    </Suspense>
  );

  if (home) {
    return (
      <section className="pt-6 pb-16 sm:pt-8 sm:pb-20">
        <Container>
          <Breadcrumbs tone="dark" className="mb-6 sm:mb-8" root={{ label: "Stock", href: "/stock" }} items={[{ label: title, href: stockUrl(segment) }]} />
          <h1 className="sr-only">{title}</h1>
          {listing}
        </Container>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-border/70">
        <Container className="py-8 sm:py-10">
          <Eyebrow>Ready stock, sold by set</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{STOCK_INTROS[segment]}</p>
        </Container>
      </section>
      <section className="pt-8 pb-16 sm:pt-10 sm:pb-20">
        <Container>{listing}</Container>
      </section>
    </>
  );
}

async function Listing({ segment, searchParams }: { segment: StockSegment; searchParams: SearchParams }) {
  const filters = stockFiltersFrom(await searchParams);
  const all = await getStockStyles();
  const styles = all.filter((style) => style.segment === segment);
  const counts = Object.fromEntries(stockSegments.map((section) => [section.slug, all.filter((style) => style.segment === section.slug).length])) as Record<
    StockSegment,
    number
  >;
  const { sizes, fits } = stockFacets(styles.filter((style) => style.sets_in_stock > 0));
  const shown = filterStock(styles, filters);
  const path = stockUrl(segment);
  const panel = <StockFilterPanel segment={segment} filters={filters} sizes={sizes} fits={fits} counts={counts} />;

  return (
    <div className={GRID}>
      <aside aria-labelledby="stock-filters" className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:pb-4">
        <h2 id="stock-filters" className="mb-5 font-heading text-lg font-semibold">
          Filters
        </h2>
        {panel}
      </aside>

      <div className="min-w-0">
        {/* Keeps the heading order (h1, h2, then the styles' h3) for screen readers. */}
        <h2 className="sr-only">Styles</h2>
        <div className="flex flex-wrap items-center gap-3">
          <StockFiltersSheet active={activeFilterCount(filters)} className="lg:hidden">
            {panel}
          </StockFiltersSheet>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {shown.length} style{shown.length === 1 ? "" : "s"}
          </p>
          {styles.length > 1 ? <StockSortSelect value={filters.sort ?? "stock"} className="ml-auto" /> : null}
        </div>
        <ActiveFilters path={path} filters={filters} fits={fits} className="mt-4" />

        {styles.length === 0 ? (
          <Notice title="New stock is on its way">Ask us on WhatsApp what is ready now.</Notice>
        ) : shown.length > 0 ? (
          <StockGrid styles={shown} className="mt-6 xl:grid-cols-3" />
        ) : (
          <Notice title="No styles match these filters">
            <Link href={stockHref(path, { sort: filters.sort }, {})} scroll={false} className="font-medium text-denim-600 underline-offset-2 hover:underline">
              Clear the filters
            </Link>
          </Notice>
        )}
      </div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed bg-white/60 px-6 py-16 text-center">
      <p className="font-heading text-xl font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{children}</p>
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading styles" className={GRID}>
      <div className="hidden gap-3 lg:grid">
        <Skeleton className="mb-2 h-6 w-20" />
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-7 rounded-lg" />
        ))}
      </div>
      <div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full lg:hidden" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-10 w-44 rounded-full" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[2/3] rounded-3xl" />
              <Skeleton className="mt-4 h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
