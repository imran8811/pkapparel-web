"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Banknote, CircleCheck, LoaderCircle, Minus, PackageCheck, Plus, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToStockCart } from "@/lib/account/actions/stock";
import { notifyUiChange } from "@/lib/account/use-ui-state";
import { mediaSrc } from "@/lib/media";
import { formatPiecePrice, formatRupees, RETURN_DAYS, setsInStock, stockSegmentInfo, type StockStyle } from "@/lib/stock";
import { cn } from "@/lib/utils";

const noSubscription = () => () => {};

/** ?color=… from the address. Read after hydration, so the page stays static. */
function useColorParam(): string | null {
  return useSyncExternalStore(noSubscription, () => new URLSearchParams(window.location.search).get("color"), () => null);
}

/** Gallery, the color, the set, sets in stock, and adding sets to the cart. */
export function StockStyleView({ style }: { style: StockStyle }) {
  const requested = useColorParam();
  const [chosen, setChosen] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [sets, setSets] = useState(1);
  const [adding, startAdding] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const slug = chosen ?? requested;
  const color =
    style.colors.find((c) => c.slug === slug) ?? style.colors.find((c) => c.sets_in_stock > 0) ?? style.colors[0];
  const images = color.images;
  const image = images[Math.min(photo, images.length - 1)];
  const available = color.sets_in_stock;
  const quantity = Math.max(1, Math.min(sets, Math.max(available, 1)));
  const total = quantity * style.set_price_cents;
  // A listing copied from the wholesale shop has no price until staff enter one, and cannot be ordered until then.
  const priced = style.piece_price_cents > 0;

  const add = () =>
    startAdding(async () => {
      const response = await addToStockCart(color.id, quantity);
      if (response.ok) {
        notifyUiChange();
        setSets(1);
        setResult({ ok: true, message: `${quantity} ${quantity === 1 ? "set" : "sets"} of ${color.name.toLowerCase()} added to your cart.` });
      } else if (response.sessionEnded) {
        window.location.replace("/stock/account/session-ended");
      } else {
        setResult({ ok: false, message: response.message });
      }
    });

  const selectColor = (next: string) => {
    setChosen(next);
    setPhoto(0);
    setSets(1);
    setResult(null);
    const url = new URL(window.location.href);
    url.searchParams.set("color", next);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="min-w-0 lg:col-span-7">
        <div className="lg:sticky lg:top-28">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-white ring-1 ring-border">
            {image ? (
              <Image key={image.path} src={mediaSrc(image.path)} alt={image.alt} fill preload sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain" />
            ) : null}
          </div>
          {images.length > 1 ? (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Photos">
              {images.map((thumb, index) => (
                <li key={thumb.path} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setPhoto(index)}
                    aria-label={`Show photo ${index + 1}: ${thumb.alt}`}
                    aria-current={index === photo ? "true" : undefined}
                    className={cn(
                      "relative block h-24 w-18 overflow-hidden rounded-xl bg-white ring-1 ring-border transition",
                      index === photo ? "ring-2 ring-denim-600" : "opacity-80 hover:opacity-100",
                    )}
                  >
                    <Image src={mediaSrc(thumb.path)} alt="" fill sizes="72px" className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 content-start gap-7 lg:col-span-5">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-denim-600 uppercase">{stockSegmentInfo(style.segment).title} · in stock</p>
          <h1 className="mt-3 text-4xl leading-[1.04] font-bold tracking-[-0.03em] sm:text-5xl">{style.name}</h1>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-3xl font-semibold tabular-nums">{formatPiecePrice(style.piece_price_cents)}</span>
            <span className="text-muted-foreground">{priced ? "per piece" : `for sets of ${style.set.pieces} pieces`}</span>
          </p>
          {priced ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              One set: {style.set.pieces} pieces × {formatRupees(style.piece_price_cents)} ={" "}
              <span className="font-medium text-foreground tabular-nums">{formatRupees(style.set_price_cents)}</span>
            </p>
          ) : null}
        </div>

        <div>
          <p className="flex items-center gap-2 text-sm">
            {style.colors.length === 1 ? (
              <span aria-hidden className="size-5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color.hex ?? "#c8d8f4" }} />
            ) : null}
            <span>
              Color: <span className="font-medium">{color.name}</span> <span className="font-mono text-xs text-muted-foreground">({color.code})</span>
            </span>
          </p>
          {/* A listing is one color; the choice is only there for a style that still has several. */}
          <div role="radiogroup" aria-label="Color" className={cn("mt-3 flex flex-wrap gap-2", style.colors.length === 1 && "hidden")}>
            {style.colors.map((option) => (
              <button
                key={option.slug}
                type="button"
                role="radio"
                aria-checked={option.slug === color.slug}
                aria-label={`${option.name} (${option.code}), ${setsInStock(option.sets_in_stock).toLowerCase()}`}
                title={`${option.name}: ${setsInStock(option.sets_in_stock).toLowerCase()}`}
                onClick={() => selectColor(option.slug)}
                className={cn(
                  "relative size-10 rounded-full ring-1 ring-black/10 ring-offset-2 ring-offset-background transition",
                  option.slug === color.slug ? "ring-2 ring-denim-900" : "hover:ring-denim-300",
                  option.sets_in_stock <= 0 && "opacity-40",
                )}
                style={{ backgroundColor: option.hex ?? "#c8d8f4" }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">One set</h2>
            <p className="text-xs text-muted-foreground">{style.set.pieces} pieces</p>
          </div>
          <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {style.set.sizes.map(({ size, pcs }) => (
              <li key={size} className="grid gap-0.5 rounded-xl bg-cotton-50 p-2 text-center">
                <span className="font-mono text-xs text-muted-foreground">{size}</span>
                <span className="text-sm font-medium tabular-nums">× {pcs}</span>
              </li>
            ))}
          </ul>

          <p className={cn("mt-5 flex items-center gap-2 text-sm font-medium", available > 0 ? "text-emerald-700" : "text-stitch-700")}>
            <PackageCheck aria-hidden className="size-4" />
            {available > 0 ? `${setsInStock(available)} in ${color.name.toLowerCase()}` : `${color.name} is sold out`}
          </p>

          {available > 0 && !priced ? (
            <div className="mt-5 grid gap-3 border-t border-dashed border-border pt-5">
              <p className="text-sm text-muted-foreground">The price of this set is not online yet. It can be ordered once it has one.</p>
            </div>
          ) : available > 0 ? (
            <>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-dashed border-border pt-5">
                <span className="text-sm font-medium">Sets</span>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="icon-sm" onClick={() => setSets(quantity - 1)} disabled={quantity <= 1} aria-label="One set less">
                    <Minus />
                  </Button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={available}
                    value={quantity}
                    onChange={(event) => setSets(Math.floor(Number(event.target.value)) || 1)}
                    aria-label={`Sets of ${color.name}`}
                    className="h-9 w-16 rounded-lg border border-input bg-white text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                  />
                  <Button type="button" variant="outline" size="icon-sm" onClick={() => setSets(quantity + 1)} disabled={quantity >= available} aria-label="One set more">
                    <Plus />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {quantity * style.set.pieces} pieces × {formatRupees(style.piece_price_cents)}
                </p>
                <p className="font-heading text-2xl font-semibold tabular-nums">{formatRupees(total)}</p>
              </div>
              {result ? (
                result.ok ? (
                  <div role="status" className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="flex items-start gap-2">
                      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
                      {result.message}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 pl-6">
                      <Button asChild size="sm">
                        <Link href="/stock/cart">
                          View cart <ArrowRight />
                        </Link>
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setResult(null)}>
                        Add another color
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p role="alert" className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {result.message}
                  </p>
                )
              ) : null}
              <div className="mt-5 grid gap-2">
                <Button type="button" size="lg" onClick={add} disabled={adding}>
                  {adding ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />}
                  {adding ? "Adding…" : "Add to cart"}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <ul className="grid gap-2.5 text-sm">
          <li className="flex items-center gap-3">
            <Banknote aria-hidden className="size-4.5 text-denim-600" />
            Pay by bank transfer, JazzCash or Easypaisa. Sets are held for you once your payment is confirmed.
          </li>
          <li className="flex items-center gap-3">
            <Truck aria-hidden className="size-4.5 text-denim-600" />
            We book the cargo to your city, or you collect the order yourself.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          <Link href="/stock/how-to-order" className="font-medium text-denim-600 underline-offset-2 hover:underline">
            How ordering works
          </Link>{" "}
          ·{" "}
          <Link href="/stock/terms" className="font-medium text-denim-600 underline-offset-2 hover:underline">
            Returns within {RETURN_DAYS} days
          </Link>
        </p>
      </div>
    </div>
  );
}
