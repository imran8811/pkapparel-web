import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoAccess, PageHeader, Panel } from "@/components/admin/page-parts";
import { StockColorManager } from "@/components/admin/stock-color-manager";
import { StockHistory } from "@/components/admin/stock-history";
import { StockStyleForm } from "@/components/admin/stock-style-form";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, adminApiWithMeta, getStaff } from "@/lib/admin/session";
import type { AdminStockMovement, AdminStockStyle, CatalogDefinitions, Pagination } from "@/lib/admin/types";
import { STOCK_PRODUCT_TYPE, stockUrl } from "@/lib/stock";

export const metadata: Metadata = { title: "Edit stock listing" };

export default async function EditStockStylePage({ params, searchParams }: PageProps<"/admin/stock/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [style, catalog, history] = await Promise.all([
    adminApi<AdminStockStyle>(`/v1/admin/stock/styles/${id}`).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    adminApi<CatalogDefinitions>("/v1/admin/product-types"),
    adminApiWithMeta<AdminStockMovement[], { pagination: Pagination }>("/v1/admin/stock/movements", { query: { style_id: id, page, per_page: 20 } }),
  ]);
  const specs = catalog.types.find((type) => type.slug === STOCK_PRODUCT_TYPE)?.specs ?? [];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/stock", label: "Stock" }}
        title={style.colors.length === 1 ? `${style.name}, ${style.colors[0].name.toLowerCase()}` : style.name}
        actions={
          style.status === "active" ? (
            <Button asChild variant="outline" size="sm">
              <Link href={stockUrl(style.segment, style.slug)} target="_blank">
                <ExternalLinkIcon /> View on the stock pages
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="grid gap-6">
        <StockColorManager style={style} />
        <StockStyleForm key={style.updated_at} style={style} specs={specs} />
        <Panel title="Stock history" description="Every change to this listing's stock, newest first.">
          <StockHistory
            movements={history.data}
            page={history.meta.pagination.page}
            pages={history.meta.pagination.pages}
            href={(next) => `/admin/stock/${style.id}?page=${next}`}
          />
        </Panel>
      </div>
    </>
  );
}
