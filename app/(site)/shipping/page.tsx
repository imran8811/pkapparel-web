import Link from "next/link";
import { FileText, Plane, Ship, Truck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { getFaqs } from "@/lib/content";
import { shippingModes } from "@/lib/shipping";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shipping by air or sea",
  description:
    "PK Apparel ships wholesale denim orders worldwide by air or sea, or hands them to your own forwarder. Transit times, Incoterms and documents explained.",
  path: "/shipping",
});

const icons = { air: Plane, sea: Ship, forwarder: Truck };
const modes = shippingModes.map((mode) => ({ ...mode, icon: icons[mode.key] }));

const terms = [
  { code: "EXW", name: "Ex works", body: "You collect the goods from our factory and handle everything after that." },
  { code: "FOB", name: "Free on board", body: "We deliver the goods to the port or airport in Pakistan. You pay freight from there." },
  { code: "CIF", name: "Cost, insurance & freight", body: "We pay freight and insurance to your port. You clear the goods and pay duties." },
  { code: "DAP", name: "Delivered at place", body: "We deliver to your door. You pay import duties and taxes on arrival." },
];

const documents = [
  "Commercial invoice",
  "Packing list with carton details",
  "Airway bill (air) or bill of lading (sea)",
  "Certificate of origin, on request",
];

export default async function ShippingPage() {
  const faqs = await getFaqs();

  return (
    <>
      <PageHero
        eyebrow="Shipping & delivery"
        title={
          <>
            By air or by sea, <span className="stitch-underline">worldwide.</span>
          </>
        }
        intro="Choose how your order travels when you check out. You see a freight estimate before you order, and the final freight cost is confirmed on your proforma invoice."
        crumbs={[{ label: "Shipping", href: "/shipping" }]}
      >
        <Button asChild variant="accent" size="lg">
          <Link href="/wholesale-shop">Shop wholesale</Link>
        </Button>
        <Button asChild variant="outline-inverse" size="lg">
          <Link href="/contact">Ask about shipping</Link>
        </Button>
      </PageHero>

      <section className="py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="Three ways to ship"
            title="Pick speed or savings."
            description="Transit times are typical times after the goods leave Pakistan. Production time comes first."
          />
          <ul className="mt-12 grid gap-4 lg:grid-cols-3">
            {modes.map((mode) => (
              <li key={mode.name} className="flex flex-col rounded-3xl border border-border bg-card p-7">
                <mode.icon aria-hidden className="size-8 text-denim-600" />
                <h2 className="mt-6 text-2xl font-semibold tracking-tight">{mode.name}</h2>
                <dl className="mt-5 space-y-4 text-[15px]">
                  <div>
                    <dt className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Transit</dt>
                    <dd className="mt-1">{mode.transit}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Best for</dt>
                    <dd className="mt-1">{mode.bestFor}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Priced</dt>
                    <dd className="mt-1">{mode.priced}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-border bg-cotton-100/60 py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading align="stack" eyebrow="Incoterms in plain words" title="Who pays for what." />
            <dl className="mt-10 grid gap-3 sm:grid-cols-2">
              {terms.map((term) => (
                <div key={term.code} className="rounded-3xl border border-border bg-card p-6">
                  <dt>
                    <span className="font-mono text-sm font-semibold text-denim-600">{term.code}</span>
                    <span className="ml-2 font-semibold">{term.name}</span>
                  </dt>
                  <dd className="mt-2 leading-relaxed text-muted-foreground">{term.body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-denim-900 p-7 text-cotton-50 twill-texture sm:p-8">
              <FileText aria-hidden className="size-7 text-stitch-400" />
              <h3 className="mt-5 text-2xl font-semibold tracking-tight">Documents with every shipment</h3>
              <ul className="mt-5 space-y-3">
                {documents.map((document) => (
                  <li key={document} className="flex gap-3 text-cotton-50/80">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-stitch-500" />
                    {document}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-dashed border-white/15 pt-5 text-sm text-cotton-50/60">
                Import duties and taxes at the destination are paid by the buyer, unless we agree otherwise in writing.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="max-w-4xl">
          <SectionHeading align="stack" eyebrow="Questions" title="Shipping questions." />
          <FaqList faqs={faqs.filter((faq) => faq.category === "shipping")} className="mt-10" />
        </Container>
      </section>

      <CtaPanel
        title="Need a freight estimate?"
        body="Tell us the styles, quantities and destination and we will suggest the best way to ship."
        primary={{ href: "/request-quote", label: "Request a quote" }}
        secondary={{ href: "/contact", label: "Contact us" }}
      />
    </>
  );
}
