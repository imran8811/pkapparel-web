import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api, ApiError } from "@/lib/api";
import type { StockCard, StockSegment, StockStyle } from "@/lib/stock";

/*
 * Stock data from the API, cached until staff change something: saving a stock style or color, or changing its
 * stock, refreshes "stock" and "stock:<slug>".
 */

/** Every style shown, in stock first; the pages filter and sort them. */
export async function getStockStyles(segment?: StockSegment): Promise<StockCard[]> {
  "use cache";
  cacheLife("max");
  cacheTag("stock");

  return api<StockCard[]>("/v1/stock/styles", { query: { segment } });
}

export async function getStockStyle(slug: string): Promise<StockStyle | null> {
  "use cache";
  cacheLife("max");
  cacheTag("stock", `stock:${slug}`);

  try {
    return await api<StockStyle>(`/v1/stock/styles/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
