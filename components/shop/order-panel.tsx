"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck, LoaderCircle, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { AddSize, SizeBoxes } from "@/components/shop/size-quantities";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/account/actions/cart";
import { notifyUiChange } from "@/lib/account/use-ui-state";
import { formatMoney } from "@/lib/format";
import { nextSizeExample, unitPrice, type Product, type ProductColor } from "@/lib/shop";
import { cn } from "@/lib/utils";

type Quantities = Record<string, Record<string, number>>;

/**
 * Pieces per size for each color, the minimums (per color, and per size ordered) and a running total. Buyers can add
 * sizes the style does not list, e.g. 38 for jeans listed in 26–36 (owner request 2026-11-21, replacing sets); an added
 * size is shown for every color. The pieces go into the cart, with no quote or WhatsApp buttons under it (owner request 2026-11-21).
 */
export function OrderPanel({
  product,
  color,
  onColorChange,
}: {
  product: Product;
  color: ProductColor;
  onColorChange: (slug: string) => void;
}) {
  const [quantities, setQuantities] = useState<Quantities>({});
  /** Sizes the buyer added, in the order added. */
  const [added, setAdded] = useState<string[]>([]);
  const [adding, startAdding] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const { moq_per_color: moq, min_pcs_per_size: minPerSize } = product.rules;
  const sizes = [...product.sizes, ...added];

  const current = quantities[color.slug] ?? {};
  const colorTotal = (slug: string) => Object.values(quantities[slug] ?? {}).reduce((sum, qty) => sum + qty, 0);
  /** Sizes of a color ordered below the minimum per size. */
  const smallSizes = (slug: string) => sizes.filter((size) => (quantities[slug]?.[size] ?? 0) > 0 && (quantities[slug]?.[size] ?? 0) < minPerSize);
  const chosen = product.colors.filter((c) => colorTotal(c.slug) > 0);
  const totalPieces = chosen.reduce((sum, c) => sum + colorTotal(c.slug), 0);
  const tierPrice = unitPrice(product.price_cents, product.tiers, totalPieces);
  // A volume tier lowers every color's price by the same amount as the style price.
  const priceFor = (c: ProductColor) => c.price_cents - (product.price_cents - tierPrice);
  const totalCents = chosen.reduce((sum, c) => sum + colorTotal(c.slug) * priceFor(c), 0);
  const belowMinimum = chosen.filter((c) => colorTotal(c.slug) < moq || smallSizes(c.slug).length > 0);
  const currentSmall = smallSizes(color.slug);

  const update = (size: string, qty: number) => setQuantities((all) => ({ ...all, [color.slug]: { ...all[color.slug], [size]: qty } }));
  const addSize = (size: string, qty: number) => {
    setAdded((list) => [...list, size]);
    update(size, qty);
  };
  /** Removes an added size, with its pieces in every color. */
  const removeSize = (size: string) => {
    setAdded((list) => list.filter((other) => other !== size));
    setQuantities((all) =>
      Object.fromEntries(Object.entries(all).map(([slug, qty]) => [slug, Object.fromEntries(Object.entries(qty).filter(([key]) => key !== size))])),
    );
  };
  const clearColor = (slug: string) =>
    setQuantities((all) => {
      const next = { ...all };
      delete next[slug];
      return next;
    });

  const thisColor = colorTotal(color.slug);
  const progress = Math.min(100, Math.round((thisColor / moq) * 100));

  const add = () =>
    startAdding(async () => {
      const lines = chosen.map((c) => ({
        colorId: c.id,
        sizeQty: Object.fromEntries(Object.entries(quantities[c.slug] ?? {}).filter(([, qty]) => qty > 0)),
      }));
      const response = await addToCart(lines);
      if (response.ok) {
        setQuantities({});
        notifyUiChange();
        const colors = chosen.length === 1 ? chosen[0].name.toLowerCase() : `${chosen.length} colors`;
        setResult({ ok: true, message: `${totalPieces} pcs of ${colors} added to your cart.` });
      } else {
        setResult({ ok: false, message: response.message });
      }
    });

  return (
    <div className="rounded-3xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Your quantities</h2>
        <p className="text-xs text-muted-foreground">
          {color.name} · <span className="font-mono">{color.code}</span>
        </p>
      </div>

      <SizeBoxes
        className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4"
        sizes={sizes}
        added={added}
        quantities={current}
        small={currentSmall}
        colorName={color.name}
        onChange={update}
        onRemove={removeSize}
      />
      {currentSmall.length > 0 ? (
        <p className="mt-2 text-xs text-stitch-700">
          Each size needs at least {minPerSize} pieces. Raise or clear size {currentSmall.join(", ")}.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <AddSize
          shown={sizes}
          addedCount={added.length}
          example={nextSizeExample(product.size_system, product.sizes)}
          colorName={color.name}
          minPerSize={minPerSize}
          onAdd={addSize}
        />
        {thisColor > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => clearColor(color.slug)}>
            <Minus /> Clear {color.name.toLowerCase()}
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className={cn(thisColor >= moq ? "text-emerald-700" : "text-muted-foreground")}>
            {thisColor >= moq ? `Minimum reached for ${color.name.toLowerCase()}` : `Minimum ${moq} pcs per color, ${minPerSize} per size`}
          </span>
          <span className="font-mono tabular-nums">
            {thisColor} / {moq}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cotton-200" role="progressbar" aria-valuemin={0} aria-valuemax={moq} aria-valuenow={Math.min(thisColor, moq)} aria-label={`Pieces of ${color.name}`}>
          <div className={cn("h-full rounded-full transition-all", thisColor >= moq ? "bg-emerald-600" : "bg-stitch-500")} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {chosen.length > 0 ? (
        <div className="mt-6 border-t border-dashed border-border pt-5">
          <ul className="grid gap-2 text-sm">
            {chosen.map((c) => {
              const pieces = colorTotal(c.slug);
              return (
                <li key={c.slug} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onColorChange(c.slug)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-denim-600"
                  >
                    <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex ?? "#c8d8f4" }} />
                    <span className="truncate">{c.name}</span>
                    {pieces < moq ? (
                      <span className="shrink-0 text-xs text-stitch-700">needs {moq - pieces} more</span>
                    ) : smallSizes(c.slug).length > 0 ? (
                      <span className="shrink-0 text-xs text-stitch-700">size {smallSizes(c.slug).join(", ")} below {minPerSize}</span>
                    ) : null}
                  </button>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{pieces} pcs</span>
                  <span className="w-20 text-right tabular-nums">{formatMoney(pieces * priceFor(c))}</span>
                  <button type="button" onClick={() => clearColor(c.slug)} aria-label={`Remove ${c.name}`} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {totalPieces} pcs
              {product.tiers.length > 0 ? ` · ${formatMoney(tierPrice)} per piece` : ""}
            </p>
            <p className="text-right">
              <span className="block font-heading text-2xl font-semibold tabular-nums">{formatMoney(totalCents)}</span>
              <span className="text-xs text-muted-foreground">FOB Pakistan, before freight</span>
            </p>
          </div>
          {belowMinimum.length > 0 ? (
            <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs text-stitch-700">
              Each color needs at least {moq} pieces, and each size you order at least {minPerSize}, before checkout. You can add them now and
              complete them in the cart.
            </p>
          ) : null}
        </div>
      ) : null}

      {result ? (
        result.ok ? (
          <div role="status" className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="flex items-start gap-2">
              <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
              {result.message}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 pl-6">
              <Button asChild size="sm">
                <Link href="/cart">
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

      <div className="mt-6 grid gap-2">
        <Button type="button" size="lg" onClick={add} disabled={chosen.length === 0 || adding}>
          {adding ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />}
          {adding ? "Adding…" : "Add to cart"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Prices per piece, FOB Pakistan. Freight is estimated at checkout and confirmed before shipment.</p>
      </div>
    </div>
  );
}
