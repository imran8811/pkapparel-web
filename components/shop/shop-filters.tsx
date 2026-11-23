import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { SortSelect } from "@/components/shop/sort-select";
import { categoriesIn, DEFAULT_SORT, findCategory, sells, type ShopFilters, type ShopPage, type ShopSections } from "@/lib/shop";
import { cn } from "@/lib/utils";

/** Builds a shop URL that keeps the other filters (`sections`: the shop's departments and categories, to drop the ones that no longer fit). */
export function shopHref(current: ShopFilters, changes: Partial<Record<keyof ShopFilters, string | undefined>>, sections?: ShopSections): string {
  const next = { ...current, ...changes };
  if (changes.segment !== undefined && next.type && next.segment && sections && !sells(sections, next.segment, next.type)) {
    delete next.type; // e.g. skirts for men don't exist
  }
  if (!sections || !hasStretch(sections, next.type)) delete next.stretch; // the stretch filter is for denim and twill only
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value && !(key === "sort" && value === DEFAULT_SORT)) params.set(key, String(value));
  }
  return `/wholesale-shop${params.size ? `?${params}` : ""}`;
}

/** The stretch filter shows once a denim or twill category is chosen. Without one, "Rigid" would hide every T-shirt. */
export function hasStretch(sections: ShopSections, type: string | undefined): boolean {
  return Boolean(type && findCategory(sections, type)?.stretch);
}

/**
 * Department and category chips with style counts (from the pages' texts), a stretch toggle (denim and twill), search
 * and sort. All of it works without JavaScript except sorting.
 */
export function ShopFilterBar({ filters, pages, sections }: { filters: ShopFilters; pages: ShopPage[]; sections: ShopSections }) {
  const count = (segment: string | undefined, type: string | undefined) =>
    pages
      .filter((c) => (segment ? c.segment === segment : true) && (type ? c.product_type === type : c.product_type !== ""))
      .reduce((sum, c) => sum + c.style_count, 0);

  const types = filters.segment ? categoriesIn(sections, filters.segment) : sections.categories;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip href={shopHref(filters, { segment: undefined }, sections)} active={!filters.segment} label="All" count={count(undefined, undefined)} />
        {sections.departments.map((department) => (
          <Chip
            key={department.slug}
            href={shopHref(filters, { segment: department.slug }, sections)}
            active={filters.segment === department.slug}
            label={department.name}
            count={count(department.slug, undefined)}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip href={shopHref(filters, { type: undefined }, sections)} active={!filters.type} label="All products" small />
        {types.map((category) => (
          <Chip
            key={category.slug}
            href={shopHref(filters, { type: category.slug }, sections)}
            active={filters.type === category.slug}
            label={category.name}
            count={count(filters.segment, category.slug)}
            small
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-border pt-4">
        <form action="/wholesale-shop" className="relative min-w-56 flex-1 sm:max-w-sm">
          {filters.segment ? <input type="hidden" name="segment" value={filters.segment} /> : null}
          {filters.type ? <input type="hidden" name="type" value={filters.type} /> : null}
          {filters.stretch ? <input type="hidden" name="stretch" value={filters.stretch} /> : null}
          {filters.sort && filters.sort !== DEFAULT_SORT ? <input type="hidden" name="sort" value={filters.sort} /> : null}
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search styles or article no."
            aria-label="Search styles"
            className="h-11 w-full rounded-full border border-input bg-white pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </form>
        {hasStretch(sections, filters.type) ? (
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1 text-sm">
            {[
              { value: undefined, label: "Any fabric" },
              { value: "stretch", label: "Stretch" },
              { value: "non-stretch", label: "Rigid" },
            ].map((option) => (
              <Link
                key={option.label}
                href={shopHref(filters, { stretch: option.value }, sections)}
                aria-current={filters.stretch === option.value ? "true" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  filters.stretch === option.value ? "bg-white font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        ) : null}
        <SortSelect value={filters.sort ?? DEFAULT_SORT} className="ml-auto" />
      </div>
    </div>
  );
}

function Chip({ href, active, label, count, small }: { href: string; active: boolean; label: string; count?: number; small?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors",
        small ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-[15px] font-medium",
        active ? "border-denim-900 bg-denim-900 text-white" : "border-border bg-white hover:border-denim-300",
      )}
    >
      {label}
      {count !== undefined ? (
        <span className={cn("font-mono text-[11px] tabular-nums", active ? "text-cotton-50/70" : "text-muted-foreground")}>{count}</span>
      ) : null}
    </Link>
  );
}
