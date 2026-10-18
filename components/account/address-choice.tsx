"use client";

import { MapPin } from "lucide-react";
import { AddressFields } from "@/components/account/address-fields";
import type { Address, Customer } from "@/lib/account/types";
import { countryName } from "@/lib/format";
import { cn } from "@/lib/utils";

type Country = { code: string; name: string };

/**
 * A saved delivery address, or a new one (sent as address_id "new" with the address fields; the order
 * action saves it to the address book first). Used by the checkout and the sample order form.
 */
export function AddressChoice({
  addresses,
  value,
  onChange,
  customer,
  countries,
  countryCode,
}: {
  addresses: Address[];
  value: number | "new";
  onChange: (value: number | "new") => void;
  customer: Pick<Customer, "company_name" | "contact_name" | "phone">;
  countries: Country[];
  /** Preselected in the new address (the destination the prices are shown for). */
  countryCode: string;
}) {
  return (
    <>
      <div className="grid gap-3" role="radiogroup" aria-label="Delivery address">
        {addresses.map((option) => (
          <label
            key={option.id}
            className={cn(
              "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
              value === option.id ? "border-denim-600 bg-denim-50/50 ring-1 ring-denim-600" : "border-border hover:border-denim-300",
            )}
          >
            <input type="radio" name="address_id" value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} className="mt-1 accent-denim-600" />
            <span className="min-w-0 text-sm">
              <span className="block font-medium">{option.company}</span>
              <span className="block text-muted-foreground">
                {option.contact_name} · {option.line1}, {option.city}, {countryName(option.country_code)}
              </span>
            </span>
          </label>
        ))}
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-medium transition-colors",
            value === "new" ? "border-denim-600 bg-denim-50/50 ring-1 ring-denim-600" : "border-border hover:border-denim-300",
          )}
        >
          <input type="radio" name="address_id" value="new" checked={value === "new"} onChange={() => onChange("new")} className="accent-denim-600" />
          <MapPin aria-hidden className="size-4 text-denim-600" /> {addresses.length > 0 ? "A new address" : "Add your delivery address"}
        </label>
      </div>
      {value === "new" ? (
        <div className="mt-5 rounded-2xl bg-cotton-50 p-4 sm:p-5">
          <AddressFields
            countries={countries}
            address={{ company: customer.company_name, contact_name: customer.contact_name, phone: customer.phone, country_code: countryCode }}
          />
          <p className="mt-4 text-xs text-muted-foreground">The address is saved to your account for next time.</p>
        </div>
      ) : null}
    </>
  );
}
