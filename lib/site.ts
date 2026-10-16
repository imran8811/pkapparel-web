import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "@/lib/api";

export type Address = { label: string; line: string; city: string; country: string };

export type SocialNetwork = "facebook" | "instagram" | "tiktok" | "linkedin" | "youtube";

export type Site = {
  company: {
    name: string;
    legal_name: string | null;
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
