import { Banknote, MessageCircle, Shirt, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Shirt,
    title: "Choose",
    body: "Pick a style and a color. Each page shows the sizes in one set, the price per set and the sets in stock.",
  },
  {
    icon: MessageCircle,
    title: "Order",
    body: "Send us the style, color and number of sets on WhatsApp, or call us. We confirm the stock and the total.",
  },
  {
    icon: Banknote,
    title: "Pay",
    body: "Pay the full amount by bank transfer, JazzCash or Easypaisa and send us the slip. Your sets are held once the payment is confirmed.",
  },
  {
    icon: Truck,
    title: "Receive",
    body: "We book the cargo to your city and you pay the cargo charges when it arrives. Or collect your order yourself.",
  },
] as const;

/** The four steps of ordering from stock. */
export function StockSteps({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {STEPS.map((step, index) => (
        <li key={step.title} className="rounded-3xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <step.icon aria-hidden className="size-6 text-denim-600" />
            <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
          </div>
          <h3 className="mt-5 font-heading text-lg font-semibold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
