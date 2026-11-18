import Image from "next/image";
import Link from "next/link";
import { CopyIcon, ImageIcon, LayoutGridIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupHeading, Pill } from "@/components/admin/page-parts";
import { setStockView } from "@/lib/admin/actions/stock";
import { inGroups, placeIn } from "@/lib/admin/list-groups";
import type { StockView } from "@/lib/admin/stock-view";
import { formatDay } from "@/lib/admin/time";
import type { AdminStockCategory, AdminStockDepartment, AdminStockStyleSummary, ProductStatus } from "@/lib/admin/types";
import { formatRupees } from "@/lib/stock";
import { cn } from "@/lib/utils";

export const STOCK_STATUS: Record<ProductStatus, { label: string; tone: "green" | "neutral" | "muted" }> = {
  active: { label: "Shown", tone: "green" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "muted" },
};

/**
 * A color for each category, in the order the categories were added (Jeans: the denim blue, Cotton pants: amber), so
 * the listings of different categories are told apart at a glance: the tag on each listing, its left edge and the bar
 * before its group's heading. Whole class names, for Tailwind to find them.
 */
const CATEGORY_TONES = [
  { tag: "bg-denim-600 text-white", edge: "border-l-denim-600", bar: "bg-denim-600" },
  { tag: "bg-amber-400 text-amber-950", edge: "border-l-amber-400", bar: "bg-amber-400" },
  { tag: "bg-violet-600 text-white", edge: "border-l-violet-600", bar: "bg-violet-600" },
  { tag: "bg-teal-700 text-white", edge: "border-l-teal-700", bar: "bg-teal-700" },
  { tag: "bg-rose-700 text-white", edge: "border-l-rose-700", bar: "bg-rose-700" },
  { tag: "bg-lime-400 text-lime-950", edge: "border-l-lime-400", bar: "bg-lime-400" },
  { tag: "bg-fuchsia-700 text-white", edge: "border-l-fuchsia-700", bar: "bg-fuchsia-700" },
  { tag: "bg-slate-600 text-white", edge: "border-l-slate-600", bar: "bg-slate-600" },
] as const;

type CategoryTone = (typeof CATEGORY_TONES)[number];

/** Each category's color, by its web address: the first one added has the first color (they repeat after eight). */
function categoryTones(categories: AdminStockCategory[]): Map<string, CategoryTone> {
  const byAge = [...categories].sort((a, b) => a.id - b.id);
  return new Map(byAge.map((category, index) => [category.slug, CATEGORY_TONES[index % CATEGORY_TONES.length]]));
}

/**
 * The listings by department and category, in staff order (Men · Jeans, Men · Cotton pants, then Boys · Jeans…), each
 * group under a heading with a line that separates it from the one above (owner request 2026-11-18), the newest first
 * in each (as the API sends them). As rows or as cards; each shows its department and category in the category's color.
 */
export function StockListings({
  styles,
  departments,
  categories,
  view,
}: {
  styles: AdminStockStyleSummary[];
  departments: AdminStockDepartment[];
  categories: AdminStockCategory[];
  view: StockView;
}) {
  const tones = categoryTones(categories);
  const toneOf = (style: AdminStockStyleSummary) => tones.get(style.category) ?? CATEGORY_TONES[CATEGORY_TONES.length - 1];
  // The API sends both in staff order.
  const departmentOrder = departments.map((department) => department.slug);
  const categoryOrder = categories.map((category) => category.slug);
  const groups = inGroups(
    styles,
    (style) => `${style.segment}/${style.category}`,
    (a, b) => placeIn(departmentOrder, a.segment) - placeIn(departmentOrder, b.segment) || placeIn(categoryOrder, a.category) - placeIn(categoryOrder, b.category),
  );

  // A column, not a grid: grid items would widen to their one-line (truncated) text on phones.
  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ key, items }, index) => {
        const tone = toneOf(items[0]);
        return (
          <section key={key} aria-labelledby={`listings-${index}`}>
            <GroupHeading
              id={`listings-${index}`}
              title={`${items[0].department_name} · ${items[0].category_name}`}
              count={items.length}
              noun="listing"
              marker={tone.bar}
            />
            {view === "cards" ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {items.map((style) => (
                  <ListingCard key={style.id} style={style} tone={tone} />
                ))}
              </ul>
            ) : (
              <ul className="overflow-hidden rounded-2xl border bg-white">
                {items.map((style) => (
                  <ListingRow key={style.id} style={style} tone={tone} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ListingRow({ style, tone }: { style: AdminStockStyleSummary; tone: CategoryTone }) {
  return (
    <li className={cn("flex items-center gap-4 border-b border-l-4 px-4 py-3 last:border-b-0 sm:px-5", tone.edge)}>
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
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <CategoryTag style={style} tone={tone} />
          <Added style={style} />
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
        <CategoryTag style={style} tone={tone} className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate px-2 py-0.5 shadow-sm" />
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
        <p className="text-xs text-muted-foreground">
          <Added style={style} />
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

/** "Men · Jeans", in the category's color. */
function CategoryTag({ style, tone, className }: { style: AdminStockStyleSummary; tone: CategoryTone; className?: string }) {
  return (
    <span className={cn("rounded-full px-1.5 py-px text-[11px] font-semibold", tone.tag, className)}>
      {style.department_name} · {style.category_name}
    </span>
  );
}

function Added({ style }: { style: AdminStockStyleSummary }) {
  return <span className="tabular-nums">Added {formatDay(style.created_at)}</span>;
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
