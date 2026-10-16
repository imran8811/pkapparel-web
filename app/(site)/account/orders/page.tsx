import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrderList } from "@/components/account/order-list";
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/forms/styles";
import { customerApiWithMeta } from "@/lib/account/session";
import type { OrderSummary } from "@/lib/account/types";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Your orders", "/account/orders");

type Pagination = { pagination: { page: number; pages: number; total: number } };

export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { data: orders, meta } = await customerApiWithMeta<OrderSummary[], Pagination>("/v1/account/orders", { query: { page } });
  const { pages, total } = meta.pagination;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your orders</h1>
          <p className="mt-2 text-muted-foreground">
            {total === 0 ? "You have not placed an order yet." : `${total} ${total === 1 ? "order" : "orders"}, newest first.`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/wholesale-shop">Shop wholesale</Link>
        </Button>
      </div>

      {orders.length > 0 ? (
        <OrderList orders={orders} />
      ) : (
        <div className={`${panelClass} text-center`}>
          <p className="mx-auto max-w-md text-muted-foreground">
            Choose styles and colors in the shop, enter the sizes you need and check out. Your proforma invoice arrives at once.
          </p>
          <Button asChild className="mt-5">
            <Link href="/wholesale-shop">
              Go to the shop <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-4 text-sm">
          {page > 1 ? (
            <Link href={`/account/orders?page=${page - 1}`} className="font-medium text-denim-600 hover:underline">
              Newer orders
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/account/orders?page=${page + 1}`} className="font-medium text-denim-600 hover:underline">
              Older orders
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
