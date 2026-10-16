"use client";

import { useRef } from "react";
import { ActionForm, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/forms/action-form";
import { panelClass } from "@/components/forms/styles";
import { changePassword, updateProfile } from "@/lib/account/actions/profile";
import { BUSINESS_TYPES, type Customer } from "@/lib/account/types";

type Country = { code: string; name: string };

export function ProfileForm({ customer, countries }: { customer: Customer; countries: Country[] }) {
  return (
    <section aria-labelledby="profile" className={panelClass}>
      <h2 id="profile" className="text-lg font-semibold">
        Company and contact
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Used on your proforma invoices. Orders you placed keep the details they were placed with.</p>
      <ActionForm action={updateProfile} className="mt-6 grid grid-cols-1 gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextInput label="Company" name="company_name" required defaultValue={customer.company_name} autoComplete="organization" />
          <TextInput label="Your name" name="contact_name" required defaultValue={customer.contact_name} autoComplete="name" />
          <TextInput label="Phone / WhatsApp" name="phone" type="tel" required defaultValue={customer.phone} autoComplete="tel" />
          <SelectInput
            label="Country"
            name="country_code"
            required
            defaultValue={customer.country_code}
            options={countries.map((country) => ({ value: country.code, label: country.name }))}
          />
          <SelectInput label="Your business" name="business_type" required defaultValue={customer.business_type} options={BUSINESS_TYPES} />
          <TextInput label="Website or online store" name="website" type="url" defaultValue={customer.website ?? ""} placeholder="https://" />
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

export function PasswordForm() {
  const form = useRef<HTMLFormElement>(null);
  return (
    <section aria-labelledby="password" className={panelClass}>
      <h2 id="password" className="text-lg font-semibold">
        Password
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Changing it logs you out on your other devices.</p>
      <ActionForm ref={form} action={changePassword} onSuccess={() => form.current?.reset()} className="mt-6 grid grid-cols-1 gap-5">
        <TextInput label="Current password" name="current_password" type="password" required autoComplete="current-password" />
        <TextInput label="New password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
        <TextInput label="Repeat the new password" name="password_confirmation" type="password" required autoComplete="new-password" />
        <FormMessage />
        <div className="flex justify-end">
          <SubmitButton pendingLabel="Saving…">Change password</SubmitButton>
        </div>
      </ActionForm>
    </section>
  );
}
