"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { whatsappUrl } from "@/lib/links";
import { mainLinks, manufacturingLinks, productTypes, segments, shopUrl } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Slide-in menu for phones and tablets. */
export function MobileNav({ whatsapp, className }: { whatsapp: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className={className}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-cotton-50 p-0 sm:max-w-md">
        <div className="border-b border-border px-5 py-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Browse products and company pages</SheetDescription>
          <Logo showTagline={false} />
        </div>

        <nav className="flex-1 space-y-8 px-5 py-6" aria-label="Mobile">
          <section>
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Shop by</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {segments.map((segment) => (
                <Link
                  key={segment.slug}
                  href={shopUrl(segment.slug)}
                  onClick={close}
                  className="rounded-2xl border border-border bg-card px-4 py-3 font-heading text-lg font-semibold transition-colors hover:border-denim-300"
                >
                  {segment.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {productTypes.map((type) => (
                <Link
                  key={type.slug}
                  href={`/wholesale-shop?type=${type.slug}`}
                  onClick={close}
                  className="rounded-full bg-secondary px-3 py-1.5 text-sm transition-colors hover:bg-cotton-200"
                >
                  {type.label}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Company</p>
            <ul className="mt-2 divide-y divide-border">
              {[...manufacturingLinks, ...mainLinks].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="flex items-center justify-between py-3 text-base font-medium"
                  >
                    {link.label}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </nav>

        <div className="sticky bottom-0 grid gap-2 border-t border-border bg-cotton-50 p-5">
          <Button asChild onClick={close}>
            <Link href="/wholesale-shop">Shop wholesale</Link>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" onClick={close}>
              <Link href="/request-quote">Request a quote</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={whatsappUrl(whatsapp)} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className={cn("size-4 text-[#1da851]")} /> WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
