import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SearchIcon } from "lucide-react";
import { InvoiceStagePill, InvoiceTypePill } from "@/components/admin/invoice-parts";
import { EmptyState, NoAccess, PageHeader, Pager } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatDay } from "@/lib/admin/time";
import type { Invoice, InvoiceCounts, InvoiceType, Pagination } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoices" };

type Status = "open" | "overdue" | "paid" | "cancelled";
type Search = { status?: string; type?: string; q?: string; page?: string };

const STATUSES: { value: Status; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPES: { value: InvoiceType; label: string }[] = [
  { value: "sample", label: "Sample" },
  { value: "proforma", label: "Proforma" },
  { value: "commercial", label: "Invoice" },
];

export default async function InvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  const staff = await getStaff();
  if (!can(staff.role, "invoices")) return <NoAccess />;

  const search = (await searchParams) as Search;
  const status = STATUSES.find((option) => option.value === search.status)?.value;
  const type = TYPES.find((option) => option.value === search.type)?.value;
  const q = search.q?.trim() || undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const { data: invoices, meta } = await adminApiWithMeta<Invoice[], { pagination: Pagination; counts: InvoiceCounts }>("/v1/admin/invoices", {
    query: { status, type, q, page },
  });
  const { counts } = meta;

  const href = (changes: Partial<Record<keyof Search, string | number | undefined>>) => {
    const params = new URLSearchParams();
    const next = { status, type, q, page: undefined as number | undefined, ...changes };
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
    }
    return `/admin/invoices${params.size ? `?${params}` : ""}`;
  };
  const total = counts.open + counts.paid + counts.cancelled;

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Sample, proforma and final invoices for buyers who order outside the website. Each PDF carries the company and bank details."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/invoices/new">
              <PlusIcon /> New invoice
            </Link>
          </Button>
        }
      />

      <nav aria-label="Kind of invoice" className="mb-3 flex gap-4 text-sm">
        {[{ value: undefined, label: "All invoices" }, ...TYPES.map((option) => ({ ...option, label: `${option.label} (${counts[option.value]})` }))].map((option) => (
          <Link
            key={option.label}
            href={href({ type: option.value })}
            aria-current={option.value === type ? "page" : undefined}
            className={cn("border-b-2 pb-1", option.value === type ? "border-denim-900 font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {[{ value: undefined, label: "All", count: total }, ...STATUSES.filter((option) => option.value !== "overdue" || counts.overdue > 0 || status === "overdue").map((option) => ({ ...option, count: counts[option.value] }))].map(
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
                  filter.value === "overdue" && !active && "border-red-200 text-red-700",
                )}
              >
                {filter.label}
                <span className={cn("text-xs tabular-nums", active ? "text-cotton-50/70" : "text-muted-foreground")}>{filter.count}</span>
              </Link>
            );
          },
        )}
      </div>

      <form action="/admin/invoices" className="mb-5 flex flex-wrap gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {type ? <input type="hidden" name="type" value={type} /> : null}
        <div className="relative min-w-60 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search invoice number, buyer, email or reference" aria-label="Search invoices" className={cn(inputClass, "pl-9")} />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-denim-900 px-4 text-sm font-medium text-white hover:bg-denim-800">
          Search
        </button>
      </form>

      {invoices.length === 0 ? (
        <EmptyState title={q || status || type ? "No invoices match" : "No invoices yet"}>
          {q || status || type ? (
            "Try another search or filter."
          ) : (
            <>
              Make a sample invoice for a buyer who confirmed samples, or a proforma for a production order.{" "}
              <Link href="/admin/invoices/new" className="font-medium text-denim-600 hover:underline">
                New invoice
              </Link>
            </>
          )}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="border-b last:border-b-0">
              <Link href={`/admin/invoices/${invoice.id}`} className="grid grid-cols-1 gap-1 px-4 py-3.5 hover:bg-cotton-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-mono font-medium">{invoice.invoice_no}</span>
                    <span className="font-medium">{invoice.buyer.company ?? invoice.buyer.contact_name}</span>
                    <span className="text-muted-foreground">{countryName(invoice.buyer.country_code)}</span>
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {formatDay(invoice.issue_date)}
                    {invoice.total_qty ? ` · ${invoice.total_qty} pcs` : ""}
                    {invoice.buyer_reference ? ` · ${invoice.buyer_reference}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <span className="inline-flex items-center gap-1.5">
                    <InvoiceTypePill invoice={invoice} />
                    <InvoiceStagePill invoice={invoice} />
                  </span>
                  <span className="text-sm font-medium tabular-nums">{formatMoney(invoice.amounts.total_cents, invoice.currency)}</span>
                  {invoice.status === "open" && invoice.amounts.due_now_cents !== invoice.amounts.total_cents ? (
                    <span className="text-xs text-muted-foreground tabular-nums">{formatMoney(invoice.amounts.due_now_cents, invoice.currency)} due now</span>
                  ) : invoice.status === "open" && invoice.due_date ? (
                    <span className={cn("text-xs", invoice.stage === "overdue" ? "font-medium text-destructive" : "text-muted-foreground")}>Due {formatDay(invoice.due_date)}</span>
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
