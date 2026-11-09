import { Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/site/page-hero";
import { STOCK_WHATSAPP_MESSAGE } from "@/components/stock/stock-header";
import { telUrl, whatsappUrl } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Order jeans from our stock, or ask what is in stock: WhatsApp, phone or email.",
  path: "/stock/contact",
});

export default async function StockContactPage() {
  const { contact, addresses } = await getSite();
  const channels = [
    { icon: WhatsAppIcon, label: "WhatsApp", value: contact.phone, href: whatsappUrl(contact.whatsapp, STOCK_WHATSAPP_MESSAGE), external: true },
    { icon: Phone, label: "Phone", value: contact.phone, href: telUrl(contact.phone), external: false },
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}`, external: false },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to us"
        intro="Order from stock, ask what is ready or when a color is back. WhatsApp is quickest."
        crumbs={[{ label: "Contact", href: "/stock/contact" }]}
        crumbRoot={{ label: "Stock", href: "/stock" }}
      />
      <section className="py-12 sm:py-16">
        <Container className="grid gap-10 lg:grid-cols-2">
          <ul className="grid gap-3">
            {channels.map((channel) => (
              <li key={channel.label}>
                <a
                  href={channel.href}
                  {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-denim-300"
                >
                  <channel.icon aria-hidden className="size-5 shrink-0 text-denim-600" />
                  <span>
                    <span className="block text-sm text-muted-foreground">{channel.label}</span>
                    <span className="font-medium">{channel.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {addresses.length > 0 ? (
            <ul className="grid content-start gap-3">
              {addresses.map((address) => (
                <li key={address.label} className="flex gap-4 rounded-2xl bg-secondary p-5">
                  <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-denim-600" />
                  <span>
                    <span className="block font-medium">{address.label}</span>
                    <span className="text-muted-foreground">
                      {address.line}, {address.city}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      </section>
    </>
  );
}
