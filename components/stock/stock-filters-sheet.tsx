"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** On phones and tablets the filter sidebar opens from a "Filters" button. Choosing a filter closes it. */
export function StockFiltersSheet({ active, children, className }: { active: number; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <SlidersHorizontalIcon />
          Filters
          {active > 0 ? <span className="rounded-full bg-denim-900 px-1.5 text-xs text-white tabular-nums">{active}</span> : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full gap-0 overflow-y-auto bg-cotton-50 p-0 sm:max-w-sm">
        <div className="border-b border-border px-5 py-4">
          <SheetTitle className="font-heading text-lg font-semibold">Filters</SheetTitle>
          <SheetDescription className="sr-only">Choose the jeans section, the size, the fit and the fabric.</SheetDescription>
        </div>
        {/* Every option is a link: following one closes the panel to show its styles. */}
        <div
          className="px-5 py-6"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
