import { Banknote, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { Eyebrow } from "@/components/brand/eyebrow";
import { panelClass } from "@/components/forms/styles";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { icon: ShoppingBag, title: "Order sets online", body: "Pick the styles and colors, see the sets in stock and place your order in a minute." },
  { icon: Banknote, title: "Pay your way", body: "Bank transfer, JazzCash or Easypaisa. Tell us the transaction ID and we confirm it." },
  { icon: Truck, title: "Cargo to your city", body: "We book the cargo once you have paid, or you collect the order yourself." },
  { icon: PackageCheck, title: "Follow every order", body: "Your orders, payments and receipts in one place." },
];

/** Layout of the stock pages' login, signup and password pages: the form, and what a stock account gives. */
export function StockAuthShell({ title, intro, children, wide }: { title: string; intro?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className="bg-cotton-100/60 py-12 sm:py-16 lg:py-20">
      <Container className={cn("grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start", wide ? "" : "max-w-6xl")}>
        <div className={cn("min-w-0", wide ? "lg:col-span-8" : "lg:col-span-7")}>
          <Eyebrow>Stock account</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{title}</h1>
          {intro ? <div className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">{intro}</div> : null}
          <div className={cn(panelClass, "mt-8")}>{children}</div>
        </div>
        <aside className={cn("min-w-0", wide ? "lg:col-span-4" : "lg:col-span-5")}>
          <div className="relative overflow-hidden rounded-3xl bg-denim-900 p-7 text-cotton-50 sm:p-8">
            <div aria-hidden className="absolute inset-0 twill-texture" />
            <ul className="relative grid gap-6">
              {BENEFITS.map(({ icon: Icon, title: benefit, body }) => (
                <li key={benefit} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
                    <Icon aria-hidden className="size-5 text-stitch-300" />
                  </span>
                  <div>
                    <p className="font-semibold">{benefit}</p>
                    <p className="mt-1 text-sm leading-relaxed text-cotton-50/70">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </Container>
    </section>
  );
}
