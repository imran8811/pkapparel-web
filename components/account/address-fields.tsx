"use client";

import { SelectInput, TextInput } from "@/components/forms/action-form";
import type { Address } from "@/lib/account/types";

type Country = { code: string; name: string };

/** The fields of a delivery address (inside an <ActionForm>; errors come back under the same names). */
export function AddressFields({ countries, address }: { countries: Country[]; address?: Partial<Address> }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <TextInput label="Company (consignee)" name="company" required defaultValue={address?.company ?? ""} autoComplete="organization" />
      <TextInput label="Contact person" name="contact_name" required defaultValue={address?.contact_name ?? ""} autoComplete="name" />
      <TextInput label="Phone" name="phone" type="tel" required defaultValue={address?.phone ?? ""} autoComplete="tel" />
      <TextInput label="Email for delivery updates" name="email" type="email" defaultValue={address?.email ?? ""} hint="Optional." />
      <TextInput label="Street address" name="line1" required defaultValue={address?.line1 ?? ""} autoComplete="address-line1" fieldClassName="sm:col-span-2" />
      <TextInput label="Address line 2" name="line2" defaultValue={address?.line2 ?? ""} autoComplete="address-line2" fieldClassName="sm:col-span-2" hint="Unit, building, warehouse. Optional." />
      <TextInput label="City" name="city" required defaultValue={address?.city ?? ""} autoComplete="address-level2" />
      <TextInput label="State / region" name="state" defaultValue={address?.state ?? ""} autoComplete="address-level1" />
      <TextInput label="Postal code" name="postal_code" defaultValue={address?.postal_code ?? ""} autoComplete="postal-code" />
      <SelectInput
        label="Country"
        name="country_code"
        required
        options={countries.map((country) => ({ value: country.code, label: country.name }))}
        placeholder="Select the country"
        defaultValue={address?.country_code ?? ""}
      />
      <TextInput
        label="Import or tax ID"
        name="tax_id"
        defaultValue={address?.tax_id ?? ""}
        fieldClassName="sm:col-span-2"
        hint="EORI, VAT number or EIN, if your customs broker needs it on the documents. Optional."
      />
    </div>
  );
}
