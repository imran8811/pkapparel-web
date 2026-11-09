"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeStockCartLine, updateStockCartLine, type StockCartResult } from "@/lib/account/actions/stock";
import { notifyUiChange } from "@/lib/account/use-ui-state";
import { mediaSrc } from "@/lib/media";
import { formatRupees, setContents, stockUrl, type StockCart } from "@/lib/stock";
import { cn } from "@/lib/utils";

/** The stock cart: sets per color (never more than in stock), what blocks the checkout, and the total. */
export function StockCartView({ initialCart, signedIn }: { initialCart: StockCart; signedIn: boolean }) {
  const [cart, setCart] = useState(initialCart);
  const [error, setError] = useState<string | null>(null);
  const [busyColor, setBusyColor] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = (colorId: number, change: () => Promise<StockCartResult>) => {
    setBusyColor(colorId);
    startTransition(async () => {
      const result = await change();
      setBusyColor(null);
      if (result.ok) {
        setCart(result.cart);
        setError(null);
        notifyUiChange();
      } else if (result.sessionEnded) {
        window.location.replace("/stock/account/session-ended");
      } else {
        setError(result.message);
      }
    });
  };

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed bg-white/60 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Choose a style, pick a color and add the sets you need.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={stockUrl("men")}>Men&apos;s jeans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={stockUrl("boys")}>Boys&apos; jeans</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      <ul className="grid min-w-0 gap-4 lg:col-span-8">
        {cart.lines.map((line) => {
          const busy = pending && busyColor === line.color_id;
          return (
            <li key={line.color_id} className={cn("flex gap-4 rounded-3xl border bg-white p-4 sm:p-5", !line.available || line.short ? "border-orange-200" : "border-border")}>
              <Link href={`${stockUrl(line.style.segment, line.style.slug)}?color=${line.slug}`} className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-cotton-100 sm:w-24">
                {line.image ? <Image src={mediaSrc(line.image.path)} alt={line.image.alt} fill sizes="96px" className="object-cover" /> : null}
              </Link>
              <div className="grid min-w-0 flex-1 gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={stockUrl(line.style.segment, line.style.slug)} className="font-heading text-lg leading-snug font-semibold hover:text-denim-600">
                      {line.style.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: line.hex ?? "#c8d8f4" }} />
                      {line.name} <span className="font-mono text-xs">{line.code}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Set of {line.set.pieces}: {setContents(line.set.sizes)} · {formatRupees(line.set_price_cents)} per set
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => apply(line.color_id, () => removeStockCartLine(line.color_id))}
                    disabled={busy}
                    aria-label={`Remove ${line.style.name}, ${line.name}`}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="One set less"
                      disabled={busy || line.sets <= 1}
                      onClick={() => apply(line.color_id, () => updateStockCartLine(line.color_id, line.sets - 1))}
                    >
                      <Minus />
                    </Button>
                    <span className="w-16 text-center text-sm tabular-nums">
                      {busy ? <LoaderCircle className="mx-auto size-4 animate-spin" /> : `${line.sets} ${line.sets === 1 ? "set" : "sets"}`}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="One set more"
                      disabled={busy || !line.available || line.sets >= line.sets_in_stock}
                      onClick={() => apply(line.color_id, () => updateStockCartLine(line.color_id, line.sets + 1))}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <p className="text-right">
                    <span className="block font-heading text-lg font-semibold tabular-nums">{formatRupees(line.line_cents)}</span>
                    <span className="text-xs text-muted-foreground">{line.pieces} pcs</span>
                  </p>
                </div>
                {!line.available ? (
                  <p className="rounded-xl bg-orange-50 px-3 py-2 text-xs text-stitch-700">This color is sold out. Please remove it.</p>
                ) : line.short ? (
                  <p className="rounded-xl bg-orange-50 px-3 py-2 text-xs text-stitch-700">
                    Only {line.sets_in_stock} {line.sets_in_stock === 1 ? "set is" : "sets are"} in stock.{" "}
                    <button type="button" className="font-medium underline" onClick={() => apply(line.color_id, () => updateStockCartLine(line.color_id, line.sets_in_stock))}>
                      Change to {line.sets_in_stock}
                    </button>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="rounded-3xl border border-border bg-white p-6 lg:sticky lg:top-28 lg:col-span-4">
        <h2 className="font-heading text-lg font-semibold">Your order</h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Sets</dt>
            <dd className="tabular-nums">{cart.total_sets}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pieces</dt>
            <dd className="tabular-nums">{cart.total_pieces}</dd>
          </div>
          <div className="flex items-end justify-between border-t border-dashed pt-3">
            <dt className="font-medium">Total</dt>
            <dd className="font-heading text-2xl font-semibold tabular-nums">{formatRupees(cart.total_cents)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">Cargo charges are paid to the cargo company when your order arrives.</p>

        {cart.issues.length > 0 || error ? (
          <ul role="alert" className="mt-4 grid gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-xs text-stitch-700">
            {error ? <li>{error}</li> : null}
            {cart.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}

        <Button asChild size="lg" className={cn("mt-5 w-full", !cart.can_checkout && "pointer-events-none opacity-50")} aria-disabled={!cart.can_checkout}>
          <Link href={signedIn ? "/stock/checkout" : `/stock/login?next=${encodeURIComponent("/stock/checkout")}`} tabIndex={cart.can_checkout ? undefined : -1}>
            {signedIn ? "Check out" : "Log in to check out"} <ArrowRight />
          </Link>
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Sets are held for you once your payment is confirmed.</p>
      </aside>
    </div>
  );
}
