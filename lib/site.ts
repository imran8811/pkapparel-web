import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "@/lib/api";

export type Address = { label: string; line: string; city: string; country: string };

export type SocialNetwork = "facebook" | "instagram" | "tiktok" | "linkedin" | "youtube";

export type Site = {
  company: {
    name: string;
    legal_name: string | null;
    /** Tax number (FBR NTN), printed on proforma invoices. */
    ntn?: string | null;
    tagline: string;
    founded_year: number;
    city: string;
    country: string;
  };
  contact: { phone: string; whatsapp: string; email: string };
  addresses: Address[];
  social: Partial<Record<SocialNetwork, string>>;
  commerce: {
    currency: string;
    moq_per_color: number;
    set_pcs_per_size: number;
    deposit_percent: number;
    lead_time_days: number;
    sample_price_cents: number;
    shipping_modes: string[];
    /** Days a proforma invoice's prices are valid (default 14). */
    pi_valid_days?: number;
    /** Above this volume (CBM) sea freight is quoted as a full container (default 15). */
    fcl_from_cbm?: number;
    /** Packing used for freight estimates when a style has none of its own. */
    packing?: {
      piece_weight_g: number;
      pcs_per_carton: number;
      carton_length_mm: number;
      carton_width_mm: number;
      carton_height_mm: number;
      carton_weight_g: number;
    };
  };
};

/**
 * Company info, contacts and business defaults from the API.
 * Cached until the admin saves settings (the API then revalidates the "site" tag).
 */
export async function getSite(): Promise<Site> {
  "use cache";
  cacheLife("max");
  cacheTag("site");

  return api<Site>("/v1/site");
}
