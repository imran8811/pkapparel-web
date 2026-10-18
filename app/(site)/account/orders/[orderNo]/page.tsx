import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Landmark } from "lucide-react";
import { CancelOrderButton, OrderNotice } from "@/components/account/order-actions";
import {
  BankDetailsCard,
  OrderLines,
  OrderTimeline,
  OrderTotals,
  PaymentList,
  shippingSummary,
  shortDate,
  StatusBadge,
} from "@/components/account/order-parts";
import { DocumentList, dueText, ProductionTimeline, readyText, ShipmentCard } from "@/components/account/order-progress";
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/forms/styles";
import { ApiError } from "@/lib/api";
import { countryName, formatMoney } from "@/lib/format";
import { customerApi } from "@/lib/account/session";
import type { Order, OrderDocumentItem } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";

/** Statuses in which the buyer sees the production timeline. */
const IN_PRODUCTION = ["confirmed", "in_production", "on_hold", "ready_to_ship", "shipped", "delivered"];

function documentHref(orderNo: string, document: OrderDocumentItem): string {
  const base = `/account/orders/${orderNo}`;
  switch (document.kind) {
    case "proforma":
      return `${base}/proforma-invoice`;
    case "invoice":
      return `${base}/invoice`;
    case "receipt":
      return `${base}/receipts/${document.number}`;
    default:
      return `${base}/documents/${document.id}`;
  }
}

export async function generateMetadata({ params }: PageProps<"/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  return privatePageMetadata(`Order ${orderNo}`, `/account/orders/${orderNo}`);
}

