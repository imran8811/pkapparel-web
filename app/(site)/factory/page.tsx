import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CtaPanel } from "@/components/site/cta-panel";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { factoryNumbers, getFactory, mediaSrc } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getSite } from "@/lib/site";
import { cn } from "@/lib/utils";
import washingUnit from "@/assets/images/factory-washing-unit.jpg";

export const metadata = pageMetadata({
  title: "Our garment factory in Lahore",
  description:
    "Inside the PK Apparel factory in Lahore: fabric store, cutting, stitching, washing, quality control and packing, all under one roof.",
  path: "/factory",
});

export default async function FactoryPage() {
  const [{ facts, departments }, site] = await Promise.all([getFactory(), getSite()]);
  const numbers = [
    ...factoryNumbers(facts),
    { value: String(departments.length), label: "departments in-house" },
    { value: `${site.commerce.moq_per_color} pcs`, label: "minimum per color" },
    { value: `${site.commerce.lead_time_days} days`, label: "production time" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Our factory"
        title={
          <>
            Fabric in, finished garments <span className="stitch-underline">out.</span>
          </>
        }
        intro="Every PK Apparel order, from jeans to T-shirts, hoodies and polo shirts, is cut, stitched, finished, checked and packed in our own factory on Ferozepur Road, Lahore. Denim is washed in our own laundry. That is how we keep quality consistent and delivery dates realistic."
        crumbs={[{ label: "Our factory", href: "/factory" }]}
        aside={
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl shadow-black/40 ring-1 ring-white/10">
            <Image
              src={washingUnit}
              alt="Washing unit in the PK Apparel factory"
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
          <Link href="/wholesale-shop">Shop wholesale</Link>
        </Button>
        <Button asChild variant="outline-inverse" size="lg">
          <Link href="/request-quote">Request a quote</Link>
        </Button>
      </PageHero>

      {numbers.length > 0 && (
        <section aria-label="Factory in numbers" className="border-b border-border bg-card">
          <Container>
            <dl className="grid grid-cols-2 lg:grid-cols-4">
              {numbers.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex flex-col-reverse gap-2 border-dashed border-border py-8 sm:py-10",
                    index % 2 === 1 && "border-l pl-6 sm:pl-10",
                    index >= 2 && "border-t",
                    "lg:border-t-0 lg:pl-10",
                    index === 0 && "lg:pl-0",
                    index > 0 && "lg:border-l",
                  )}
                >
                  <dt className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{item.label}</dt>
                  <dd className="font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>
      )}

      <section className="py-20 lg:py-28">
        <Container className="space-y-20 lg:space-y-28">
          {departments.map((department, index) => {
            const [main, ...more] = department.images;
            return (
              <article key={department.slug} id={department.slug} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={cn("space-y-3", index % 2 === 1 && "lg:order-2")}>
                  {main && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-cotton-100 ring-1 ring-border">
                      <Image src={mediaSrc(main.path)} alt={main.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  {more.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {more.map((image) => (
                        <div key={image.path} className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-cotton-100 ring-1 ring-border">
                          <Image src={mediaSrc(image.path)} alt={image.alt} fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-mono text-xs tracking-[0.2em] text-denim-600 uppercase">
                    Step {String(index + 1).padStart(2, "0")} of {String(departments.length).padStart(2, "0")}
                  </p>
                  <h2 className="mt-4 text-4xl leading-[1.02] font-bold tracking-[-0.03em] sm:text-5xl">{department.name}</h2>
                  <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{department.summary}</p>
                  {department.stats.length > 0 && (
                    <dl className="mt-8 grid grid-cols-2 gap-3">
                      {department.stats.map((stat) => (
                        <div key={stat.label} className="flex flex-col-reverse gap-1 rounded-2xl border border-border bg-card p-4">
                          <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                          <dd className="font-heading text-2xl font-bold tracking-tight">{stat.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </article>
            );
          })}
        </Container>
      </section>

      <CtaPanel
        title="Want to see your own order being made?"
        body="Once production starts, your buyer account shows every stage, from cutting to packing, with photos from the factory floor."
      />
    </>
  );
}
