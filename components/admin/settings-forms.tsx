"use client";

import { useState, type ReactNode } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminForm, FormError, SubmitButton, TextField, useAdminForm } from "@/components/admin/form";
import { inputClass } from "@/components/admin/styles";
import { Panel } from "@/components/admin/page-parts";
import { saveSettings } from "@/lib/admin/actions/settings";
import type { AdminSettings } from "@/lib/admin/types";
import type { Address } from "@/lib/site";

/** One form per group. Each is keyed by its saved values, so it shows fresh data after a save. */
export function SettingsForms({ settings }: { settings: AdminSettings }) {
  const { company, contact, addresses, social, commerce, factory_facts: facts, bank } = settings;
  const packing = commerce.packing;

  return (
    <div className="grid gap-6">
      <Section id="contact" title="Contact" description="Shown in the header, footer, contact page and emails.">
        <AdminForm key={JSON.stringify(contact)} action={saveSettings.bind(null, "contact")} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Phone" name="phone" defaultValue={contact.phone} placeholder="+92 310 4489288" />
            <TextField
              label="WhatsApp number"
              name="whatsapp"
              defaultValue={contact.whatsapp}
              placeholder="923104489288"
              hint="Country code and number, digits only."
            />
            <TextField label="Email" name="email" type="email" defaultValue={contact.email} />
          </div>
          <SaveRow />
        </AdminForm>
      </Section>

      <Section id="company" title="Company">
        <AdminForm key={JSON.stringify(company)} action={saveSettings.bind(null, "company")} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Company name" name="name" defaultValue={company.name} />
            <TextField label="Legal name" name="legal_name" defaultValue={company.legal_name ?? ""} placeholder="As registered, for invoices" />
            <TextField label="Tax number (NTN)" name="ntn" defaultValue={company.ntn ?? ""} hint="Printed on proforma invoices." />
            <TextField label="Tagline" name="tagline" defaultValue={company.tagline} fieldClassName="sm:col-span-2" />
            <TextField label="Founded (year)" name="founded_year" type="number" defaultValue={company.founded_year} />
            <div className="grid grid-cols-2 gap-4">
              <TextField label="City" name="city" defaultValue={company.city} />
              <TextField label="Country" name="country" defaultValue={company.country} />
            </div>
          </div>
          <SaveRow />
        </AdminForm>
      </Section>

      <Section id="addresses" title="Addresses" description="Factory and office addresses on the contact page and in the footer (up to 4).">
        <AdminForm key={JSON.stringify(addresses)} action={saveSettings.bind(null, "addresses")} className="grid gap-4">
          <AddressesEditor initial={addresses} />
          <SaveRow />
        </AdminForm>
      </Section>

      <Section id="social" title="Social media" description="Full links to your pages. Leave a field empty to hide that network.">
        <AdminForm key={JSON.stringify(social)} action={saveSettings.bind(null, "social")} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Facebook" name="facebook" type="url" defaultValue={social.facebook ?? ""} placeholder="https://www.facebook.com/…" />
            <TextField label="Instagram" name="instagram" type="url" defaultValue={social.instagram ?? ""} placeholder="https://www.instagram.com/…" />
            <TextField label="TikTok" name="tiktok" type="url" defaultValue={social.tiktok ?? ""} placeholder="https://www.tiktok.com/@…" />
            <TextField label="LinkedIn" name="linkedin" type="url" defaultValue={social.linkedin ?? ""} placeholder="https://www.linkedin.com/company/…" />
            <TextField label="YouTube" name="youtube" type="url" defaultValue={social.youtube ?? ""} placeholder="https://www.youtube.com/@…" />
          </div>
          <SaveRow />
        </AdminForm>
      </Section>

      <Section
        id="business"
        title="Business rules"
        description="Used in the wholesale shop and quoted on the website (how to order, shipping, samples). Prices are in US dollars."
      >
        <AdminForm key={JSON.stringify(commerce)} action={saveSettings.bind(null, "commerce")} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Minimum order per color (pcs)" name="moq_per_color" type="number" min={1} defaultValue={commerce.moq_per_color} />
            <TextField
              label="Minimum per size (pcs)"
              name="min_pcs_per_size"
              type="number"
              min={1}
              defaultValue={commerce.min_pcs_per_size}
              hint="Every size ordered in a color needs at least this many pieces (20: 100 pieces cover up to 5 sizes)."
            />
            <TextField
              label="Pieces per size in a set"
              name="set_pcs_per_size"
              type="number"
              min={1}
              defaultValue={commerce.set_pcs_per_size}
              hint="A set is every size of a style, this many of each."
            />
            <TextField label="Deposit (%)" name="deposit_percent" type="number" min={0} max={100} defaultValue={commerce.deposit_percent} />
            <TextField
              label="Production time (days)"
              name="lead_time_days"
              type="number"
              min={1}
              defaultValue={commerce.lead_time_days}
              hint="Counted from the deposit."
            />
            <TextField
              label="Sample price (USD)"
              name="sample_price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={(commerce.sample_price_cents / 100).toFixed(2)}
              hint="Per piece, for styles without their own sample price."
            />
            <TextField
              label="Samples ready in (days)"
              name="sample_lead_time_days"
              type="number"
              min={1}
              defaultValue={commerce.sample_lead_time_days}
              hint="Samples of shop styles, counted from the payment."
            />
            <TextField
              label="Custom-design samples ready in (days)"
              name="custom_sample_lead_time_days"
              type="number"
              min={1}
              defaultValue={commerce.custom_sample_lead_time_days}
              hint="Made from the buyer's tech pack or reference."
            />
            <TextField
              label="Proforma invoice valid for (days)"
              name="pi_valid_days"
              type="number"
              min={1}
              defaultValue={commerce.pi_valid_days ?? 14}
            />
            <TextField
              label="Full container from (CBM)"
              name="fcl_from_cbm"
              type="number"
              min={1}
              step="0.1"
              defaultValue={commerce.fcl_from_cbm ?? 15}
              hint="Above this volume, sea freight is quoted instead of estimated."
            />
          </div>
          <fieldset className="grid gap-3 rounded-xl border border-dashed p-4">
            <legend className="px-1 text-sm font-medium">Default packing, for freight estimates</legend>
            <p className="-mt-1 text-xs text-muted-foreground">Used for styles without their own packing data (set those on each style).</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Weight per piece (g)" name="piece_weight_g" type="number" min={1} defaultValue={packing?.piece_weight_g ?? 650} />
              <TextField label="Pieces per carton" name="pcs_per_carton" type="number" min={1} defaultValue={packing?.pcs_per_carton ?? 50} />
              <TextField label="Empty carton weight (kg)" name="carton_weight_kg" type="number" min={0} step="0.1" defaultValue={(packing?.carton_weight_g ?? 1200) / 1000} />
              <TextField label="Carton length (cm)" name="carton_length_cm" type="number" min={1} step="0.1" defaultValue={(packing?.carton_length_mm ?? 600) / 10} />
              <TextField label="Carton width (cm)" name="carton_width_cm" type="number" min={1} step="0.1" defaultValue={(packing?.carton_width_mm ?? 400) / 10} />
              <TextField label="Carton height (cm)" name="carton_height_cm" type="number" min={1} step="0.1" defaultValue={(packing?.carton_height_mm ?? 400) / 10} />
            </div>
          </fieldset>
          <SaveRow />
        </AdminForm>
      </Section>

      <Section
        id="bank"
        title="Bank details"
        description="The account buyers transfer to. Private: shown only on orders with an amount due (order page, proforma invoice, order email), never elsewhere on the website."
      >
        <AdminForm key={JSON.stringify(bank)} action={saveSettings.bind(null, "bank")} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Beneficiary (account name)" name="beneficiary" defaultValue={bank.beneficiary ?? ""} />
            <TextField label="Bank" name="bank_name" defaultValue={bank.bank_name ?? ""} />
            <TextField label="Branch" name="branch" defaultValue={bank.branch ?? ""} />
            <TextField label="Account number" name="account_number" defaultValue={bank.account_number ?? ""} />
            <TextField label="IBAN" name="iban" defaultValue={bank.iban ?? ""} placeholder="PK00 ABCD 0000 0000 0000 0000" />
            <TextField label="SWIFT / BIC" name="swift" defaultValue={bank.swift ?? ""} placeholder="ABCDPKKA" />
            <TextField label="Bank address" name="bank_address" defaultValue={bank.bank_address ?? ""} fieldClassName="sm:col-span-2" />
            <TextField label="Note for buyers" name="notes" defaultValue={bank.notes ?? ""} fieldClassName="sm:col-span-2" placeholder="e.g. Intermediary bank for USD transfers" />
          </div>
          <SaveRow />
        </AdminForm>
      </Section>

      <Section
        id="factory"
        title="Factory numbers"
        description="Headline numbers on the home and factory pages. Only fill in confirmed numbers; empty ones are hidden."
      >
        <AdminForm key={JSON.stringify(facts)} action={saveSettings.bind(null, "factory_facts")} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Monthly capacity" name="monthly_capacity" defaultValue={facts.monthly_capacity ?? ""} placeholder="e.g. 30,000+ pcs" />
            <TextField label="Machines" name="machines" defaultValue={facts.machines ?? ""} placeholder="e.g. 150+" />
            <TextField label="Workers" name="workers" defaultValue={facts.workers ?? ""} placeholder="e.g. 200+" />
            <TextField label="Quality checkers" name="qa_staff" defaultValue={facts.qa_staff ?? ""} placeholder="e.g. 12" />
          </div>
          <SaveRow />
        </AdminForm>
      </Section>
    </div>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20">
      <Panel title={title} description={description}>
        {children}
      </Panel>
    </div>
  );
}

