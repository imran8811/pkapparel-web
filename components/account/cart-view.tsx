"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, LoaderCircle, Minus, Plus, ShoppingBag, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { panelClass } from "@/components/forms/styles";
import { removeCartLine, updateCartLine, type CartResult } from "@/lib/account/actions/cart";
import { notifyUiChange } from "@/lib/account/use-ui-state";
import type { Cart, CartColor, CartStyle } from "@/lib/account/types";
import { formatMoney } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { productUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";

const MAX_PER_SIZE = 100_000;

type Quantities = Record<string, number>;

/** The cart: quantities per size for each color, the minimum per color, and the totals. */
export function CartView({ initialCart, signedIn }: { initialCart: Cart; signedIn: boolean }) {
  const [cart, setCart] = useState(initialCart);
  const [error, setError] = useState<string | null>(null);

  const apply = (result: CartResult) => {
    if (result.ok) {
      setCart(result.cart);
      setError(null);
      notifyUiChange();
    } else if ("sessionEnded" in result && result.sessionEnded) {
      window.location.replace("/account/session-ended");
    } else {
      setError(result.message);
    }
    return result.ok;
  };

  if (cart.line_count === 0) {
    return (
      <div className={cn(panelClass, "mx-auto max-w-xl text-center")}>
        <ShoppingBag aria-hidden className="mx-auto size-10 text-denim-300" />
        <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Choose a style in the shop, pick colors and enter the pieces you need per size.</p>
        <Button asChild className="mt-6">
          <Link href="/wholesale-shop">
            Go to the shop <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-8">
        {error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {cart.issues.length > 0 ? (
          <div role="status" className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-stitch-700">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle aria-hidden className="size-4" /> Before you check out
            </p>
            <ul className="mt-2 grid gap-1 pl-6">
              {cart.issues.map((issue) => (
                <li key={issue} className="list-disc">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {cart.styles.map((style) => (
          <StyleCard key={style.product_id} style={style} apply={apply} />
        ))}
      </div>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:col-span-4">
        <CartSummary cart={cart} signedIn={signedIn} />
      </aside>
    </div>
  );
}

function StyleCard({ style, apply }: { style: CartStyle; apply: (result: CartResult) => boolean }) {
  return (
    <section className={panelClass} aria-label={style.name}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold">
          {style.available ? (
            <Link href={productUrl(style)} className="hover:text-denim-600">
              {style.name}
            </Link>
          ) : (
            style.name
          )}
          {style.style_no ? <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">{style.style_no}</span> : null}
        </h2>
        <p className="text-sm text-muted-foreground">
          {style.pcs} pcs · {formatMoney(style.goods_cents)}
          {style.tier_price_cents !== null && style.tier_price_cents < style.price_cents ? ` · volume price ${formatMoney(style.tier_price_cents)}` : ""}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Minimum {style.rules.moq_per_color} pcs per color · 1 set = {style.rules.set_pcs_per_size} pcs of every size
      </p>
      <ul className="mt-4 divide-y divide-border">
        {style.colors.map((color) => (
          <ColorLine key={`${color.color_id}-${JSON.stringify(color.size_qty)}`} style={style} color={color} apply={apply} />
        ))}
      </ul>
    </section>
  );
}

function ColorLine({ style, color, apply }: { style: CartStyle; color: CartColor; apply: (result: CartResult) => boolean }) {
  const saved = color.size_qty;
  const [draft, setDraft] = useState<Quantities>(saved);
  const [pending, startTransition] = useTransition();
  const moq = style.rules.moq_per_color;
  const draftPcs = style.sizes.reduce((sum, size) => sum + (draft[size] ?? 0), 0);
  const changed = style.sizes.some((size) => (draft[size] ?? 0) !== (saved[size] ?? 0));
  const progress = Math.min(100, Math.round((draftPcs / moq) * 100));

  const setSize = (size: string, value: number) =>
    setDraft((current) => ({ ...current, [size]: Math.max(0, Math.min(MAX_PER_SIZE, Math.floor(value) || 0)) }));
  const addSet = () =>
    setDraft((current) =>
      Object.fromEntries(style.sizes.map((size) => [size, Math.min(MAX_PER_SIZE, (current[size] ?? 0) + style.rules.set_pcs_per_size)])),
    );
  const save = () => startTransition(async () => void apply(await updateCartLine(color.color_id, draft)));
  const remove = () => startTransition(async () => void apply(await removeCartLine(color.color_id)));

  return (
    <li className="grid grid-cols-1 gap-4 py-5 first:pt-2 last:pb-0">
      <div className="flex items-start gap-4">
        <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-xl bg-cotton-100">
          {color.image ? <Image src={mediaSrc(color.image.path)} alt={color.image.alt} fill sizes="56px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium">
            <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color.hex ?? "#c8d8f4" }} />
            <span className="truncate">{color.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{color.code}</span>
          </p>
          {color.available ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {color.pcs} pcs × {formatMoney(color.unit_price_cents)} = <span className="font-medium text-foreground">{formatMoney(color.line_cents)}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-destructive">No longer available. Remove it to check out.</p>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={remove} disabled={pending} aria-label={`Remove ${color.name}`} className="text-muted-foreground hover:text-destructive">
          {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
        </Button>
      </div>

      {color.available ? (
        <>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {style.sizes.map((size) => (
              <label key={size} className="grid gap-1 rounded-xl bg-cotton-50 p-2 text-center">
                <span className="font-mono text-xs text-muted-foreground">{size}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={draft[size] ? String(draft[size]) : ""}
                  placeholder="0"
                  onChange={(event) => setSize(size, Number(event.target.value))}
                  aria-label={`Size ${size}, pieces of ${color.name}`}
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-white text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="min-w-48 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className={cn(draftPcs >= moq ? "text-emerald-700" : "text-stitch-700")}>
                  {draftPcs >= moq ? "Minimum reached" : `Needs ${moq - draftPcs} more pcs`}
                </span>
                <span className="font-mono tabular-nums">
                  {draftPcs} / {moq}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cotton-200" role="progressbar" aria-valuemin={0} aria-valuemax={moq} aria-valuenow={Math.min(draftPcs, moq)} aria-label={`Pieces of ${color.name}`}>
                <div className={cn("h-full rounded-full transition-all", draftPcs >= moq ? "bg-emerald-600" : "bg-stitch-500")} style={{ width: `${progress}%` }} />
              </div>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addSet} disabled={pending}>
              <Plus /> Add a set
            </Button>
            {changed ? (
              <>
                <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(saved)} disabled={pending}>
                  <Undo2 /> Undo
                </Button>
                <Button type="button" size="sm" onClick={save} disabled={pending}>
                  {pending ? <LoaderCircle className="animate-spin" /> : null}
                  {draftPcs === 0 ? (
                    <>
                      <Minus /> Remove color
                    </>
                  ) : (
                    "Update cart"
                  )}
                </Button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </li>
  );
}

function CartSummary({ cart, signedIn }: { cart: Cart; signedIn: boolean }) {
  const { packing } = cart;
  return (
    <div className={panelClass}>
      <h2 className="text-lg font-semibold">Summary</h2>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Colors</dt>
          <dd className="tabular-nums">{cart.line_count}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Pieces</dt>
          <dd className="tabular-nums">{cart.total_pcs}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Packing (estimate)</dt>
          <dd className="tabular-nums">
            {packing.cartons} {packing.cartons === 1 ? "carton" : "cartons"} · {(packing.gross_g / 1000).toFixed(1)} kg · {packing.cbm.toFixed(2)} CBM
          </dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <dt className="font-semibold">Goods (FOB)</dt>
          <dd className="font-heading text-2xl font-semibold tabular-nums">{formatMoney(cart.goods_cents)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Freight by air or sea is estimated at checkout. Production takes about {cart.lead_time_days} days after your deposit is confirmed.
      </p>
      <Button asChild size="lg" className={cn("mt-6 w-full", !cart.can_checkout && "pointer-events-none opacity-50")} aria-disabled={!cart.can_checkout}>
        <Link href={cart.can_checkout ? "/checkout" : "#"} tabIndex={cart.can_checkout ? undefined : -1}>
          Check out <ArrowRight />
        </Link>
      </Button>
      {!cart.can_checkout ? <p className="mt-2 text-center text-xs text-stitch-700">Fix the points above to check out.</p> : null}
      {!signedIn ? <p className="mt-3 text-center text-xs text-muted-foreground">You log in or create a buyer account at checkout. Your cart is kept.</p> : null}
      <p className="mt-4 text-center text-xs">
        <Link href="/wholesale-shop" className="text-denim-600 hover:underline">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
