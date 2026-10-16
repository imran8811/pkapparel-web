import Image from "next/image";
import Link from "next/link";
import { CopyButton } from "@/components/account/copy-button";
import { formatMoney } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { productUrl } from "@/lib/shop";
import {
  STATUS_TONE,
  transitText,
  type BankDetails,
  type Order,
  type OrderAmounts,
  type OrderEvent,
  type OrderStatus,
  type Payment,
} from "@/lib/account/types";
import { cn } from "@/lib/utils";

/* Pieces of the order pages, shared by the buyer account (and reused in the admin). */

export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", STATUS_TONE[status], className)}>
      {label}
    </span>
  );
}

/** "16 Oct 2026" in the buyer's reading, from an ISO time (dates are shown in UTC). */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function sizesText(sizeQty: Record<string, number>): string {
  return Object.entries(sizeQty)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => `${size}×${qty}`)
    .join("  ");
}

export function OrderLines({ order, linkStyles = true }: { order: Pick<Order, "lines" | "addons">; linkStyles?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {order.lines.map((line, index) => (
        <li key={index} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cotton-100">
            {line.image_path ? <Image src={mediaSrc(line.image_path)} alt="" fill sizes="64px" className="object-cover" /> : null}
          </div>
          <div className="min-w-0">
            <p className="font-medium">
              {linkStyles ? (
                <Link href={productUrl({ segment: line.segment, product_type: line.product_type, slug: line.style_slug })} className="hover:text-denim-600">
                  {line.style_name}
                </Link>
              ) : (
                line.style_name
              )}
              {line.style_no ? <span className="ml-2 font-mono text-xs text-muted-foreground">{line.style_no}</span> : null}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: line.color_hex ?? "#c8d8f4" }} />
              {line.color_name} <span className="font-mono text-xs">({line.color_code})</span>
            </p>
            <p className="mt-1.5 font-mono text-xs break-words text-muted-foreground">{sizesText(line.size_qty)}</p>
          </div>
          <div className="col-start-2 text-sm sm:col-start-3 sm:text-right">
            <p className="tabular-nums">
              {line.qty} pcs × {formatMoney(line.unit_price_cents)}
            </p>
            <p className="font-semibold tabular-nums">{formatMoney(line.line_cents)}</p>
          </div>
        </li>
      ))}
      {order.addons.map((addon) => (
        <li key={addon.name} className="flex items-baseline justify-between gap-4 py-3 text-sm">
          <span>
            {addon.name}
            {addon.pricing === "per_piece" && addon.unit_price_cents !== null ? (
              <span className="text-muted-foreground">
                {" "}
                · {addon.qty} pcs × {formatMoney(addon.unit_price_cents)}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 tabular-nums">{addon.line_cents === null ? <span className="text-muted-foreground">Price on request</span> : formatMoney(addon.line_cents)}</span>
        </li>
      ))}
    </ul>
  );
}

export function freightText(amounts: Pick<OrderAmounts, "freight_status" | "freight_cents">): string {
  switch (amounts.freight_status) {
    case "none":
      return "Booked by you";
    case "quoted":
      return "We will quote it";
    case "estimate":
      return `${formatMoney(amounts.freight_cents ?? 0)} (estimate)`;
    default:
      return formatMoney(amounts.freight_cents ?? 0);
  }
}

