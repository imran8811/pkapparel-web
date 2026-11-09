import Image from "next/image";
import Link from "next/link";
import { ColorDots } from "@/components/shop/product-card";
import { mediaSrc } from "@/lib/media";
import { formatPiecePrice, formatRupees, sizeRange, stockSegmentInfo, stockUrl, type StockCard as Card } from "@/lib/stock";
import { cn } from "@/lib/utils";

/** A stock listing in a grid (one color each): photo (second photo on hover), its color and code, sizes of the set, price per set, and whether it is sold out. */
export function StockCard({ style, preload = false }: { style: Card; preload?: boolean }) {
  const cover = style.colors.find((color) => color.sets_in_stock > 0) ?? style.colors[0];
  const image = cover?.image;
  const hover = cover?.hover_image;
  const soldOut = style.sets_in_stock <= 0;

  return (
    <Link href={stockUrl(style.segment, style.slug)} className="group flex h-full flex-col">
      <div className="relative aspect-[2/3] overflow-hidden rounded-3xl bg-white ring-1 ring-border transition-shadow group-hover:shadow-lg group-hover:shadow-denim-900/10">
        {image ? (
          <Image
            src={mediaSrc(image.path)}
            alt={image.alt}
            fill
            preload={preload}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            className={cn("object-cover transition-opacity duration-500", hover && "group-hover:opacity-0", soldOut && "opacity-60")}
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
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] uppercase backdrop-blur",
            soldOut ? "bg-denim-950/85 text-white" : "bg-white/90 text-denim-950",
          )}
        >
          {soldOut ? "Sold out" : `${style.sets_in_stock} ${style.sets_in_stock === 1 ? "set" : "sets"} in stock`}
        </span>
      </div>
      <div className="mt-4 flex flex-1 flex-col px-1">
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {stockSegmentInfo(style.segment).title} · sizes {sizeRange(style.sizes)}
        </p>
        <h3 className="mt-1.5 font-heading text-lg leading-snug font-semibold tracking-tight transition-colors group-hover:text-denim-600">
          {style.name}
        </h3>
        {cover && style.colors.length === 1 ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span aria-hidden className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: cover.hex ?? "#c8d8f4" }} />
            {cover.name} <span className="font-mono text-xs">{cover.code}</span>
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="text-sm">
            <span className="font-semibold">{formatPiecePrice(style.piece_price_cents)}</span>{" "}
            <span className="text-muted-foreground">{style.piece_price_cents > 0 ? "/ piece" : `· set of ${style.set_pieces}`}</span>
            {style.piece_price_cents > 0 ? (
              <span className="block text-xs text-muted-foreground">
                {formatRupees(style.set_price_cents)} a set of {style.set_pieces}
              </span>
            ) : null}
          </p>
          {style.colors.length > 1 ? <ColorDots colors={style.colors} /> : null}
        </div>
      </div>
    </Link>
  );
}

export function StockGrid({ styles, className }: { styles: Card[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4", className)}>
      {styles.map((style, index) => (
        <li key={style.slug}>
          <StockCard style={style} preload={index === 0} />
        </li>
      ))}
    </ul>
  );
}
