"use client";

import { CircleCheck } from "lucide-react";
import { useSearchParam } from "@/lib/use-search-param";

/** One-off messages on a stock order after a redirect (?placed=1, ?payment=sent), read after hydration. */
export function StockOrderNotice({ paymentDays }: { paymentDays: number | null }) {
  const placed = useSearchParam("placed");
  const payment = useSearchParam("payment");

  const text = placed
    ? `Thank you, your order is placed. Pay the amount below${paymentDays ? ` within ${paymentDays} days` : ""}, then tell us the transaction ID. We also emailed you the details.`
    : payment === "sent"
      ? "Thank you, we received your payment details. We check the payment and email you a receipt once it is confirmed."
      : null;
  if (!text) return null;

  return (
    <p role="status" className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      {text}
    </p>
  );
}
