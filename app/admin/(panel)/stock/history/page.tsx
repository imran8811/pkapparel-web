import type { Metadata } from "next";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { StockHistory } from "@/components/admin/stock-history";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import type { AdminStockMovement, Pagination } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Stock history" };

export default async function StockHistoryPage({ searchParams }: PageProps<"/admin/stock/history">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { data, meta } = await adminApiWithMeta<AdminStockMovement[], { pagination: Pagination }>("/v1/admin/stock/movements", {
    query: { page, per_page: 50 },
  });

  return (
    <>
      <PageHeader back={{ href: "/admin/stock", label: "Stock" }} title="Stock history" description="Every change to the stock of every style, newest first." />
      <StockHistory movements={data} page={meta.pagination.page} pages={meta.pagination.pages} href={(next) => `/admin/stock/history?page=${next}`} showStyle />
    </>
  );
}
