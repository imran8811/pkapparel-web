import Link from "next/link";
import { Eye, Factory, MapPin, Receipt, Users } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CertificationGrid } from "@/components/site/certification-grid";
import { CtaPanel } from "@/components/site/cta-panel";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { getCertifications } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About PK Apparel",
  description:
    "PK Apparel is a denim manufacturer and exporter in Lahore, Pakistan, making jeans, jackets, shorts, cargo and chino pants to order since 2015.",
  path: "/about",
});

export default async function AboutPage() {
  const [site, certifications] = await Promise.all([getSite(), getCertifications()]);
  const { company, commerce } = site;

  const values = [
    {
      icon: Factory,
      title: "Made to order",
      body: "We keep no stock. Every order is fresh production in the sizes, colors and labels you choose.",
    },
    {
      icon: Users,
      title: "Small brands welcome",
      body: `From ${commerce.moq_per_color} pieces per style and color, so new brands can start small and grow with us.`,
    },
    {
      icon: Receipt,
      title: "No surprises",
      body: "You see the price, deposit, ready date and shipping options before you pay anything.",
    },
    {
      icon: Eye,
      title: "Every step visible",
      body: "Follow your order through cutting, stitching, washing, quality control and packing in your account.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            Denim made in {company.city}, for brands <span className="stitch-underline">worldwide.</span>
          </>
        }
        intro={`PK Apparel is a denim manufacturer and exporter founded in ${company.founded_year}. From our factory on Ferozepur Road we make jeans, jackets, shorts, cargo and chino pants for brands, wholesalers and online sellers in the USA, the UK and Europe.`}
        crumbs={[{ label: "About us", href: "/about" }]}
      >
        <Button asChild variant="accent" size="lg">
          <Link href="/factory">Tour the factory</Link>
        </Button>
        <Button asChild variant="outline-inverse" size="lg">
          <Link href="/contact">Contact us</Link>
        </Button>
      </PageHero>

      <section className="py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="How we work"
            title="A factory that is easy to work with."
            description="Buyers tell us what they value most: honest timelines, fair minimums and quick answers. That is what we focus on."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <li key={value.title} className="rounded-3xl border border-border bg-card p-7">
                <value.icon aria-hidden className="size-7 text-denim-600" />
                <h3 className="mt-6 text-xl font-semibold">{value.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{value.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-border bg-cotton-100/60 py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              align="stack"
              eyebrow="Where to find us"
              title={`Two addresses in ${company.city}.`}
              description="Visits are by appointment. Message us on WhatsApp to arrange one."
            />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {site.addresses.map((address) => (
              <li key={address.label} className="flex flex-col rounded-3xl border border-border bg-card p-7">
                <MapPin aria-hidden className="size-6 text-stitch-600" />
                <h3 className="mt-5 text-xl font-semibold">{address.label}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">
                  {address.line}
                  <br />
                  {address.city}, {address.country}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-6 self-start">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.line}, ${address.city}, ${address.country}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {certifications.length > 0 && (
        <section className="py-20 lg:py-28">
          <Container>
            <SectionHeading eyebrow="Registered & verified" title="Official registrations." />
            <CertificationGrid certifications={certifications} className="mt-12" />
          </Container>
        </section>
      )}

      <CtaPanel
        title="Let's make your next collection."
        body="Browse our styles and order online, or send us your own design for a quote."
      />
    </>
  );
}
