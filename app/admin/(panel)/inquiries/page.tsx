import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { EmptyState, NoAccess, PageHeader, Pager, Pill } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { INQUIRY_STATUSES, INQUIRY_TYPES } from "@/lib/admin/labels";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatRelative } from "@/lib/admin/time";
import type { InquirySummary, InquiryStatus, Pagination } from "@/lib/admin/types";
import { countryName } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inquiries" };

const FILTERS: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  ...Object.entries(INQUIRY_STATUSES).map(([value, { label }]) => ({ value, label })),
  { value: "all", label: "All" },
];

type Search = { status?: string; type?: string; q?: string; page?: string };

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  const staff = await getStaff();
  if (!can(staff.role, "inquiries")) return <NoAccess />;

  const search = (await searchParams) as Search;
  const status = FILTERS.some((filter) => filter.value === search.status) ? (search.status as string) : "open";
  const type = search.type && search.type in INQUIRY_TYPES ? search.type : undefined;
  const q = search.q?.trim() || undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const { data: inquiries, meta } = await adminApiWithMeta<InquirySummary[], { pagination: Pagination; counts: Record<InquiryStatus, number> }>(
    "/v1/admin/inquiries",
    { query: { status: status === "all" ? undefined : status, type, q, page } },
  );
  const counts = meta.counts;
  const openCount = counts.new + counts.in_progress + counts.quoted;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const href = (changes: Partial<Record<keyof Search, string | number | undefined>>) => {
    const params = new URLSearchParams();
    const next = { status, type, q, page: undefined as number | undefined, ...changes };
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== "" && !(key === "status" && value === "open") && !(key === "page" && value === 1)) {
        params.set(key, String(value));
      }
    }
    return `/admin/inquiries${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Messages, quote requests and sample requests from the website. Set a status to keep track of each one."
      />

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((filter) => {
          const count = filter.value === "open" ? openCount : filter.value === "all" ? total : counts[filter.value as InquiryStatus];
          const active = filter.value === status;
          return (
            <Link
              key={filter.value}
              href={href({ status: filter.value })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
              )}
            >
              {filter.label}
              <span className={cn("text-xs tabular-nums", active ? "text-cotton-50/70" : "text-muted-foreground")}>{count}</span>
            </Link>
          );
        })}
      </div>

      <form action="/admin/inquiries" className="mb-5 flex flex-wrap gap-2">
        {status !== "open" ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative min-w-60 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, company, message or INQ number"
            aria-label="Search inquiries"
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select name="type" defaultValue={type ?? ""} aria-label="Type" className={cn(inputClass, "w-auto")}>
          <option value="">All types</option>
          {Object.entries(INQUIRY_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-lg bg-denim-900 px-4 text-sm font-medium text-white hover:bg-denim-800">
          Search
        </button>
      </form>

      {inquiries.length === 0 ? (
        <EmptyState title={q || type ? "No inquiries match" : "Nothing here"}>
          {q || type ? "Try another search or filter." : "Inquiries with this status will show up here."}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="border-b last:border-b-0">
              <Link href={`/admin/inquiries/${inquiry.id}`} className="grid gap-1 px-4 py-3.5 hover:bg-cotton-50 sm:grid-cols-[1fr_auto] sm:gap-4 sm:px-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium">{inquiry.name}</span>
                    {inquiry.company ? <span className="text-muted-foreground">{inquiry.company}</span> : null}
                    <span className="font-mono text-xs text-muted-foreground">{inquiry.reference}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/80">{INQUIRY_TYPES[inquiry.type]}</span>
                    {inquiry.country_code ? ` · ${countryName(inquiry.country_code)}` : ""} — {inquiry.preview}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <Pill tone={INQUIRY_STATUSES[inquiry.status].tone}>{INQUIRY_STATUSES[inquiry.status].label}</Pill>
                  <span className="text-xs text-muted-foreground">{formatRelative(inquiry.created_at)}</span>
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
