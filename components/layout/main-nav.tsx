import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { mainLinks, manufacturingLinks, productTypes, segments, shopUrl } from "@/lib/nav";
import { cn } from "@/lib/utils";

const triggerClass = "bg-transparent text-[15px] text-foreground/80 hover:text-foreground data-open:text-foreground";

/** Desktop navigation with a products mega menu. */
export function MainNav({ moq, className }: { moq: number; className?: string }) {
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList className="gap-0.5">
        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[900px] grid-cols-[repeat(4,minmax(0,1fr))_1.2fr] gap-1 p-2">
              {segments.map((segment) => (
                <div key={segment.slug} className="p-2">
                  <NavigationMenuLink asChild className="px-2 font-heading text-base font-semibold">
                    <Link href={shopUrl(segment.slug)}>{segment.label}</Link>
                  </NavigationMenuLink>
                  <ul className="mt-1">
                    {productTypes.map((type) => (
                      <li key={type.slug}>
                        <NavigationMenuLink
                          asChild
                          className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Link href={shopUrl(segment.slug, type.slug)}>{type.label}</Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <NavigationMenuLink
                asChild
                className="relative flex-col items-start justify-end gap-0 overflow-hidden rounded-xl bg-denim-900 p-5 text-cotton-50 twill-texture hover:bg-denim-800 focus:bg-denim-800"
              >
                <Link href="/private-label">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-stitch-400 uppercase">Private label</span>
                  <span className="mt-2 font-heading text-lg leading-tight font-semibold">
                    Your brand, made in our factory
                  </span>
                  <span className="mt-2 text-xs text-cotton-50/70">Custom labels, washes, fits and packaging.</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-stitch-300">
                    Learn more <ArrowRight className="size-3.5" />
                  </span>
                </Link>
              </NavigationMenuLink>

              <div className="col-span-5 mt-1 flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  MOQ {moq} pcs per style &amp; color · Made to order · Air or sea shipping
                </span>
                <NavigationMenuLink asChild className="p-0 font-medium text-denim-700 hover:bg-transparent hover:underline">
                  <Link href="/wholesale-shop">
                    View all products <ArrowRight className="size-3.5" />
                  </Link>
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className={triggerClass}>Manufacturing</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[520px] grid-cols-2 gap-1 p-2">
              {manufacturingLinks.map((link) => (
                <li key={link.href}>
                  <NavigationMenuLink asChild className="flex-col items-start gap-1 p-3">
                    <Link href={link.href}>
                      <span className="font-medium text-foreground">{link.label}</span>
                      <span className="text-[13px] leading-snug text-muted-foreground">{link.description}</span>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {mainLinks.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), triggerClass)}>
              <Link href={link.href}>{link.label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
