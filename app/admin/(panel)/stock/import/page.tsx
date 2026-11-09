import type { Metadata } from "next";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { StockImport } from "@/components/admin/stock-import";
import { can } from "@/lib/admin/permissions";
import { getStaff } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Import stock counts" };

export default async function StockImportPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/stock", label: "Stock" }}
        title="Import stock counts"
        description="Count the stock in Excel and bring the numbers back in one go. You see every change before anything is saved."
      />
      <StockImport />
    </>
  );
}
