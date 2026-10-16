import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { EmptyState, NoAccess, PageHeader, Pager, Pill } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { ORDER_STATUSES } from "@/lib/admin/labels";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatRelative } from "@/lib/admin/time";
import type { AdminOrderSummary, Pagination } from "@/lib/admin/types";
import type { OrderStatus } from "@/lib/account/types";
import { countryName, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

type Search = { status?: string; q?: string; page?: string };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const staff = await getStaff();
  if (!can(staff.role, "orders")) return <NoAccess />;

  const search = (await searchParams) as Search;
  const status = search.status && search.status in ORDER_STATUSES ? (search.status as OrderStatus) : undefined;
  const q = search.q?.trim() || undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const { data: orders, meta } = await adminApiWithMeta<AdminOrderSummary[], { pagination: Pagination; counts: Partial<Record<OrderStatus, number>>; payments_to_check: number }>(
    "/v1/admin/orders",
    { query: { status, q, page } },
  );
  const total = Object.values(meta.counts).reduce((sum, count) => sum + (count ?? 0), 0);

  const href = (changes: Partial<Record<keyof Search, string | number | undefined>>) => {
    const params = new URLSearchParams();
    const next = { status, q, page: undefined as number | undefined, ...changes };
    for (const [key, value] of Object.entries(next)) {
      if (value !== undefined && value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
    }
    return `/admin/orders${params.size ? `?${params}` : ""}`;
  };
  const filters: { value: OrderStatus | undefined; label: string; count: number }[] = [
    { value: undefined, label: "All", count: total },
    ...(Object.keys(ORDER_STATUSES) as OrderStatus[]).filter((key) => (meta.counts[key] ?? 0) > 0 || key === status).map((key) => ({
      value: key,
      label: ORDER_STATUSES[key].label,
      count: meta.counts[key] ?? 0,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Orders placed in the wholesale shop. Each has a proforma invoice; buyers report their bank transfers on the order."
      />

      {meta.payments_to_check > 0 ? (
        <p className="mb-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-stitch-700">
          {meta.payments_to_check} reported {meta.payments_to_check === 1 ? "payment needs" : "payments need"} checking against the bank statement. Open the orders marked “Payment to check”.
        </p>
      ) : null}

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {filters.map((filter) => {
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
              <span className={cn("text-xs tabular-nums", active ? "text-cotton-50/70" : "text-muted-foreground")}>{filter.count}</span>
            </Link>
          );
        })}
      </div>

      <form action="/admin/orders" className="mb-5 flex flex-wrap gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative min-w-60 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search order number, company, email or the buyer's reference" aria-label="Search orders" className={cn(inputClass, "pl-9")} />
        </div>
        <button type="submit" className="h-10 rounded-lg bg-denim-900 px-4 text-sm font-medium text-white hover:bg-denim-800">
          Search
        </button>
      </form>

      {orders.length === 0 ? (
        <EmptyState title={q || status ? "No orders match" : "No orders yet"}>
          {q || status ? "Try another search or filter." : "Orders placed in the wholesale shop show up here."}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {orders.map((order) => (
            <li key={order.id} className="border-b last:border-b-0">
              <Link href={`/admin/orders/${order.id}`} className="grid grid-cols-1 gap-1 px-4 py-3.5 hover:bg-cotton-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-mono font-medium">{order.order_no}</span>
                    <span className="font-medium">{order.company_name}</span>
                    <span className="text-muted-foreground">{countryName(order.country_code)}</span>
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {order.total_pcs} pcs · {order.styles.join(", ")} · {order.shipping_mode_label}
                    {order.buyer_reference ? ` · ${order.buyer_reference}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <Pill tone={ORDER_STATUSES[order.status].tone}>{ORDER_STATUSES[order.status].label}</Pill>
                  <span className="text-sm font-medium tabular-nums">{formatMoney(order.total_cents)}</span>
                  <span className="text-xs text-muted-foreground">{formatRelative(order.placed_at)}</span>
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
