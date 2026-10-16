import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { type Department, type FactoryFacts, factoryNumbers, mediaSrc } from "@/lib/content";

/** The production line, department by department, with real factory photos. */
export function ProcessStrip({ departments, facts }: { departments: Department[]; facts: FactoryFacts }) {
  const numbers = [
    ...factoryNumbers(facts),
    { value: String(departments.length), label: "departments under one roof" },
  ];
  const columns =
    numbers.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : numbers.length === 3 ? "grid-cols-3" : numbers.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <section className="relative overflow-hidden bg-denim-950 py-20 text-cotton-50 lg:py-28">
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <Container className="relative">
        <SectionHeading
          tone="light"
          eyebrow="Inside our factory"
          title={
            <>
              One roof, from fabric <span className="stitch-underline">to carton.</span>
            </>
          }
          description="Cutting, stitching, washing, quality control and packing all happen in our own Lahore factory, so we control quality and delivery dates."
        />

        <dl className={`mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 ${columns}`}>
          {numbers.map((item) => (
            <div key={item.label} className="flex flex-col-reverse gap-1 bg-denim-950 p-6">
              <dt className="text-sm text-cotton-50/60">{item.label}</dt>
              <dd className="font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{item.value}</dd>
            </div>
          ))}
        </dl>

        <ol className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {departments.map((department, index) => {
            const image = department.images[0];
            return (
              <li key={department.slug} className="w-64 shrink-0 snap-start lg:w-auto">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-denim-900 ring-1 ring-white/10">
                  {image && (
                    <Image src={mediaSrc(image.path)} alt={image.alt} fill sizes="(min-width: 1024px) 16vw, 256px" className="object-cover" />
                  )}
                  <span className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-stitch-500 font-mono text-xs text-denim-950">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-4 font-heading text-lg font-semibold">{department.name}</p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-cotton-50/65">{department.summary}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-10">
          <Button asChild variant="inverse">
            <Link href="/factory">
              Tour the factory <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
