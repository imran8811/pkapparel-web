import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { TopBar } from "@/components/layout/top-bar";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { GoogleAnalytics } from "@/components/site/google-analytics";
import { getShopSections } from "@/lib/catalog";
import { getSite } from "@/lib/site";

/** Chrome for all public pages: top bar, sticky header, footer and WhatsApp button. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // The shop's departments and categories, for the menus (Admin → Shop categories).
  const [site, sections] = await Promise.all([getSite(), getShopSections()]);

  return (
    <>
      <TopBar site={site} />
      <SiteHeader site={site} sections={sections} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter site={site} sections={sections} />
      <WhatsAppButton number={site.contact.whatsapp} />
      <GoogleAnalytics />
    </>
  );
}
