import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SearchIcon } from "lucide-react";
import { EmptyState, NoAccess, PageHeader, Pager } from "@/components/admin/page-parts";
import { QuotationStagePill } from "@/components/admin/quotation-parts";
import { inputClass } from "@/components/admin/styles";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatDay } from "@/lib/admin/time";
import type { Pagination, Quotation, QuotationCounts } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Quotations" };

type Status = "open" | "expired" | "accepted" | "declined";
type Search = { status?: string; q?: string; page?: string };

const STATUSES: { value: Status; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "expired", label: "Expired" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

export default async function QuotationsPage({ searchParams }: PageProps<"/admin/quotations">) {
  const staff = await getStaff();
  if (!can(staff.role, "quotations")) return <NoAccess />;

  const search = (await searchParams) as Search;
  const status = STATUSES.find((option) => option.value === search.status)?.value;
  const q = search.q?.trim() || undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const { data: quotations, meta } = await adminApiWithMeta<Quotation[], { pagination: Pagination; counts: QuotationCounts }>("/v1/admin/quotations", {
    query: { status, q, page },
  });
  const { counts } = meta;

  const href = (changes: Partial<Record<keyof Search, string | number | undefined>>) => {
    const params = new URLSearchParams();
    const next = { status, q, page: undefined as number | undefined, ...changes };
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
    }
    return `/admin/quotations${params.size ? `?${params}` : ""}`;
  };
  const total = counts.open + counts.accepted + counts.declined;

  return (
    <>
      <PageHeader
        title="Quotations"
        description="Prices for buyers who sent artwork, sizes and colors. Each style is costed per piece; the buyer's PDF shows the prices, the costing sheet how they were made."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/quotations/new">
              <PlusIcon /> New quotation
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {[{ value: undefined, label: "All", count: total }, ...STATUSES.filter((option) => option.value !== "expired" || counts.expired > 0 || status === "expired").map((option) => ({ ...option, count: counts[option.value] }))].map(
          (filter) => {
            const active = filter.value === status;
            return (
              <Link
                key={filter.label}
                href={href({ status: filter.value })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
                  filter.value === "expired" && !active && "border-red-200 text-red-700",
                )}
              >
                {filter.label}
                <span className={cn("text-xs tabular-nums", active ? "text-cotton-50/70" : "text-muted-foreground")}>{filter.count}</span>
              </Link>
            );
          },
        )}
      </div>

      <form action="/admin/quotations" className="mb-5 flex flex-wrap gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative min-w-60 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search number, buyer, email, reference or article no." aria-label="Search quotations" className={cn(inputClass, "pl-9")} />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-denim-900 px-4 text-sm font-medium text-white hover:bg-denim-800">
          Search
        </button>
      </form>

      {quotations.length === 0 ? (
        <EmptyState title={q || status ? "No quotations match" : "No quotations yet"}>
          {q || status ? (
            "Try another search or filter."
          ) : (
            <>
              When a buyer sends artwork and asks for prices, cost each style and send them the quotation.{" "}
              <Link href="/admin/quotations/new" className="font-medium text-denim-600 hover:underline">
                New quotation
              </Link>
            </>
          )}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {quotations.map((quotation) => (
            <li key={quotation.id} className="border-b last:border-b-0">
              <Link href={`/admin/quotations/${quotation.id}`} className="grid grid-cols-1 gap-1 px-4 py-3.5 hover:bg-cotton-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-mono font-medium">{quotation.quotation_no}</span>
                    <span className="font-medium">{quotation.buyer.company ?? quotation.buyer.contact_name}</span>
                    <span className="text-muted-foreground">{countryName(quotation.buyer.country_code)}</span>
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {formatDay(quotation.issue_date)} · {quotation.styles_count} {quotation.styles_count === 1 ? "style" : "styles"}
                    {quotation.article_nos ? ` · ${quotation.article_nos}` : ""}
                    {quotation.buyer_reference ? ` · ${quotation.buyer_reference}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <QuotationStagePill quotation={quotation} />
                  {quotation.total_qty > 0 ? (
                    <span className="text-sm font-medium tabular-nums">{formatMoney(quotation.total_cents, quotation.currency)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Per piece, {quotation.currency}</span>
                  )}
                  {quotation.status === "open" && quotation.valid_until ? (
                    <span className={cn("text-xs", quotation.stage === "expired" ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {quotation.stage === "expired" ? "Expired" : "Valid until"} {formatDay(quotation.valid_until)}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pager page={meta.pagination.page} pages={meta.pagination.pages} href={(target) => href({ page: target })} />
    </>
  );
}
