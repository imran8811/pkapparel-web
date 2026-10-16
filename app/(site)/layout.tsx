import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { TopBar } from "@/components/layout/top-bar";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getSite } from "@/lib/site";

/** Chrome for all public pages: top bar, sticky header, footer and WhatsApp button. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();

  return (
    <>
      <TopBar site={site} />
      <SiteHeader site={site} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter site={site} />
      <WhatsAppButton number={site.contact.whatsapp} />
    </>
  );
}
