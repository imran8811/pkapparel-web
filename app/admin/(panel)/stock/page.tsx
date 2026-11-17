import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyIcon, DownloadIcon, FileSpreadsheetIcon, ImageIcon, PlusIcon, SearchIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { can } from "@/lib/admin/permissions";
import { adminApi, adminApiWithMeta, getStaff } from "@/lib/admin/session";
import type { AdminStockCategory, AdminStockDepartment, AdminStockStyleSummary, Pagination, ProductStatus } from "@/lib/admin/types";
import { formatRupees } from "@/lib/stock";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Stock" };

const STATUS: Record<ProductStatus, { label: string; tone: "green" | "neutral" | "muted" }> = {
  active: { label: "Shown", tone: "green" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "muted" },
};

export default async function StockStylesPage({ searchParams }: PageProps<"/admin/stock">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const search = (await searchParams) as { status?: string; q?: string; segment?: string; category?: string };
  const status = search.status && search.status in STATUS ? (search.status as ProductStatus) : undefined;
  const q = search.q?.trim() || undefined;
  // Only the listings of a department or category, e.g. from Stock categories (unknown ones are ignored).
  const [departments, categories] = await Promise.all([
    adminApi<AdminStockDepartment[]>("/v1/admin/stock/departments"),
    adminApi<AdminStockCategory[]>("/v1/admin/stock/categories"),
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
        description="Ready stock sold by set on the stock pages, by department and category. Each listing is one color, with its own details, set, price per set and sets in stock."
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
        <form action="/admin/stock" className="relative ml-auto w-full sm:w-72">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {Object.entries(sections).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Name, style no. or color code" aria-label="Search stock listings" className={cn(inputClass, "pl-9")} />
        </form>
      </div>

      {styles.length === 0 ? (
        <EmptyState title={q || department || category ? "No listings match" : "No stock listings yet"}>
          {q || department || category ? (
            "Try another search, or show every department and category."
          ) : (
            <>
              Add the first one with “New listing”, or{" "}
              <Link href="/admin/stock/from-wholesale" className="font-medium text-denim-600 hover:underline">
                copy the wholesale shop&apos;s jeans
              </Link>
              .
            </>
          )}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {styles.map((style) => (
            <li key={style.id} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:px-5">
              <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
                {style.thumbnail ? (
                  <Image src={`/${style.thumbnail}`} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <ImageIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/stock/${style.id}`} className="font-medium hover:text-denim-600">
                  {style.name}
                </Link>
                <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  {style.color_name ? (
                    <span className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: style.color_hex ?? "#c8d8f4" }} />
                  ) : null}
                  <span className="truncate">
                    {style.color_name ? (
                      <>
                        {style.color_name} <span className="font-mono">{style.color_code}</span>
                      </>
                    ) : (
                      <span className="text-stitch-700">No color yet</span>
                    )}
                    {" · "}
                    {style.department_name} · {style.category_name} · sets of {style.set_pieces}
                    {style.style_no ? ` · ${style.style_no}` : ""}
                  </span>
                </p>
              </div>
              <span className={cn("hidden text-right text-sm tabular-nums sm:block", style.piece_price_cents === 0 && "text-stitch-700")}>
                {style.piece_price_cents > 0 ? (
                  <>
                    {formatRupees(style.piece_price_cents)}/pc
                    <span className="block text-xs text-muted-foreground">{formatRupees(style.set_price_cents)}/set</span>
                  </>
                ) : (
                  "No price"
                )}
              </span>
              <span className={cn("w-20 text-right text-sm tabular-nums", style.sets_in_stock === 0 && "text-muted-foreground")}>
                {style.sets_in_stock} set{style.sets_in_stock === 1 ? "" : "s"}
              </span>
              {style.is_featured ? <Pill tone="blue">Featured</Pill> : null}
              <Pill tone={STATUS[style.status].tone}>{STATUS[style.status].label}</Pill>
              <Button asChild variant="ghost" size="icon-sm">
                <Link href={`/admin/stock/new?copy=${style.id}`} aria-label={`Duplicate ${style.name}${style.color_name ? `, ${style.color_name}` : ""}`} title="Duplicate">
                  <CopyIcon />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** The stock list with these filters. */
function listHref(params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `/admin/stock${query ? `?${query}` : ""}`;
}
