import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import type { Site } from "@/lib/site";

/** Sticky header: logo, navigation, main actions, account and cart. */
export function SiteHeader({ site }: { site: Site }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-cotton-50/85 backdrop-blur-md supports-[backdrop-filter]:bg-cotton-50/70">
      <Container className="flex h-16 items-center gap-4 lg:h-[72px]">
        <Logo />
        <MainNav moq={site.commerce.moq_per_color} className="ml-4 hidden lg:flex xl:ml-8" />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex">
            <Link href="/request-quote">Request a quote</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/wholesale-shop">Shop wholesale</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Your account">
            <Link href="/login">
              <UserRound className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Cart">
            <Link href="/cart">
              <ShoppingBag className="size-5" />
            </Link>
          </Button>
          <MobileNav whatsapp={site.contact.whatsapp} className="lg:hidden" />
        </div>
      </Container>
    </header>
  );
}
