import { Palette, Shirt } from "lucide-react";
import { Container } from "@/components/layout/container";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { getFaqs } from "@/lib/content";
import { countryOptions, formatMoney } from "@/lib/format";
import { whatsappUrl } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Order samples",
  description:
    "Check fit, fabric and wash before you order. Samples of PK Apparel styles cost $50 per piece plus courier; custom samples take about 2 weeks.",
  path: "/samples",
});

export default async function SamplesPage() {
  const [site, faqs] = await Promise.all([getSite(), getFaqs()]);
  const price = formatMoney(site.commerce.sample_price_cents);

  const options = [
    {
      icon: Shirt,
      title: "Samples of our styles",
      price: `${price} per piece`,
      body: "Any style from the wholesale shop, in your chosen size and color. Courier cost is added at cost.",
    },
    {
      icon: Palette,
      title: "Samples of your design",
      price: "Priced by design",
      body: "Made from your tech pack or reference, usually in about 2 weeks. You approve it before bulk production.",
    },
  ];

  const steps = [
    "Send the request below with the styles you want.",
    "We confirm the price and courier cost for your country.",
    "You pay by bank transfer and confirm the payment.",
    "We make or pick your samples and send them with tracking.",
  ];

  return (
    <>
      <PageHero
        eyebrow="Samples"
        title={
          <>
            Check it before you <span className="stitch-underline">order.</span>
          </>
        }
        intro="Feel the fabric, check the fit and see the wash in person. Samples are the easiest way to start working with us."
        crumbs={[{ label: "Samples", href: "/samples" }]}
      />

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-5">
            <ul className="space-y-4">
              {options.map((option) => (
                <li key={option.title} className="rounded-3xl border border-border bg-card p-7">
                  <option.icon aria-hidden className="size-7 text-denim-600" />
                  <h2 className="mt-5 text-xl font-semibold">{option.title}</h2>
                  <p className="mt-1 font-heading text-2xl font-bold text-denim-600">{option.price}</p>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{option.body}</p>
                </li>
              ))}
            </ul>
            <div>
              <h2 className="font-mono text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">How it works</h2>
              <ol className="mt-5 space-y-4">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-denim-900 font-mono text-xs text-cotton-50">
                      {index + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="lg:col-span-7">
            <InquiryForm
              type="sample"
              countries={countryOptions()}
              whatsappUrl={whatsappUrl(site.contact.whatsapp)}
              submitLabel="Request samples"
            />
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-cotton-100/60 py-20 lg:py-28">
        <Container className="max-w-4xl">
          <SectionHeading align="stack" eyebrow="Questions" title="Samples and quality." />
          <FaqList faqs={faqs.filter((faq) => faq.category === "samples" || faq.category === "quality")} className="mt-10" />
        </Container>
      </section>
    </>
  );
}
