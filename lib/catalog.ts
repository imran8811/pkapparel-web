import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api, ApiError, apiWithMeta } from "@/lib/api";
import type { SampleStyle } from "@/lib/samples";
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

/** Every style with its colors, sizes and sample price, for the sample picker. */
export async function getSampleStyles(): Promise<SampleStyle[]> {
  "use cache";
  cacheLife("max");
  cacheTag("products");

  const { items } = await getProducts();
  const products = await Promise.all(items.map((card) => getProduct(card.slug)));
  return products
    .filter((product): product is Product => product !== null)
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      style_no: product.style_no,
      sizes: product.sizes,
      sample_price_cents: product.rules.sample_price_cents,
      colors: product.colors.map((color) => ({
        id: color.id,
        name: color.name,
        slug: color.slug,
        code: color.code,
        hex: color.hex,
        image: color.images[0]?.path ?? null,
      })),
    }));
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
