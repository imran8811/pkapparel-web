import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MapPin, Truck } from "lucide-react";
import { CancelOrderButton } from "@/components/account/order-actions";
import { OrderTimeline, PaymentList, StatusBadge, shortDate } from "@/components/account/order-parts";
import { panelClass } from "@/components/forms/styles";
import { StockOrderNotice } from "@/components/stock/stock-order-notice";
import { StockPaymentCard } from "@/components/stock/stock-payment-card";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { ORDER_NO } from "@/lib/account/download";
import { stockCustomerApi } from "@/lib/account/session";
import type { Order, StockPaymentDetails } from "@/lib/account/types";
import { mediaSrc } from "@/lib/media";
import { privatePageMetadata } from "@/lib/seo";
import { formatRupees, stockOrderUrl } from "@/lib/stock";

export async function generateMetadata({ params }: PageProps<"/stock/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  return privatePageMetadata(`Order ${orderNo}`, stockOrderUrl(orderNo));
}

export default async function StockOrderPage({ params }: PageProps<"/stock/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  if (!ORDER_NO.test(orderNo)) notFound();
  let order: Order;
  try {
    order = await stockCustomerApi<Order>(`/v1/account/orders/${orderNo}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (order.kind !== "stock") notFound();

  const { amounts } = order;
  const cargo = order.shipping_mode === "cargo";
  const receipts = order.documents.filter((document) => document.kind === "receipt");

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <Link href="/stock/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Your orders
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">{order.order_no}</h1>
          <StatusBadge status={order.status} label={order.status_label} />
        </div>
        <p className="mt-2 text-muted-foreground">Placed on {shortDate(order.placed_at)}</p>
      </div>

      <StockOrderNotice paymentDays={null} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-7">
          <section className={panelClass} aria-labelledby="jeans">
            <h2 id="jeans" className="text-lg font-semibold">
              Jeans
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {order.lines.map((line) => (
                <li key={`${line.color_code}-${line.style_slug}`} className="flex gap-4 py-4 first:pt-0">
                  <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
                    {line.image_path ? <Image src={mediaSrc(line.image_path)} alt="" fill sizes="56px" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{line.style_name}</p>
                    <p className="text-muted-foreground">
                      {line.color_name} <span className="font-mono text-xs">{line.color_code}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.sets ?? 0} {line.sets === 1 ? "set" : "sets"} × {formatRupees(line.unit_price_cents)} · {line.qty} pcs
                      {line.sets && line.qty > 0 ? ` · ${formatRupees(Math.round((line.unit_price_cents * line.sets) / line.qty))} a piece` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">{formatRupees(line.line_cents)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 grid gap-1.5 border-t border-dashed pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-heading text-xl font-semibold tabular-nums">{formatRupees(amounts.total_cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="tabular-nums">{formatRupees(amounts.paid_cents)}</dd>
              </div>
            </dl>
          </section>

          <section className={panelClass} aria-labelledby="delivery">
            <h2 id="delivery" className="flex items-center gap-2 text-lg font-semibold">
              {cargo ? <Truck aria-hidden className="size-5 text-denim-600" /> : <MapPin aria-hidden className="size-5 text-denim-600" />}
              {cargo ? "Cargo to your city" : "Collect from us"}
            </h2>
            {cargo ? (
              <div className="mt-3 grid gap-1 text-sm">
                <p>
                  {order.address.company}, {order.address.contact_name} · {order.address.phone}
                </p>
                <p className="text-muted-foreground">
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}
                </p>
                {order.forwarder?.name ? <p className="text-muted-foreground">Cargo company you asked for: {order.forwarder.name}</p> : null}
                <p className="mt-2 text-muted-foreground">You pay the cargo charges to the cargo company when the goods arrive.</p>
              </div>
            ) : (
              <div className="mt-3 grid gap-1 text-sm">
                <p>{order.pickup?.address ?? "We send you the address when your order is ready."}</p>
                {order.pickup?.hours ? <p className="text-muted-foreground">{order.pickup.hours}</p> : null}
              </div>
            )}
            {order.shipment ? (
              <dl className="mt-4 grid gap-1.5 rounded-2xl bg-cotton-50 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Sent on</dt>
                  <dd>{shortDate(order.shipment.shipped_on)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Cargo company</dt>
                  <dd>{order.shipment.carrier}</dd>
                </div>
                {order.shipment.tracking_no ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Bilty / tracking number</dt>
                    <dd className="font-mono">{order.shipment.tracking_no}</dd>
                  </div>
                ) : null}
              </dl>
            ) : order.production_due_on && order.status === "confirmed" ? (
              <p className="mt-4 rounded-2xl bg-denim-50 px-4 py-3 text-sm text-denim-800">
                {cargo ? `We send your order by ${shortDate(order.production_due_on)}.` : `Ready to collect on ${shortDate(order.production_due_on)}.`}
              </p>
            ) : null}
          </section>

          <section className={panelClass} aria-labelledby="history">
            <h2 id="history" className="text-lg font-semibold">
              History
            </h2>
            <div className="mt-5">
              <OrderTimeline events={order.events} kind="stock" />
            </div>
          </section>
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-5">
          {order.can_submit_payment ? (
            <section className="rounded-3xl border border-orange-200 bg-orange-50/50 p-6" aria-labelledby="pay">
              <h2 id="pay" className="text-sm text-muted-foreground">
                To pay now
              </h2>
              <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{formatRupees(amounts.due_now_cents)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Your sets are held for you once the payment is confirmed.</p>
              <div className="mt-5">
                <StockPaymentCard payment={order.bank as StockPaymentDetails | null} reference={order.order_no} />
              </div>
              <Button asChild size="lg" className="mt-5 w-full">
                <Link href={stockOrderUrl(order.order_no, "confirm-payment")}>I have paid: confirm payment</Link>
              </Button>
            </section>
          ) : null}

          {order.payments.length > 0 || receipts.length > 0 ? (
            <section className={panelClass} aria-labelledby="payments">
              <h2 id="payments" className="text-lg font-semibold">
                Payments
              </h2>
              <div className="mt-4">
                <PaymentList payments={order.payments} />
              </div>
              {receipts.length > 0 ? (
                <ul className="mt-4 grid gap-2">
                  {receipts.map((receipt) =>
                    receipt.kind === "receipt" ? (
                      <li key={receipt.number}>
                        <a
                          href={`${stockOrderUrl(order.order_no)}/receipts/${receipt.number}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-denim-600 hover:underline"
                        >
                          <Download aria-hidden className="size-4" /> Receipt {receipt.number} (PDF)
                        </a>
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : null}
            </section>
          ) : null}

          {order.can_cancel ? (
            <div className="flex justify-end">
              <CancelOrderButton orderNo={order.order_no} />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
