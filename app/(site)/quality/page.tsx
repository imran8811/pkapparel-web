import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CertificationGrid } from "@/components/site/certification-grid";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { getCertifications, getFactory, getFaqs, mediaSrc } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Quality control & compliance",
  description:
    "How PK Apparel checks every order, from jeans to T-shirts, hoodies and polo shirts: fabric inspection, inline checks, wash approval, measurement and trim checks, and a final inspection before packing.",
  path: "/quality",
});

const checks = [
  { title: "Fabric inspection", body: "Shade, weight, width and visible defects are checked before cutting." },
  { title: "Cutting check", body: "Panels are checked against the pattern and bundled by size and shade." },
  { title: "Inline inspection", body: "Stitching quality is checked on the line, while garments are being sewn." },
  { title: "Wash approval", body: "Every wash lot is compared with the approved standard for shade and finish." },
  { title: "Measurements", body: "Key measurements are checked against the size chart for every size." },
  { title: "Trims", body: "Stitching, buttonholes, rivets, metal buttons and snaps are checked for strength and rust." },
  { title: "Final inspection", body: "Faulty pieces are repaired and inspected again before anything is packed." },
];

export default async function QualityPage() {
  const [certifications, factory, faqs] = await Promise.all([getCertifications(), getFactory(), getFaqs()]);
  const qcPhotos = factory.departments.find((department) => department.slug === "quality")?.images ?? [];

  return (
    <>
      <PageHero
        eyebrow="Quality & compliance"
        title={
          <>
            Quality you can <span className="stitch-underline">check.</span>
          </>
        }
        intro="Quality is checked at every step, not only at the end, for denim and tops alike. Our QA team inspects fabric, stitching, washing, measurements and trims before your order is packed."
        crumbs={[{ label: "Quality", href: "/quality" }]}
      >
        <Button asChild variant="accent" size="lg">
          <Link href="/samples">Order a sample</Link>
        </Button>
        <Button asChild variant="outline-inverse" size="lg">
          <Link href="/factory">See the factory</Link>
        </Button>
      </PageHero>

      <section className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              align="stack"
              eyebrow="Seven checks"
              title="From fabric roll to packed carton."
              description="Third-party inspection before shipment can be arranged on request."
            />
            {qcPhotos.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-3">
                {qcPhotos.map((photo) => (
                  <div key={photo.path} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cotton-100 ring-1 ring-border">
                    <Image src={mediaSrc(photo.path)} alt={photo.alt} fill sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <ol className="space-y-3 lg:col-span-7">
            {checks.map((check, index) => (
              <li key={check.title} className="flex gap-5 rounded-3xl border border-border bg-card p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-denim-900 font-mono text-sm text-cotton-50">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{check.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{check.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {certifications.length > 0 && (
        <section className="border-y border-border bg-cotton-100/60 py-20 lg:py-28">
          <Container>
            <SectionHeading eyebrow="Registered & verified" title="Official registrations." />
            <CertificationGrid certifications={certifications} className="mt-12" />
          </Container>
        </section>
      )}

      <section className="py-20 lg:py-28">
        <Container className="max-w-4xl">
          <SectionHeading align="stack" eyebrow="Questions" title="Quality and samples." />
          <FaqList
            faqs={faqs.filter((faq) => faq.category === "quality" || faq.category === "samples")}
            className="mt-10"
          />
        </Container>
      </section>

      <CtaPanel
        title="See the quality for yourself."
        body="Order a sample of any style before you place a bulk order."
        primary={{ href: "/samples", label: "Order a sample" }}
        secondary={{ href: "/wholesale-shop", label: "Shop wholesale" }}
      />
    </>
  );
}
