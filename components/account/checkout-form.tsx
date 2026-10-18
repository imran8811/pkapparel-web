"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle, Plane, Ship, Warehouse } from "lucide-react";
import { AddressChoice } from "@/components/account/address-choice";
import { VerifyEmailBanner } from "@/components/account/account-notices";
import { ActionForm, CheckboxInput, FormMessage, SubmitButton, TextAreaInput, TextInput, useActionForm } from "@/components/forms/action-form";
import { panelClass } from "@/components/forms/styles";
import { checkoutFor, placeOrder } from "@/lib/account/actions/orders";
import { notifyUiChange } from "@/lib/account/use-ui-state";
import { transitText, type Addon, type Checkout, type Customer, type FreightQuote, type ShippingMode } from "@/lib/account/types";
import { countryName, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Country = { code: string; name: string };

const MODES: { key: ShippingMode; label: string; icon: typeof Plane; note: string }[] = [
  { key: "air", label: "Air freight", icon: Plane, note: "Fastest. Priced by weight." },
  { key: "sea", label: "Sea freight", icon: Ship, note: "Best for larger orders. Priced by volume." },
  { key: "forwarder", label: "Your own forwarder", icon: Warehouse, note: "You book the freight; we hand the goods over in Pakistan." },
];

/** Checkout: delivery address, shipping, add-ons, reference, then the totals and the deposit. */
export function CheckoutForm({ initial, customer, countries }: { initial: Checkout; customer: Customer; countries: Country[] }) {
  const [data, setData] = useState(initial);
  // Confirmed in another tab: the banner refreshes the page data (initial), and the form follows without losing input.
  const emailVerified = data.email_verified || initial.email_verified;
  const [address, setAddress] = useState<number | "new">(initial.address_id ?? "new");
  const [mode, setMode] = useState<ShippingMode>(defaultMode(initial.shipping));
  const [addons, setAddons] = useState<ReadonlySet<number>>(() => new Set());
  const [quoting, startQuote] = useTransition();

  const reload = (addressId: number | null, country: string | null) =>
    startQuote(async () => {
      const fresh = await checkoutFor(addressId, country);
      if (fresh) setData(fresh);
    });

  const { cart } = data;
  const pcs = cart.total_pcs;
  const chosen = data.addons.filter((addon) => addons.has(addon.id));
  const addonsCents = chosen.reduce((sum, addon) => sum + addonPrice(addon, pcs), 0);
  const freight = mode === "forwarder" ? null : data.shipping[mode].cost_cents;
  const total = cart.goods_cents + addonsCents + (freight ?? 0);
  const deposit = Math.round(((cart.goods_cents + addonsCents) * data.deposit_percent) / 100);

  return (
    <ActionForm
      action={placeOrder}
      onSuccess={notifyUiChange}
      className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start"
      onChange={(event) => {
        // A new address: freight estimates follow its country.
        const target = event.target;
        if (address === "new" && target instanceof HTMLSelectElement && target.name === "country_code" && target.value) reload(null, target.value);
      }}
    >
      <input type="hidden" name="expected_total_cents" value={total} />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-7">
        {!emailVerified ? <VerifyEmailBanner email={customer.email} /> : null}

        <Section number={1} title="Delivery address" hint="The consignee on your documents. Your forwarder's address works too.">
          <AddressChoice
            addresses={data.addresses}
            value={address}
            onChange={(next) => {
              setAddress(next);
              if (next !== "new") reload(next, null);
            }}
            customer={customer}
            countries={countries}
            countryCode={data.country_code}
          />
        </Section>

        <Section
          number={2}
          title="Shipping"
          hint={`Estimates to ${countryName(data.country_code)} for about ${cart.packing.cartons} cartons (${(cart.packing.gross_g / 1000).toFixed(0)} kg, ${cart.packing.cbm.toFixed(2)} CBM).`}
          busy={quoting}
        >
          <div className="grid gap-3" role="radiogroup" aria-label="Shipping">
            {MODES.map(({ key, label, icon: Icon, note }) => {
              const quote = data.shipping[key];
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                    mode === key ? "border-denim-600 bg-denim-50/50 ring-1 ring-denim-600" : "border-border hover:border-denim-300",
                  )}
                >
                  <input type="radio" name="shipping_mode" value={key} checked={mode === key} onChange={() => setMode(key)} className="mt-1 accent-denim-600" />
                  <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-denim-600" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium">{label}</span>
                      <span className="font-medium tabular-nums">{quoteLabel(key, quote)}</span>
                    </span>
                    <span className="mt-0.5 block text-muted-foreground">{quoteNote(key, quote) ?? note}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {mode === "forwarder" ? (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextInput label="Forwarder" name="forwarder_name" placeholder="Company name" hint="Optional. We contact them when the goods are ready." />
              <TextInput label="Forwarder contact" name="forwarder_contact" placeholder="Name, phone or email" />
            </div>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Freight is an estimate: we confirm it before shipment, and you pay it with the balance. Import duties and taxes are paid by you.
            </p>
          )}
        </Section>

        {data.addons.length > 0 ? (
          <Section number={3} title="Your brand (optional)" hint="Private-label extras. Send us the artwork after ordering.">
            <div className="grid gap-3">
              {data.addons.map((addon) => (
                <label key={addon.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-denim-300">
                  <input
                    type="checkbox"
                    name="addons"
                    value={addon.id}
                    checked={addons.has(addon.id)}
                    onChange={(event) =>
                      setAddons((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(addon.id);
                        else next.delete(addon.id);
                        return next;
                      })
                    }
                    className="mt-1 size-4 shrink-0 accent-denim-600"
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium">{addon.name}</span>
                      <span className="text-muted-foreground tabular-nums">{addonLabel(addon, pcs)}</span>
                    </span>
                    {addon.description ? <span className="mt-0.5 block text-muted-foreground">{addon.description}</span> : null}
                  </span>
                </label>
              ))}
            </div>
            <AddonError />
          </Section>
        ) : null}

        <Section number={data.addons.length > 0 ? 4 : 3} title="Reference and notes">
          <div className="grid grid-cols-1 gap-5">
            <TextInput label="Your PO number or reference" name="buyer_reference" maxLength={60} hint="Optional. Printed on the proforma invoice." />
            <TextAreaInput label="Notes for us" name="notes" rows={3} maxLength={2000} placeholder="e.g. size ratio per carton, label details, delivery wishes" />
          </div>
        </Section>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:col-span-5">
        <div className={panelClass}>
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {cart.styles.map((style) => (
              <li key={style.product_id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{style.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{style.colors.map((color) => `${color.name} ${color.pcs}`).join(" · ")}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatMoney(style.goods_cents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
            <Row label={`Goods (${pcs} pcs)`} value={formatMoney(cart.goods_cents)} />
            {chosen.length > 0 ? (
              <Row
                label="Add-ons"
                value={addonsCents === 0 ? "On request" : formatMoney(addonsCents)}
                note={addonsCents > 0 && chosen.some((a) => a.pricing === "on_request") ? "+ items on request" : undefined}
              />
            ) : null}
            <Row label="Freight" value={freightValue(mode, data.shipping[mode])} />
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">{formatMoney(total)}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-semibold text-stitch-700">Deposit due now ({data.deposit_percent}%)</span>
              <span className="font-heading text-xl font-semibold tabular-nums text-stitch-700">{formatMoney(deposit)}</span>
            </div>
            <p className="mt-1 text-xs text-stitch-700">
              Of the goods{addonsCents > 0 ? " and add-ons" : ""}, by bank transfer. The balance of {formatMoney(Math.max(0, total - deposit))}
              {mode === "forwarder" ? "" : " plus the final freight"} is due before shipment.
            </p>
          </div>
          {data.sample_credit_cents > 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Your samples ({formatMoney(data.sample_credit_cents)}) are deducted from the balance once this order is confirmed.
            </p>
          ) : null}
          <p className="mt-4 text-xs text-muted-foreground">Ready about {cart.lead_time_days} days after your deposit is confirmed. Bank details and your proforma invoice follow as soon as you place the order.</p>
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
              Place order
            </SubmitButton>
            {!emailVerified ? <p className="text-center text-xs text-stitch-700">Confirm your email address first (see the top of the page).</p> : null}
          </div>
        </div>
      </aside>
    </ActionForm>
  );
}

function Section({ number, title, hint, busy, children }: { number: number; title: string; hint?: string; busy?: boolean; children: React.ReactNode }) {
  return (
    <section className={panelClass}>
      <div className="flex items-start gap-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-denim-900 font-mono text-xs text-cotton-50">{String(number).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            {title}
            {busy ? <LoaderCircle aria-label="Updating" className="size-4 animate-spin text-muted-foreground" /> : null}
          </h2>
          {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
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

function AddonError() {
  const { state } = useActionForm();
  return state.fields?.addons ? <p className="mt-3 text-sm text-destructive">{state.fields.addons}</p> : null;
}

function defaultMode(shipping: Checkout["shipping"]): ShippingMode {
  if (shipping.air.cost_cents !== null) return "air";
  if (shipping.sea.cost_cents !== null) return "sea";
  return "air";
}

function addonPrice(addon: Addon, pcs: number): number {
  if (addon.price_cents === null || addon.pricing === "on_request") return 0;
  return addon.pricing === "per_piece" ? addon.price_cents * pcs : addon.price_cents;
}

function addonLabel(addon: Addon, pcs: number): string {
  if (addon.pricing === "on_request" || addon.price_cents === null) return "Price on request";
  if (addon.pricing === "per_order") return formatMoney(addon.price_cents);
  return `${formatMoney(addon.price_cents)}/pc · ${formatMoney(addon.price_cents * pcs)}`;
}

function quoteLabel(mode: ShippingMode, quote: FreightQuote): string {
  if (mode === "forwarder") return "No freight";
  return quote.cost_cents === null ? "Quoted later" : `about ${formatMoney(quote.cost_cents)}`;
}

function quoteNote(mode: ShippingMode, quote: FreightQuote): string | null {
  if (mode === "forwarder") return null;
  const transit = transitText(quote);
  if (quote.reason === "fcl") return "A full container suits this order: we quote it for you.";
  if (quote.cost_cents === null) return `We quote the freight to you${transit ? ` (about ${transit} in transit)` : ""}.`;
  return [transit ? `${transit} in transit` : null, quote.basis].filter(Boolean).join(" · ");
}

function freightValue(mode: ShippingMode, quote: FreightQuote): string {
  if (mode === "forwarder") return "Booked by you";
  return quote.cost_cents === null ? "Quoted later" : `${formatMoney(quote.cost_cents)} (est.)`;
}
