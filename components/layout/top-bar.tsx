import { Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { whatsappUrl } from "@/lib/links";
import type { Site } from "@/lib/site";

/** Slim announcement bar above the header: the offer in one line, plus direct contacts. */
export function TopBar({ site }: { site: Site }) {
  const { company, contact, commerce } = site;

  return (
    <div className="bg-denim-950 text-cotton-50/75">
      <Container className="flex h-9 items-center justify-between gap-6 text-xs">
        <p className="truncate">
          <span className="mr-2 inline-block size-1.5 -translate-y-px rounded-full bg-stitch-500 align-middle" aria-hidden />
          Made to order in {company.city}, {company.country}
          <span className="hidden sm:inline"> · {commerce.lead_time_days}-day production</span>
          <span className="hidden md:inline"> · Air &amp; sea shipping worldwide</span>
        </p>
        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
            <Mail className="size-3.5" aria-hidden />
            {contact.email}
          </a>
          <a
            href={whatsappUrl(contact.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <WhatsAppIcon className="size-3.5" />
            {contact.phone}
          </a>
        </div>
      </Container>
    </div>
  );
}
