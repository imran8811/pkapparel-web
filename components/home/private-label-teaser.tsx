import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import flatlay from "@/assets/images/private-label-flatlay.jpg";

const options = [
  "Your woven labels, care labels and hang tags",
  "Leather or PU patches, branded buttons and rivets",
  "Your choice of fabric, wash, fit and colors",
  "Packed in your polybags and cartons",
];

export function PrivateLabelTeaser() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-cotton-100 ring-1 ring-border">
            <Image
              src={flatlay}
              alt="Jeans with branded leather patches, ready for private label"
              placeholder="blur"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-6 rounded-2xl bg-denim-900 px-5 py-4 text-cotton-50 shadow-xl sm:left-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stitch-400 uppercase">Private label</p>
            <p className="mt-1 font-heading text-xl font-semibold">Same MOQ: 100 pcs per color</p>
          </div>
        </div>

        <div>
          <Eyebrow>Private label & custom</Eyebrow>
          <h2 className="mt-5 text-4xl leading-[1.02] font-bold tracking-[-0.03em] sm:text-5xl">
            Your brand, made in <span className="text-denim-600">our factory.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Start from one of our styles or send us your own design and tech pack. We develop a sample for your approval,
            then produce your collection with your branding on every piece.
          </p>
          <ul className="mt-7 space-y-3">
            {options.map((option) => (
              <li key={option} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-denim-50 text-denim-600">
                  <Check className="size-3.5" />
                </span>
                {option}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/private-label">
                How private label works <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/request-quote">Request a quote</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
