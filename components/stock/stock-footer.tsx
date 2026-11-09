import Link from "next/link";
import { cacheLife } from "next/cache";
import { Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Container } from "@/components/layout/container";
import { STOCK_TAGLINE } from "@/components/stock/stock-header";
import { whatsappUrl } from "@/lib/links";
import type { Site } from "@/lib/site";
import { stockInfoLinks, stockLegalLinks, stockSegments, stockUrl } from "@/lib/stock";

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
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-cotton-50/80 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Footer of the stock pages: only stock links, and the contacts (addresses without the country). */
export function StockFooter({ site }: { site: Site }) {
  const { company, contact, addresses } = site;
  const jeansLinks = stockSegments.map((segment) => ({ href: stockUrl(segment.slug), label: segment.title }));

  return (
    <footer className="relative mt-auto overflow-hidden bg-denim-950 text-cotton-50">
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <Container className="relative">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 py-14 lg:grid-cols-[1.5fr_1fr_1fr_1.4fr] lg:gap-10">
          <div className="col-span-2 max-w-xs lg:col-span-1">
            <Logo tone="light" markClassName="h-14" href="/stock" tagline={STOCK_TAGLINE} />
            <p className="mt-5 text-sm leading-relaxed text-cotton-50/65">
              Men&apos;s and boys&apos; jeans from our own factory, ready in stock for shopkeepers and wholesalers. Sold by set, sent by cargo to your
              city.
            </p>
          </div>

          <FooterColumn title="Jeans" links={jeansLinks} />
          <FooterColumn title="Buying" links={[...stockInfoLinks, ...stockLegalLinks]} />

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
                <a href={whatsappUrl(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex gap-3 transition-colors hover:text-white">
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

        <div className="border-t border-white/10 py-6 text-xs text-cotton-50/55">
          <p>
            © {company.founded_year}–<CurrentYear /> {company.name}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
