import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { StockListingPage } from "@/components/stock/stock-listing";
import { findRedirect } from "@/lib/redirects";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_STOCK_SEGMENT, stockIntro, stockUrl } from "@/lib/stock";
import { getStockDepartment, getStockSections } from "@/lib/stock-catalog";

// The address is read before anything streams, so a redirect or a 404 keeps its HTTP status. The departments are
// prerendered (generateStaticParams); only the filtered list renders on request.
export const instant = false;

/** The men's are listed at /stock itself (next.config.ts sends /stock/men there, with its filters). */
export async function generateStaticParams() {
  const { departments } = await getStockSections();
  const params = departments.filter((department) => department.slug !== DEFAULT_STOCK_SEGMENT).map((department) => ({ segment: department.slug }));
  // Cache Components needs one value to prerender; departments added later render on their first visit.
  return params.length > 0 ? params : [{ segment: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/stock/[segment]">): Promise<Metadata> {
  const { segment } = await params;
  const department = await getStockDepartment(segment);
  if (!department) return {};
  return {
    ...pageMetadata({
      title: `${department.title} in stock, sold by set`,
      description: `${stockIntro(department.title)} Sent by cargo to your city.`,
      path: stockUrl(segment),
    }),
    // A department without styles shown yet stays out of search results.
    ...(department.styles === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function StockSegmentPage({ params, searchParams }: PageProps<"/stock/[segment]">) {
  const { segment } = await params;
  if (segment === DEFAULT_STOCK_SEGMENT) permanentRedirect(stockUrl(segment));
  if (!(await getStockDepartment(segment))) {
    const moved = await findRedirect(`/stock/${segment}`);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  return <StockListingPage segment={segment} searchParams={searchParams} />;
}