export function OrderTotals({ order }: { order: Pick<Order, "amounts" | "total_pcs" | "addons"> }) {
  const { amounts } = order;
  const rows: [string, string, string?][] = [[`Goods (${order.total_pcs} pcs)`, formatMoney(amounts.goods_cents)]];
  if (order.addons.length > 0) {
    rows.push(
      amounts.addons_cents === 0
        ? ["Add-ons", "On request", "Quoted and added to the balance"]
        : ["Add-ons", formatMoney(amounts.addons_cents), amounts.has_quoted_addons ? "Items on request are added later" : undefined],
    );
  }
  rows.push(["Freight", freightText(amounts)]);

  return (
    <dl className="grid gap-2 text-sm">
      {rows.map(([label, value, note]) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">
            {label}
            {note ? <span className="block text-xs">{note}</span> : null}
          </dt>
          <dd className="text-right tabular-nums">{value}</dd>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-heading text-xl font-semibold tabular-nums">{formatMoney(amounts.total_cents)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
        <dt>{amounts.deposit_percent}% deposit</dt>
        <dd className="tabular-nums">{formatMoney(amounts.deposit_cents)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
        <dt>Balance before shipment</dt>
        <dd className="tabular-nums">{formatMoney(amounts.balance_cents)}</dd>
      </div>
      {amounts.paid_cents > 0 ? (
        <div className="flex items-baseline justify-between gap-4 text-emerald-700">
          <dt>Paid so far</dt>
          <dd className="tabular-nums">{formatMoney(amounts.paid_cents)}</dd>
        </div>
      ) : null}
    </dl>
  );
}

/** The account to transfer to, with copy buttons for the long numbers. */
export function BankDetailsCard({ bank, reference }: { bank: BankDetails; reference: string }) {
  const rows: [string, string | null, boolean][] = [
    ["Beneficiary", bank.beneficiary, false],
    ["Bank", bank.bank_name, false],
    ["Branch", bank.branch, false],
    ["Account number", bank.account_number, true],
    ["IBAN", bank.iban, true],
    ["SWIFT / BIC", bank.swift, true],
    ["Bank address", bank.bank_address, false],
    ["Payment reference", reference, true],
  ];
  return (
    <div>
      <dl className="grid gap-y-1 text-sm">
        {rows
          .filter((row): row is [string, string, boolean] => Boolean(row[1]))
          .map(([label, value, copy]) => (
            <div key={label} className="grid grid-cols-1 items-center gap-x-4 py-1 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="flex min-w-0 items-center gap-1">
                <span className={cn("min-w-0 break-words", copy && "font-mono")}>{value}</span>
                {copy ? <CopyButton value={value.replace(/\s+/g, label === "Payment reference" ? " " : "")} label={label} /> : null}
              </dd>
            </div>
          ))}
      </dl>
      {bank.notes ? <p className="mt-3 text-sm text-muted-foreground">{bank.notes}</p> : null}
    </div>
  );
}

export function PaymentList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) return null;
  const tone = { submitted: "text-amber-800 bg-amber-50", confirmed: "text-emerald-800 bg-emerald-50", rejected: "text-destructive bg-destructive/10" };
  return (
    <ul className="grid gap-3">
      {payments.map((payment, index) => (
        <li key={index} className="rounded-2xl border border-border p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {payment.kind_label}: {formatMoney(payment.amount_cents)}
            </p>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tone[payment.status])}>{payment.status_label}</span>
          </div>
          <p className="mt-1 text-muted-foreground">
            Transaction <span className="font-mono text-foreground">{payment.transaction_id}</span> · sent {shortDate(payment.transferred_on)} from {payment.payer_bank}
          </p>
          {payment.rejection_reason ? <p className="mt-2 text-destructive">Reason: {payment.rejection_reason}</p> : null}
          {payment.receipt_no ? <p className="mt-2 text-emerald-700">Receipt {payment.receipt_no}</p> : null}
        </li>
      ))}
    </ul>
  );
}

const EVENT_TEXT: Record<string, (event: OrderEvent) => string> = {
  placed: () => "Order placed",
  payment_submitted: (event) => event.note ?? "Payment reported",
  status: (event) => {
    if (event.to_status === "payment_review") return "Payment reported, under review";
    if (event.to_status === "cancelled") return "Order cancelled";
    return `Status: ${event.to_status?.replaceAll("_", " ") ?? "updated"}`;
  },
};

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="relative grid gap-4 border-l border-dashed border-border pl-5">
      {events.map((event, index) => (
        <li key={index} className="relative text-sm">
          <span aria-hidden className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-denim-600 ring-4 ring-cotton-50" />
          <p className="font-medium">{(EVENT_TEXT[event.type] ?? (() => event.note ?? event.type))(event)}</p>
          {event.type === "status" && event.to_status === "cancelled" && event.note ? <p className="text-muted-foreground">“{event.note}”</p> : null}
          <p className="text-xs text-muted-foreground">{shortDate(event.created_at)}</p>
        </li>
      ))}
    </ol>
  );
}

/** "Air freight · 6–9 days in transit" for the order page. */
export function shippingSummary(order: Pick<Order, "shipping_mode_label" | "packing">): string {
  const transit = order.packing.freight ? transitText(order.packing.freight) : null;
  return transit ? `${order.shipping_mode_label} · ${transit} in transit` : order.shipping_mode_label;
}
