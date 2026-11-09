"use server";

import { refresh, updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";

const GROUPS = ["company", "contact", "addresses", "social", "commerce", "factory_facts", "bank", "stock", "stock_payment"] as const;
type Group = (typeof GROUPS)[number];

function bodyFor(group: Group, form: FormData): Record<string, unknown> {
  switch (group) {
    case "company":
      return {
        name: text(form, "name"),
        legal_name: optional(form, "legal_name"),
        ntn: optional(form, "ntn"),
        tagline: text(form, "tagline"),
        founded_year: number(form, "founded_year"),
        city: text(form, "city"),
        country: text(form, "country"),
      };
    case "contact":
      return { phone: text(form, "phone"), whatsapp: text(form, "whatsapp"), email: text(form, "email") };
    case "addresses":
      return { addresses: jsonList(form, "addresses") };
    case "social":
      return Object.fromEntries(
        ["facebook", "instagram", "tiktok", "linkedin", "youtube"].map((network) => [network, optional(form, network)]),
      );
    case "commerce": {
      const samplePrice = number(form, "sample_price");
      return {
        moq_per_color: number(form, "moq_per_color"),
        set_pcs_per_size: number(form, "set_pcs_per_size"),
        min_pcs_per_size: number(form, "min_pcs_per_size"),
        deposit_percent: number(form, "deposit_percent"),
        lead_time_days: number(form, "lead_time_days"),
        sample_price_cents: samplePrice === null ? null : Math.round(samplePrice * 100),
        sample_lead_time_days: number(form, "sample_lead_time_days"),
        custom_sample_lead_time_days: number(form, "custom_sample_lead_time_days"),
        pi_valid_days: number(form, "pi_valid_days"),
        fcl_from_cbm: number(form, "fcl_from_cbm"),
        // The form uses centimeters and kilograms; the API stores millimeters and grams.
        packing: {
          piece_weight_g: number(form, "piece_weight_g"),
          pcs_per_carton: number(form, "pcs_per_carton"),
          carton_length_mm: scaled(number(form, "carton_length_cm"), 10),
          carton_width_mm: scaled(number(form, "carton_width_cm"), 10),
          carton_height_mm: scaled(number(form, "carton_height_cm"), 10),
          carton_weight_g: scaled(number(form, "carton_weight_kg"), 1000),
        },
      };
    }
    case "factory_facts":
      return {
        monthly_capacity: optional(form, "monthly_capacity"),
        machines: optional(form, "machines"),
        workers: optional(form, "workers"),
        qa_staff: optional(form, "qa_staff"),
      };
    case "bank":
      return Object.fromEntries(
        ["beneficiary", "bank_name", "branch", "bank_address", "account_number", "iban", "swift", "notes"].map((key) => [key, optional(form, key)]),
      );
    case "stock":
      return {
        min_sets_per_order: number(form, "min_sets_per_order"),
        dispatch_days: number(form, "dispatch_days"),
        payment_days: number(form, "payment_days"),
        pickup_address: optional(form, "pickup_address"),
        pickup_hours: optional(form, "pickup_hours"),
      };
    case "stock_payment":
      return Object.fromEntries(
        ["bank_name", "account_title", "account_number", "iban", "jazzcash_name", "jazzcash_number", "easypaisa_name", "easypaisa_number", "notes"].map((key) => [
          key,
          optional(form, key),
        ]),
      );
  }
}

function scaled(value: number | null, factor: number): number | null {
  return value === null ? null : Math.round(value * factor);
}

/** Field names the form uses for values the API checks under another name. */
const FIELD_NAMES: Record<string, string> = {
  sample_price_cents: "sample_price",
  carton_length_mm: "carton_length_cm",
  carton_width_mm: "carton_width_cm",
  carton_height_mm: "carton_height_cm",
  carton_weight_g: "carton_weight_kg",
};

export async function saveSettings(group: string, _previous: FormState, form: FormData): Promise<FormState> {
  if (!(GROUPS as readonly string[]).includes(group)) return failure("Unknown settings.");
  const settingsGroup = group as Group;

  try {
    await adminApi(`/v1/admin/settings/${settingsGroup}`, { method: "PUT", body: bodyFor(settingsGroup, form) });
  } catch (error) {
    const state = errorState(error);
    // The form asks for dollars, centimeters and kilograms; the API checks cents, millimeters and grams.
    for (const [apiName, formName] of Object.entries(FIELD_NAMES)) {
      if (state.fields?.[apiName]) state.fields[formName] = state.fields[apiName];
    }
    return state;
  }
  if (settingsGroup === "bank") {
    // Private: not on the public website. Only this admin page shows it again, with the stored values.
    refresh();
    return success("Bank details saved. Buyers see them on orders with an amount due.");
  }
  if (settingsGroup === "stock" || settingsGroup === "stock_payment") {
    // Private too: read by the stock checkout and order pages, which are never cached.
    refresh();
    return success(settingsGroup === "stock" ? "Stock settings saved." : "Payment details saved. Stock buyers see them on orders with an amount due.");
  }
  updateTag(settingsGroup === "factory_facts" ? "factory" : "site");
  return success("Settings saved. The website shows the change now.");
}
