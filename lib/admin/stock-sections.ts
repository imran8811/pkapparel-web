import "server-only";
import { adminApi } from "@/lib/admin/session";
import type { AdminStockCategory, AdminStockDepartment, CatalogDefinitions, StockFormCategory } from "@/lib/admin/types";
import { stockSpecs } from "@/lib/stock";

/**
 * The stock departments and categories (with the number of listings in each), each category with the specs its
 * listings have, and the product types they come from.
 */
export async function getStockSectionsAdmin(): Promise<{ departments: AdminStockDepartment[]; categories: StockFormCategory[]; catalog: CatalogDefinitions }> {
  const [departments, categories, catalog] = await Promise.all([
    adminApi<AdminStockDepartment[]>("/v1/admin/stock/departments"),
    adminApi<AdminStockCategory[]>("/v1/admin/stock/categories"),
    adminApi<CatalogDefinitions>("/v1/admin/product-types"),
  ]);
  return { departments, categories: categories.map((category) => ({ ...category, specs: stockSpecs(catalog, category.product_type) })), catalog };
}
