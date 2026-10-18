"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { AddressChoice } from "@/components/account/address-choice";
import { VerifyEmailBanner } from "@/components/account/account-notices";
import { sizesText } from "@/components/account/order-parts";
import { ActionForm, CheckboxInput, FormField, FormMessage, SubmitButton, TextAreaInput, TextInput, useActionForm } from "@/components/forms/action-form";
import { FileAttachments } from "@/components/forms/file-attachments";
import { fieldClass, panelClass } from "@/components/forms/styles";
import { placeSampleOrder, quoteSamples } from "@/lib/account/actions/samples";
import { transitText, type Customer } from "@/lib/account/types";
import { countryName, formatMoney } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { productTypes } from "@/lib/nav";
import { encodeItem, MAX_PER_SIZE, type SampleItem, type SampleQuote } from "@/lib/samples";

type Country = { code: string; name: string };

/** The sample order: the chosen samples, an optional custom-design sample, the address, then the courier and total. */
export function SampleOrderForm({
  initial,
  items,
  withCustom,
  customer,
  countries,
}: {
  initial: SampleQuote;
  items: SampleItem[];
  withCustom: boolean;
  customer: Customer;
  countries: Country[];
}) {
  const [data, setData] = useState(initial);
  // Confirmed in another tab: the banner refreshes the page data (initial), and the form follows without losing input.
  const emailVerified = data.email_verified || initial.email_verified;
  const [address, setAddress] = useState<number | "new">(initial.address_id ?? "new");
  const [custom, setCustom] = useState(withCustom);
  const [customQty, setCustomQty] = useState(1);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, startQuote] = useTransition();

  const reload = (next: { address?: number | "new"; country?: string | null; custom?: boolean; customQty?: number }) =>
    startQuote(async () => {
      const addressId = next.address ?? address;
      const withCustomSample = next.custom ?? custom;
      const fresh = await quoteSamples(
        items,
        withCustomSample ? (next.customQty ?? customQty) : null,
        addressId === "new" ? null : addressId,
        addressId === "new" ? (next.country ?? null) : null,
      );
      if ("error" in fresh) {
        setQuoteError(fresh.error);
      } else {
        setQuoteError(null);
        setData(fresh);
      }
    });

  const courier = data.courier.cost_cents;
  const transit = transitText(data.courier);
  // Samples of shop styles (the quote's pieces include the custom-design sample).
  const stylePieces = data.lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <ActionForm
      action={placeSampleOrder}
      className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start"
      onChange={(event) => {
        // A new address: the courier follows its country.
        const target = event.target;
        if (address === "new" && target instanceof HTMLSelectElement && target.name === "country_code" && target.value) reload({ country: target.value });
      }}
    >
      {items.map((item) => (
        <input key={encodeItem(item)} type="hidden" name="items" value={encodeItem(item)} />
      ))}
      {custom ? <input type="hidden" name="custom" value="on" /> : null}
      {!data.needs_price && data.total_cents !== null ? <input type="hidden" name="expected_total_cents" value={data.total_cents} /> : null}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-7">
        {!emailVerified ? <VerifyEmailBanner email={customer.email} /> : null}

        <section className={panelClass}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Your samples</h2>
            <Link href="/samples" className="text-sm font-medium text-denim-600 hover:underline">
              Change samples
            </Link>
          </div>
          {data.lines.length > 0 ? (
            <ul className="mt-4 divide-y divide-border">
              {data.lines.map((line) => (
                <li key={line.color_id} className="flex items-center gap-3 py-3">
                  <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
                    {line.image_path ? <Image src={mediaSrc(line.image_path)} alt="" fill sizes="48px" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{line.style_name}</p>
                    <p className="text-muted-foreground">
                      {line.color_name} · {sizesText(line.size_qty)}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
                    {line.qty} × {formatMoney(line.unit_price_cents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No samples of shop styles.</p>
          )}
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-border p-4 text-sm">
            <input
              type="checkbox"
              checked={custom}
              onChange={(event) => {
                setCustom(event.target.checked);
                reload({ custom: event.target.checked });
              }}
              className="mt-0.5 size-4 accent-denim-600"
            />
            <span>
              <span className="block font-medium">A sample of my own design</span>
              <span className="text-muted-foreground">We price it for you, usually within 1 to 2 working days.</span>
            </span>
          </label>
        </section>

        {custom ? (
          <section className={panelClass}>
            <h2 className="text-lg font-semibold">Your design</h2>
            <p className="mt-1 text-sm text-muted-foreground">Describe the sample and attach your tech pack, sketches or photos of a reference garment.</p>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Product" name="custom_product">
                {(control) => (
                  <select {...control} className={fieldClass} defaultValue="Jeans pants">
                    {productTypes.map((type) => (
                      <option key={type.slug}>{type.label}</option>
                    ))}
                  </select>
                )}
              </FormField>
              <FormField label="Pieces" name="custom_qty">
                {(control) => (
                  <select
                    {...control}
                    className={fieldClass}
                    value={customQty}
                    onChange={(event) => {
                      setCustomQty(Number(event.target.value));
                      reload({ customQty: Number(event.target.value) });
                    }}
                  >
                    {Array.from({ length: MAX_PER_SIZE }, (_, index) => index + 1).map((qty) => (
                      <option key={qty} value={qty}>
                        {qty}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
              <TextAreaInput
                label="What should we make?"
                name="custom_description"
                required
                rows={4}
                maxLength={2000}
                fieldClassName="sm:col-span-2"
                placeholder="Fabric and weight, wash, fit, sizes, trims and labels"
              />
              <div className="sm:col-span-2">
                <FileAttachments />
                <FilesError />
              </div>
            </div>
          </section>
        ) : null}

        <section className={panelClass}>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            Delivery address
            {quoting ? <LoaderCircle aria-label="Updating" className="size-4 animate-spin text-muted-foreground" /> : null}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Samples go by express courier to this address.</p>
          <div className="mt-5">
            <AddressChoice
              addresses={data.addresses}
              value={address}
              onChange={(next) => {
                setAddress(next);
                if (next !== "new") reload({ address: next });
              }}
              customer={customer}
              countries={countries}
              countryCode={data.country_code}
            />
          </div>
        </section>

        <section className={panelClass}>
          <h2 className="text-lg font-semibold">Reference and notes</h2>
          <div className="mt-5 grid grid-cols-1 gap-5">
            <TextInput label="Your reference" name="buyer_reference" maxLength={60} hint="Optional. Printed on the sample invoice." />
            <TextAreaInput label="Notes for us" name="notes" rows={3} maxLength={2000} placeholder="e.g. a delivery contact, or what you want to check" />
          </div>
        </section>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:col-span-5">
        <div className={panelClass}>
          <h2 className="text-lg font-semibold">Your sample order</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            {stylePieces > 0 ? <Row label={`Samples (${stylePieces} pcs)`} value={formatMoney(data.goods_cents)} /> : null}
            {custom ? <Row label="Your design" value="We price it" /> : null}
            <Row
              label={`Courier to ${countryName(data.country_code)}`}
              value={courier === null ? "We price it" : formatMoney(courier)}
              note={transit ? `About ${transit} in transit` : undefined}
            />
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">{data.total_cents === null ? "Follows by email" : formatMoney(data.total_cents)}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm text-stitch-700">
            {data.needs_price
              ? "We confirm the price within 1 to 2 working days and email you the sample invoice. You pay by bank transfer, then we prepare your samples."
              : "Paid in full by bank transfer before dispatch. The bank details and your sample invoice follow as soon as you place the order."}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Ready about {data.lead_time_days} days after your payment, then express courier with tracking. The sample cost (without the courier) is deducted from
            your first bulk order.
          </p>
          {quoteError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {quoteError}
            </p>
          ) : null}
          <div className="mt-5 grid gap-4">
            <CheckboxInput
              name="accept_terms"
              label={
                <>
                  I accept the{" "}
                  <Link href="/terms-of-sale" target="_blank" className="font-medium text-denim-600 underline-offset-2 hover:underline">
                    terms of sale
                  </Link>
                  .
                </>
              }
            />
            <FormMessage />
            <SubmitButton size="lg" className="w-full" disabled={!emailVerified || quoting} pendingLabel="Placing your order…">
              Place sample order
            </SubmitButton>
            {!emailVerified ? <p className="text-center text-xs text-stitch-700">Confirm your email address first (see the top of the page).</p> : null}
          </div>
        </div>
      </aside>
    </ActionForm>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">
        {label}
        {note ? <span className="block text-xs">{note}</span> : null}
      </dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}

function FilesError() {
  const { state } = useActionForm();
  return state.fields?.files ? <p className="mt-2 text-sm text-destructive">{state.fields.files}</p> : null;
}
