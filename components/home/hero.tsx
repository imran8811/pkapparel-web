import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package, Plane, Ship, Tag, Timer } from "lucide-react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import type { Site } from "@/lib/site";
import factoryPhoto from "@/assets/images/factory-washing-unit.jpg";
import chinoPhoto from "@/assets/images/men-chino-cream-pk9652.jpg";
import jeansPhoto from "@/assets/images/men-jeans-mid-blue-pk1058.jpg";

export function Hero({ site }: { site: Site }) {
  const { company, commerce } = site;

  const promises = [
    { icon: Package, text: `MOQ ${commerce.moq_per_color} pcs per color` },
    { icon: Timer, text: `${commerce.lead_time_days}-day production` },
    { icon: Tag, text: "Private label available" },
  ];

  return (
    <section className="relative overflow-hidden bg-denim-900 text-cotton-50">
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 right-[-15%] size-[46rem] rounded-full bg-denim-600/35 blur-3xl"
      />

      <Container className="relative grid gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pt-24 lg:pb-28">
        <div className="lg:col-span-7">
          <Eyebrow tone="light">
            Denim manufacturer · {company.city}, {company.country} · Since {company.founded_year}
          </Eyebrow>

          <h1 className="mt-7 text-[3.25rem] leading-[0.92] font-bold tracking-[-0.035em] sm:text-7xl xl:text-[5.75rem]">
            Denim, made to <span className="stitch-underline text-stitch-400">your&nbsp;order.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-cotton-50/75 sm:text-xl">
            Jeans, jackets and shorts for men, women and kids, and men&apos;s cargo and chino pants. Cut, sewn and washed in our own{" "}
            {company.city} factory, then shipped worldwide by air or sea.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/wholesale-shop">
                Shop wholesale
                <ArrowRight className="transition-transform duration-200 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline-inverse" size="lg">
              <Link href="/request-quote">Request a quote</Link>
            </Button>
          </div>

          <ul className="mt-11 grid gap-x-6 gap-y-3 text-sm text-cotton-50/80 sm:grid-cols-3">
            {promises.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-full bg-white/8 ring-1 ring-white/10">
                  <Icon className="size-4 text-stitch-400" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:col-span-5 lg:max-w-none">
          <div className="grid aspect-[5/6] grid-cols-6 grid-rows-6 gap-3">
            <figure className="relative col-span-4 col-start-3 row-span-4 row-start-1 overflow-hidden rounded-[1.75rem] bg-white shadow-2xl shadow-black/40">
              <Image
                src={jeansPhoto}
                alt="Men's mid-blue stretch jeans, style PK-1058"
                placeholder="blur"
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 28vw, 60vw"
                className="size-full object-cover object-top"
              />
              <figcaption className="absolute top-4 right-4 rounded-full bg-denim-950/80 px-3 py-1 font-mono text-[10px] tracking-[0.15em] text-cotton-50 uppercase backdrop-blur">
                PK-1058 · Mid blue
              </figcaption>
            </figure>

            <figure className="relative z-10 col-span-3 col-start-1 row-span-3 row-start-2 overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/30 ring-4 ring-denim-900">
              <Image
                src={chinoPhoto}
                alt="Men's cream stretch chino pants, style PK-9652"
                placeholder="blur"
                sizes="(min-width: 1024px) 20vw, 45vw"
                className="size-full object-cover object-top"
              />
            </figure>

            <figure className="relative z-20 col-span-5 col-start-1 row-span-2 row-start-5 overflow-hidden rounded-3xl shadow-xl shadow-black/30 ring-4 ring-denim-900">
              <Image
                src={factoryPhoto}
                alt="Washing unit in our Lahore factory"
                placeholder="blur"
                sizes="(min-width: 1024px) 30vw, 75vw"
                className="size-full object-cover"
              />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur">
                Washing unit · {company.city} factory
              </figcaption>
            </figure>
          </div>

          <div className="absolute -top-4 -left-2 z-30 rounded-2xl bg-cotton-50 px-4 py-3 text-denim-950 shadow-xl sm:-left-5">
            <p className="font-heading text-3xl leading-none font-bold">{commerce.lead_time_days} days</p>
            <p className="mt-1 text-xs leading-snug text-denim-950/65">
              from deposit to
              <br />
              ready-to-ship
            </p>
          </div>

          <div className="absolute right-0 bottom-[36%] z-30 flex items-center gap-2 rounded-full bg-stitch-500 py-2 pr-4 pl-3 text-sm font-medium text-denim-950 shadow-xl">
            <Plane className="size-4" aria-hidden />
            <Ship className="size-4" aria-hidden />
            Air or sea, worldwide
          </div>
        </div>
      </Container>
    </section>
  );
}
