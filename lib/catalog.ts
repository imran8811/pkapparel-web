import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api, ApiError, apiWithMeta } from "@/lib/api";
import type { Product, ProductCard, ShopCategory, ShopFilters } from "@/lib/shop";

/*
 * Shop data from the API, cached until staff change something: saving a style
 * refreshes "products" and "product:<slug>", saving a category text refreshes "categories".
 */

export async function getProducts(filters: ShopFilters = {}): Promise<{ items: ProductCard[]; total: number }> {
  "use cache";
  cacheLife("max");
  cacheTag("products");

  const { data, meta } = await apiWithMeta<ProductCard[], { pagination: { total: number } }>("/v1/products", {
    query: { ...filters, per_page: 60 },
  });
  return { items: data, total: meta.pagination.total };
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product:${slug}`);

  try {
    return await api<Product>(`/v1/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Texts of the segment and category pages, with how many styles each one has. */
export async function getShopCategories(): Promise<ShopCategory[]> {
  "use cache";
  cacheLife("max");
  cacheTag("categories", "products");

  return api<ShopCategory[]>("/v1/shop/categories");
}

/** Where an old product URL (…/{slug}-{article}) points now. */
export async function findLegacyProduct(
  article: string,
): Promise<{ segment: string; product_type: string; slug: string | null; color: string | null } | null> {
  "use cache";
  cacheLife("max");
  cacheTag("products");

  try {
    return await api(`/v1/products/legacy/${encodeURIComponent(article)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
