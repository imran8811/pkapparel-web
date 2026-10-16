import Image from "next/image";
import Link from "next/link";
import { mediaSrc } from "@/lib/content";
import { categoryLabel, priceRange, productUrl, type ColorCard, type ProductCard as Card } from "@/lib/shop";
import { cn } from "@/lib/utils";

/** A style in a grid: photo (second photo on hover), category, name, price per piece and its colors. */
export function ProductCard({ product, preload = false }: { product: Card; preload?: boolean }) {
  const cover = product.colors[0];
  const image = cover?.image;
  const hover = cover?.hover_image;

  return (
    <Link href={productUrl(product)} className="group flex h-full flex-col">
      <div className="relative aspect-[2/3] overflow-hidden rounded-3xl bg-white ring-1 ring-border transition-shadow group-hover:shadow-lg group-hover:shadow-denim-900/10">
        {image ? (
          <Image
            src={mediaSrc(image.path)}
            alt={image.alt}
            fill
            preload={preload}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            className={cn("object-cover transition-opacity duration-500", hover && "group-hover:opacity-0")}
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-denim-900 twill-texture" />
        )}
        {hover ? (
          <Image
            src={mediaSrc(hover.path)}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}
        {product.colors.length > 1 ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-denim-950 uppercase backdrop-blur">
            {product.colors.length} colors
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col px-1">
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {categoryLabel(product.segment, product.product_type)}
        </p>
        <h3 className="mt-1.5 font-heading text-lg leading-snug font-semibold tracking-tight transition-colors group-hover:text-denim-600">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="text-sm">
            <span className="font-semibold">{priceRange(product.price_from_cents, product.price_to_cents)}</span>{" "}
            <span className="text-muted-foreground">/ piece</span>
          </p>
          <ColorDots colors={product.colors} />
        </div>
      </div>
    </Link>
  );
}

/** Small round swatches; "+3" when there are more than fit. */
export function ColorDots({ colors, max = 6, className }: { colors: Pick<ColorCard, "slug" | "name" | "hex">[]; max?: number; className?: string }) {
  const shown = colors.slice(0, max);
  return (
    <span className={cn("flex items-center", className)} aria-label={`${colors.length} color${colors.length === 1 ? "" : "s"}: ${colors.map((c) => c.name).join(", ")}`}>
      {shown.map((color) => (
        <span
          key={color.slug}
          title={color.name}
          className="-ml-1 size-4 rounded-full ring-2 ring-background first:ml-0"
          style={{ backgroundColor: color.hex ?? "#c8d8f4" }}
        />
      ))}
      {colors.length > max ? <span className="ml-1.5 text-xs text-muted-foreground">+{colors.length - max}</span> : null}
    </span>
  );
}
