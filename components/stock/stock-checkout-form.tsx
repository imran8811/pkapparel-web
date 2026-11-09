"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Store, Truck } from "lucide-react";
import { VerifyEmailBanner } from "@/components/account/account-notices";
import { ActionForm, CheckboxInput, FormMessage, SubmitButton, TextAreaInput, TextInput } from "@/components/forms/action-form";
import { panelClass } from "@/components/forms/styles";
import { placeStockOrder } from "@/lib/account/actions/stock";
import type { Address, Customer } from "@/lib/account/types";
import { notifyUiChange } from "@/lib/account/use-ui-state";
import { formatRupees, RETURN_DAYS, type StockCheckout } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Delivery = "cargo" | "pickup";

/** The stock checkout: cargo to a saved or new address, or collection; how to pay; notes; the order and its total. */
export function StockCheckoutForm({ checkout, customer }: { checkout: StockCheckout; customer: Customer }) {
  const [delivery, setDelivery] = useState<Delivery>("cargo");
  const [address, setAddress] = useState<number | "new">(checkout.addresses[0]?.id ?? "new");
  const { cart, pickup } = checkout;
  const canPlace = cart.can_checkout && checkout.email_verified;

  return (
    <ActionForm action={placeStockOrder} onSuccess={notifyUiChange} className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      <input type="hidden" name="expected_total_cents" value={cart.total_cents} />
      <input type="hidden" name="delivery" value={delivery} />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-7">
        {!checkout.email_verified ? <VerifyEmailBanner email={customer.email} /> : null}

        <Section number={1} title="Delivery">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery">
            <DeliveryOption
              checked={delivery === "cargo"}
              onSelect={() => setDelivery("cargo")}
              icon={Truck}
              title="Cargo to your city"
              body={`We book the cargo within ${checkout.dispatch_days} days of your payment. You pay the cargo charges when it arrives.`}
            />
            <DeliveryOption
              checked={delivery === "pickup"}
              onSelect={() => setDelivery("pickup")}
              icon={Store}
              title="Collect from us"
              body={`Ready to collect within ${checkout.dispatch_days} days of your payment.`}
            />
          </div>

          {delivery === "cargo" ? (
            <div className="mt-6 grid gap-5">
              <AddressChoice addresses={checkout.addresses} value={address} onChange={setAddress} customer={customer} />
              <TextInput
                label="Cargo company you prefer"
                name="cargo_company"
                placeholder="Optional, e.g. the one with an office near your shop"
                hint="Leave it empty and we choose one."
              />
            </div>
          ) : (
            <div className="mt-6 flex gap-3 rounded-2xl bg-cotton-50 p-4 text-sm">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-denim-600" />
              <p>
                {pickup.address ?? "We send you the address with the order confirmation."}
                {pickup.hours ? <span className="block text-muted-foreground">{pickup.hours}</span> : null}
              </p>
            </div>
          )}
        </Section>

        <Section number={2} title="Payment">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pay the full amount by {checkout.payment_methods.length > 0 ? joinAnd(checkout.payment_methods.map((method) => method.replace(/^Bank transfer$/, "bank transfer"))) : "bank transfer, JazzCash or Easypaisa"} after
            placing the order. The account details are on your order page and in the email we send. Your sets are held for you once the payment is confirmed;
            an order not paid within {checkout.payment_days} days is cancelled.
          </p>
        </Section>

        <Section number={3} title="Notes">
          <TextAreaInput label="Anything we should know?" name="notes" rows={3} placeholder="Optional, e.g. when you can collect, or a second phone number" />
        </Section>
      </div>

      <aside className={cn(panelClass, "grid min-w-0 gap-5 lg:sticky lg:top-28 lg:col-span-5")}>
        <h2 className="font-heading text-lg font-semibold">Your order</h2>
        <ul className="grid gap-3 text-sm">
          {cart.lines.map((line) => (
            <li key={line.color_id} className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block font-medium">{line.style.name}</span>
                <span className="text-muted-foreground">
                  {line.name} · {line.sets} × {formatRupees(line.set_price_cents)} ({line.set.pieces} × {formatRupees(line.piece_price_cents)})
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{formatRupees(line.line_cents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-end justify-between border-t border-dashed pt-4">
          <span className="text-sm text-muted-foreground">
            {cart.total_sets} {cart.total_sets === 1 ? "set" : "sets"}, {cart.total_pieces} pcs
          </span>
          <span className="font-heading text-2xl font-semibold tabular-nums">{formatRupees(cart.total_cents)}</span>
        </div>
        {cart.issues.length > 0 ? (
          <ul role="alert" className="grid gap-1 rounded-xl bg-orange-50 px-3 py-2 text-xs text-stitch-700">
            {cart.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}
        <CheckboxInput
          name="accept_terms"
          label={
            <>
              I agree to the{" "}
              <Link href="/stock/terms" target="_blank" className="font-medium text-denim-600 underline-offset-2 hover:underline">
                terms and returns
              </Link>{" "}
              (returns within {RETURN_DAYS} days if there is an issue).
            </>
          }
        />
        <FormMessage />
        <SubmitButton size="lg" pendingLabel="Placing your order…" disabled={!canPlace}>
          Place order
        </SubmitButton>
        {!cart.can_checkout ? (
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/stock/cart" className="font-medium text-denim-600 hover:underline">
              Check your cart
            </Link>{" "}
            first.
          </p>
        ) : null}
      </aside>
    </ActionForm>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className={panelClass}>
      <h2 className="flex items-center gap-3 font-heading text-lg font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-denim-900 font-mono text-xs text-white">{number}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DeliveryOption({
  checked,
  onSelect,
  icon: Icon,
  title,
  body,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: typeof Truck;
  title: string;
  body: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
        checked ? "border-denim-600 bg-denim-50/50 ring-1 ring-denim-600" : "border-border hover:border-denim-300",
      )}
    >
      <input type="radio" name="delivery_choice" checked={checked} onChange={onSelect} className="mt-1 accent-denim-600" />
      <span className="min-w-0 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon aria-hidden className="size-4 text-denim-600" /> {title}
        </span>
        <span className="mt-1 block text-muted-foreground">{body}</span>
      </span>
    </label>
  );
}

/** A saved address or a new one (shop, contact, phone, street and city; saved to the address book with the order). */
function AddressChoice({
  addresses,
  value,
  onChange,
  customer,
}: {
  addresses: Address[];
  value: number | "new";
  onChange: (value: number | "new") => void;
  customer: Customer;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">Send the cargo to</p>
      <div className="grid gap-3" role="radiogroup" aria-label="Cargo address">
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
                {option.contact_name} · {option.line1}, {option.city} · {option.phone}
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
          <MapPin aria-hidden className="size-4 text-denim-600" /> {addresses.length > 0 ? "A new address" : "Add your address"}
        </label>
      </div>
      {value === "new" ? (
        <div className="mt-5 grid grid-cols-1 gap-5 rounded-2xl bg-cotton-50 p-4 sm:grid-cols-2 sm:p-5">
          <TextInput label="Shop or business name" name="company" required defaultValue={customer.company_name} autoComplete="organization" />
          <TextInput label="Receiver's name" name="contact_name" required defaultValue={customer.contact_name} autoComplete="name" />
          <TextInput label="Phone" name="phone" type="tel" required defaultValue={customer.phone} autoComplete="tel" />
          <TextInput label="City" name="city" required defaultValue={customer.city ?? ""} autoComplete="address-level2" />
          <TextInput label="Address" name="line1" required autoComplete="address-line1" fieldClassName="sm:col-span-2" placeholder="Shop number, market, street" />
          <TextInput label="Landmark" name="line2" autoComplete="address-line2" fieldClassName="sm:col-span-2" hint="Optional." />
          <p className="text-xs text-muted-foreground sm:col-span-2">The address is saved to your account for next time.</p>
        </div>
      ) : null}
    </div>
  );
}

/** "bank transfer, JazzCash or Easypaisa" */
function joinAnd(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}
