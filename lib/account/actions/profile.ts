"use server";

import { refresh } from "next/cache";
import { customerApi } from "@/lib/account/session";
import { checked, errorState, failure, optional, success, text, type FormState } from "@/lib/forms";

export async function updateProfile(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await customerApi("/v1/account", {
      method: "PUT",
      body: {
        email: text(form, "email"),
        company_name: text(form, "company_name"),
        contact_name: text(form, "contact_name"),
        business_type: text(form, "business_type"),
        country_code: text(form, "country_code"),
        phone: text(form, "phone"),
        website: optional(form, "website"),
        current_password: optional(form, "current_password"),
      },
    });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success("Your details are saved.");
}

export async function changePassword(_previous: FormState, form: FormData): Promise<FormState> {
  const password = text(form, "password");
  if (password !== text(form, "password_confirmation")) {
    return failure("Please check the highlighted fields.", { password_confirmation: "The two new passwords do not match." });
  }
  try {
    await customerApi("/v1/account/password", { method: "PUT", body: { current_password: text(form, "current_password"), password } });
  } catch (error) {
    return errorState(error);
  }
  return success("Password changed. You were logged out on your other devices.");
}

/** Adds (id null) or updates an address. Returns the saved address id in the message-free success state. */
export async function saveAddress(id: number | null, _previous: FormState, form: FormData): Promise<FormState> {
  const body = {
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
    is_default: checked(form, "is_default"),
  };
  try {
    await customerApi(id === null ? "/v1/account/addresses" : `/v1/account/addresses/${id}`, { method: id === null ? "POST" : "PUT", body });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success(id === null ? "Address added." : "Address saved.");
}

export async function deleteAddress(id: number): Promise<FormState> {
  try {
    await customerApi(`/v1/account/addresses/${id}`, { method: "DELETE" });
  } catch (error) {
    return errorState(error);
  }
  refresh();
  return success("Address deleted.");
}
