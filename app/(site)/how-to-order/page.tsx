import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { getFaqs } from "@/lib/content";
import { formatMoney } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";

export const metadata = pageMetadata({
  title: "How to order wholesale denim",
  description:
    "How ordering works at PK Apparel: MOQ, sizes and sets, prices, bank transfer payment, 30-day production and air or sea shipping.",
  path: "/how-to-order",
});

export default async function HowToOrderPage() {
  const [site, faqs] = await Promise.all([getSite(), getFaqs()]);
  const { moq_per_color: moq, set_pcs_per_size: perSize, min_pcs_per_size: minPerSize, deposit_percent: deposit, lead_time_days: leadTime } = site.commerce;

  const steps = [
    {
      title: "Choose styles, colors and sizes",
      body: `Pick styles in the wholesale shop. The minimum is ${moq} pieces per style and color, with at least ${minPerSize} pieces in each size you order: ${moq} pieces cover up to ${Math.floor(moq / minPerSize)} sizes, and more sizes need more pieces. Enter a quantity for each size, or add ready-made sets (1 set = ${perSize} pieces of every size).`,
    },
    {
      title: "Place your order",
      body: "Create a business account, choose air or sea shipping (or your own forwarder) and place the order. You receive a proforma invoice straight away.",
    },
    {
      title: `Pay the ${deposit}% deposit`,
      body: "Our bank details are shown once your order is placed, on the order page and in the proforma invoice. Pay by bank transfer, then enter the transaction ID on the Confirm payment page.",
    },
    {
      title: "We confirm and start production",
      body: `As soon as the payment is confirmed you get a receipt by email and production starts. It takes about ${leadTime} days, and you can follow every stage in your account.`,
    },
    {
      title: "Pay the balance",
      body: "When your order is packed and ready, we send the final QC result and the balance invoice. Pay and confirm the payment the same way.",
    },
    {
      title: "We ship your order",
      body: "We ship by air or sea and send you the tracking number with the commercial invoice, packing list and bill of lading or airway bill.",
    },
  ];

  const glance = [
    { label: "Minimum order", value: `${moq} pcs per style & color` },
    { label: "Prices", value: "USD per piece, ex-factory (FOB)" },
    { label: "Payment", value: `Bank transfer: ${deposit}% deposit, balance before shipping` },
    { label: "Production", value: `About ${leadTime} days after the deposit` },
    { label: "Shipping", value: "Air, sea or your own forwarder" },
    { label: "Samples", value: `${formatMoney(site.commerce.sample_price_cents)} per piece plus courier` },
  ];

  return (
    <>
      <PageHero
        eyebrow="How to order"
        title={
          <>
            Ordering, step by <span className="stitch-underline">step.</span>
          </>
        }
        intro="Nothing is held in stock: every order is produced for you. Here is exactly what happens between your first click and the goods arriving."
        crumbs={[{ label: "How to order", href: "/how-to-order" }]}
      >
        <Button asChild variant="accent" size="lg">
          <Link href="/wholesale-shop">Start shopping</Link>
        </Button>
        <Button asChild variant="outline-inverse" size="lg">
          <Link href="/request-quote">Request a quote</Link>
        </Button>
      </PageHero>

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <ol className="space-y-4 lg:col-span-7">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-denim-900 font-mono text-sm text-cotton-50">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <aside className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl bg-denim-900 p-7 text-cotton-50 twill-texture sm:p-8">
              <p className="font-mono text-xs tracking-[0.2em] text-stitch-400 uppercase">At a glance</p>
              <dl className="mt-6 divide-y divide-dashed divide-white/15">
                {glance.map((item) => (
                  <div key={item.label} className="grid gap-1 py-4 first:pt-0 last:pb-0">
                    <dt className="text-sm text-cotton-50/60">{item.label}</dt>
                    <dd className="font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </Container>
      </section>

      <section className="border-t border-border bg-cotton-100/60 py-20 lg:py-28">
        <Container className="max-w-4xl">
          <SectionHeading align="stack" eyebrow="Questions" title="Ordering and payment." />
          <FaqList
            faqs={faqs.filter((faq) => ["ordering", "payment", "production"].includes(faq.category))}
            className="mt-10"
          />
        </Container>
      </section>

      <CtaPanel title="Ready when you are." body="Browse our styles and place your first order, or ask us for a quote." />
    </>
  );
}
