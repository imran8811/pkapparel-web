import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Logo } from "@/components/brand/logo";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/links";
import { buyerLinks, companyLinks, legalLinks, segments, shopUrl } from "@/lib/nav";
import type { Site, SocialNetwork } from "@/lib/site";

const socialLabels: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.2em] text-cotton-50/50 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-sm text-cotton-50/80 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ site }: { site: Site }) {
  const { company, contact, addresses, social } = site;
  const productLinks = [
    ...segments.map((segment) => ({ href: shopUrl(segment.slug), label: `${segment.possessive} clothing` })),
    { href: "/wholesale-shop", label: "All products" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden bg-denim-950 text-cotton-50">
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <Container className="relative">
        <div className="flex flex-col gap-10 border-b border-white/10 py-16 lg:flex-row lg:items-end lg:justify-between lg:py-20">
          <div className="max-w-2xl">
            <Eyebrow tone="light">Start an order</Eyebrow>
            <h2 className="mt-5 text-4xl leading-[1.02] font-bold tracking-[-0.03em] sm:text-5xl">
              Ready to make your next collection?
            </h2>
            <p className="mt-5 max-w-xl text-cotton-50/70">
              Tell us the styles, quantities and destination. We&apos;ll come back with prices, production dates and
              shipping options.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/wholesale-shop">Shop wholesale</Link>
            </Button>
            <Button asChild variant="outline-inverse" size="lg">
              <a href={whatsappUrl(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-4" /> WhatsApp us
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr] lg:gap-10">
          <div className="col-span-2 max-w-xs lg:col-span-1">
            <Logo tone="light" markClassName="h-14" />
            <p className="mt-5 text-sm leading-relaxed text-cotton-50/65">
              Apparel manufacturer and exporter in {company.city}, {company.country}, since {company.founded_year}.
              Made-to-order jeans, trousers, jackets, T-shirts, hoodies and polo shirts for brands and wholesalers.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {(Object.entries(social) as [SocialNetwork, string][]).map(([network, url]) => (
                <li key={network}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-cotton-50/80 transition-colors hover:border-white/40 hover:text-white"
                  >
                    {socialLabels[network]} <ArrowUpRight className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Products" links={productLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="For buyers" links={buyerLinks} />

          <div className="col-span-2 lg:col-span-1">
            <p className="font-mono text-[11px] tracking-[0.2em] text-cotton-50/50 uppercase">Contact</p>
            <ul className="mt-4 space-y-4 text-sm text-cotton-50/80">
              {addresses.map((address) => (
                <li key={address.label} className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-stitch-400" aria-hidden />
                  <span>
                    <span className="block text-cotton-50">{address.label}</span>
                    {address.line}, {address.city}
                  </span>
                </li>
              ))}
              <li>
                <a
                  href={whatsappUrl(contact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 transition-colors hover:text-white"
                >
                  <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-stitch-400" />
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="flex gap-3 transition-colors hover:text-white">
                  <Mail className="mt-0.5 size-4 shrink-0 text-stitch-400" aria-hidden />
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-cotton-50/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {company.founded_year}–<CurrentYear /> {company.name}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
