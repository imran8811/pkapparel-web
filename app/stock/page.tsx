import { STOCK_INTROS, StockListingPage } from "@/components/stock/stock-listing";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_STOCK_SEGMENT } from "@/lib/stock";

export const metadata = pageMetadata({
  title: "Men's jeans in stock, sold by set",
  description: `${STOCK_INTROS.men} Sent by cargo to your city.`,
  path: "/stock",
});

/** The stock pages open on the men's jeans, with the filters in a sidebar and only a breadcrumb above (owner decisions 2026-11-09). */
export default function StockHomePage({ searchParams }: PageProps<"/stock">) {
  return <StockListingPage segment={DEFAULT_STOCK_SEGMENT} searchParams={searchParams} home />;
}
