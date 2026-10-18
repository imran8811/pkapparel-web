import "server-only";
import { customerApi } from "@/lib/account/session";
import type { Address } from "@/lib/account/types";
import { optional, text } from "@/lib/forms";

/**
 * The delivery address chosen in an order form (<AddressChoice>): a saved one, or a new one that is saved
 * to the address book first. API errors (e.g. 422 on the address fields) are thrown to the caller.
 */
export async function chosenAddress(form: FormData): Promise<{ id: number; created: boolean }> {
  if (text(form, "address_id") !== "new") {
    return { id: Number(text(form, "address_id")) || 0, created: false };
  }
  const address = await customerApi<Address>("/v1/account/addresses", {
    method: "POST",
    body: {
      company: text(form, "company"),
      contact_name: text(form, "contact_name"),
      phone: text(form, "phone"),
      email: optional(form, "email"),
      line1: text(form, "line1"),
      line2: optional(form, "line2"),
      city: text(form, "city"),
      state: optional(form, "state"),
      postal_code: optional(form, "postal_code"),
      country_code: text(form, "country_code"),
      tax_id: optional(form, "tax_id"),
    },
  });
  return { id: address.id, created: true };
}
