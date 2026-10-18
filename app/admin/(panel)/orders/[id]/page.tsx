import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadIcon, MailIcon, PaperclipIcon, ReceiptIcon } from "lucide-react";
import { NoAccess, OrderStatusPill, PageHeader, Panel, Pill } from "@/components/admin/page-parts";
import {
  ChargesForm,
  DeleteDocument,
  DocumentUpload,
  NoteForm,
  OrderActions,
  PaymentReview,
  ProductionManager,
} from "@/components/admin/order-manager";
import { OrderLines, OrderTimeline, OrderTotals, shippingSummary, sizesText } from "@/components/account/order-parts";
import { DocumentList, dueText, ShipmentCard } from "@/components/account/order-progress";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { BUSINESS_TYPES, type OrderDocumentItem, type OrderStatus } from "@/lib/account/types";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { ADMIN_TIME_ZONE, formatDateTime, formatDay } from "@/lib/admin/time";
import type { AdminOrder } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";
import { whatsappUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Order" };

/** Statuses with a production timeline. */
const PRODUCTION: OrderStatus[] = ["confirmed", "in_production", "on_hold", "ready_to_ship", "shipped", "delivered"];
/** Statuses in which production can still be updated (as the API allows). */
const PRODUCTION_OPEN: OrderStatus[] = ["confirmed", "in_production", "on_hold", "ready_to_ship"];

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
  // The page is rendered per request (it reads the staff session), so "today" is the current date in Lahore.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: ADMIN_TIME_ZONE }).format(new Date());
  const { customer, address, amounts } = order;
  const canManage = can(staff.role, "order_workflow");
  const canPay = can(staff.role, "payments_review");
  const business = BUSINESS_TYPES.find((type) => type.value === customer.business_type)?.label;
  const due = dueText(order);
  const late = order.production_days_left !== null && order.production_days_left < 0;
  const sample = order.kind === "sample";
  // A sample order is priced once (before the buyer pays); a bulk order's charges can change until it ships.
  const editableCharges = canManage && (sample ? order.status === "awaiting_price" : !["shipped", "delivered", "cancelled"].includes(order.status));

  const documentHref = (document: OrderDocumentItem): string => {
    switch (document.kind) {
      case "proforma":
        return `/admin/orders/${order.id}/proforma-invoice`;
      case "invoice":
        return `/admin/orders/${order.id}/invoice`;
      case "receipt":
        return `/admin/payments/${order.payments.find((p) => p.receipt_no === document.number)?.id ?? 0}/receipt`;
      default:
        return `/admin/order-documents/${document.id}`;
    }
  };

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.order_no}</span>
            <OrderStatusPill status={order.status} dueNowCents={amounts.due_now_cents} kind={order.kind} />
          </span>
        }
        description={`Placed ${formatDateTime(order.placed_at)} · ${order.total_pcs} pcs · ${formatMoney(amounts.total_cents)}${order.buyer_reference ? ` · Buyer's reference ${order.buyer_reference}` : ""}`}
        actions={
          canManage ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/orders/${order.id}/proforma-invoice`} download>
                <DownloadIcon /> {sample ? "Sample invoice" : "Proforma invoice"}
              </a>
            </Button>
          ) : null
        }
      />

      {due ? (
        <p className={late ? "mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive" : "mb-4 rounded-xl bg-denim-50 px-4 py-3 text-sm text-denim-800"}>
          {sample ? "Samples" : "Production"}: {due}
        </p>
      ) : null}

      <div className="mb-6">
        <OrderActions order={order} canManage={canManage} canPay={canPay} today={today} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-2">
          {order.payments.length > 0 ? (
            <Panel
              title="Payments"
              description={canPay ? "Check each transfer against the bank statement before confirming it. Confirming emails the buyer a receipt." : "Admins confirm or reject reported transfers."}
            >
              <ul className="grid gap-3">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="rounded-xl border p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {payment.kind_label}: {formatMoney(payment.amount_cents)}
                        {payment.received_cents !== null && payment.received_cents !== payment.amount_cents ? (
                          <span className="font-normal text-muted-foreground"> · {formatMoney(payment.received_cents)} arrived</span>
                        ) : null}
                      </p>
                      <Pill tone={payment.status === "confirmed" ? "green" : payment.status === "rejected" ? "red" : "orange"}>{payment.status_label}</Pill>
                    </div>
                    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                      <Item label="Transaction ID" value={<span className="font-mono">{payment.transaction_id}</span>} />
                      <Item label="Transfer date" value={formatDay(payment.transferred_on)} />
                      <Item label="Sent by" value={payment.payer_name} />
                      <Item label="From bank" value={payment.payer_bank} />
                      <Item label={payment.recorded_by_staff ? "Recorded" : "Reported"} value={formatDateTime(payment.created_at)} />
                      {payment.notes ? <Item label="Notes" value={payment.notes} /> : null}
                      {payment.rejection_reason ? <Item label="Rejected because" value={payment.rejection_reason} /> : null}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {payment.has_slip && canManage ? (
                        <a href={`/admin/payments/${payment.id}/slip`} className="inline-flex items-center gap-1.5 font-medium text-denim-600 hover:underline">
                          <PaperclipIcon className="size-4" /> {payment.slip_name ?? "Transfer slip"}
                        </a>
                      ) : null}
                      {payment.receipt_no && canManage ? (
                        <a href={`/admin/payments/${payment.id}/receipt`} className="inline-flex items-center gap-1.5 font-medium text-denim-600 hover:underline">
                          <ReceiptIcon className="size-4" /> Receipt {payment.receipt_no}
                        </a>
                      ) : null}
                    </div>
                    {payment.status === "submitted" && canPay ? <PaymentReview payment={payment} dueCents={amounts.due_now_cents} today={today} /> : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {!sample && PRODUCTION.includes(order.status) ? (
            <Panel title="Production" description="Mark each stage as it starts and finishes, and add photos. The buyer sees them on their order page.">
              <ProductionManager
                orderId={order.id}
                stages={order.stages}
                photos={order.photos}
                canEdit={can(staff.role, "production") && PRODUCTION_OPEN.includes(order.status)}
                today={today}
              />
            </Panel>
          ) : null}

          {order.shipment ? (
            <Panel title="Shipment">
              <ShipmentCard shipment={order.shipment} />
            </Panel>
          ) : null}

          <Panel title="Items">
            <OrderLines order={order} />
          </Panel>

          <Panel title="Documents" description="The proforma invoice, balance invoice and receipts are made by the website. Upload your own export paperwork here.">
            <DocumentList
              documents={order.documents}
              href={documentHref}
              action={(document) => (document.kind === "file" && canManage ? <DeleteDocument id={document.id} title={document.title} /> : null)}
            />
            {canManage && order.status !== "cancelled" ? (
              <div className="mt-4">
                <DocumentUpload orderId={order.id} />
              </div>
            ) : null}
          </Panel>

          {order.notes ? (
            <Panel title="Buyer's notes">
              <p className="text-sm whitespace-pre-line">{order.notes}</p>
            </Panel>
          ) : null}

          {sample ? null : (
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
          )}
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6">
          <Panel title="Buyer">
            <p className="font-medium">{customer.company_name}</p>
            <p className="text-sm text-muted-foreground">
              {customer.contact_name}
              {business ? ` · ${business}` : ""} · {countryName(customer.country_code)}
            </p>
            <div className="mt-3 grid gap-1 text-sm">
              <a href={`mailto:${customer.email}?subject=${encodeURIComponent(`Your order ${order.order_no}`)}`} className="inline-flex items-center gap-1.5 break-all text-denim-600 hover:underline">
                <MailIcon className="size-4 shrink-0" /> {customer.email}
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
            {editableCharges && (order.shipping_mode !== "forwarder" || order.addons.some((addon) => addon.pricing !== "per_piece")) ? (
              <div className="mt-5 border-t pt-4">
                <ChargesForm order={order} />
              </div>
            ) : null}
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
            <OrderTimeline events={order.events} kind={order.kind} />
            <div className="mt-5 border-t pt-4">
              <NoteForm orderId={order.id} />
            </div>
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