function SaveRow() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
      <SubmitButton size="sm">Save</SubmitButton>
      <FormError className="flex-1" />
    </div>
  );
}

function AddressesEditor({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState(initial.length ? initial : [{ label: "", line: "", city: "", country: "Pakistan" }]);
  const { state } = useAdminForm();

  const update = (index: number, key: keyof Address, value: string) =>
    setAddresses((current) => current.map((address, i) => (i === index ? { ...address, [key]: value } : address)));

  const fields: { key: keyof Address; label: string; placeholder: string; wide?: boolean }[] = [
    { key: "label", label: "Label", placeholder: "Factory" },
    { key: "line", label: "Street", placeholder: "18-KM Ferozepur Road", wide: true },
    { key: "city", label: "City", placeholder: "Lahore" },
    { key: "country", label: "Country", placeholder: "Pakistan" },
  ];

  return (
    <div className="grid gap-4">
      <input type="hidden" name="addresses" value={JSON.stringify(addresses)} />
      {addresses.map((address, index) => (
        <div key={index} className="grid gap-3 rounded-xl border bg-cotton-50/60 p-4 sm:grid-cols-[1fr_2fr_1fr_1fr_auto] sm:items-end">
          {fields.map((field) => {
            const error = state.fields?.[`addresses.${index}.${field.key}`];
            return (
              <label key={field.key} className="grid gap-1.5 text-sm font-medium">
                {field.label}
                <input
                  value={address[field.key]}
                  onChange={(event) => update(index, field.key, event.target.value)}
                  placeholder={field.placeholder}
                  aria-invalid={error ? true : undefined}
                  className={inputClass}
                />
                {error ? <span className="text-sm font-normal text-destructive">{error}</span> : null}
              </label>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="sm:mb-1"
            aria-label={`Remove address ${index + 1}`}
            disabled={addresses.length === 1}
            onClick={() => setAddresses((current) => current.filter((_, i) => i !== index))}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      {addresses.length < 4 ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddresses((current) => [...current, { label: "", line: "", city: "", country: "Pakistan" }])}
          >
            <PlusIcon />
            Add address
          </Button>
        </div>
      ) : null}
      {state.fields?.addresses ? <p className="text-sm text-destructive">{state.fields.addresses}</p> : null}
    </div>
  );
}
