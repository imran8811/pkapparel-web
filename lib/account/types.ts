/* Buyer accounts, cart, checkout and orders: types and labels shared by server and client components. */

import type { Segment, ProductType } from "@/lib/nav";
import type { OrderRules, PriceTier, ProductImage } from "@/lib/shop";

export const BUSINESS_TYPES = [
  { value: "brand", label: "Brand owner" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "retailer", label: "Retailer or store" },
  { value: "online_seller", label: "Online or Amazon seller" },
  { value: "importer", label: "Importer or distributor" },
  { value: "other", label: "Other" },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

export type Customer = {
  id: number;
  email: string;
  email_verified: boolean;
  company_name: string;
  contact_name: string;
  business_type: BusinessType;
  country_code: string;
  phone: string;
  website: string | null;
  created_at: string;
};

export type Address = {
  id: number;
  company: string;
  contact_name: string;
  phone: string;
  email: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country_code: string;
  tax_id: string | null;
  is_default: boolean;
};

export type CartColor = {
  color_id: number;
  code: string;
  name: string;
  slug: string;
  hex: string | null;
  image: ProductImage | null;
  size_qty: Record<string, number>;
  pcs: number;
  unit_price_cents: number;
  line_cents: number;
  available: boolean;
  below_moq: boolean;
};

export type CartStyle = {
  product_id: number;
  slug: string;
  name: string;
  style_no: string | null;
  segment: Segment;
  product_type: ProductType;
  sizes: string[];
  available: boolean;
  rules: OrderRules;
  price_cents: number;
  tiers: PriceTier[];
  tier_price_cents: number | null;
  colors: CartColor[];
  pcs: number;
  goods_cents: number;
};

export type Packing = { cartons: number; gross_g: number; volume_cm3: number; cbm: number };

export type Cart = {
  styles: CartStyle[];
  line_count: number;
  total_pcs: number;
  goods_cents: number;
  lead_time_days: number;
  packing: Packing;
  issues: string[];
  can_checkout: boolean;
};

export type ShippingMode = "air" | "sea" | "forwarder";

export type FreightQuote = {
  cost_cents: number | null;
  quoted: boolean;
  reason: "no_rate" | "fcl" | null;
  transit_min_days: number | null;
  transit_max_days: number | null;
  basis: string | null;
};

export type AddonPricing = "per_piece" | "per_order" | "on_request";

export type Addon = {
  id: number;
  name: string;
  description: string | null;
  pricing: AddonPricing;
  price_cents: number | null;
};

export type Checkout = {
  cart: Cart;
  addresses: Address[];
  address_id: number | null;
  country_code: string;
  shipping: Record<ShippingMode, FreightQuote>;
  addons: Addon[];
  deposit_percent: number;
  email_verified: boolean;
};

export type OrderStatus =
  | "awaiting_deposit"
  | "payment_review"
  | "confirmed"
  | "in_production"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "on_hold"
  | "cancelled";

export type FreightStatus = "none" | "estimate" | "final" | "quoted";

export type OrderAmounts = {
  goods_cents: number;
  addons_cents: number;
  has_quoted_addons: boolean;
  freight_cents: number | null;
  freight_status: FreightStatus;
  total_cents: number;
  deposit_percent: number;
  deposit_cents: number;
  balance_cents: number;
  paid_cents: number;
  due_now_cents: number;
};

export type OrderLine = {
  product_id: number | null;
  color_id: number | null;
  style_no: string | null;
  style_name: string;
  style_slug: string;
  segment: Segment;
  product_type: ProductType;
  color_code: string;
  color_name: string;
  color_hex: string | null;
  image_path: string | null;
  size_qty: Record<string, number>;
  qty: number;
  unit_price_cents: number;
  line_cents: number;
};

export type OrderAddon = {
  id: number;
  name: string;
  pricing: AddonPricing;
  unit_price_cents: number | null;
  qty: number;
  line_cents: number | null;
};

export type PaymentStatus = "submitted" | "confirmed" | "rejected";

export type Payment = {
  /** Staff views only. */
  id?: number;
  kind: "deposit" | "balance";
  kind_label: string;
  amount_cents: number;
  currency: string;
  transaction_id: string;
  transferred_on: string;
  payer_name: string;
  payer_bank: string;
  has_slip: boolean;
  notes: string | null;
  status: PaymentStatus;
  status_label: string;
  rejection_reason: string | null;
  receipt_no: string | null;
  /** What actually arrived (confirmed payments; bank fees can make it less than reported). */
  received_cents: number | null;
  received_on: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type OrderEvent = {
  type: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus | null;
  note: string | null;
  actor_type: "customer" | "staff" | "system";
  created_at: string;
};

export type StageStatus = "not_started" | "in_progress" | "done";

export type ProductionStage = {
  key: "fabric" | "cutting" | "stitching" | "washing" | "finishing" | "qc" | "packing";
  label: string;
  status: StageStatus;
  started_on: string | null;
  completed_on: string | null;
  note: string | null;
};

export type ProductionPhoto = { id: number; stage: ProductionStage["key"] | null; caption: string | null; width: number; height: number; created_at: string };

/** A document of the order: made by the site (proforma, invoice, receipt) or a file attached by staff. */
export type OrderDocumentItem =
  | { kind: "proforma" | "invoice" | "receipt"; title: string; number: string; date: string | null }
  | {
      kind: "file";
      id: number;
      type: string;
      type_label: string;
      title: string;
      date: string;
      mime: string;
      size_bytes: number;
      /** Staff views only. */
      is_public?: boolean;
    };

export type Shipment = {
  carrier: string;
  tracking_no: string | null;
  tracking_url: string | null;
  shipped_on: string;
  cartons: number | null;
  gross_g: number | null;
  note: string | null;
};

export type BankDetails = {
  beneficiary: string | null;
  bank_name: string | null;
  branch: string | null;
  bank_address: string | null;
  account_number: string | null;
  iban: string | null;
  swift: string | null;
  notes: string | null;
};

export type Order = {
  order_no: string;
  status: OrderStatus;
  status_label: string;
  placed_at: string;
  valid_until: string;
  currency: string;
  shipping_mode: ShippingMode;
  shipping_mode_label: string;
  incoterm: string;
  buyer_reference: string | null;
  notes: string | null;
  customer: { company_name: string; contact_name: string; email: string; phone: string; country_code: string; business_type: BusinessType };
  address: Omit<Address, "id" | "is_default">;
  forwarder: { name: string | null; contact: string | null } | null;
  total_pcs: number;
  lead_time_days: number;
  packing: Packing & { freight?: FreightQuote | null };
  lines: OrderLine[];
  addons: OrderAddon[];
  amounts: OrderAmounts;
  payments: Payment[];
  events: OrderEvent[];
  next_payment_kind: "deposit" | "balance" | null;
  can_submit_payment: boolean;
  can_cancel: boolean;
  bank: BankDetails | null;
  confirmed_at: string | null;
  production_due_on: string | null;
  /** Days until the production due date (negative when late); null when not in production. */
  production_days_left: number | null;
  stages: ProductionStage[];
  photos: ProductionPhoto[];
  documents: OrderDocumentItem[];
  shipment: Shipment | null;
  balance_invoice_no: string | null;
  balance_invoiced_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

export type OrderSummary = {
  order_no: string;
  status: OrderStatus;
  status_label: string;
  placed_at: string;
  total_pcs: number;
  shipping_mode: ShippingMode;
  shipping_mode_label: string;
  styles: string[];
  color_count: number;
  image_path: string | null;
  total_cents: number;
  freight_status: FreightStatus;
  due_now_cents: number;
  buyer_reference: string | null;
};

/** Badge colors per order status (Tailwind classes). */
export const STATUS_TONE: Record<OrderStatus, string> = {
  awaiting_deposit: "bg-orange-50 text-stitch-700 ring-orange-200",
  payment_review: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-denim-50 text-denim-700 ring-denim-200",
  in_production: "bg-denim-50 text-denim-700 ring-denim-200",
  ready_to_ship: "bg-orange-50 text-stitch-700 ring-orange-200",
  shipped: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  on_hold: "bg-stone-100 text-stone-700 ring-stone-200",
  cancelled: "bg-stone-100 text-stone-600 ring-stone-200",
};

export const SHIPPING_MODE_LABELS: Record<ShippingMode, string> = {
  air: "Air freight",
  sea: "Sea freight",
  forwarder: "Your own forwarder",
};

/** "5–8 days" from a freight quote, or null. */
export function transitText(quote: Pick<FreightQuote, "transit_min_days" | "transit_max_days">): string | null {
  const { transit_min_days: min, transit_max_days: max } = quote;
  if (min && max) return min === max ? `${min} days` : `${min}–${max} days`;
  if (min || max) return `${min ?? max} days`;
  return null;
}
