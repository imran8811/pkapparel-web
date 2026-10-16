"use client";

import { useRouter } from "next/navigation";
import { SORTS, type ShopSort } from "@/lib/shop";
import { cn } from "@/lib/utils";

/** Changes the shop's sort order, keeping the other filters in the URL. */
export function SortSelect({ value, className }: { value: ShopSort; className?: string }) {
  const router = useRouter();

  return (
    <label className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      Sort
      <select
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(window.location.search);
          if (event.target.value === "featured") params.delete("sort");
          else params.set("sort", event.target.value);
          router.push(`/wholesale-shop${params.size ? `?${params}` : ""}`, { scroll: false });
        }}
        className="h-10 rounded-full border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
    </label>
  );
}
