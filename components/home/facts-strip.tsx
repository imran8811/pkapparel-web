import { Container } from "@/components/layout/container";
import type { Site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Four key facts right under the hero. Only verified numbers go here. */
export function FactsStrip({ site }: { site: Site }) {
  const { company, commerce } = site;

  const facts = [
    { value: String(company.founded_year), label: "Making denim since" },
    { value: `${commerce.moq_per_color} pcs`, label: "Minimum per style & color" },
    { value: `${commerce.lead_time_days} days`, label: "Production after deposit" },
    { value: "Air & sea", label: "Shipping to your door or port" },
  ];

  return (
    <section aria-label="Key facts" className="border-b border-border bg-card">
      <Container>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <div
              key={fact.label}
              className={cn(
                // 2×2 grid on phones, one row on desktop, separated by dashed "stitch" lines
                "flex flex-col-reverse gap-2 border-dashed border-border py-8 sm:py-10",
                index % 2 === 1 && "border-l pl-6 sm:pl-10",
                index >= 2 && "border-t",
                "lg:border-t-0 lg:pl-10",
                index === 0 && "lg:pl-0",
                index > 0 && "lg:border-l",
              )}
            >
              <dt className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{fact.label}</dt>
              <dd className="font-heading text-3xl font-bold tracking-[-0.03em] text-denim-950 sm:text-4xl">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
