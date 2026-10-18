import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BankDetailsCard } from "@/components/account/order-parts";
import { PaymentForm } from "@/components/account/payment-form";
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/forms/styles";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { customerApi } from "@/lib/account/session";
import type { Order } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/account/orders/[orderNo]/confirm-payment">) {
  const { orderNo } = await params;
  return privatePageMetadata(`Confirm payment for ${orderNo}`, `/account/orders/${orderNo}/confirm-payment`);
}

export default async function ConfirmPaymentPage({ params }: PageProps<"/account/orders/[orderNo]/confirm-payment">) {
  const { orderNo } = await params;
  if (!/^PK-[0-9-]+$/.test(orderNo)) notFound();
  let order: Order;
  try {
    order = await customerApi<Order>(`/v1/account/orders/${orderNo}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  // The page reads the session first, so it is rendered per request and "today" is the current date.
  const today = new Date().toISOString().slice(0, 10);
  const kind = order.next_payment_kind === "balance" ? "balance" : order.kind === "sample" ? "payment" : "deposit";

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <Link href={`/account/orders/${order.order_no}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Order {order.order_no}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Confirm payment</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sent the {kind} for <span className="font-mono">{order.order_no}</span>? Tell us about the transfer and we will match it with our bank statement. You get a receipt by email once
          it is confirmed.
        </p>
      </div>

      {order.can_submit_payment ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className={`${panelClass} min-w-0 lg:col-span-7`}>
            <PaymentForm orderNo={order.order_no} dueCents={order.amounts.due_now_cents} payerName={order.customer.company_name} today={today} />
          </div>
          <aside className="grid min-w-0 grid-cols-1 gap-4 lg:col-span-5">
            <div className="rounded-3xl border border-orange-200 bg-orange-50/50 p-6">
              <p className="text-sm text-muted-foreground">{kind === "balance" ? "Balance" : kind === "payment" ? "Payment" : "Deposit"} due</p>
              <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{formatMoney(order.amounts.due_now_cents)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Payment reference: <span className="font-mono text-foreground">{order.order_no}</span>
              </p>
            </div>
            {order.bank ? (
              <div className={panelClass}>
                <h2 className="text-lg font-semibold">Our bank account</h2>
                <div className="mt-4">
                  <BankDetailsCard bank={order.bank} reference={order.order_no} />
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <div className={`${panelClass} max-w-2xl`}>
          <p className="font-medium">No payment is due for this order right now.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.status === "cancelled" ? "The order was cancelled." : "We will let you know by email when the balance is due before shipment."}
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href={`/account/orders/${order.order_no}`}>Back to the order</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
