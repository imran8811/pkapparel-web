import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/site/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href: string };

/** Visible breadcrumb trail plus BreadcrumbList structured data. "Home" is added automatically. */
export function Breadcrumbs({ items, tone = "light", className }: { items: Crumb[]; tone?: "light" | "dark"; className?: string }) {
  const trail = [{ label: "Home", href: "/" }, ...items];

  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol
          className={cn(
            "flex flex-wrap items-center gap-1.5 text-xs",
            tone === "light" ? "text-cotton-50/60" : "text-muted-foreground",
          )}
        >
          {trail.map((crumb, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className={tone === "light" ? "text-cotton-50/90" : "text-foreground"}>
                    {crumb.label}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.href} className="transition-colors hover:underline">
                      {crumb.label}
                    </Link>
                    <ChevronRight aria-hidden className="size-3 opacity-60" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            item: absoluteUrl(crumb.href),
          })),
        }}
      />
    </>
  );
}
