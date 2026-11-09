import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { AccountNotice, VerifyEmailBanner } from "@/components/account/account-notices";
import { StatusBadge, shortDate } from "@/components/account/order-parts";
import { panelClass } from "@/components/forms/styles";
import { Button } from "@/components/ui/button";
import { getStockCart, requireStockCustomer, stockCustomerApi } from "@/lib/account/session";
import type { OrderSummary } from "@/lib/account/types";
import { formatMoney } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { privatePageMetadata } from "@/lib/seo";
import { formatRupees, stockOrderUrl } from "@/lib/stock";

export const metadata = privatePageMetadata("Your account", "/stock/account");

export default async function StockAccountPage() {
  const customer = await requireStockCustomer();
  const [orders, cart] = await Promise.all([stockCustomerApi<OrderSummary[]>("/v1/account/orders"), getStockCart()]);
  const stockOrders = orders.filter((order) => order.kind === "stock");
  const toPay = stockOrders.filter((order) => order.status === "awaiting_deposit" && order.due_now_cents > 0);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <AccountNotice />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hello, {customer.contact_name.split(" ")[0]}</h1>
        <p className="mt-2 text-muted-foreground">
          {customer.company_name}
          {customer.city ? ` · ${customer.city}` : ""} · {customer.phone}
        </p>
      </div>

      {!customer.email_verified ? <VerifyEmailBanner email={customer.email} /> : null}

      {toPay.length > 0 ? (
        <section aria-labelledby="to-pay" className="grid gap-3">
          <h2 id="to-pay" className="text-lg font-semibold">
            Waiting for your payment
          </h2>
          {toPay.map((order) => (
            <div key={order.order_no} className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  Payment for <span className="font-mono">{order.order_no}</span>: <span className="tabular-nums">{formatRupees(order.due_now_cents)}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Pay, then tell us the transaction ID. Your sets are held once the payment is confirmed.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={stockOrderUrl(order.order_no)}>Payment details</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={stockOrderUrl(order.order_no, "confirm-payment")}>Confirm payment</Link>
                </Button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {cart.line_count > 0 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 text-sm">
            <ShoppingBag aria-hidden className="size-5 text-denim-600" />
            Your cart has {cart.total_sets} {cart.total_sets === 1 ? "set" : "sets"} ({formatRupees(cart.total_cents)}).
          </p>
          <Button asChild size="sm">
            <Link href="/stock/cart">
              Go to the cart <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : null}

      <section aria-labelledby="orders" className={panelClass}>
        <h2 id="orders" className="text-lg font-semibold">
          Your orders
        </h2>
        {stockOrders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link href="/stock" className="font-medium text-denim-600 hover:underline">
              See what is in stock
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {stockOrders.map((order) => (
              <li key={order.order_no}>
                <Link href={stockOrderUrl(order.order_no)} className="flex items-center gap-4 py-4 hover:bg-cotton-50/60">
                  <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
                    {order.image_path ? <Image src={mediaSrc(order.image_path)} alt="" fill sizes="48px" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium">{order.order_no}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {order.styles.join(", ")} · {shortDate(order.placed_at)}
                    </p>
                  </div>
                  <span className="hidden text-sm tabular-nums sm:block">{formatMoney(order.total_cents, order.currency)}</span>
                  <StatusBadge status={order.status} label={order.status_label} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
