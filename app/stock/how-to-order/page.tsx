import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/site/page-hero";
import { STOCK_WHATSAPP_MESSAGE } from "@/components/stock/stock-header";
import { StockSteps } from "@/components/stock/stock-steps";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";
import { RETURN_DAYS } from "@/lib/stock";

export const metadata = pageMetadata({
  title: "How to order from stock",
  description: `Ordering jeans from our stock: sold by set, paid by bank transfer, JazzCash or Easypaisa, sent by cargo or collected, with returns within ${RETURN_DAYS} days.`,
  path: "/stock/how-to-order",
});

const SECTIONS = [
  {
    title: "Sold by set",
    body: [
      "Every style is sold by set only. A set is the sizes shown on the style's page, with the pieces of each size, so you always get a full size run.",
      "Prices are per set. The page shows how many sets of each color are in stock right now.",
    ],
  },
  {
    title: "Ordering",
    body: [
      "Send us the style, color and number of sets on WhatsApp, or call us. The Order on WhatsApp button on each style fills in the message for you.",
      "We confirm what is in stock and the total, and send you the payment details.",
    ],
  },
  {
    title: "Payment",
    body: [
      "Pay the full amount by bank transfer, JazzCash or Easypaisa, then send us the payment slip.",
      "Your sets are held for you once the payment is confirmed. If a color sells out before your payment arrives, we tell you straight away and refund what you paid for it.",
    ],
  },
  {
    title: "Cargo or collection",
    body: [
      "Once your order is paid, we book the cargo to your city and send it. You pay the cargo charges to the cargo company when the goods arrive.",
      "You can also collect your order from us yourself.",
    ],
  },
  {
    title: "Returns",
    body: [
      `If there is an issue with your order, such as a fault, a wrong size or a wrong color, tell us within ${RETURN_DAYS} days of receiving it and send us photos. We replace or refund the goods once we receive them back, unused and with their tags.`,
    ],
  },
] as const;

export default async function StockHowToOrderPage() {
  const site = await getSite();

  return (
    <>
      <PageHero
        eyebrow="Ordering from stock"
        title="How to order"
        intro="Choose your jeans, order on WhatsApp, pay, and we send them by cargo."
        crumbs={[{ label: "How to order", href: "/stock/how-to-order" }]}
        crumbRoot={{ label: "Stock", href: "/stock" }}
      />
      <section className="py-12 sm:py-16">
        <Container>
          <StockSteps />
          <div className="mt-16 grid max-w-3xl gap-10">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-3 leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={whatsappUrl(site.contact.whatsapp, STOCK_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="size-4" /> Order on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/stock/terms">Terms and returns</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
