import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { AccountNotice, VerifyEmailBanner } from "@/components/account/account-notices";
import { OrderList } from "@/components/account/order-list";
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/forms/styles";
import { countryName, formatMoney } from "@/lib/format";
import { customerApi, getCart, requireCustomer } from "@/lib/account/session";
import { BUSINESS_TYPES, type OrderSummary } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Your account", "/account");

export default async function AccountPage() {
  const customer = await requireCustomer();
  const [orders, cart] = await Promise.all([customerApi<OrderSummary[]>("/v1/account/orders"), getCart()]);
  const toPay = orders.filter((order) => order.status === "awaiting_deposit" || order.status === "ready_to_ship");
  const business = BUSINESS_TYPES.find((type) => type.value === customer.business_type)?.label;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div>
        <AccountNotice />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hello, {customer.contact_name.split(" ")[0]}</h1>
        <p className="mt-2 text-muted-foreground">
          {customer.company_name}
          {business ? ` · ${business}` : ""} · {countryName(customer.country_code)}
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
                  {order.status === "ready_to_ship" ? "Balance" : "Deposit"} for <span className="font-mono">{order.order_no}</span>:{" "}
                  <span className="tabular-nums">{formatMoney(order.due_now_cents)}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Transfer the amount, then tell us the transaction ID so we can confirm it.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/account/orders/${order.order_no}`}>Bank details</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/account/orders/${order.order_no}/confirm-payment`}>Confirm payment</Link>
                </Button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {cart.line_count > 0 ? (
        <div className={`${panelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-denim-50 text-denim-600">
              <ShoppingBag aria-hidden className="size-5" />
            </span>
            <div>
              <p className="font-medium">Your cart</p>
              <p className="text-sm text-muted-foreground">
                {cart.line_count} {cart.line_count === 1 ? "color" : "colors"} · {cart.total_pcs} pcs · {formatMoney(cart.goods_cents)}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={cart.can_checkout ? "/checkout" : "/cart"}>
              {cart.can_checkout ? "Check out" : "Review your cart"} <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : null}

      <section aria-labelledby="recent-orders" className="grid gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-orders" className="text-lg font-semibold">
            Recent orders
          </h2>
          {orders.length > 5 ? (
            <Link href="/account/orders" className="text-sm font-medium text-denim-600 hover:underline">
              All orders
            </Link>
          ) : null}
        </div>
        {orders.length > 0 ? (
          <OrderList orders={orders.slice(0, 5)} />
        ) : (
          <div className={`${panelClass} text-center`}>
            <p className="font-medium">No orders yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Choose styles and colors in the wholesale shop, add the sizes you need, and check out. Your proforma invoice arrives at once.
            </p>
            <Button asChild className="mt-5">
              <Link href="/wholesale-shop">
                Go to the shop <ArrowRight />
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
