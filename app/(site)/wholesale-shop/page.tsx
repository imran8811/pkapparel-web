import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { PageHero } from "@/components/site/page-hero";
import { ProductGrid } from "@/components/shop/product-grid";
import { ShopFilterBar, shopHref } from "@/components/shop/shop-filters";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getProducts, getShopCategories } from "@/lib/catalog";
import { isProductType, isSegment } from "@/lib/nav";
import { pageMetadata } from "@/lib/seo";
import { SORTS, type ShopFilters } from "@/lib/shop";
import { getSite } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Wholesale shop: made-to-order denim",
  description:
    "Wholesale jeans, chinos, cargo trousers and denim skirts for men, women and kids, made to order in Lahore. Prices per piece, from 100 pieces per color, shipped by air or sea.",
  path: "/wholesale-shop",
});

export default async function ShopPage({ searchParams }: PageProps<"/wholesale-shop">) {
  const site = await getSite();
  const { moq_per_color: moq, lead_time_days: leadTime } = site.commerce;

  return (
    <>
      <PageHero
        eyebrow="Wholesale shop"
        title={
          <>
            Made-to-order denim, <span className="stitch-underline">priced per piece.</span>
          </>
        }
        intro={`Pick a style, then the colors and sizes you need, from ${moq} pieces per color. Production takes about ${leadTime} days after your deposit; then we ship by air or sea.`}
        crumbs={[{ label: "Wholesale shop", href: "/wholesale-shop" }]}
      />
      <section className="py-12 sm:py-16">
        <Container>
          <Suspense fallback={<ShopSkeleton />}>
            <ShopResults searchParams={searchParams} />
          </Suspense>
        </Container>
      </section>
      <CtaPanel
        title="Don't see your style?"
        body="Everything is made to order, so we can also make your own design, fit, fabric or wash. Send us a tech pack, a photo or a sample."
        primary={{ href: "/request-quote", label: "Request a quote" }}
        secondary={{ href: "/private-label", label: "Private label" }}
      />
    </>
  );
}

function filtersFrom(params: Record<string, string | string[] | undefined>): ShopFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };
  const segment = one("segment");
  const type = one("type");
  const stretch = one("stretch");
  const sort = one("sort");

  return {
    segment: segment && isSegment(segment) ? segment : undefined,
    type: type && isProductType(type) ? type : undefined,
    stretch: stretch === "stretch" || stretch === "non-stretch" ? stretch : undefined,
    q: one("q")?.slice(0, 80),
    sort: SORTS.find((option) => option.value === sort)?.value,
  };
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/wholesale-shop">["searchParams"] }) {
  const filters = filtersFrom(await searchParams);
  const [categories, { items, total }] = await Promise.all([getShopCategories(), getProducts(filters)]);
  const filtered = Boolean(filters.segment || filters.type || filters.stretch || filters.q);

  return (
    <>
      <ShopFilterBar filters={filters} categories={categories} />
      <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
        {total} style{total === 1 ? "" : "s"}
        {filters.q ? ` matching “${filters.q}”` : ""}
      </p>
      {items.length > 0 ? (
        <ProductGrid products={items} className="mt-6" />
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed bg-white/60 px-6 py-16 text-center">
          <p className="font-heading text-xl font-semibold">No styles match these filters</p>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Everything is made to order, so we can probably make it anyway. Ask us for a quote, or{" "}
            {filtered ? (
              <Link href={shopHref({}, {})} className="font-medium text-denim-600 underline-offset-2 hover:underline">
                see all styles
              </Link>
            ) : (
              "check back soon"
            )}
            .
          </p>
        </div>
      )}
    </>
  );
}

function ShopSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading styles">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-full" />
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
