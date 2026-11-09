"use client";

import { usePathname, useRouter } from "next/navigation";
import { STOCK_SORTS, type StockSort } from "@/lib/stock";
import { cn } from "@/lib/utils";

/** Changes the order of the stock styles, keeping the other filters in the URL. */
export function StockSortSelect({ value, className }: { value: StockSort; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      Sort
      <select
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(window.location.search);
          if (event.target.value === "stock") params.delete("sort");
          else params.set("sort", event.target.value);
          router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
        }}
        className="h-10 rounded-full border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {STOCK_SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
    </label>
  );
}
