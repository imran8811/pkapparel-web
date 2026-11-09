"use client";

import { ActionForm, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/forms/action-form";
import { panelClass } from "@/components/forms/styles";
import { updateStockProfile } from "@/lib/account/actions/stock";
import type { Customer } from "@/lib/account/types";

const STOCK_BUSINESS = [
  { value: "retailer", label: "Shopkeeper" },
  { value: "wholesaler", label: "Wholesaler" },
];

/** The stock account's details. Orders already placed keep the details they were placed with. */
export function StockProfileForm({ customer }: { customer: Customer }) {
  return (
    <section aria-labelledby="profile" className={panelClass}>
      <h2 id="profile" className="text-lg font-semibold">
        Your shop
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Used on your orders and receipts. Orders you placed keep the details they were placed with.</p>
      <ActionForm action={updateStockProfile} className="mt-6 grid grid-cols-1 gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextInput label="Shop or business name" name="company_name" required defaultValue={customer.company_name} autoComplete="organization" />
          <TextInput label="Your name" name="contact_name" required defaultValue={customer.contact_name} autoComplete="name" />
          <TextInput label="City" name="city" required defaultValue={customer.city ?? ""} autoComplete="address-level2" />
          <SelectInput
            label="You are a"
            name="business_type"
            required
            defaultValue={customer.business_type === "wholesaler" ? "wholesaler" : "retailer"}
            options={STOCK_BUSINESS}
          />
          <TextInput label="Phone / WhatsApp" name="phone" type="tel" required defaultValue={customer.phone} autoComplete="tel" />
          <TextInput
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={customer.email}
            autoComplete="email"
            hint="A new address must be confirmed again before your next order."
          />
          <TextInput
            label="Current password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            hint="Only needed when you change your email address."
            fieldClassName="sm:col-span-2"
          />
        </div>
        <FormMessage />
        <div className="flex justify-end">
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        </div>
      </ActionForm>
    </section>
  );
}
