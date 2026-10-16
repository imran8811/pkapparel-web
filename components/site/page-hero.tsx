import { Eyebrow } from "@/components/brand/eyebrow";
import { Container } from "@/components/layout/container";
import { Breadcrumbs, type Crumb } from "@/components/site/breadcrumbs";
import { cn } from "@/lib/utils";

/** Dark denim header band used at the top of inner pages. */
export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  crumbs: Crumb[];
  /** Buttons under the intro. */
  children?: React.ReactNode;
  /** Optional right-hand column (image, facts…). */
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-denim-900 text-cotton-50", className)}>
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-56 right-[-20%] size-[40rem] rounded-full bg-denim-600/30 blur-3xl"
      />
      <Container className={cn("relative py-14 sm:py-20", aside && "grid gap-12 lg:grid-cols-12 lg:items-center")}>
        <div className={cn(aside ? "lg:col-span-7" : "max-w-3xl")}>
          <Breadcrumbs items={crumbs} />
          <Eyebrow tone="light" className="mt-8">
            {eyebrow}
          </Eyebrow>
          <h1 className="mt-5 text-4xl leading-[1.02] font-bold tracking-[-0.03em] sm:text-5xl lg:text-6xl">{title}</h1>
          {intro && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-cotton-50/75">{intro}</div>}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
        {aside && <div className="lg:col-span-5">{aside}</div>}
      </Container>
    </section>
  );
}
