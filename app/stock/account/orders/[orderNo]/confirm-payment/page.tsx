import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PaymentForm } from "@/components/account/payment-form";
import { panelClass } from "@/components/forms/styles";
import { StockPaymentCard } from "@/components/stock/stock-payment-card";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { ORDER_NO } from "@/lib/account/download";
import { stockCustomerApi } from "@/lib/account/session";
import type { Order, StockPaymentDetails } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";
import { formatRupees, stockOrderUrl } from "@/lib/stock";

export async function generateMetadata({ params }: PageProps<"/stock/account/orders/[orderNo]/confirm-payment">) {
  const { orderNo } = await params;
  return privatePageMetadata(`Confirm payment for ${orderNo}`, stockOrderUrl(orderNo, "confirm-payment"));
}

export default async function StockConfirmPaymentPage({ params }: PageProps<"/stock/account/orders/[orderNo]/confirm-payment">) {
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
  // The page reads the session first, so it is rendered per request and "today" is the current date.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <Link href={stockOrderUrl(order.order_no)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Order {order.order_no}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Confirm payment</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Paid for <span className="font-mono">{order.order_no}</span>? Tell us about the payment and we will match it with our accounts. You get a receipt by email once
          it is confirmed.
        </p>
      </div>

      {order.can_submit_payment ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className={`${panelClass} min-w-0 lg:col-span-7`}>
            <PaymentForm stock orderNo={order.order_no} dueCents={order.amounts.due_now_cents} payerName={order.customer.company_name} today={today} />
          </div>
          <aside className="grid min-w-0 grid-cols-1 gap-4 lg:col-span-5">
            <div className="rounded-3xl border border-orange-200 bg-orange-50/50 p-6">
              <p className="text-sm text-muted-foreground">Payment due</p>
              <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{formatRupees(order.amounts.due_now_cents)}</p>
            </div>
            <div className={panelClass}>
              <h2 className="text-lg font-semibold">Where to pay</h2>
              <div className="mt-4">
                <StockPaymentCard payment={order.bank as StockPaymentDetails | null} reference={order.order_no} />
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className={`${panelClass} max-w-2xl`}>
          <p className="font-medium">No payment is due for this order right now.</p>
          <p className="mt-2 text-sm text-muted-foreground">{order.status === "cancelled" ? "The order was cancelled." : "We have your payment details."}</p>
          <Button asChild variant="outline" className="mt-5">
            <Link href={stockOrderUrl(order.order_no)}>Back to the order</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
