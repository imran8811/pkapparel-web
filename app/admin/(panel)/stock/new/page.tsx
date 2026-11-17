import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { StockStyleForm } from "@/components/admin/stock-style-form";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { getStockSectionsAdmin } from "@/lib/admin/stock-sections";
import type { AdminStockStyle } from "@/lib/admin/types";

export const metadata: Metadata = { title: "New stock listing" };

/** A new listing: empty, or with ?copy={id} a duplicate of that listing, its details filled in to change and save as new. */
export default async function NewStockStylePage({ searchParams }: PageProps<"/admin/stock/new">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { copy } = await searchParams;
  const copyId = typeof copy === "string" && /^\d+$/.test(copy) ? copy : null;
  const [{ departments, categories }, original] = await Promise.all([
    getStockSectionsAdmin(),
    copyId
      ? adminApi<AdminStockStyle>(`/v1/admin/stock/styles/${copyId}`).catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 404) notFound();
          throw error;
        })
      : null,
  ]);
  const originalName = original && original.colors.length === 1 ? `${original.name}, ${original.colors[0].name.toLowerCase()}` : original?.name;

  return (
    <>
      <PageHeader
        back={original ? { href: `/admin/stock/${original.id}`, label: originalName ?? original.name } : { href: "/admin/stock", label: "Stock" }}
        title={original ? "Duplicate listing" : "New stock listing"}
        description={
          original
            ? `A copy of “${originalName}”. Change what is different, then create it as a new listing. The color, its photos and stock are not copied: add the new color below.`
            : "A listing is one color of a style: its department and category, its details, its color with photos, and the sets in stock."
        }
      />
      <StockStyleForm key={original?.id ?? "new"} style={null} copyOf={original} departments={departments} categories={categories} />
    </>
  );
}
