import Link from "next/link";
import { StockSortSelect } from "@/components/stock/stock-sort-select";
import { STOCK_SORTS, type StockFilters } from "@/lib/stock";
import { cn } from "@/lib/utils";

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

/** Size and fit chips, a stretch toggle and the sort order. All of it works without JavaScript except sorting. */
export function StockFilterBar({ path, filters, sizes, fits }: { path: string; filters: StockFilters; sizes: string[]; fits: string[] }) {
  return (
    <div className="grid gap-4">
      {sizes.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">Size</span>
          <Chip href={stockHref(path, filters, { size: undefined })} active={!filters.size} label="All" />
          {sizes.map((size) => (
            <Chip key={size} href={stockHref(path, filters, { size })} active={filters.size === size} label={size} mono />
          ))}
        </div>
      ) : null}
      {fits.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">Fit</span>
          <Chip href={stockHref(path, filters, { fit: undefined })} active={!filters.fit} label="All" />
          {fits.map((fit) => (
            <Chip key={fit} href={stockHref(path, filters, { fit })} active={filters.fit?.toLowerCase() === fit.toLowerCase()} label={fit} />
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-border pt-4">
        <div className="flex items-center gap-1 rounded-full bg-secondary p-1 text-sm">
          {[
            { value: undefined, label: "Any fabric" },
            { value: "stretch", label: "Stretch" },
            { value: "non-stretch", label: "Rigid" },
          ].map((option) => (
            <Link
              key={option.label}
              href={stockHref(path, filters, { stretch: option.value })}
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
        <StockSortSelect value={filters.sort ?? "stock"} className="ml-auto" />
      </div>
    </div>
  );
}

function Chip({ href, active, label, mono }: { href: string; active: boolean; label: string; mono?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
        mono && "font-mono tabular-nums",
        active ? "border-denim-900 bg-denim-900 text-white" : "border-border bg-white hover:border-denim-300",
      )}
    >
      {label}
    </Link>
  );
}
