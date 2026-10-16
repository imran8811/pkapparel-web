import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { shortDate, StatusBadge } from "@/components/account/order-parts";
import { formatMoney } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import type { OrderSummary } from "@/lib/account/types";

/** The buyer's orders as cards that open the order page. */
export function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <ul className="grid gap-3">
      {orders.map((order) => (
        <li key={order.order_no}>
          <Link
            href={`/account/orders/${order.order_no}`}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-denim-300"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cotton-100">
              {order.image_path ? <Image src={mediaSrc(order.image_path)} alt="" fill sizes="56px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">{order.order_no}</span>
                <StatusBadge status={order.status} label={order.status_label} />
              </div>
              <p className="mt-1 truncate text-sm">{order.styles.join(", ")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {shortDate(order.placed_at)} · {order.total_pcs} pcs · {order.shipping_mode_label}
                {order.buyer_reference ? ` · ${order.buyer_reference}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="font-semibold tabular-nums">{formatMoney(order.total_cents)}</p>
                {order.due_now_cents > 0 && order.status !== "payment_review" ? (
                  <p className="text-xs text-stitch-700">{formatMoney(order.due_now_cents)} due</p>
                ) : null}
              </div>
              <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
