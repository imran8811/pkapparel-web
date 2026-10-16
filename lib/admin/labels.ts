import type { AddonPricing, OrderStatus } from "@/lib/account/types";
import type { InquiryStatus, InquiryType } from "@/lib/admin/types";

/* Wording used across the admin. */

export const INQUIRY_TYPES: Record<InquiryType, string> = {
  contact: "Message",
  quote: "Quote request",
  sample: "Sample request",
};

export const INQUIRY_STATUSES: Record<InquiryStatus, { label: string; tone: "blue" | "orange" | "green" | "red" | "muted" | "neutral" }> = {
  new: { label: "New", tone: "orange" },
  in_progress: { label: "In progress", tone: "blue" },
  quoted: { label: "Quote sent", tone: "blue" },
  won: { label: "Won", tone: "green" },
  lost: { label: "Lost", tone: "neutral" },
  closed: { label: "Closed", tone: "muted" },
  spam: { label: "Spam", tone: "red" },
};

/** Extra fields sent with quote and sample requests. */
export const INQUIRY_DETAILS: Record<string, string> = {
  product: "Product",
  quantity: "Quantity (pcs)",
  target_price: "Target price (USD)",
  needed_by: "Needed by",
  styles: "Styles",
  sample_quantity: "Number of samples",
};

export function detailLabel(key: string): string {
  return INQUIRY_DETAILS[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export const FAQ_CATEGORIES: { value: string; label: string }[] = [
  { value: "ordering", label: "Ordering" },
  { value: "production", label: "Production" },
  { value: "payment", label: "Payment" },
  { value: "shipping", label: "Shipping" },
  { value: "samples", label: "Samples" },
  { value: "quality", label: "Quality" },
];

type Tone = "blue" | "orange" | "green" | "red" | "muted" | "neutral";

/** Order statuses in the admin, in the order of the order's life. */
export const ORDER_STATUSES: Record<OrderStatus, { label: string; tone: Tone }> = {
  awaiting_deposit: { label: "Awaiting deposit", tone: "orange" },
  payment_review: { label: "Payment to check", tone: "red" },
  confirmed: { label: "Confirmed", tone: "blue" },
  in_production: { label: "In production", tone: "blue" },
  ready_to_ship: { label: "Ready, balance due", tone: "orange" },
  shipped: { label: "Shipped", tone: "green" },
  delivered: { label: "Delivered", tone: "green" },
  on_hold: { label: "On hold", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export const ADDON_PRICING: { value: AddonPricing; label: string }[] = [
  { value: "per_piece", label: "Per piece (× all pieces of the order)" },
  { value: "per_order", label: "Once per order" },
  { value: "on_request", label: "Price on request (quoted later)" },
];
