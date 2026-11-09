import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { StockGrid } from "@/components/stock/stock-card";
import { STOCK_WHATSAPP_MESSAGE } from "@/components/stock/stock-header";
import { StockSteps } from "@/components/stock/stock-steps";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";
import { stockSegments, stockUrl } from "@/lib/stock";
import { getStockStyles } from "@/lib/stock-catalog";

/** Always served complete: the sets in stock change often, and the next visitor waits for the fresh page. */
export const ensureStatic = "navigation";

export const metadata = pageMetadata({
  title: "Jeans in stock, sold by set",
  description:
    "Men's and boys' jeans in stock for shopkeepers and wholesalers. Sold by set, priced per set, with the sets in stock for every color. Order on WhatsApp; we send it by cargo.",
  path: "/stock",
});

export default async function StockHomePage() {
  const [site, styles] = await Promise.all([getSite(), getStockStyles()]);
  const inStock = styles.filter((style) => style.sets_in_stock > 0);

  return (
    <>
      <PageHero
        eyebrow="Ready stock"
        title={
          <>
            Jeans in stock, <span className="stitch-underline">sold by set.</span>
          </>
        }
        intro="Men's and boys' jeans from our own factory, ready to send. Pick a style and color, see how many sets are in stock, and order on WhatsApp. We book the cargo to your city."
        crumbs={[]}
        crumbRoot={{ label: "Stock", href: "/stock" }}
      >
        {stockSegments.map((segment) => (
          <Button key={segment.slug} asChild variant={segment.slug === "men" ? "accent" : "outline-inverse"} size="lg">
            <Link href={stockUrl(segment.slug)}>{segment.title}</Link>
          </Button>
        ))}
      </PageHero>

      <section className="py-12 sm:py-16">
        <Container>
          <ul className="grid gap-3 sm:grid-cols-2">
            {stockSegments.map((segment) => {
              const count = inStock.filter((style) => style.segment === segment.slug).length;
              return (
                <li key={segment.slug}>
                  <Link
                    href={stockUrl(segment.slug)}
                    className="group flex h-full items-end justify-between gap-6 rounded-3xl border border-border bg-white p-6 transition-colors hover:border-denim-300 sm:p-8"
                  >
                    <span>
                      <span className="block font-heading text-2xl font-semibold tracking-tight">{segment.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {count > 0 ? `${count} style${count === 1 ? "" : "s"} in stock` : "New stock coming soon"}
                      </span>
                    </span>
                    <ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-16">
            <SectionHeading eyebrow="Ready to send" title="In stock now" align="stack" />
            {inStock.length > 0 ? (
              <StockGrid styles={inStock} className="mt-10" />
            ) : (
              <div className="mt-10 rounded-3xl border border-dashed bg-white/60 px-6 py-16 text-center">
                <p className="font-heading text-xl font-semibold">New stock is on its way</p>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">Ask us on WhatsApp what is ready now.</p>
              </div>
            )}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="How it works" title="Ordering from stock" align="stack" />
          <StockSteps className="mt-10" />
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={whatsappUrl(site.contact.whatsapp, STOCK_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-4" /> Order on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/stock/how-to-order">Payment, cargo and returns</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
