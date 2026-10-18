"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/forms/styles";
import { formatMoney } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { MAX_PER_SIZE, MAX_SAMPLE_PIECES, sampleOrderHref, type SampleItem, type SampleStyle } from "@/lib/samples";
import { useSearchParam } from "@/lib/use-search-param";
import { cn } from "@/lib/utils";

/**
 * Pick samples of shop styles (style, color, size, pieces), then continue to the sample order page,
 * where the buyer logs in, chooses the address and sees the courier. A link from a product page
 * (?style=…&color=…) opens the picker on that style and color.
 */
export function SamplePicker({ styles }: { styles: SampleStyle[] }) {
  const linkedStyle = useSearchParam("style");
  const linkedColor = useSearchParam("color");
  const [choice, setChoice] = useState<{ style?: string; color?: number; size?: string; qty: number }>({ qty: 1 });
  const [items, setItems] = useState<SampleItem[]>([]);
  const [custom, setCustom] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // A product page link preselects its style and color until the buyer picks another one.
  const styleSlug = choice.style ?? (styles.some((s) => s.slug === linkedStyle) ? linkedStyle! : styles[0]?.slug);
  const style = styles.find((s) => s.slug === styleSlug);
  const color = style?.colors.find((c) => c.id === choice.color) ?? style?.colors.find((c) => c.slug === linkedColor) ?? style?.colors[0];
  const size = choice.size && style?.sizes.includes(choice.size) ? choice.size : (style?.sizes[0] ?? "");
  const pieces = items.reduce((sum, item) => sum + item.qty, 0);

  const find = (colorId: number) => {
    for (const s of styles) {
      const c = s.colors.find((candidate) => candidate.id === colorId);
      if (c) return { style: s, color: c };
    }
    return null;
  };
  const subtotal = items.reduce((sum, item) => sum + (find(item.color_id)?.style.sample_price_cents ?? 0) * item.qty, 0);

  const add = () => {
    if (!style || !color || !size) return;
    if (pieces + choice.qty > MAX_SAMPLE_PIECES) {
      setMessage(`A sample order can have up to ${MAX_SAMPLE_PIECES} pieces.`);
      return;
    }
    const existing = items.find((item) => item.color_id === color.id && item.size === size);
    if (existing && existing.qty + choice.qty > MAX_PER_SIZE) {
      setMessage(`Up to ${MAX_PER_SIZE} pieces of each color and size.`);
      return;
    }
    setMessage(null);
    setItems((current) =>
      existing
        ? current.map((item) => (item === existing ? { ...item, qty: item.qty + choice.qty } : item))
        : [...current, { color_id: color.id, size, qty: choice.qty }],
    );
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold">Choose your samples</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Up to {MAX_SAMPLE_PIECES} pieces per order, and up to {MAX_PER_SIZE} of each color and size.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Style
          <select value={styleSlug} onChange={(event) => setChoice({ style: event.target.value, qty: choice.qty })} className={fieldClass}>
            {styles.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
                {s.style_no ? ` (${s.style_no})` : ""} · {formatMoney(s.sample_price_cents)} per piece
              </option>
            ))}
          </select>
        </label>

        {style ? (
          <fieldset className="grid gap-2 sm:col-span-2">
            <legend className="text-sm font-medium">
              Color: <span className="font-normal text-muted-foreground">{color?.name}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {style.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChoice({ ...choice, style: style.slug, color: c.id })}
                  aria-pressed={c.id === color?.id}
                  aria-label={`${c.name} (${c.code})`}
                  title={c.name}
                  className={cn(
                    "size-9 rounded-full ring-1 ring-black/10 ring-offset-2 transition-shadow",
                    c.id === color?.id ? "ring-2 ring-denim-600" : "hover:ring-denim-300",
                  )}
                  style={{ backgroundColor: c.hex ?? "#c8d8f4" }}
                />
              ))}
            </div>
          </fieldset>
        ) : null}

        <label className="grid gap-2 text-sm font-medium">
          Size
          <select value={size} onChange={(event) => setChoice({ ...choice, style: styleSlug, color: color?.id, size: event.target.value })} className={fieldClass}>
            {style?.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Pieces
          <select value={choice.qty} onChange={(event) => setChoice({ ...choice, style: styleSlug, color: color?.id, size, qty: Number(event.target.value) })} className={fieldClass}>
            {Array.from({ length: MAX_PER_SIZE }, (_, index) => index + 1).map((qty) => (
              <option key={qty} value={qty}>
                {qty}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={add} disabled={!style || !color || pieces >= MAX_SAMPLE_PIECES}>
          <Plus /> Add sample
        </Button>
        {message ? (
          <p role="alert" className="text-sm text-stitch-700">
            {message}
          </p>
        ) : null}
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-border rounded-2xl border border-border" aria-label="Your samples">
          {items.map((item) => {
            const found = find(item.color_id);
            if (!found) return null;
            return (
              <li key={`${item.color_id}-${item.size}`} className="flex items-center gap-3 p-3">
                <div className="relative aspect-[4/5] w-10 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
                  {found.color.image ? <Image src={mediaSrc(found.color.image)} alt="" fill sizes="40px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{found.style.name}</p>
                  <p className="text-muted-foreground">
                    {found.color.name} · size {item.size} · {item.qty} {item.qty === 1 ? "piece" : "pieces"}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatMoney(found.style.sample_price_cents * item.qty)}</span>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((candidate) => candidate !== item))}
                  aria-label={`Remove ${found.color.name}, size ${item.size}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <label className="flex items-start gap-3 rounded-2xl border border-border p-4 text-sm">
        <input type="checkbox" checked={custom} onChange={(event) => setCustom(event.target.checked)} className="mt-0.5 size-4 accent-denim-600" />
        <span>
          <span className="block font-medium">A sample of my own design</span>
          <span className="text-muted-foreground">From your tech pack or a reference garment. We price it for you, usually within 1 to 2 working days.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-dashed border-border pt-5">
        <p className="text-sm text-muted-foreground">
          {pieces > 0 ? (
            <>
              {pieces} {pieces === 1 ? "piece" : "pieces"} · <span className="font-medium text-foreground tabular-nums">{formatMoney(subtotal)}</span> plus courier
            </>
          ) : custom ? (
            "Your custom-design sample is priced by us."
          ) : (
            "Add the samples you want to see."
          )}
        </p>
        {items.length > 0 || custom ? (
          <Button asChild size="lg">
            <Link href={sampleOrderHref(items, custom)}>
              Continue <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button size="lg" disabled>
            Continue <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
