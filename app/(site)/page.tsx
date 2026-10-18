import { CategoryGrid } from "@/components/home/category-grid";
import { FactsStrip } from "@/components/home/facts-strip";
import { FaqPreview } from "@/components/home/faq-preview";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { PrivateLabelTeaser } from "@/components/home/private-label-teaser";
import { ProcessStrip } from "@/components/home/process-strip";
import { ProofSection } from "@/components/home/proof-section";
import { JsonLd } from "@/components/site/json-ld";
import { getCertifications, getFactory, getFaqs, getTestimonials } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import { getSite } from "@/lib/site";

export default async function HomePage() {
  const [site, factory, testimonials, certifications, faqs] = await Promise.all([
    getSite(),
    getFactory(),
    getTestimonials(),
    getCertifications(),
    getFaqs(),
  ]);
  const featuredFaqs = ["ordering", "production", "payment", "shipping"]
    .map((category) => faqs.find((faq) => faq.category === category))
    .filter((faq) => faq !== undefined);

  return (
    <>
      <Hero site={site} />
      <FactsStrip site={site} />
      <CategoryGrid />
      <ProcessStrip departments={factory.departments} facts={factory.facts} />
      <HowItWorks site={site} />
      <PrivateLabelTeaser />
      <ProofSection testimonials={testimonials} certifications={certifications} />
      <FaqPreview faqs={featuredFaqs} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": ["Organization", "LocalBusiness"],
          name: site.company.name,
          url: absoluteUrl("/"),
          logo: absoluteUrl("/apple-icon.png"),
          email: site.contact.email,
          telephone: site.contact.phone,
          foundingDate: String(site.company.founded_year),
          address: {
            "@type": "PostalAddress",
            streetAddress: site.addresses[0]?.line,
            addressLocality: site.company.city,
            addressCountry: "PK",
          },
          sameAs: Object.values(site.social),
          description:
            "Denim manufacturer and exporter in Lahore, Pakistan. Made-to-order jeans, denim jackets and shorts for men, women and kids, and men's cargo and chino pants.",
        }}
      />
    </>
  );
}
