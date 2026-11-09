import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { StockReport } from "@/lib/admin/types";
import { formatRupees } from "@/lib/stock";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Stock report" };

const PERIODS = [7, 30, 90];

export default async function StockReportPage({ searchParams }: PageProps<"/admin/stock/report">) {
  const staff = await getStaff();
  if (!can(staff.role, "stock_report")) return <NoAccess />;

  const requested = Number((await searchParams).days);
  const days = PERIODS.includes(requested) ? requested : 30;
  const report = await adminApi<StockReport>("/v1/admin/stock/report", { query: { days } });
  const { totals } = report;

  return (
    <>
      <PageHeader
        back={can(staff.role, "content") ? { href: "/admin/stock", label: "Stock" } : undefined}
        title="Stock report"
        description={`What is in stock and its value at today's set prices, and what moved since ${report.since}. Sold sets do not count orders cancelled after payment.`}
      />

      <nav aria-label="Period" className="mb-5 flex gap-1">
        {PERIODS.map((period) => (
          <Link
            key={period}
            href={`/admin/stock/report?days=${period}`}
            aria-current={period === days ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              period === days ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
            )}
          >
            Last {period} days
          </Link>
        ))}
      </nav>

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Sets in stock", value: totals.sets_in_stock.toLocaleString("en-US") },
          { label: "Stock value", value: formatRupees(totals.value_cents) },
          { label: `Sets sold (${days} days)`, value: totals.sold_sets.toLocaleString("en-US") },
          { label: `Sales (${days} days)`, value: formatRupees(totals.sold_cents) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-white p-4">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      {report.rows.length === 0 ? (
        <EmptyState title="No stock yet">Add stock listings first.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-cotton-50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Style and color
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  In stock
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Value
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Sold
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Received
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Returned
                </th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.code} className="border-t">
                  <td className="px-4 py-2.5">
                    {can(staff.role, "content") ? (
                      <Link href={`/admin/stock/${row.style_id}`} className="hover:text-denim-600">
                        {row.style_name}
                      </Link>
                    ) : (
                      row.style_name
                    )}
                    , {row.color} <span className="font-mono text-xs text-muted-foreground">{row.code}</span>
                    {row.shown ? null : (
                      <span className="ml-2">
                        <Pill tone="muted">Not shown</Pill>
                      </span>
                    )}
                  </td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", row.sets_in_stock === 0 && "text-muted-foreground")}>{row.sets_in_stock}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatRupees(row.value_cents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.sold_sets || "–"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.received_sets || "–"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.returned_sets || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
