import { Container } from "@/components/layout/container";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { PageHero } from "@/components/site/page-hero";
import { countryOptions } from "@/lib/format";
import { whatsappUrl } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Request a quote",
  description:
    "Get a price for custom or private label jeans, jackets, shorts, cargo and chino pants. Tell us the product, quantity and destination.",
  path: "/request-quote",
});

export default async function RequestQuotePage() {
  const site = await getSite();
  const { moq_per_color: moq, lead_time_days: leadTime } = site.commerce;

  const next = [
    { title: "We review your request", body: "We check fabric, wash and trims, and ask questions if anything is unclear." },
    { title: "You get a quote", body: `Price per piece, minimums (from ${moq} pcs per color), sample plan and shipping options.` },
    { title: "Sample, then production", body: `After you approve the sample and pay the deposit, production takes about ${leadTime} days.` },
  ];

  return (
    <>
      <PageHero
        eyebrow="Request a quote"
        title={
          <>
            Tell us what you <span className="stitch-underline">need.</span>
          </>
        }
        intro="For your own designs, private label or large orders. The more detail you share, the more accurate our quote will be."
        crumbs={[{ label: "Request a quote", href: "/request-quote" }]}
      />

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7 lg:order-2">
            <InquiryForm
              type="quote"
              countries={countryOptions()}
              whatsappUrl={whatsappUrl(site.contact.whatsapp)}
              submitLabel="Send quote request"
            />
          </div>
          <aside className="lg:col-span-5">
            <h2 className="font-mono text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">What happens next</h2>
            <ol className="mt-6 space-y-4">
              {next.map((step, index) => (
                <li key={step.title} className="flex gap-5 rounded-3xl border border-border bg-card p-6">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-denim-900 font-mono text-sm text-cotton-50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-3xl bg-denim-900 p-6 text-sm leading-relaxed text-cotton-50/80 twill-texture">
              <strong className="text-cotton-50">Have a tech pack?</strong> Attach it to the form (PDF, Excel, Word, Illustrator or photos), or share a link
              to bigger files. You can also email it to{" "}
              <a href={`mailto:${site.contact.email}`} className="text-stitch-300 underline underline-offset-2">
                {site.contact.email}
              </a>{" "}
              with your quote reference.
            </p>
          </aside>
        </Container>
      </section>
    </>
  );
}
