import type { Metadata } from "next";
import Link from "next/link";
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
        description="Copy the wholesale shop's styles for men and boys into the stock, with their details, colors and photos. Each goes into the stock category with the details of its type: jeans into Jeans, chino pants into Cotton pants. The copies are separate from then on: changing one shop never changes the other."
      />
      {rows.length === 0 ? (
        <EmptyState title="Nothing to copy">
          The wholesale shop has no men&apos;s or boys&apos; styles of a type the stock has a category for. Each category takes the wholesale type whose details it has:{" "}
          <Link href="/admin/stock/categories" className="font-medium text-denim-600 hover:underline">
            Stock categories
          </Link>
          .
        </EmptyState>
      ) : (
        <StockFromWholesale rows={rows} />
      )}
    </>
  );
}
