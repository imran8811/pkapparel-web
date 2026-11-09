import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { STOCK_INTROS, StockListingPage } from "@/components/stock/stock-listing";
import { findRedirect } from "@/lib/redirects";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_STOCK_SEGMENT, isStockSegment, stockSegmentInfo, stockSegments, stockUrl } from "@/lib/stock";

// The address is read before anything streams, so a redirect or a 404 keeps its HTTP status. The sections are
// prerendered (generateStaticParams); only the filtered list renders on request.
export const instant = false;

/** The men's jeans are listed at /stock itself (next.config.ts sends /stock/men there, with its filters). */
export function generateStaticParams() {
  return stockSegments.filter((segment) => segment.slug !== DEFAULT_STOCK_SEGMENT).map((segment) => ({ segment: segment.slug }));
}

export async function generateMetadata({ params }: PageProps<"/stock/[segment]">): Promise<Metadata> {
  const { segment } = await params;
  if (!isStockSegment(segment)) return {};
  return pageMetadata({
    title: `${stockSegmentInfo(segment).title} in stock, sold by set`,
    description: `${STOCK_INTROS[segment]} Sent by cargo to your city.`,
    path: stockUrl(segment),
  });
}

export default async function StockSegmentPage({ params, searchParams }: PageProps<"/stock/[segment]">) {
  const { segment } = await params;
  if (segment === DEFAULT_STOCK_SEGMENT) permanentRedirect(stockUrl(segment));
  if (!isStockSegment(segment)) {
    const moved = await findRedirect(`/stock/${segment}`);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  return <StockListingPage segment={segment} searchParams={searchParams} />;
}
