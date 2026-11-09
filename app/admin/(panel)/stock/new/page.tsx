import type { Metadata } from "next";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { StockStyleForm } from "@/components/admin/stock-style-form";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { CatalogDefinitions } from "@/lib/admin/types";
import { STOCK_PRODUCT_TYPE } from "@/lib/stock";

export const metadata: Metadata = { title: "New stock listing" };

export default async function NewStockStylePage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;
  const catalog = await adminApi<CatalogDefinitions>("/v1/admin/product-types");
  const specs = catalog.types.find((type) => type.slug === STOCK_PRODUCT_TYPE)?.specs ?? [];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/stock", label: "Stock" }}
        title="New stock listing"
        description="A listing is one color of jeans. Save its details first, then add the color with its photos and the sets in stock."
      />
      <StockStyleForm style={null} specs={specs} />
    </>
  );
}
