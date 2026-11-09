import Link from "next/link";
import { XIcon } from "lucide-react";
import { STOCK_SORTS, stockSegments, stockUrl, type StockFilters, type StockSegment } from "@/lib/stock";
import { cn } from "@/lib/utils";

const FABRICS = [
  { value: undefined, label: "Any fabric" },
  { value: "stretch", label: "Stretch" },
  { value: "non-stretch", label: "Rigid" },
] as const;

/** Reads the filters from the address; unknown values are ignored. */
export function stockFiltersFrom(params: Record<string, string | string[] | undefined>): StockFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };
  const size = one("size");
  const stretch = one("stretch");
  const sort = one("sort");

  return {
    size: size && /^\d{2}$/.test(size) ? size : undefined,
    fit: one("fit")?.slice(0, 60),
    stretch: stretch === "stretch" || stretch === "non-stretch" ? stretch : undefined,
    sort: STOCK_SORTS.find((option) => option.value === sort)?.value,
  };
}

/** The page's address with some filters changed, keeping the others. */
export function stockHref(path: string, current: StockFilters, changes: Partial<Record<keyof StockFilters, string | undefined>>): string {
  const next = { ...current, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value && !(key === "sort" && value === "stock")) params.set(key, String(value));
  }
  return `${path}${params.size ? `?${params}` : ""}`;
}

/** Size, fit and fabric chosen (the sort order is not a filter). */
export function activeFilterCount(filters: StockFilters): number {
  return [filters.size, filters.fit, filters.stretch].filter(Boolean).length;
}

/**
 * The filter sidebar: the two jeans sections, then size, fit and fabric. Every option is a link, so filtering works
 * without JavaScript. Changing the section starts without filters (the sizes differ).
 */
export function StockFilterPanel({
  segment,
  filters,
  sizes,
  fits,
  counts,
}: {
  segment: StockSegment;
  filters: StockFilters;
  /** The sizes and fits of the styles in stock. */
  sizes: string[];
  fits: string[];
  /** Styles in each section, shown beside the section links. */
  counts: Record<StockSegment, number>;
}) {
  const path = stockUrl(segment);

  return (
    <div className="grid gap-7">
      <FilterGroup title="Jeans">
        {stockSegments.map((section) => (
          <Option key={section.slug} href={stockUrl(section.slug)} active={section.slug === segment} label={section.title} count={counts[section.slug]} />
        ))}
      </FilterGroup>

      {sizes.length > 1 ? (
        <FilterGroup title="Size" chips>
          <Chip href={stockHref(path, filters, { size: undefined })} active={!filters.size} label="All" />
          {sizes.map((size) => (
            <Chip key={size} href={stockHref(path, filters, { size })} active={filters.size === size} label={size} mono />
          ))}
        </FilterGroup>
      ) : null}

      {fits.length > 1 ? (
        <FilterGroup title="Fit">
          <Option href={stockHref(path, filters, { fit: undefined })} active={!filters.fit} label="All fits" filter />
          {fits.map((fit) => (
            <Option key={fit} href={stockHref(path, filters, { fit })} active={filters.fit?.toLowerCase() === fit.toLowerCase()} label={fit} filter />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Fabric">
        {FABRICS.map((option) => (
          <Option key={option.label} href={stockHref(path, filters, { stretch: option.value })} active={filters.stretch === option.value} label={option.label} filter />
        ))}
      </FilterGroup>

      {activeFilterCount(filters) > 0 ? (
        <Link
          href={stockHref(path, { sort: filters.sort }, {})}
          scroll={false}
          className="justify-self-start text-sm font-medium text-denim-600 underline-offset-2 hover:underline"
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}

/** The chosen filters above the styles, each removable, and "Clear all" when there are several. */
export function ActiveFilters({ path, filters, fits, className }: { path: string; filters: StockFilters; fits: string[]; className?: string }) {
  const chosen: { key: "size" | "fit" | "stretch"; label: string }[] = [];
  if (filters.size) chosen.push({ key: "size", label: `Size ${filters.size}` });
  if (filters.fit) chosen.push({ key: "fit", label: fits.find((fit) => fit.toLowerCase() === filters.fit?.toLowerCase()) ?? filters.fit });
  if (filters.stretch) chosen.push({ key: "stretch", label: filters.stretch === "stretch" ? "Stretch" : "Rigid" });
  if (chosen.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chosen.map((item) => (
        <Link
          key={item.key}
          href={stockHref(path, filters, { [item.key]: undefined })}
          scroll={false}
          aria-label={`Remove the filter: ${item.label}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-denim-900 py-1 pr-2 pl-3 text-sm text-white transition-colors hover:bg-denim-800"
        >
          {item.label}
          <XIcon className="size-3.5" aria-hidden />
        </Link>
      ))}
      {chosen.length > 1 ? (
        <Link href={stockHref(path, { sort: filters.sort }, {})} scroll={false} className="text-sm font-medium text-denim-600 underline-offset-2 hover:underline">
          Clear all
        </Link>
      ) : null}
    </div>
  );
}

function FilterGroup({ title, chips, children }: { title: string; chips?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 font-mono text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">{title}</h3>
      {chips ? <div className="flex flex-wrap gap-1.5">{children}</div> : <ul className="grid gap-0.5">{children}</ul>}
    </section>
  );
}

/** One choice of a group, marked like a radio button. Filters keep the scroll position; sections open at the top. */
function Option({ href, active, label, count, filter }: { href: string; active: boolean; label: string; count?: number; filter?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        scroll={filter ? false : undefined}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-denim-50",
          active ? "font-medium text-denim-950" : "text-denim-950/75 hover:text-denim-950",
        )}
      >
        <span aria-hidden className={cn("size-4 shrink-0 rounded-full border bg-white", active ? "border-[5px] border-denim-900" : "border-input")} />
        <span className="min-w-0 flex-1">{label}</span>
        {count !== undefined ? <span className="text-xs text-muted-foreground tabular-nums">{count}</span> : null}
      </Link>
    </li>
  );
}

function Chip({ href, active, label, mono }: { href: string; active: boolean; label: string; mono?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-w-10 items-center justify-center rounded-full border px-2.5 py-1 text-sm transition-colors",
        mono && "font-mono tabular-nums",
        active ? "border-denim-900 bg-denim-900 text-white" : "border-border bg-white hover:border-denim-300",
      )}
    >
      {label}
    </Link>
  );
}
