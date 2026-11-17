import type { Metadata } from "next";
import { StockListingPage } from "@/components/stock/stock-listing";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_STOCK_SEGMENT, stockIntro } from "@/lib/stock";
import { getStockDepartment } from "@/lib/stock-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const title = (await getStockDepartment(DEFAULT_STOCK_SEGMENT))?.title ?? "Men's jeans";
  return pageMetadata({
    title: `${title} in stock, sold by set`,
    description: `${stockIntro(title)} Sent by cargo to your city.`,
    path: "/stock",
  });
}

/** The stock pages open on the men's department, with the filters in a sidebar and only a breadcrumb above (owner decisions 2026-11-09). */
export default function StockHomePage({ searchParams }: PageProps<"/stock">) {
  return <StockListingPage segment={DEFAULT_STOCK_SEGMENT} searchParams={searchParams} home />;
}
