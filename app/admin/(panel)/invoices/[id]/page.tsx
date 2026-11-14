import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadIcon, EyeIcon, PencilIcon } from "lucide-react";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { InvoiceStagePill, InvoiceSummary } from "@/components/admin/invoice-parts";
import { NoAccess, PageHeader, Panel } from "@/components/admin/page-parts";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { ADMIN_TIME_ZONE, formatDateTime, formatDay } from "@/lib/admin/time";
import type { Invoice, InvoiceDefaults } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: PageProps<"/admin/invoices/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "invoices")) return <NoAccess />;
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  let invoice: Invoice;
  let defaults: InvoiceDefaults;
  try {
    [invoice, defaults] = await Promise.all([adminApi<Invoice>(`/v1/admin/invoices/${id}`), adminApi<InvoiceDefaults>("/v1/admin/invoices/defaults")]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  // The page is rendered per request (it reads the staff session), so "today" is the current date in Lahore.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: ADMIN_TIME_ZONE }).format(new Date());
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  const buyerName = invoice.buyer.company ?? invoice.buyer.contact_name ?? "";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/invoices", label: "Invoices" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{invoice.invoice_no}</span>
            <InvoiceStagePill invoice={invoice} />
          </span>
        }
        description={`${invoice.type_label} for ${buyerName} · ${money(invoice.amounts.total_cents)} · ${formatDay(invoice.issue_date)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/invoices/${invoice.id}/pdf?view=1`} target="_blank" rel="noopener">
                <EyeIcon /> Preview PDF
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/invoices/${invoice.id}/pdf`} download>
                <DownloadIcon /> Download
              </a>
            </Button>
            {invoice.status === "open" ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/invoices/${invoice.id}/edit`}>
                  <PencilIcon /> Edit
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {!defaults.bank_ready && invoice.status === "open" ? (
        <p className="mb-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-stitch-700">
          The bank details are not filled in yet: the PDF says “our team will send you the bank details”.{" "}
          {staff.role === "admin" ? (
            <Link href="/admin/settings" className="font-medium underline">
              Add them in Settings
            </Link>
          ) : (
            "Ask an administrator to add them in Settings."
          )}
        </p>
      ) : null}
      {invoice.stage === "overdue" ? (
        <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Overdue since {formatDay(invoice.due_date)}: {money(invoice.amounts.due_now_cents)} not received yet.
        </p>
      ) : null}

      <div className="mb-6">
        <InvoiceActions invoice={invoice} today={today} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <Panel title="Invoice" className="min-w-0 lg:col-span-2">
          <InvoiceSummary invoice={invoice} />
        </Panel>

        <div className="grid min-w-0 grid-cols-1 gap-6">
          <Panel title="Status">
            <dl className="grid gap-3 text-sm">
              <Item label="Amount due" value={invoice.status === "open" ? money(invoice.amounts.due_now_cents) : invoice.status === "paid" ? "Paid" : "Cancelled"} />
              <Item label="Emailed" value={invoice.sent_at ? `${formatDateTime(invoice.sent_at)} to ${invoice.sent_to}` : "Not yet"} />
              {invoice.status === "paid" ? (
                <Item label="Paid" value={`${formatDay(invoice.paid_on)}${invoice.payment_reference ? ` · ${invoice.payment_reference}` : ""}`} />
              ) : null}
              {invoice.cancelled_at ? <Item label="Cancelled" value={formatDateTime(invoice.cancelled_at)} /> : null}
              <Item label="Made" value={`${formatDateTime(invoice.created_at)}${invoice.created_by ? ` by ${invoice.created_by}` : ""}`} />
              {invoice.updated_at !== invoice.created_at ? <Item label="Last changed" value={formatDateTime(invoice.updated_at)} /> : null}
              {invoice.customer ? (
                <Item
                  label="Buyer account"
                  value={
                    <Link href={`/admin/customers/${invoice.customer.id}`} className="font-medium text-denim-600 hover:underline">
                      {invoice.customer.company_name}
                    </Link>
                  }
                />
              ) : null}
            </dl>
          </Panel>

          {invoice.staff_notes ? (
            <Panel title="Staff notes">
              <p className="text-sm whitespace-pre-line">{invoice.staff_notes}</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
