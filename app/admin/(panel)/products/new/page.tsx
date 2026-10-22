import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminSizeChart, CatalogDefinitions } from "@/lib/admin/types";
import { getSite } from "@/lib/site";

export const metadata: Metadata = { title: "New style" };

export default async function NewProductPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;
  const [charts, catalog, site] = await Promise.all([
    adminApi<AdminSizeChart[]>("/v1/admin/size-charts"),
    adminApi<CatalogDefinitions>("/v1/admin/product-types"),
    getSite(),
  ]);

  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Shop styles" }} title="New style" />
      <ProductForm product={null} charts={charts} catalog={catalog} defaults={site.commerce} />
    </>
  );
}
