import type { Metadata } from "next";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { GoogleAnalytics } from "@/components/site/google-analytics";
import { StockFooter } from "@/components/stock/stock-footer";
import { STOCK_WHATSAPP_MESSAGE, StockHeader } from "@/components/stock/stock-header";
import { getSite } from "@/lib/site";

/*
 * The stock pages: ready men's and boys' jeans, sold by set. Visitors from the stock countries see only these
 * pages (proxy.ts). Their own header and footer link only to stock pages; nothing here names the country.
 */
export const metadata: Metadata = {
  title: { default: "Jeans in stock, sold by set | PK Apparel", template: "%s | PK Apparel" },
  description:
    "Men's and boys' jeans in stock for shopkeepers and wholesalers, sold by set. See the sets in stock, order on WhatsApp and get it by cargo.",
};

export default async function StockLayout({ children }: LayoutProps<"/stock">) {
  const site = await getSite();

  return (
    <>
      <StockHeader site={site} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <StockFooter site={site} />
      <WhatsAppButton number={site.contact.whatsapp} message={STOCK_WHATSAPP_MESSAGE} />
      <GoogleAnalytics />
    </>
  );
}
