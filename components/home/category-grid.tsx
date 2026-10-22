import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";
import cargo from "@/assets/images/cargo-camo-pk4336.jpg";
import chinos from "@/assets/images/men-chino-cream-pk9652.jpg";
import jacket from "@/assets/images/denim-jacket.jpg";
import jeans from "@/assets/images/men-jeans-mid-blue-pk1058.jpg";
import shorts from "@/assets/images/jeans-shorts.jpg";

type Category = { title: string; note: string; href: string; image: StaticImageData; alt: string; wide?: boolean };

const categories: Category[] = [
  { title: "Jeans pants", note: "Slim, straight, flare and wide fits, stretch or rigid", href: "/wholesale-shop?type=jeans-pant", image: jeans, alt: "Men's mid-blue stretch jeans", wide: true },
  { title: "Denim jackets", note: "For men and women", href: "/wholesale-shop?type=denim-jacket", image: jacket, alt: "Washed denim jacket" },
  { title: "Jeans shorts", note: "Clean or ripped finishes", href: "/wholesale-shop?type=jeans-short", image: shorts, alt: "Ripped denim shorts" },
  { title: "Cargo trousers", note: "Solid colors and camo", href: "/wholesale-shop?type=cargo-trouser", image: cargo, alt: "Camouflage cargo trousers" },
  { title: "Chino pants", note: "Stretch cotton in many colors", href: "/wholesale-shop?type=chino-pant", image: chinos, alt: "Cream stretch chino pants" },
];

/** Tops have no photos yet, so their card is text only, with a link per type. */
const tops = [
  { label: "T-shirts", href: "/wholesale-shop?type=t-shirt" },
  { label: "Hoodies", href: "/wholesale-shop?type=hoodie" },
  { label: "Polo shirts", href: "/wholesale-shop?type=polo-shirt" },
];

/** "What we make": the product groups, each linking into the shop. */
export function CategoryGrid() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="What we make"
          title={
            <>
              Apparel for men <span className="text-denim-600">and women.</span>
            </>
          }
          description="Every style is made to order in your colors, sizes and labels, from 100 pieces per color. Kids' styles on request."
        />

        {/* 3×3 on desktop: the wide card takes 2×2, five cards fill the rest. The tops card spans the last row on phones. */}
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.title} className={cn(category.wide && "col-span-2 row-span-2")}>
              <Link
                href={category.href}
                className="group relative flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-3xl bg-white ring-1 ring-border sm:min-h-64"
              >
                <Image
                  src={category.image}
                  alt={category.alt}
                  placeholder="blur"
                  fill
                  sizes={category.wide ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 50vw"}
                  className="object-cover object-top transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
                />
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-denim-950/85 via-denim-950/30 to-transparent" />
                <div className="relative flex items-end justify-between gap-3 p-4 text-cotton-50 sm:p-5">
                  <div>
                    <p className={cn("font-heading leading-tight font-semibold", category.wide ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl")}>
                      {category.title}
                    </p>
                    <p className="mt-1 hidden text-sm text-cotton-50/75 sm:block">{category.note}</p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cotton-50 text-denim-950 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
          <li className="col-span-2 lg:col-span-1">
            <div className="relative flex h-full min-h-56 flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-denim-900 p-4 text-cotton-50 sm:min-h-64 sm:p-5">
              <div aria-hidden className="absolute inset-0 twill-texture" />
              <p className="relative font-mono text-[10px] tracking-[0.2em] text-stitch-400 uppercase">Tops</p>
              <div className="relative">
                <p className="font-heading text-lg leading-tight font-semibold sm:text-xl">T-shirts, hoodies and polo shirts</p>
                <p className="mt-1 text-sm text-cotton-50/75">Cut and sewn in our factory, for men and women</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {tops.map((top) => (
                    <li key={top.href}>
                      <Link
                        href={top.href}
                        className="inline-flex items-center gap-1 rounded-full bg-cotton-50 px-3 py-1.5 text-sm font-medium text-denim-950 transition-colors hover:bg-white"
                      >
                        {top.label} <ArrowUpRight aria-hidden className="size-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </Container>
    </section>
  );
}
