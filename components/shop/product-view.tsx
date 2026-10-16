"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Layers, PackageCheck } from "lucide-react";
import { OrderPanel } from "@/components/shop/order-panel";
import { mediaSrc } from "@/lib/media";
import { formatMoney } from "@/lib/format";
import { categoryLabel, type Product } from "@/lib/shop";
import { cn } from "@/lib/utils";

const noSubscription = () => () => {};

/** ?color=… from the address (old product links point to a color). Read after hydration, so the page stays static. */
function useColorParam(): string | null {
  return useSyncExternalStore(noSubscription, () => new URLSearchParams(window.location.search).get("color"), () => null);
}

/** Gallery, colors, price and order panel of a product page. */
export function ProductView({ product, whatsapp }: { product: Product; whatsapp: string }) {
  const requested = useColorParam();
  const [chosen, setChosen] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);

  const slug = chosen ?? requested;
  const color = product.colors.find((c) => c.slug === slug) ?? product.colors[0];
  const images = color.images;
  const image = images[Math.min(photo, images.length - 1)];
  const { rules } = product;

  const selectColor = (next: string) => {
    setChosen(next);
    setPhoto(0);
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
              <Image
                key={image.path}
                src={mediaSrc(image.path)}
                alt={image.alt}
                fill
                preload
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-contain"
              />
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
          <p className="font-mono text-[11px] tracking-[0.18em] text-denim-600 uppercase">
            {categoryLabel(product.segment, product.product_type)}
          </p>
          <h1 className="mt-3 text-4xl leading-[1.04] font-bold tracking-[-0.03em] sm:text-5xl">{product.name}</h1>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-3xl font-semibold tabular-nums">{formatMoney(color.price_cents)}</span>
            <span className="text-muted-foreground">per piece · FOB Pakistan</span>
          </p>
          {product.tiers.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2 text-xs">
              {product.tiers.map((tier) => (
                <li key={tier.min_qty} className="rounded-full bg-denim-50 px-3 py-1 text-denim-800">
                  {tier.min_qty.toLocaleString("en-US")}+ pcs: {formatMoney(tier.price_cents - (product.price_cents - color.price_cents))}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="text-sm">
            Color: <span className="font-medium">{color.name}</span>{" "}
            <span className="font-mono text-xs text-muted-foreground">({color.code})</span>
          </p>
          <div role="radiogroup" aria-label="Color" className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((option) => (
              <button
                key={option.slug}
                type="button"
                role="radio"
                aria-checked={option.slug === color.slug}
                aria-label={`${option.name} (${option.code})`}
                title={option.name}
                onClick={() => selectColor(option.slug)}
                className={cn(
                  "size-10 rounded-full ring-1 ring-black/10 ring-offset-2 ring-offset-background transition",
                  option.slug === color.slug ? "ring-2 ring-denim-900" : "hover:ring-denim-300",
                )}
                style={{ backgroundColor: option.hex ?? "#c8d8f4" }}
              />
            ))}
          </div>
        </div>

        <ul className="grid gap-2.5 text-sm">
          <li className="flex items-center gap-3">
            <PackageCheck aria-hidden className="size-4.5 text-denim-600" />
            Minimum {rules.moq_per_color} pieces per color, mixed sizes
          </li>
          <li className="flex items-center gap-3">
            <Layers aria-hidden className="size-4.5 text-denim-600" />
            Sets of {rules.set_pcs_per_size} pieces per size ({rules.set_pcs_per_size * product.sizes.length} pcs)
          </li>
          <li className="flex items-center gap-3">
            <Clock aria-hidden className="size-4.5 text-denim-600" />
            Ready about {rules.lead_time_days} days after your deposit
          </li>
        </ul>

        <OrderPanel product={product} color={color} onColorChange={selectColor} whatsapp={whatsapp} />

        <p className="text-sm text-muted-foreground">
          Want to check the fit and fabric first?{" "}
          <Link
            href={`/samples?${new URLSearchParams({ styles: `${product.name}, ${color.name} (${color.code})` })}`}
            className="font-medium text-denim-600 underline-offset-2 hover:underline"
          >
            Order a sample
          </Link>{" "}
          for {formatMoney(rules.sample_price_cents)} plus courier.
        </p>
      </div>
    </div>
  );
}
