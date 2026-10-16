import Image from "next/image";
import Link from "next/link";
import { Check, Droplets, Layers, Package, Ruler, Scissors, Tag } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { getFaqs } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";
import flatlay from "@/assets/images/private-label-flatlay.jpg";

export const metadata = pageMetadata({
  title: "Private label denim manufacturing",
  description:
    "Private label jeans, jackets, shorts, cargo and chino pants with your labels, trims, washes and packaging. From 100 pieces per style and color.",
  path: "/private-label",
});

const options = [
  { icon: Ruler, title: "Fit & pattern", body: "Use one of our fits or send your own measurements and graded size chart." },
  { icon: Layers, title: "Fabric", body: "Denim, twill or canvas, stretch or rigid, in the weight and color you need." },
  { icon: Droplets, title: "Wash & finish", body: "From rinse to heavy washes, matched to your approved standard." },
  { icon: Scissors, title: "Trims", body: "Branded buttons, rivets, zips and thread colors to match your style." },
  { icon: Tag, title: "Labels & tags", body: "Woven brand labels, care labels, hang tags and leather or PU patches." },
  { icon: Package, title: "Packaging", body: "Folded and packed in your polybags, with your carton marks and size ratio." },
];

export default async function PrivateLabelPage() {
  const [site, faqs] = await Promise.all([getSite(), getFaqs()]);
  const { moq_per_color: moq, lead_time_days: leadTime, deposit_percent: deposit } = site.commerce;

  const steps = [
    { title: "Share your idea", body: "Send a tech pack, a reference sample or photos, plus quantities and your destination." },
    { title: "Get a quote", body: "We reply with price per piece, minimums, timeline and shipping options." },
    { title: "Approve a sample", body: "We develop a sample of your design, usually in about 2 weeks." },
    { title: "Confirm your order", body: `Pay a ${deposit}% deposit by bank transfer to book your production slot.` },
    { title: "Production", body: `About ${leadTime} days. Follow every stage in your account.` },
    { title: "Shipping", body: "Pay the balance and we ship by air or sea, with full documents." },
  ];

  const checklist = [
    "Tech pack, sample or reference photos",
    "Fabric preferences: weight, stretch and color",
    "Sizes and quantity per size and color",
    "Label, tag and packaging artwork",
    "Destination country and target delivery date",
  ];

  return (
    <>
      <PageHero
        eyebrow="Private label & custom"
        title={
          <>
            Your denim brand, <span className="stitch-underline">made by us.</span>
          </>
        }
        intro={`Start from one of our styles or bring your own design. We make it with your labels, trims and packaging, from ${moq} pieces per style and color.`}
        crumbs={[{ label: "Private label", href: "/private-label" }]}
        aside={
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl shadow-black/40 ring-1 ring-white/10">
            <Image
              src={flatlay}
              alt="Jeans with branded leather patches"
              placeholder="blur"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        }
      >
        <Button asChild variant="accent" size="lg">
          <Link href="/request-quote">Request a quote</Link>
        </Button>
        <Button asChild variant="outline-inverse" size="lg">
          <Link href="/samples">Order a sample</Link>
        </Button>
      </PageHero>

      <section className="py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="What you can customize"
            title="Every detail, your way."
            description="Choose as much or as little as you need. Many brands start with our fits and add their own labels and packaging."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((option) => (
              <li key={option.title} className="rounded-3xl border border-border bg-card p-7">
                <option.icon aria-hidden className="size-7 text-denim-600" />
                <h3 className="mt-6 text-xl font-semibold">{option.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{option.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-denim-950 py-20 text-cotton-50 lg:py-28">
        <div aria-hidden className="absolute inset-0 twill-texture" />
        <Container className="relative">
          <SectionHeading tone="light" eyebrow="How it works" title="From idea to delivered collection." />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <span className="grid size-10 place-items-center rounded-full bg-stitch-500 font-mono text-sm text-denim-950">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-cotton-50/70">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading align="stack" eyebrow="Before you start" title="What to send us." />
            <ul className="mt-8 space-y-3">
              {checklist.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-denim-50 text-denim-600">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <FaqList faqs={faqs.filter((faq) => faq.category === "ordering")} className="lg:col-span-7" />
        </Container>
      </section>

      <CtaPanel
        title="Ready to brief us?"
        body="Tell us what you have in mind. We will come back with a price, a sample plan and a production date."
        primary={{ href: "/request-quote", label: "Request a quote" }}
        secondary={{ href: "/samples", label: "Order a sample" }}
      />
    </>
  );
}
