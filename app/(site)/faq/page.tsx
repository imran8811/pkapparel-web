import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { getFaqs } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about MOQ, private label, production time, payment by bank transfer, samples, quality control and shipping at PK Apparel.",
  path: "/faq",
});

const GROUPS: { category: string; title: string }[] = [
  { category: "ordering", title: "Ordering" },
  { category: "production", title: "Production" },
  { category: "payment", title: "Payment" },
  { category: "shipping", title: "Shipping" },
  { category: "samples", title: "Samples" },
  { category: "quality", title: "Quality" },
];

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = GROUPS.map((group) => ({ ...group, faqs: faqs.filter((faq) => faq.category === group.category) })).filter(
    (group) => group.faqs.length > 0,
  );

  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            Questions buyers <span className="stitch-underline">ask us.</span>
          </>
        }
        intro="Short answers about ordering, production, payment, shipping, samples and quality. Can't find yours? Message us on WhatsApp."
        crumbs={[{ label: "FAQ", href: "/faq" }]}
      />

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <nav aria-label="FAQ topics" className="lg:col-span-3">
            <ul className="sticky top-28 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {groups.map((group) => (
                <li key={group.category}>
                  <a
                    href={`#${group.category}`}
                    className="block rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-card lg:rounded-xl lg:border-transparent"
                  >
                    {group.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-14 lg:col-span-9">
            {groups.map((group) => (
              <section key={group.category} id={group.category} className="scroll-mt-28">
                <h2 className="text-3xl font-bold tracking-[-0.03em]">{group.title}</h2>
                <FaqList faqs={group.faqs} className="mt-6" />
              </section>
            ))}
          </div>
        </Container>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
      />

      <CtaPanel
        title="Still have a question?"
        body="Our team answers on WhatsApp and by email."
        primary={{ href: "/contact", label: "Contact us" }}
        secondary={{ href: "/how-to-order", label: "How to order" }}
      />
    </>
  );
}
