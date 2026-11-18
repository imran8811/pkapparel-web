import type { Metadata } from "next";
import Link from "next/link";
import { CopyIcon, DownloadIcon, FileSpreadsheetIcon, PlusIcon, SearchIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, NoAccess, PageHeader } from "@/components/admin/page-parts";
import { STOCK_STATUS as STATUS, StockListings, StockViewToggle } from "@/components/admin/stock-listings";
import { inputClass } from "@/components/admin/styles";
import { can } from "@/lib/admin/permissions";
import { adminApi, adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { getStockView } from "@/lib/admin/stock-view";
import type { AdminStockCategory, AdminStockDepartment, AdminStockStyleSummary, Pagination, ProductStatus } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Stock" };

export default async function StockStylesPage({ searchParams }: PageProps<"/admin/stock">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const search = (await searchParams) as { status?: string; q?: string; segment?: string; category?: string };
  const status = search.status && search.status in STATUS ? (search.status as ProductStatus) : undefined;
  const q = search.q?.trim() || undefined;
  // Only the listings of a department or category, e.g. from Stock categories (unknown ones are ignored).
  const [departments, categories, view] = await Promise.all([
    adminApi<AdminStockDepartment[]>("/v1/admin/stock/departments"),
    adminApi<AdminStockCategory[]>("/v1/admin/stock/categories"),
    getStockView(),
  ]);
  const department = departments.find((option) => option.slug === search.segment);
  const category = categories.find((option) => option.slug === search.category);
  const sections = { ...(department ? { segment: department.slug } : {}), ...(category ? { category: category.slug } : {}) };
  const { data: styles, meta } = await adminApiWithMeta<AdminStockStyleSummary[], { pagination: Pagination; counts: Record<ProductStatus, number> }>(
    "/v1/admin/stock/styles",
    { query: { status, q, ...sections, per_page: 100 } },
  );
  const total = Object.values(meta.counts).reduce((sum, count) => sum + count, 0);
  const tabs: { value?: ProductStatus; label: string; count: number }[] = [
    { label: "All", count: total },
    ...(Object.keys(STATUS) as ProductStatus[]).map((value) => ({ value, label: STATUS[value].label, count: meta.counts[value] })),
  ];

  return (
    <>
      <PageHeader
        title="Stock"
        description="Ready stock sold by set on the stock pages, by department and category. Each listing is one color, with its own details, set, price per set and sets in stock. The newest are listed first."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/stock/report">Report</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/stock/history">Stock history</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="/admin/stock/export" download>
                <DownloadIcon /> Export CSV
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/stock/import">
                <UploadIcon /> Import counts
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/stock/import-listings">
                <FileSpreadsheetIcon /> Import listings
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/stock/from-wholesale">
                <CopyIcon /> Copy from wholesale
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/stock/new">
                <PlusIcon /> New listing
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={listHref({ ...(tab.value ? { status: tab.value } : {}), ...sections, ...(q ? { q } : {}) })}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
              tab.value === status ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
            )}
          >
            {tab.label}
            <span className={cn("text-xs tabular-nums", tab.value === status ? "text-cotton-50/70" : "text-muted-foreground")}>{tab.count}</span>
          </Link>
        ))}
        {department || category ? (
          <Link
            href={listHref({ ...(status ? { status } : {}), ...(q ? { q } : {}) })}
            aria-label="Show every department and category"
            className="inline-flex items-center gap-1.5 rounded-full bg-cotton-100 py-1.5 pr-2.5 pl-3 text-sm hover:bg-cotton-200"
          >
            {[department?.name, category?.name].filter(Boolean).join(" · ")}
            <XIcon className="size-3.5" aria-hidden />
          </Link>
        ) : null}
        <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
          <form action="/admin/stock" className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            {Object.entries(sections).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input name="q" defaultValue={q} placeholder="Name, style no. or color code" aria-label="Search stock listings" className={cn(inputClass, "pl-9")} />
          </form>
          <StockViewToggle view={view} />
        </div>
      </div>

      {styles.length === 0 ? (
        <EmptyState title={q || department || category ? "No listings match" : "No stock listings yet"}>
          {q || department || category ? (
            "Try another search, or show every department and category."
          ) : (
            <>
              Add the first one with “New listing”, or{" "}
              <Link href="/admin/stock/from-wholesale" className="font-medium text-denim-600 hover:underline">
                copy styles from the wholesale shop
              </Link>
              .
            </>
          )}
        </EmptyState>
      ) : (
        <StockListings styles={styles} categories={categories} view={view} />
      )}
    </>
  );
}

/** The stock list with these filters. */
function listHref(params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `/admin/stock${query ? `?${query}` : ""}`;
}
