/* Sample orders: types and helpers shared by the sample pages (server) and their forms (client). */

import type { Address, FreightQuote, OrderLine } from "@/lib/account/types";

/** At most this many pieces per sample order, and per color and size (the API checks the same). */
export const MAX_SAMPLE_PIECES = 10;
export const MAX_PER_SIZE = 3;

/** A style for the sample picker. */
export type SampleStyle = {
  slug: string;
  name: string;
  style_no: string | null;
  sizes: string[];
  sample_price_cents: number;
  colors: { id: number; name: string; slug: string; code: string; hex: string | null; image: string | null }[];
};

/** One chosen sample: a color in one size, 1–3 pieces. */
export type SampleItem = { color_id: number; size: string; qty: number };

/** A custom-design sample, priced by staff. */
export type CustomSample = { product: string; description: string; qty: number; files: string[] };

/** POST /v1/account/sample-orders/quote */
export type SampleQuote = {
  lines: OrderLine[];
  custom: { product: string | null; description: string; qty: number } | null;
  pieces: number;
  goods_cents: number;
  courier: FreightQuote;
  total_cents: number | null;
  needs_price: boolean;
  lead_time_days: number;
  addresses: Address[];
  address_id: number | null;
  country_code: string;
  email_verified: boolean;
};

/** "123|M|2": one item in the sample order page's address (?i=…&i=…). */
export function encodeItem(item: SampleItem): string {
  return `${item.color_id}|${item.size}|${item.qty}`;
}

export function decodeItems(values: string[]): SampleItem[] {
  return values
    .map((value) => {
      const [colorId, size, qty] = value.split("|");
      return { color_id: Number(colorId), size: size ?? "", qty: Number(qty) };
    })
    .filter((item) => Number.isInteger(item.color_id) && item.color_id > 0 && item.size !== "" && Number.isInteger(item.qty) && item.qty > 0)
    .slice(0, MAX_SAMPLE_PIECES);
}

/** The sample order page for these samples (and a custom-design sample when asked). */
export function sampleOrderHref(items: SampleItem[], custom: boolean): string {
  const params = new URLSearchParams();
  for (const item of items) params.append("i", encodeItem(item));
  if (custom) params.set("custom", "1");
  return `/samples/order${params.size ? `?${params}` : ""}`;
}
