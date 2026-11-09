import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyIcon, DownloadIcon, ImageIcon, PlusIcon, SearchIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import type { AdminStockStyleSummary, Pagination, ProductStatus } from "@/lib/admin/types";
import { formatRupees, isStockSegment, stockSegmentInfo } from "@/lib/stock";
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

  const search = (await searchParams) as { status?: string; q?: string };
  const status = search.status && search.status in STATUS ? (search.status as ProductStatus) : undefined;
  const q = search.q?.trim() || undefined;
  const { data: styles, meta } = await adminApiWithMeta<AdminStockStyleSummary[], { pagination: Pagination; counts: Record<ProductStatus, number> }>(
    "/v1/admin/stock/styles",
    { query: { status, q, per_page: 100 } },
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
        description="Ready men's and boys' jeans, sold by set on the stock pages. Each listing is one color, with its own details, set, price per set and sets in stock."
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
            href={`/admin/stock${tab.value || q ? `?${new URLSearchParams({ ...(tab.value ? { status: tab.value } : {}), ...(q ? { q } : {}) })}` : ""}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
              tab.value === status ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
            )}
          >
            {tab.label}
            <span className={cn("text-xs tabular-nums", tab.value === status ? "text-cotton-50/70" : "text-muted-foreground")}>{tab.count}</span>
          </Link>
        ))}
        <form action="/admin/stock" className="relative ml-auto w-full sm:w-72">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Name, style no. or color code" aria-label="Search stock listings" className={cn(inputClass, "pl-9")} />
        </form>
      </div>

      {styles.length === 0 ? (
        <EmptyState title={q ? "No listings match" : "No stock listings yet"}>
          {q ? (
            "Try another search."
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
                    {isStockSegment(style.segment) ? stockSegmentInfo(style.segment).title : style.segment} · sets of {style.set_pieces}
                    {style.style_no ? ` · ${style.style_no}` : ""}
                  </span>
                </p>
              </div>
              <span className={cn("hidden text-sm tabular-nums sm:block", style.set_price_cents === 0 && "text-stitch-700")}>
                {style.set_price_cents > 0 ? formatRupees(style.set_price_cents) : "No price"}
              </span>
              <span className={cn("w-20 text-right text-sm tabular-nums", style.sets_in_stock === 0 && "text-muted-foreground")}>
                {style.sets_in_stock} set{style.sets_in_stock === 1 ? "" : "s"}
              </span>
              {style.is_featured ? <Pill tone="blue">Featured</Pill> : null}
              <Pill tone={STATUS[style.status].tone}>{STATUS[style.status].label}</Pill>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
