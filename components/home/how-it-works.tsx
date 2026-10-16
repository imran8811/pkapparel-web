import Link from "next/link";
import { ArrowRight, Factory, FileText, Landmark, LayoutGrid, Ship } from "lucide-react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import type { Site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function HowItWorks({ site }: { site: Site }) {
  const { deposit_percent: deposit, lead_time_days: leadTime } = site.commerce;

  const steps = [
    {
      icon: LayoutGrid,
      title: "Choose your styles",
      body: "Pick styles, colors and sizes in the wholesale shop, or send us your own design.",
    },
    {
      icon: FileText,
      title: "Place your order",
      body: "Choose air or sea shipping and get your proforma invoice straight away.",
    },
    {
      icon: Landmark,
      title: `Pay a ${deposit}% deposit`,
      body: "A bank transfer confirms your production slot. The balance is due before shipping.",
    },
    {
      icon: Factory,
      title: `We make it in ${leadTime} days`,
      body: "Follow cutting, stitching, washing, QC and packing from your account.",
      highlight: true,
    },
    {
      icon: Ship,
      title: "Ship & receive",
      body: "Pay the balance and we ship by air or sea, with tracking and all documents.",
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow>How ordering works</Eyebrow>
            <h2 className="mt-5 text-4xl leading-[1.02] font-bold tracking-[-0.03em] sm:text-5xl">
              From order to your door in five steps.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground lg:col-span-5">
            Nothing sits in a warehouse. Every order is produced for you, and you see the price, deposit and delivery
            date before you pay.
          </p>
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                "relative flex flex-col rounded-3xl border p-6",
                step.highlight ? "border-transparent bg-denim-900 text-cotton-50 twill-texture" : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full font-mono text-sm",
                    step.highlight ? "bg-stitch-500 text-denim-950" : "bg-denim-900 text-cotton-50",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {index < steps.length - 1 && (
                  <span aria-hidden className="stitch-line hidden flex-1 text-stitch-500/50 lg:block" />
                )}
              </div>
              <step.icon
                aria-hidden
                className={cn("mt-6 size-6 lg:mt-10", step.highlight ? "text-stitch-400" : "text-denim-500")}
              />
              <h3 className="mt-4 text-lg leading-snug font-semibold">{step.title}</h3>
              <p className={cn("mt-2 text-sm leading-relaxed", step.highlight ? "text-cotton-50/70" : "text-muted-foreground")}>
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/how-to-order">
              Read the ordering guide <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/samples">Order a sample first</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
