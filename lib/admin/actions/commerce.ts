"use server";

import { refresh } from "next/cache";
import { adminApi } from "@/lib/admin/session";
import { checked, errorState, failure, jsonList, number, optional, success, text, type FormState } from "@/lib/admin/forms";

/* Checkout settings in the admin: shipping zones with their rates, and customization add-ons. */

type RateInput = { mode: string; from_qty: string; rate: string; fixed: string; transit_min_days: string; transit_max_days: string };

const dollarsToCents = (value: string): number | null => {
  const amount = Number(String(value).replace(/[,\s$]/g, ""));
  return value === "" || !Number.isFinite(amount) ? null : Math.round(amount * 100);
};
const wholeNumber = (value: string): number | null => (value === "" || !Number.isFinite(Number(value)) ? null : Math.round(Number(value)));

/** Saves a zone (id null: a new one), replacing its countries and rates. Rates come as JSON from the editor, in dollars. */
export async function saveZone(id: number | null, _previous: FormState, form: FormData): Promise<FormState> {
  const rates = jsonList<RateInput>(form, "rates").map((rate) => ({
    mode: rate.mode,
    from_qty: rate.from_qty === "" ? 0 : Number(rate.from_qty),
    rate_cents: dollarsToCents(rate.rate),
    fixed_cents: dollarsToCents(rate.fixed) ?? 0,
    transit_min_days: wholeNumber(rate.transit_min_days),
    transit_max_days: wholeNumber(rate.transit_max_days),
  }));
  if (rates.some((rate) => rate.rate_cents === null)) {
    return failure("Please check the highlighted fields.", { rates: "Every rate needs a price." });
  }

  try {
    await adminApi(id === null ? "/v1/admin/shipping/zones" : `/v1/admin/shipping/zones/${id}`, {
      method: id === null ? "POST" : "PUT",
      body: { name: text(form, "name"), sort_order: number(form, "sort_order"), countries: form.getAll("countries").map(String), rates },
    });
  } catch (error) {
    const state = errorState(error);
    // Rate errors come back per row ("rates.2"): show them under the rates editor.
    const rateError = Object.entries(state.fields ?? {}).find(([name]) => name.startsWith("rates."))?.[1];
    if (rateError && state.fields) state.fields.rates = rateError;
    return state;
  }
  refresh();
  return success(id === null ? "Zone added. Checkout uses its rates now." : "Zone saved. Checkout uses the new rates now.");
}

export async function deleteZone(id: number): Promise<FormState> {
  try {
    await adminApi(`/v1/admin/shipping/zones/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success("Zone deleted. Its countries now get “freight quoted” at checkout.");
}

export async function saveAddon(_previous: FormState, form: FormData): Promise<FormState> {
  const id = number(form, "id");
  const pricing = text(form, "pricing");
  const body = {
    name: text(form, "name"),
    description: optional(form, "description"),
    pricing,
    price_cents: pricing === "on_request" ? null : dollarsToCents(text(form, "price")),
    is_active: checked(form, "is_active"),
    sort_order: number(form, "sort_order"),
  };
  try {
    await adminApi(id === null ? "/v1/admin/addons" : `/v1/admin/addons/${id}`, { method: id === null ? "POST" : "PUT", body });
  } catch (error) {
    const state = errorState(error);
    // The form asks for dollars; the API checks cents.
    if (state.fields?.price_cents) state.fields.price = state.fields.price_cents;
    return state;
  }
  refresh();
  return success(id === null ? "Add-on added." : "Add-on saved.");
}

export async function deleteAddon(id: number): Promise<FormState> {
  try {
    await adminApi(`/v1/admin/addons/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success("Add-on deleted. Orders that have it keep their copy.");
}
