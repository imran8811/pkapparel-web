import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { EmptyState, NoAccess, PageHeader, Pager, Pill } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatRelative } from "@/lib/admin/time";
import type { AdminCustomer, Pagination } from "@/lib/admin/types";
import { BUSINESS_TYPES } from "@/lib/account/types";
import { countryName } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "active", label: "Active" },
  { value: "unverified", label: "Email not confirmed" },
  { value: "blocked", label: "Blocked" },
] as const;

type Search = { status?: string; q?: string; page?: string };
type Counts = { active: number; blocked: number; unverified: number };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const staff = await getStaff();
  if (!can(staff.role, "customers")) return <NoAccess />;

  const search = (await searchParams) as Search;
  const status = FILTERS.find((filter) => filter.value === search.status)?.value;
  const q = search.q?.trim() || undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const { data: customers, meta } = await adminApiWithMeta<AdminCustomer[], { pagination: Pagination; counts: Counts }>("/v1/admin/customers", {
    query: { status, q, page },
  });
  const count = (value: (typeof FILTERS)[number]["value"]) => (value === undefined ? meta.counts.active + meta.counts.blocked : meta.counts[value]);

  const href = (changes: Partial<Record<keyof Search, string | number | undefined>>) => {
    const params = new URLSearchParams();
    const next = { status, q, page: undefined as number | undefined, ...changes };
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
    }
    return `/admin/customers${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Customers" description="Buyer accounts from the website. Open one to see its orders and addresses, add notes, or block it." />

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <Link
              key={filter.label}
              href={href({ status: filter.value })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
              )}
            >
              {filter.label}
              <span className={cn("text-xs tabular-nums", active ? "text-cotton-50/70" : "text-muted-foreground")}>{count(filter.value)}</span>
            </Link>
          );
        })}
      </div>

      <form action="/admin/customers" className="mb-5 flex flex-wrap gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative min-w-60 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search company, name or email" aria-label="Search customers" className={cn(inputClass, "pl-9")} />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-denim-900 px-4 text-sm font-medium text-white hover:bg-denim-800">
          Search
        </button>
      </form>

      {customers.length === 0 ? (
        <EmptyState title={q || status ? "No customers match" : "No buyer accounts yet"}>
          {q || status ? "Try another search or filter." : "Buyers who sign up on the website show up here."}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {customers.map((customer) => (
            <li key={customer.id} className="border-b last:border-b-0">
              <Link href={`/admin/customers/${customer.id}`} className="grid grid-cols-1 gap-1 px-4 py-3.5 hover:bg-cotton-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium">{customer.company_name}</span>
                    <span className="text-muted-foreground">{customer.contact_name}</span>
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {customer.email} · {countryName(customer.country_code)} · {BUSINESS_TYPES.find((type) => type.value === customer.business_type)?.label}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                  <div className="flex gap-1.5">
                    {customer.status === "blocked" ? <Pill tone="red">Blocked</Pill> : null}
                    {!customer.email_verified ? <Pill tone="orange">Email not confirmed</Pill> : null}
                    <Pill tone={customer.order_count ? "blue" : "muted"}>
                      {customer.order_count ?? 0} {customer.order_count === 1 ? "order" : "orders"}
                    </Pill>
                  </div>
                  <span className="text-xs text-muted-foreground">Joined {formatRelative(customer.created_at)}</span>
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
