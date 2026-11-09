import type { Metadata } from "next";
import { EmptyState, NoAccess, PageHeader } from "@/components/admin/page-parts";
import { StockFromWholesale } from "@/components/admin/stock-from-wholesale";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { StockFromWholesaleRow } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Copy from the wholesale shop" };

export default async function StockFromWholesalePage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const rows = await adminApi<StockFromWholesaleRow[]>("/v1/admin/stock/from-wholesale");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/stock", label: "Stock" }}
        title="Copy from the wholesale shop"
        description="Start the stock with the wholesale shop's jeans: their details, colors and photos. The copies are separate from then on: changing one shop never changes the other."
      />
      {rows.length === 0 ? (
        <EmptyState title="No jeans to copy">The wholesale shop has no men&apos;s or boys&apos; jeans pants yet.</EmptyState>
      ) : (
        <StockFromWholesale rows={rows} />
      )}
    </>
  );
}
