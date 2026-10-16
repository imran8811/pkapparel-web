"use server";

import { updateTag } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";

const GROUPS = ["company", "contact", "addresses", "social", "commerce", "factory_facts"] as const;
type Group = (typeof GROUPS)[number];

function bodyFor(group: Group, form: FormData): Record<string, unknown> {
  switch (group) {
    case "company":
      return {
        name: text(form, "name"),
        legal_name: optional(form, "legal_name"),
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
        deposit_percent: number(form, "deposit_percent"),
        lead_time_days: number(form, "lead_time_days"),
        sample_price_cents: samplePrice === null ? null : Math.round(samplePrice * 100),
      };
    }
    case "factory_facts":
      return {
        monthly_capacity: optional(form, "monthly_capacity"),
        machines: optional(form, "machines"),
        workers: optional(form, "workers"),
        qa_staff: optional(form, "qa_staff"),
      };
  }
}

export async function saveSettings(group: string, _previous: FormState, form: FormData): Promise<FormState> {
  if (!(GROUPS as readonly string[]).includes(group)) return failure("Unknown settings.");
  const settingsGroup = group as Group;

  try {
    await adminApi(`/v1/admin/settings/${settingsGroup}`, { method: "PUT", body: bodyFor(settingsGroup, form) });
  } catch (error) {
    const state = errorState(error);
    // The form asks for the sample price in dollars; the API stores cents.
    if (state.fields?.sample_price_cents) state.fields.sample_price = state.fields.sample_price_cents;
    return state;
  }
  updateTag(settingsGroup === "factory_facts" ? "factory" : "site");
  return success("Settings saved. The website shows the change now.");
}
