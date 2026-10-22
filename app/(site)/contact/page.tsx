import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/layout/container";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { PageHero } from "@/components/site/page-hero";
import { countryOptions } from "@/lib/format";
import { telUrl, whatsappUrl } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact PK Apparel",
  description:
    "Contact PK Apparel, garment manufacturer in Lahore, Pakistan, by WhatsApp, phone or email, or send us a message.",
  path: "/contact",
});

export default async function ContactPage() {
  const site = await getSite();
  const { contact } = site;

  const channels = [
    {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      value: contact.phone,
      href: whatsappUrl(contact.whatsapp, "Hello PK Apparel, I'd like to discuss a wholesale order."),
      note: "Fastest way to reach us",
      external: true,
    },
    { icon: Phone, label: "Phone", value: contact.phone, href: telUrl(contact.phone), note: "Pakistan time (UTC+5)" },
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}`, note: "For quotes, tech packs and orders" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let&apos;s talk <span className="stitch-underline">production.</span>
          </>
        }
        intro="Questions about styles, prices, samples or shipping? Message us on WhatsApp, call, email or use the form below."
        crumbs={[{ label: "Contact", href: "/contact" }]}
      />

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-5 rounded-3xl border border-border bg-card p-6 transition-colors hover:border-denim-300"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-denim-50 text-denim-600">
                  <channel.icon className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    {channel.label}
                  </span>
                  <span className="mt-1 block truncate text-lg font-semibold">{channel.value}</span>
                  <span className="block text-sm text-muted-foreground">{channel.note}</span>
                </span>
              </a>
            ))}

            {site.addresses.map((address) => (
              <div key={address.label} className="flex gap-5 rounded-3xl border border-border bg-card p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-stitch-500/10 text-stitch-600">
                  <MapPin className="size-6" />
                </span>
                <div>
                  <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{address.label}</p>
                  <p className="mt-1 leading-relaxed">
                    {address.line}, {address.city}, {address.country}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.line}, ${address.city}, ${address.country}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-denim-600 underline-offset-2 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-7">
            <InquiryForm type="contact" countries={countryOptions()} whatsappUrl={whatsappUrl(contact.whatsapp)} />
          </div>
        </Container>
      </section>
    </>
  );
}
