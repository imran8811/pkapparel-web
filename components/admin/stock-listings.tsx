import Image from "next/image";
import Link from "next/link";
import { CopyIcon, ImageIcon, LayoutGridIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/admin/page-parts";
import { setStockView } from "@/lib/admin/actions/stock";
import type { StockView } from "@/lib/admin/stock-view";
import type { AdminStockCategory, AdminStockStyleSummary, ProductStatus } from "@/lib/admin/types";
import { formatRupees } from "@/lib/stock";
import { cn } from "@/lib/utils";

export const STOCK_STATUS: Record<ProductStatus, { label: string; tone: "green" | "neutral" | "muted" }> = {
  active: { label: "Shown", tone: "green" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "muted" },
};

/**
 * A color for each category, in the order the categories were added (Jeans: the denim blue, Cotton pants: amber), so
 * the listings of different categories are told apart at a glance. Whole class names, for Tailwind to find them.
 */
const CATEGORY_TONES = [
  { dot: "bg-denim-600", tag: "bg-denim-600 text-white", edge: "border-l-denim-600" },
  { dot: "bg-amber-400", tag: "bg-amber-400 text-amber-950", edge: "border-l-amber-400" },
  { dot: "bg-violet-600", tag: "bg-violet-600 text-white", edge: "border-l-violet-600" },
  { dot: "bg-teal-700", tag: "bg-teal-700 text-white", edge: "border-l-teal-700" },
  { dot: "bg-rose-700", tag: "bg-rose-700 text-white", edge: "border-l-rose-700" },
  { dot: "bg-lime-400", tag: "bg-lime-400 text-lime-950", edge: "border-l-lime-400" },
  { dot: "bg-fuchsia-700", tag: "bg-fuchsia-700 text-white", edge: "border-l-fuchsia-700" },
  { dot: "bg-slate-600", tag: "bg-slate-600 text-white", edge: "border-l-slate-600" },
] as const;

type CategoryTone = (typeof CATEGORY_TONES)[number];

/** Each category's color, by its web address: the first one added has the first color (they repeat after eight). */
function categoryTones(categories: AdminStockCategory[]): Map<string, CategoryTone> {
  const byAge = [...categories].sort((a, b) => a.id - b.id);
  return new Map(byAge.map((category, index) => [category.slug, CATEGORY_TONES[index % CATEGORY_TONES.length]]));
}

type ListingGroup = { key: string; department: string; category: string; categorySlug: string; listings: AdminStockStyleSummary[] };

/** The listings by department and category, in the order they come (the API sorts them by department, then category). */
function groupListings(styles: AdminStockStyleSummary[]): ListingGroup[] {
  const groups = new Map<string, ListingGroup>();
  for (const style of styles) {
    const key = `${style.segment}--${style.category}`;
    const group = groups.get(key) ?? { key, department: style.department_name, category: style.category_name, categorySlug: style.category, listings: [] };
    group.listings.push(style);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** The listings under a heading for each department and category (in its category's color), as rows or as cards. */
export function StockListings({ styles, categories, view }: { styles: AdminStockStyleSummary[]; categories: AdminStockCategory[]; view: StockView }) {
  const tones = categoryTones(categories);

  return (
    <div className="space-y-8">
      {groupListings(styles).map((group) => {
        const tone = tones.get(group.categorySlug) ?? CATEGORY_TONES[CATEGORY_TONES.length - 1];
        const headingId = `stock-${group.key}`;
        return (
          <section key={group.key} aria-labelledby={headingId}>
            <h2 id={headingId} className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-heading text-base font-semibold">
              <span className={cn("size-3 shrink-0 rounded-full", tone.dot)} aria-hidden />
              {group.department} · {group.category}
              <span className="font-sans text-sm font-normal text-muted-foreground tabular-nums">
                {group.listings.length} listing{group.listings.length === 1 ? "" : "s"}
              </span>
            </h2>
            {view === "cards" ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {group.listings.map((style) => (
                  <ListingCard key={style.id} style={style} tone={tone} />
                ))}
              </ul>
            ) : (
              <ul className={cn("overflow-hidden rounded-2xl border border-l-4 bg-white", tone.edge)}>
                {group.listings.map((style) => (
                  <ListingRow key={style.id} style={style} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ListingRow({ style }: { style: AdminStockStyleSummary }) {
  return (
    <li className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:px-5">
      <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
        <Thumbnail style={style} sizes="48px" iconClassName="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/admin/stock/${style.id}`} className="font-medium hover:text-denim-600">
          {style.name}
        </Link>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <ColorDot style={style} />
          <span className="truncate">
            <ColorName style={style} />
            {" · "}
            <SetDetails style={style} />
          </span>
        </p>
        {/* On a phone the sets and pills go under the name, which then has room. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
          <SetsInStock style={style} className="mr-1 text-xs" />
          <StatusPills style={style} />
        </div>
      </div>
      <Price style={style} className="hidden text-right sm:block" />
      <SetsInStock style={style} className="hidden w-20 shrink-0 text-right sm:block" />
      <span className="hidden shrink-0 items-center gap-4 sm:flex">
        <StatusPills style={style} />
      </span>
      <DuplicateButton style={style} />
    </li>
  );
}

/** A listing as a card: its photo with its category, and the whole card opens it. */
function ListingCard({ style, tone }: { style: AdminStockStyleSummary; tone: CategoryTone }) {
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden bg-cotton-100">
        <Thumbnail
          style={style}
          sizes="(min-width: 1280px) 240px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          iconClassName="size-8"
          className="transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className={cn("absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm", tone.tag)}>
          {style.category_name}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={`/admin/stock/${style.id}`}
          className="line-clamp-2 text-sm leading-snug font-medium outline-none group-hover:text-denim-600 after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-denim-600 focus-visible:after:ring-inset"
        >
          {style.name}
        </Link>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <ColorDot style={style} />
          <span className="truncate">
            <ColorName style={style} />
          </span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          <SetDetails style={style} capitalized />
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price style={style} />
          <SetsInStock style={style} className="text-right" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <StatusPills style={style} />
          <span className="relative z-10 ml-auto">
            <DuplicateButton style={style} />
          </span>
        </div>
      </div>
    </li>
  );
}

function Thumbnail({ style, sizes, iconClassName, className }: { style: AdminStockStyleSummary; sizes: string; iconClassName: string; className?: string }) {
  return style.thumbnail ? (
    <Image src={`/${style.thumbnail}`} alt="" fill sizes={sizes} className={cn("object-cover", className)} />
  ) : (
    <ImageIcon className={cn("absolute inset-0 m-auto text-muted-foreground", iconClassName)} />
  );
}

function ColorDot({ style }: { style: AdminStockStyleSummary }) {
  return style.color_name ? <span className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: style.color_hex ?? "#c8d8f4" }} /> : null;
}

function ColorName({ style }: { style: AdminStockStyleSummary }) {
  return style.color_name ? (
    <>
      {style.color_name} <span className="font-mono">{style.color_code}</span>
    </>
  ) : (
    <span className="text-stitch-700">No color yet</span>
  );
}

/** "sets of 12 · PK-1051": the pieces in a set, and the style no. */
function SetDetails({ style, capitalized = false }: { style: AdminStockStyleSummary; capitalized?: boolean }) {
  return (
    <>
      {capitalized ? "Sets" : "sets"} of {style.set_pieces}
      {style.style_no ? ` · ${style.style_no}` : ""}
    </>
  );
}

function Price({ style, className }: { style: AdminStockStyleSummary; className?: string }) {
  return (
    <span className={cn("text-sm tabular-nums", style.piece_price_cents === 0 && "text-stitch-700", className)}>
      {style.piece_price_cents > 0 ? (
        <>
          {formatRupees(style.piece_price_cents)}/pc
          <span className="block text-xs text-muted-foreground">{formatRupees(style.set_price_cents)}/set</span>
        </>
      ) : (
        "No price"
      )}
    </span>
  );
}

function SetsInStock({ style, className }: { style: AdminStockStyleSummary; className?: string }) {
  return (
    <span className={cn("text-sm tabular-nums", style.sets_in_stock === 0 && "text-muted-foreground", className)}>
      {style.sets_in_stock} set{style.sets_in_stock === 1 ? "" : "s"}
    </span>
  );
}

function StatusPills({ style }: { style: AdminStockStyleSummary }) {
  return (
    <>
      {style.is_featured ? <Pill tone="blue">Featured</Pill> : null}
      <Pill tone={STOCK_STATUS[style.status].tone}>{STOCK_STATUS[style.status].label}</Pill>
    </>
  );
}

function DuplicateButton({ style }: { style: AdminStockStyleSummary }) {
  return (
    <Button asChild variant="ghost" size="icon-sm">
      <Link href={`/admin/stock/new?copy=${style.id}`} aria-label={`Duplicate ${style.name}${style.color_name ? `, ${style.color_name}` : ""}`} title="Duplicate">
        <CopyIcon />
      </Link>
    </Button>
  );
}

const VIEWS = [
  { value: "list", label: "List", Icon: ListIcon },
  { value: "cards", label: "Cards", Icon: LayoutGridIcon },
] as const;

/** Rows or cards. The choice is kept in this browser (see setStockView). */
export function StockViewToggle({ view }: { view: StockView }) {
  return (
    <form action={setStockView} className="shrink-0">
      <div role="group" aria-label="Show listings as" className="flex h-10 items-center rounded-lg border bg-white p-0.5">
        {VIEWS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="submit"
            name="view"
            value={value}
            aria-pressed={view === value}
            className={cn(
              "inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors",
              view === value ? "bg-denim-900 text-white" : "text-muted-foreground hover:text-denim-900",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </button>
        ))}
      </div>
    </form>
  );
}
