import type { QuotationCostKey } from "@/lib/admin/types";

/*
 * A quotation style's price, worked out exactly like the API (App\Services\Quotations::price), so the form shows
 * the figures the PDF will print. Whole paisa and cents, halves rounded up, and decimals read as text, so no
 * floating-point error creeps in:
 *
 *   fabric = rate × consumption · cost = fabric + the other costs · profit = % of the cost, or an amount
 *   price = cost + profit → in rupees to the rupee, or ÷ the exchange rate to the cent
 */

export const QUOTATION_COST_KEYS: QuotationCostKey[] = ["cutting", "stitching", "washing", "packing", "printing", "embroidery", "accessories", "overhead", "extra"];

/** "1.35" with 3 places → 1350: a decimal typed in, as a whole number of its smallest unit (half up); 0 when not a number. */
export function scaled(value: string, places: number): number {
  const match = /^(\d*)(?:\.(\d*))?$/.exec(value.trim());
  if (!match || (match[1] === "" && (match[2] ?? "") === "")) return 0;
  const digits = (match[2] ?? "").padEnd(places + 1, "0");
  const whole = Number((match[1] || "0") + digits.slice(0, places));
  return digits[places] >= "5" ? whole + 1 : whole;
}

/** "1,250.50", "Rs 120", "$850" or "" → cents or paisa (125050, 12000, 85000, 0); null when it is not an amount. */
export function amountToCents(value: string): number | null {
  const clean = value.replace(/rs\.?|[,\s$€£]/gi, "");
  if (clean === "") return 0;
  return /^\d+(\.\d+)?$/.test(clean) ? scaled(clean, 2) : null;
}

/** Cents or paisa → what staff typed: 125050 → "1250.50", 12000 → "120", 0 → "". */
export function centsToText(cents: number): string {
  if (!cents) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export type StylePriceInput = {
  fabricRateCents: number;
  fabricConsumption: string;
  costs: Record<QuotationCostKey, number>;
  profitType: "percent" | "amount";
  profitPercent: string;
  profitCents: number;
};

export type StylePrice = { fabricCostCents: number; costCents: number; profitCents: number; priceCents: number; unitPriceCents: number };

export function stylePrice(style: StylePriceInput, currency: string, exchangeRate: string | null): StylePrice {
  const fabric = Math.floor((style.fabricRateCents * scaled(style.fabricConsumption, 3) + 500) / 1000);
  const cost = QUOTATION_COST_KEYS.reduce((sum, key) => sum + (style.costs[key] || 0), fabric);
  const profit = style.profitType === "amount" ? style.profitCents : Math.floor((cost * scaled(style.profitPercent, 2) + 5000) / 10000);
  const price = cost + profit;
  let unit: number;
  if (currency === "PKR") {
    unit = Math.floor((price + 50) / 100) * 100;
  } else {
    const rate = scaled(exchangeRate ?? "", 4);
    unit = rate > 0 ? Math.floor((price * 20000 + rate) / (2 * rate)) : 0;
  }
  return { fabricCostCents: fabric, costCents: cost, profitCents: profit, priceCents: price, unitPriceCents: unit };
}

const wholeRupees = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const rupeesAndPaisa = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** A cost as the costing sheet prints it: 149750 → "Rs 1,497.50", 141700 → "Rs 1,417". */
export function formatPaisa(paisa: number): string {
  const sign = paisa < 0 ? "-" : "";
  const rupees = Math.abs(paisa) / 100;
  return `${sign}Rs ${(Math.abs(paisa) % 100 === 0 ? wholeRupees : rupeesAndPaisa).format(rupees)}`;
}

/** The profit as a share of the cost: 22463 of 149750 → "15%"; "" without a cost. */
export function profitShare(profitCents: number, costCents: number): string {
  if (costCents <= 0) return "";
  const percent = Math.round((profitCents * 1000) / costCents) / 10;
  return `${percent}%`;
}
