import { BadgeCheck, FileText, Factory, Truck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/brand/eyebrow";
import { panelClass } from "@/components/forms/styles";
import { cn } from "@/lib/utils";

/** Layout of the login, signup and password pages: the form on a card, and what a buyer account gives. */
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  wide,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  /** The signup form needs more room. */
  wide?: boolean;
}) {
  return (
    <section className="bg-cotton-100/60 py-12 sm:py-16 lg:py-20">
      <Container className={cn("grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start", wide ? "" : "max-w-6xl")}>
        <div className={cn("min-w-0", wide ? "lg:col-span-8" : "lg:col-span-7")}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{title}</h1>
          {intro ? <div className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">{intro}</div> : null}
          <div className={cn(panelClass, "mt-8")}>{children}</div>
        </div>
        <aside className={cn("min-w-0", wide ? "lg:col-span-4" : "lg:col-span-5")}>
          <BuyerBenefits />
        </aside>
      </Container>
    </section>
  );
}

const BENEFITS = [
  { icon: Factory, title: "Order straight from the factory", body: "Pick styles, colors and sizes, see the total and place the order in minutes." },
  { icon: FileText, title: "Proforma invoice at once", body: "Your PI and our bank details arrive as soon as you order." },
  { icon: BadgeCheck, title: "Payments you can follow", body: "Report each transfer online and get an emailed receipt when it is confirmed." },
  { icon: Truck, title: "Air, sea or your forwarder", body: "Freight estimates at checkout, and tracking once your order ships." },
];

function BuyerBenefits() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-denim-900 p-7 text-cotton-50 sm:p-8">
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <div className="relative">
        <p className="font-mono text-xs tracking-[0.2em] text-stitch-400 uppercase">Buyer account</p>
        <ul className="mt-6 grid gap-6">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
                <Icon aria-hidden className="size-5 text-stitch-300" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-cotton-50/70">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
