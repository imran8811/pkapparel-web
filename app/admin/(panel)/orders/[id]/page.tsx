import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadIcon, MailIcon, PaperclipIcon } from "lucide-react";
import { NoAccess, PageHeader, Panel, Pill } from "@/components/admin/page-parts";
import { OrderLines, OrderTimeline, OrderTotals, shippingSummary, sizesText } from "@/components/account/order-parts";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { BUSINESS_TYPES } from "@/lib/account/types";
import { ORDER_STATUSES } from "@/lib/admin/labels";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { formatDateTime, formatDay } from "@/lib/admin/time";
import type { AdminOrder } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";
import { whatsappUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "orders")) return <NoAccess />;
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  let order: AdminOrder;
  try {
    order = await adminApi<AdminOrder>(`/v1/admin/orders/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const { customer, address, amounts } = order;
  const status = ORDER_STATUSES[order.status];
  const canDownload = can(staff.role, "customers"); // PDFs and slips: admins and sales
  const business = BUSINESS_TYPES.find((type) => type.value === customer.business_type)?.label;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.order_no}</span>
            <Pill tone={status.tone}>{status.label}</Pill>
          </span>
        }
        description={`Placed ${formatDateTime(order.placed_at)} · ${order.total_pcs} pcs · ${formatMoney(amounts.total_cents)}${order.buyer_reference ? ` · Buyer's reference ${order.buyer_reference}` : ""}`}
        actions={
          canDownload && order.status !== "cancelled" ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/orders/${order.id}/proforma-invoice`} download>
                <DownloadIcon /> Proforma invoice
              </a>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-2">
          {order.payments.length > 0 ? (
            <Panel title="Reported payments" description="Check each transfer against the bank statement. Confirming payments in the admin (with automatic receipts) comes in the next update; until then, reply to the buyer by email.">
              <ul className="grid gap-3">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="rounded-xl border p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {payment.kind_label}: {formatMoney(payment.amount_cents)}{" "}
                        <span className="font-normal text-muted-foreground">(due {formatMoney(amounts.due_now_cents)})</span>
                      </p>
                      <Pill tone={payment.status === "confirmed" ? "green" : payment.status === "rejected" ? "red" : "orange"}>{payment.status_label}</Pill>
                    </div>
                    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                      <Item label="Transaction ID" value={<span className="font-mono">{payment.transaction_id}</span>} />
                      <Item label="Transfer date" value={formatDay(payment.transferred_on)} />
                      <Item label="Sent by" value={payment.payer_name} />
                      <Item label="From bank" value={payment.payer_bank} />
                      <Item label="Reported" value={formatDateTime(payment.created_at)} />
                      {payment.notes ? <Item label="Notes" value={payment.notes} /> : null}
                    </dl>
                    {payment.has_slip && canDownload ? (
                      <a href={`/admin/payments/${payment.id}/slip`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-denim-600 hover:underline">
                        <PaperclipIcon className="size-4" /> {payment.slip_name ?? "Transfer slip"}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Items">
            <OrderLines order={order} />
          </Panel>

          {order.notes ? (
            <Panel title="Buyer's notes">
              <p className="text-sm whitespace-pre-line">{order.notes}</p>
            </Panel>
          ) : null}

          <Panel title="Packing estimate">
            <p className="text-sm">
              {order.packing.cartons} cartons · {(order.packing.gross_g / 1000).toFixed(1)} kg gross · {order.packing.cbm.toFixed(2)} CBM
              {order.packing.freight?.basis ? ` · freight estimate based on ${order.packing.freight.basis}` : ""}
            </p>
            <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
              {order.lines.map((line, index) => (
                <li key={index}>
                  {line.style_name}, {line.color_name}: {sizesText(line.size_qty)}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6">
          <Panel title="Buyer">
            <p className="font-medium">{customer.company_name}</p>
            <p className="text-sm text-muted-foreground">
              {customer.contact_name}
              {business ? ` · ${business}` : ""} · {countryName(customer.country_code)}
            </p>
            <div className="mt-3 grid gap-1 text-sm">
              <a href={`mailto:${customer.email}?subject=${encodeURIComponent(`Your order ${order.order_no}`)}`} className="inline-flex items-center gap-1.5 text-denim-600 hover:underline">
                <MailIcon className="size-4" /> {customer.email}
              </a>
              <a href={whatsappUrl(customer.phone.replace(/\D/g, ""), `Hello ${customer.contact_name}, about your order ${order.order_no}:`)} target="_blank" rel="noopener noreferrer" className="text-denim-600 hover:underline">
                WhatsApp {customer.phone}
              </a>
            </div>
            {order.account ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Account:{" "}
                {can(staff.role, "customers") ? (
                  <Link href={`/admin/customers/${order.account.id}`} className="text-denim-600 hover:underline">
                    {order.account.email}
                  </Link>
                ) : (
                  order.account.email
                )}
                {order.account.status === "blocked" ? " (blocked)" : ""}
              </p>
            ) : null}
          </Panel>

          <Panel title="Totals">
            <OrderTotals order={order} />
          </Panel>

          <Panel title="Delivery">
            <p className="text-sm font-medium">
              {shippingSummary(order)} · {order.incoterm}
            </p>
            {order.forwarder ? <p className="mt-1 text-sm text-muted-foreground">Forwarder: {[order.forwarder.name, order.forwarder.contact].filter(Boolean).join(", ")}</p> : null}
            <address className="mt-3 text-sm leading-relaxed not-italic text-muted-foreground">
              <span className="font-medium text-foreground">{address.company}</span>
              <br />
              {address.contact_name}, {address.phone}
              {address.email ? `, ${address.email}` : ""}
              <br />
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {[address.postal_code, address.city].filter(Boolean).join(" ")}
              {address.state ? `, ${address.state}` : ""}, {countryName(address.country_code)}
              {address.tax_id ? (
                <>
                  <br />
                  Tax / import ID: {address.tax_id}
                </>
              ) : null}
            </address>
          </Panel>

          <Panel title="History">
            <OrderTimeline events={order.events} />
          </Panel>
        </aside>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}