export default async function OrderPage({ params }: PageProps<"/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  const order = await loadOrder(orderNo);
  const { amounts } = order;
  const sample = order.kind === "sample";
  const paymentLabel = order.next_payment_kind === "balance" ? "Balance" : sample ? "Payment" : "Deposit";
  const address = order.address;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All orders
        </Link>
        <OrderNotice orderNo={order.order_no} leadTime={order.lead_time_days} kind={order.kind} pricing={order.status === "awaiting_price"} />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {sample ? <p className="font-mono text-xs font-medium tracking-[0.2em] text-stitch-700 uppercase">Sample order</p> : null}
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="font-mono">{order.order_no}</span>
              <StatusBadge status={order.status} label={order.status_label} className="text-sm" />
            </h1>
            <p className="mt-2 text-muted-foreground">
              Placed {shortDate(order.placed_at)} · {order.total_pcs} pcs
              {order.buyer_reference ? ` · Your reference ${order.buyer_reference}` : ""}
            </p>
          </div>
          {order.status !== "cancelled" && order.status !== "awaiting_price" ? (
            <Button asChild variant="outline">
              <a href={`/account/orders/${order.order_no}/proforma-invoice`} download>
                <Download /> {sample ? "Sample invoice (PDF)" : "Proforma invoice (PDF)"}
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-8 lg:col-span-7">
          {order.status === "awaiting_price" ? (
            <section aria-labelledby="pricing" className="rounded-3xl border border-border bg-cotton-100/60 p-6 sm:p-8">
              <h2 id="pricing" className="text-xl font-semibold">
                We are pricing your samples
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {amounts.freight_status === "quoted" ? "We confirm the courier cost to your country" : "We price your custom-design sample"}
                {amounts.freight_status === "quoted" && amounts.has_quoted_addons ? " and your custom-design sample" : ""}, usually within 1 to 2
                working days. You then get the sample invoice by email, with the bank details, and can pay here.
              </p>
            </section>
          ) : null}

          {order.can_submit_payment ? (
            <section aria-labelledby="pay" className="rounded-3xl border border-orange-200 bg-orange-50/50 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <Landmark aria-hidden className="mt-1 size-5 shrink-0 text-stitch-600" />
                <div className="min-w-0 flex-1">
                  <h2 id="pay" className="text-xl font-semibold">
                    {paymentLabel} due: <span className="tabular-nums">{formatMoney(amounts.due_now_cents)}</span>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.status === "payment_review"
                      ? "You reported a transfer and we are checking it. If you sent the money in more than one transfer, report each one."
                      : `Pay by bank transfer and write ${order.order_no} as the payment reference. Bank charges on your side are paid by you.`}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-white p-5">
                {order.bank ? (
                  <BankDetailsCard bank={order.bank} reference={order.order_no} />
                ) : (
                  <p className="text-sm">Our team will email you the bank details for the transfer shortly. They are also on your proforma invoice once ready.</p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={`/account/orders/${order.order_no}/confirm-payment`}>I have paid: confirm payment</Link>
                </Button>
                <p className="text-sm text-muted-foreground">You need the transaction ID from your bank.</p>
              </div>
            </section>
          ) : null}

          {order.shipment ? (
            <section aria-labelledby="shipment" className={panelClass}>
              <h2 id="shipment" className="text-lg font-semibold">
                Shipment
              </h2>
              <div className="mt-4">
                <ShipmentCard shipment={order.shipment} />
              </div>
            </section>
          ) : null}

          {order.can_review || order.review_status ? (
            <section aria-labelledby="review" className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
              <h2 id="review" className="text-xl font-semibold">
                {order.can_review ? "How did this order go?" : "Thank you for your review"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {order.can_review
                  ? "Tell other buyers about the quality, the communication and the delivery. It takes a minute."
                  : order.review_status === "approved"
                    ? "Your review is on the product pages of the styles you ordered."
                    : "We read every review before it appears on the website."}
              </p>
              {order.can_review ? (
                <Button asChild className="mt-4">
                  <Link href={`/account/orders/${order.order_no}/review`}>Write a review</Link>
                </Button>
              ) : null}
            </section>
          ) : null}

          {!sample && IN_PRODUCTION.includes(order.status) ? (
            <section aria-labelledby="production" className={panelClass}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="production" className="text-lg font-semibold">
                  Production
                </h2>
                {dueText(order) ? <p className="text-sm text-muted-foreground">{dueText(order)}</p> : null}
              </div>
              <div className="mt-5">
                <ProductionTimeline
                  stages={order.stages}
                  photos={order.photos}
                  photoSrc={(id, full) => `/account/orders/${order.order_no}/photos/${id}${full ? "?size=full" : ""}`}
                />
              </div>
            </section>
          ) : null}

          <section aria-labelledby="items" className={panelClass}>
            <h2 id="items" className="text-lg font-semibold">
              What you ordered
            </h2>
            <div className="mt-2">
              <OrderLines order={order} />
            </div>
          </section>

          {order.documents.length > 0 ? (
            <section aria-labelledby="documents" className={panelClass}>
              <h2 id="documents" className="text-lg font-semibold">
                Documents
              </h2>
              <div className="mt-2">
                <DocumentList documents={order.documents} href={(document) => documentHref(order.order_no, document)} />
              </div>
            </section>
          ) : null}

          {order.payments.length > 0 ? (
            <section aria-labelledby="payments" className={panelClass}>
              <h2 id="payments" className="text-lg font-semibold">
                Payments
              </h2>
              <div className="mt-4">
                <PaymentList payments={order.payments} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-5">
          <section aria-labelledby="totals" className={panelClass}>
            <h2 id="totals" className="text-lg font-semibold">
              Totals
            </h2>
            <div className="mt-4">
              <OrderTotals order={order} />
            </div>
            {!sample && (amounts.freight_status === "estimate" || amounts.freight_status === "quoted") ? (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                The freight is confirmed before shipment and paid with the balance. Import duties and taxes are paid by you.
              </p>
            ) : null}
            {sample ? (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {order.credited_to
                  ? `The cost of these samples was deducted from your order ${order.credited_to}.`
                  : "The cost of these samples (without the courier) is deducted from your first bulk order once it is confirmed."}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="delivery" className={panelClass}>
            <h2 id="delivery" className="text-lg font-semibold">
              Delivery
            </h2>
            <p className="mt-3 text-sm font-medium">{shippingSummary(order)}</p>
            {order.forwarder?.name || order.forwarder?.contact ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Forwarder: {[order.forwarder.name, order.forwarder.contact].filter(Boolean).join(", ")}
              </p>
            ) : null}
            <address className="mt-4 text-sm leading-relaxed not-italic text-muted-foreground">
              <span className="font-medium text-foreground">{address.company}</span>
              <br />
              {address.contact_name}, {address.phone}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {[address.postal_code, address.city].filter(Boolean).join(" ")}
              {address.state ? `, ${address.state}` : ""}
              <br />
              {countryName(address.country_code)}
            </address>
            {readyText(order) ? <p className="mt-4 text-sm text-muted-foreground">{readyText(order)}</p> : null}
          </section>

          <section aria-labelledby="history" className={panelClass}>
            <h2 id="history" className="text-lg font-semibold">
              History
            </h2>
            <div className="mt-4">
              <OrderTimeline events={order.events} kind={order.kind} />
            </div>
            {order.can_cancel ? (
              <div className="mt-6 border-t border-dashed border-border pt-4">
                <CancelOrderButton orderNo={order.order_no} />
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

async function loadOrder(orderNo: string): Promise<Order> {
  if (!/^PK-[0-9-]+$/.test(orderNo)) notFound();
  try {
    return await customerApi<Order>(`/v1/account/orders/${orderNo}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
