import { Container } from "@/components/layout/container";
import { CertificationGrid } from "@/components/site/certification-grid";
import { SectionHeading } from "@/components/site/section-heading";
import { TestimonialGrid } from "@/components/site/testimonial-grid";
import type { Certification, Testimonial } from "@/lib/content";

/** What buyers say, plus the registrations that back us up. */
export function ProofSection({
  testimonials,
  certifications,
}: {
  testimonials: Testimonial[];
  certifications: Certification[];
}) {
  return (
    <section className="border-y border-border bg-cotton-100/60 py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Trusted by buyers"
          title="Brands and stores in the USA, UK and Europe."
          description="Small brands, wholesalers and online sellers order from us again and again."
        />
        <TestimonialGrid testimonials={testimonials} className="mt-12" />
        {certifications.length > 0 && (
          <>
            <h3 className="mt-16 font-mono text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Registered & verified
            </h3>
            <CertificationGrid certifications={certifications} className="mt-5" />
          </>
        )}
      </Container>
    </section>
  );
}
