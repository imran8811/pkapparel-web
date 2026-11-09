import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/links";
import type { Site } from "@/lib/site";
import { stockInfoLinks, stockSegments, stockUrl } from "@/lib/stock";

export const STOCK_TAGLINE = ["Jeans in stock", "Sold by set"] as const;

export const STOCK_WHATSAPP_MESSAGE = "Hello PK Apparel, I'd like to order jeans from your stock.";

/** Sticky header of the stock pages: logo, the two jeans sections, how to order, contact and WhatsApp. */
export function StockHeader({ site }: { site: Site }) {
  const links = [...stockSegments.map((segment) => ({ href: stockUrl(segment.slug), label: segment.title })), ...stockInfoLinks];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-cotton-50/85 backdrop-blur-md supports-[backdrop-filter]:bg-cotton-50/70">
      <Container className="flex h-16 items-center gap-4 lg:h-[72px]">
        <Logo href="/stock" tagline={STOCK_TAGLINE} />
        <nav aria-label="Stock" className="ml-4 hidden items-center gap-1 md:flex xl:ml-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-denim-950/80 transition-colors hover:bg-denim-50 hover:text-denim-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <Button asChild size="sm">
            <a href={whatsappUrl(site.contact.whatsapp, STOCK_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-4" />
              <span className="hidden sm:inline">Order on WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          </Button>
        </div>
      </Container>
      <nav aria-label="Stock" className="border-t border-border/60 md:hidden">
        <Container className="flex gap-1 overflow-x-auto py-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-denim-950/80 hover:bg-denim-50 hover:text-denim-950"
            >
              {link.label}
            </Link>
          ))}
        </Container>
      </nav>
    </header>
  );
}
