import type { Metadata } from "next";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { SizeChartManager } from "@/components/admin/size-chart-manager";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminSizeChart, CatalogDefinitions } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Size charts" };

export default async function SizeChartsPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;
  const [charts, catalog] = await Promise.all([
    adminApi<AdminSizeChart[]>("/v1/admin/size-charts"),
    adminApi<CatalogDefinitions>("/v1/admin/product-types"),
  ]);

  return (
    <>
      <PageHeader
        title="Size charts"
        description="Garment measurements per size, shown on product pages. Choose a chart in each style's settings; a style can use the charts for its own sizes (waist, letter or other)."
      />
      <SizeChartManager charts={charts} systems={catalog.size_systems} />
    </>
  );
}
