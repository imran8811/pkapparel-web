"use client";

import { useState, type ReactNode } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "@/components/admin/nav-links";
import type { Role } from "@/lib/admin/types";

/** The admin menu on phones and tablets: a slide-in panel with the same links as the sidebar. */
export function MobileNav({ role, footer }: { role: Role; footer: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline-inverse" size="icon-sm" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-none bg-denim-900 p-4 text-cotton-50">
        <SheetTitle className="sr-only">Admin menu</SheetTitle>
        <div className="flex h-full flex-col gap-6 overflow-y-auto pt-8">
          <NavLinks role={role} onNavigate={() => setOpen(false)} />
          <div className="mt-auto">{footer}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
