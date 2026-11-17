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
import { filterStock, stockFacets, stockIntro, stockUrl } from "@/lib/stock";
import { getStockDepartment, getStockSections, getStockStyles } from "@/lib/stock-catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const GRID = "lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-12";

/**
 * A department's listing (/stock for the men's, /stock/boys): the filters in a sidebar, behind a "Filters" button on
 * phones, and the styles beside them. The heading is prerendered, titled by the categories the department has styles
 * in ("Men's jeans and cotton pants"); the list follows the filters in the address (the category among them) and
 * renders on request. On the stock home only a breadcrumb is shown above the list, without a title or intro (owner
 * request 2026-11-09); its title stays for screen readers.
 */
export async function StockListingPage({ segment, searchParams, home = false }: { segment: string; searchParams: SearchParams; home?: boolean }) {
  const title = (await getStockDepartment(segment))?.title ?? segment;
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
          <p className="mt-3 max-w-2xl text-muted-foreground">{stockIntro(title)}</p>
        </Container>
      </section>
      <section className="pt-8 pb-16 sm:pt-10 sm:pb-20">
        <Container>{listing}</Container>
      </section>
    </>
  );
}

async function Listing({ segment, searchParams }: { segment: string; searchParams: SearchParams }) {
  const [params, all, sections] = await Promise.all([searchParams, getStockStyles(), getStockSections()]);
  const parsed = stockFiltersFrom(params);
  // A category that does not exist (any more) is ignored.
  const filters = { ...parsed, category: sections.categories.some((category) => category.slug === parsed.category) ? parsed.category : undefined };
  const inDepartment = all.filter((style) => style.segment === segment);
  // The departments with styles (and this one), and every category with its number of styles here (0 when it has none).
  const departments = sections.departments
    .map((department) => ({ ...department, count: all.filter((style) => style.segment === department.slug).length }))
    .filter((department) => department.count > 0 || department.slug === segment);
  const categories = sections.categories.map((category) => ({ ...category, count: inDepartment.filter((style) => style.category === category.slug).length }));
  // Sizes and fits of the chosen category's styles in stock.
  const styles = filters.category ? inDepartment.filter((style) => style.category === filters.category) : inDepartment;
  const { sizes, fits } = stockFacets(styles.filter((style) => style.sets_in_stock > 0));
  const shown = filterStock(styles, filters);
  const path = stockUrl(segment);
  const panel = <StockFilterPanel segment={segment} filters={filters} sizes={sizes} fits={fits} departments={departments} categories={categories} />;

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
        <ActiveFilters path={path} filters={filters} fits={fits} categories={sections.categories} className="mt-4" />

        {/* Nothing in the department, or in the chosen category, yet. */}
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
