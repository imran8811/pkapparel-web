"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { whatsappUrl } from "@/lib/links";
import { typeInfo } from "@/lib/nav";
import { unitPrice, type Product, type ProductColor } from "@/lib/shop";
import { cn } from "@/lib/utils";

type Quantities = Record<string, Record<string, number>>;

const MAX_PER_SIZE = 100_000;

/**
 * Quantities per size for each color, with an "add a set" shortcut, the minimum per color and a running total.
 * Until the cart exists, the result goes into a prefilled quote request (or a WhatsApp message).
 */
export function OrderPanel({
  product,
  color,
  onColorChange,
  whatsapp,
}: {
  product: Product;
  color: ProductColor;
  onColorChange: (slug: string) => void;
  whatsapp: string;
}) {
  const [quantities, setQuantities] = useState<Quantities>({});
  const { moq_per_color: moq, set_pcs_per_size: perSize } = product.rules;
  const setSize = perSize * product.sizes.length;

  const current = quantities[color.slug] ?? {};
  const colorTotal = (slug: string) => Object.values(quantities[slug] ?? {}).reduce((sum, qty) => sum + qty, 0);
  const chosen = product.colors.filter((c) => colorTotal(c.slug) > 0);
  const totalPieces = chosen.reduce((sum, c) => sum + colorTotal(c.slug), 0);
  const tierPrice = unitPrice(product.price_cents, product.tiers, totalPieces);
  // A volume tier lowers every color's price by the same amount as the style price.
  const priceFor = (c: ProductColor) => c.price_cents - (product.price_cents - tierPrice);
  const totalCents = chosen.reduce((sum, c) => sum + colorTotal(c.slug) * priceFor(c), 0);
  const belowMinimum = chosen.filter((c) => colorTotal(c.slug) < moq);

  const update = (size: string, qty: number) =>
    setQuantities((all) => ({
      ...all,
      [color.slug]: { ...all[color.slug], [size]: Math.max(0, Math.min(MAX_PER_SIZE, Math.floor(qty) || 0)) },
    }));
  const addSet = () =>
    setQuantities((all) => ({
      ...all,
      [color.slug]: Object.fromEntries(product.sizes.map((size) => [size, Math.min(MAX_PER_SIZE, (all[color.slug]?.[size] ?? 0) + perSize)])),
    }));
  const clearColor = (slug: string) =>
    setQuantities((all) => {
      const next = { ...all };
      delete next[slug];
      return next;
    });

  const summary = [
    `I'd like a quote for ${product.name}:`,
    ...chosen.map(
      (c) =>
        `- ${c.name} (${c.code}): ${product.sizes
          .filter((size) => (quantities[c.slug]?.[size] ?? 0) > 0)
          .map((size) => `${size}×${quantities[c.slug]?.[size]}`)
          .join(", ")} = ${colorTotal(c.slug)} pcs`,
    ),
    `Total: ${totalPieces} pcs (about ${formatMoney(totalCents)} FOB Pakistan)`,
  ].join("\n");
  const quoteHref = `/request-quote?${new URLSearchParams({
    product: typeInfo(product.product_type).label,
    quantity: String(totalPieces),
    message: summary,
  })}`;

  const thisColor = colorTotal(color.slug);
  const progress = Math.min(100, Math.round((thisColor / moq) * 100));

  return (
    <div className="rounded-3xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Your quantities</h2>
        <p className="text-xs text-muted-foreground">
          {color.name} · <span className="font-mono">{color.code}</span>
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {product.sizes.map((size) => (
          <label key={size} className="grid gap-1 rounded-xl bg-cotton-50 p-2 text-center">
            <span className="font-mono text-xs text-muted-foreground">{size}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={current[size] ? String(current[size]) : ""}
              placeholder="0"
              onChange={(event) => update(size, Number(event.target.value))}
              aria-label={`Size ${size}, pieces of ${color.name}`}
              className="h-9 w-full rounded-lg border border-input bg-white text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={addSet}>
          <Plus /> Add a set ({setSize} pcs)
        </Button>
        {thisColor > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => clearColor(color.slug)}>
            <Minus /> Clear {color.name.toLowerCase()}
          </Button>
        ) : null}
        <p className="w-full text-xs text-muted-foreground">
          A set is {perSize} pieces of every size ({product.sizes.join(", ")}).
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className={cn(thisColor >= moq ? "text-emerald-700" : "text-muted-foreground")}>
            {thisColor >= moq ? `Minimum reached for ${color.name.toLowerCase()}` : `Minimum ${moq} pcs per color`}
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
                    {pieces < moq ? <span className="shrink-0 text-xs text-stitch-700">needs {moq - pieces} more</span> : null}
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
              Each color needs at least {moq} pieces. You can still ask for a quote, and we will help you plan the quantities.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-2">
        <Button asChild size="lg" className={cn(chosen.length === 0 && "pointer-events-none opacity-50")} aria-disabled={chosen.length === 0}>
          <Link href={chosen.length > 0 ? quoteHref : "#"} tabIndex={chosen.length === 0 ? -1 : undefined}>
            Request a quote for this order <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={whatsappUrl(whatsapp, chosen.length > 0 ? summary : `Hello, I'm interested in ${product.name}.`)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-4" /> Ask on WhatsApp
          </a>
        </Button>
        <p className="text-center text-xs text-muted-foreground">Online ordering is coming soon. Prices and freight are confirmed on your proforma invoice.</p>
      </div>
    </div>
  );
}
