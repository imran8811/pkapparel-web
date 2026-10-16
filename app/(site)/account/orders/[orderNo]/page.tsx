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
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/forms/styles";
import { ApiError } from "@/lib/api";
import { countryName, formatMoney } from "@/lib/format";
import { customerApi } from "@/lib/account/session";
import type { Order } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  return privatePageMetadata(`Order ${orderNo}`, `/account/orders/${orderNo}`);
}

export default async function OrderPage({ params }: PageProps<"/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  const order = await loadOrder(orderNo);
  const { amounts } = order;
  const paymentLabel = order.next_payment_kind === "balance" ? "Balance" : "Deposit";
  const address = order.address;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All orders
        </Link>
        <OrderNotice orderNo={order.order_no} leadTime={order.lead_time_days} />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="font-mono">{order.order_no}</span>
              <StatusBadge status={order.status} label={order.status_label} className="text-sm" />
            </h1>
            <p className="mt-2 text-muted-foreground">
              Placed {shortDate(order.placed_at)} · {order.total_pcs} pcs
              {order.buyer_reference ? ` · Your reference ${order.buyer_reference}` : ""}
            </p>
          </div>
          {order.status !== "cancelled" ? (
            <Button asChild variant="outline">
              <a href={`/account/orders/${order.order_no}/proforma-invoice`} download>
                <Download /> Proforma invoice (PDF)
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-8 lg:col-span-7">
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

          <section aria-labelledby="items" className={panelClass}>
            <h2 id="items" className="text-lg font-semibold">
              What you ordered
            </h2>
            <div className="mt-2">
              <OrderLines order={order} />
            </div>
          </section>

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
            {amounts.freight_status === "estimate" || amounts.freight_status === "quoted" ? (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                The freight is confirmed before shipment and paid with the balance. Import duties and taxes are paid by you.
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
            <p className="mt-4 text-sm text-muted-foreground">
              Ready about {order.lead_time_days} days after the deposit is confirmed{order.production_due_on ? ` (due ${shortDate(order.production_due_on)})` : ""}.
            </p>
          </section>

          <section aria-labelledby="history" className={panelClass}>
            <h2 id="history" className="text-lg font-semibold">
              History
            </h2>
            <div className="mt-4">
              <OrderTimeline events={order.events} />
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
