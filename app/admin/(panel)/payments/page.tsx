import type { Metadata } from "next";
import Link from "next/link";
import { PaperclipIcon, ReceiptIcon } from "lucide-react";
import { PaymentReview } from "@/components/admin/order-manager";
import { EmptyState, NoAccess, PageHeader, Pager, Pill } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { ADMIN_TIME_ZONE, formatDateTime, formatDay } from "@/lib/admin/time";
import type { AdminPayment, Pagination } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };

type QueueItem = AdminPayment & {
  slip_name: string | null;
  order: { id: number; order_no: string; status: string; company_name: string; country_code: string; deposit_cents: number; total_cents: number; paid_cents: number; due_now_cents: number };
};

const TABS = [
  { value: "submitted", label: "To check" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
] as const;

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  const staff = await getStaff();
  if (!can(staff.role, "payments")) return <NoAccess />;

  const search = (await searchParams) as { status?: string; page?: string };
  const status = TABS.find((tab) => tab.value === search.status)?.value ?? "submitted";
  const page = Math.max(1, Number(search.page) || 1);
  const { data: payments, meta } = await adminApiWithMeta<QueueItem[], { pagination: Pagination; counts: Record<string, number>; can_review: boolean }>("/v1/admin/payments", {
    query: { status, page },
  });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: ADMIN_TIME_ZONE }).format(new Date());
  const href = (changes: { status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const next = { status, page: undefined as number | undefined, ...changes };
    if (next.status && next.status !== "submitted") params.set("status", next.status);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    return `/admin/payments${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description={
          meta.can_review
            ? "Bank transfers reported by buyers. Check each one against the bank statement, then confirm it (the buyer gets a receipt) or reject it with a reason."
            : "Bank transfers reported by buyers. Admins confirm or reject them."
        }
      />

      <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.value}
              href={href({ status: tab.value })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                active ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
              )}
            >
              {tab.label}
              <span className={cn("text-xs tabular-nums", active ? "text-cotton-50/70" : "text-muted-foreground")}>{meta.counts[tab.value] ?? 0}</span>
            </Link>
          );
        })}
      </div>

      {payments.length === 0 ? (
        <EmptyState title={status === "submitted" ? "Nothing to check" : "No payments here yet"}>
          {status === "submitted" ? "Reported transfers appear here as soon as a buyer sends their details." : null}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {payments.map((payment) => (
            <li key={payment.id} className="rounded-2xl border bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <Link href={`/admin/orders/${payment.order.id}`} className="font-mono font-medium text-denim-600 hover:underline">
                      {payment.order.order_no}
                    </Link>
                    <span className="font-medium">{payment.order.company_name}</span>
                    <span className="text-muted-foreground">{countryName(payment.order.country_code)}</span>
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {payment.kind_label}: {formatMoney(payment.amount_cents)}
                    {payment.received_cents !== null && payment.received_cents !== payment.amount_cents ? (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">{formatMoney(payment.received_cents)} arrived</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {status === "submitted"
                      ? `Due on the order: ${formatMoney(payment.order.due_now_cents)} · paid so far ${formatMoney(payment.order.paid_cents)}`
                      : payment.reviewed_at
                        ? `Reviewed ${formatDateTime(payment.reviewed_at)}`
                        : null}
                  </p>
                </div>
                <Pill tone={payment.status === "confirmed" ? "green" : payment.status === "rejected" ? "red" : "orange"}>{payment.status_label}</Pill>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex min-w-0 gap-2">
                  <dt className="shrink-0 text-muted-foreground">Transaction ID:</dt>
                  <dd className="min-w-0 font-mono break-all">{payment.transaction_id}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Sent:</dt>
                  <dd>
                    {formatDay(payment.transferred_on)} by {payment.payer_name}, {payment.payer_bank}
                  </dd>
                </div>
                {payment.notes ? (
                  <div className="flex min-w-0 gap-2 sm:col-span-2">
                    <dt className="shrink-0 text-muted-foreground">Notes:</dt>
                    <dd className="min-w-0 break-words">{payment.notes}</dd>
                  </div>
                ) : null}
                {payment.rejection_reason ? (
                  <div className="flex min-w-0 gap-2 sm:col-span-2">
                    <dt className="shrink-0 text-muted-foreground">Rejected because:</dt>
                    <dd className="min-w-0 break-words">{payment.rejection_reason}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {payment.has_slip ? (
                  <a href={`/admin/payments/${payment.id}/slip`} className="inline-flex items-center gap-1.5 font-medium text-denim-600 hover:underline">
                    <PaperclipIcon className="size-4" /> {payment.slip_name ?? "Transfer slip"}
                  </a>
                ) : null}
                {payment.receipt_no ? (
                  <a href={`/admin/payments/${payment.id}/receipt`} className="inline-flex items-center gap-1.5 font-medium text-denim-600 hover:underline">
                    <ReceiptIcon className="size-4" /> Receipt {payment.receipt_no}
                  </a>
                ) : null}
              </div>
              {payment.status === "submitted" && meta.can_review ? <PaymentReview payment={payment} dueCents={payment.order.due_now_cents} today={today} /> : null}
            </li>
          ))}
        </ul>
      )}

      <Pager page={meta.pagination.page} pages={meta.pagination.pages} href={(target) => href({ page: target })} />
    </>
  );
}
