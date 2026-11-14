"use client";

import { useEffect, useRef, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { Loader2Icon, PlusIcon, UserRoundSearchIcon, XIcon } from "lucide-react";
import { AdminForm, FormError, SelectField, SubmitButton, TextAreaField, TextField, useAdminForm } from "@/components/admin/form";
import { Panel } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { buyerFromAccount, saveInvoice, searchBuyers, type BuyerMatch } from "@/lib/admin/actions/invoices";
import type { Invoice, InvoiceDefaults, InvoiceParty, InvoiceType } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Country = { code: string; name: string };
type LineRow = { key: number; description: string; details: string; hs_code: string; qty: string; unit: string; price: string };

const TYPES: { value: InvoiceType; label: string; prefix: string; text: string }[] = [
  { value: "sample", label: "Sample invoice", prefix: "SI", text: "Samples and the courier, paid in full before dispatch." },
  { value: "proforma", label: "Proforma invoice", prefix: "PI", text: "A production order: a deposit now, the balance before shipment." },
  { value: "commercial", label: "Invoice", prefix: "INV", text: "The final invoice, less what was already paid." },
];

const EMPTY_PARTY: InvoiceParty = { company: null, contact_name: null, email: null, phone: null, address: null, country_code: "", tax_id: null };

let nextKey = 1;

const dollars = (cents: number | null | undefined): string => (cents ? (cents / 100).toFixed(2) : "");
const toCents = (value: string): number => {
  const amount = Number(value.replace(/[,\s$€£]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

function deliveryDefault(type: InvoiceType, defaults: InvoiceDefaults): string {
  if (type === "sample") return `About ${defaults.sample_lead_time_days} days after payment`;
  if (type === "proforma") return `About ${defaults.lead_time_days} days after the deposit`;
  return "";
}

/**
 * Create or edit an invoice: the type (new invoices only), the buyer (typed in or copied from an account), dates,
 * shipment, lines, charges with live totals, and the printed notes and terms.
 */
export function InvoiceForm({
  invoice,
  initialType = "sample",
  defaults,
  countries,
  account,
}: {
  invoice?: Invoice;
  initialType?: InvoiceType;
  defaults: InvoiceDefaults;
  countries: Country[];
  /** A buyer account to start from (?customer= on the new-invoice page). */
  account?: { customerId: number; buyer: InvoiceParty; label: string } | null;
}) {
  const [type, setType] = useState<InvoiceType>(invoice?.type ?? initialType);
  const [currency, setCurrency] = useState(invoice?.currency ?? "USD");
  const [dueDate, setDueDate] = useState(invoice ? (invoice.due_date ?? "") : (defaults.due_dates[initialType] ?? ""));
  const [delivery, setDelivery] = useState(invoice ? (invoice.delivery_time ?? "") : deliveryDefault(initialType, defaults));
  const [terms, setTerms] = useState(invoice ? (invoice.terms ?? "") : defaults.terms[initialType]);
  const [charges, setCharges] = useState({
    shipping: dollars(invoice?.amounts.shipping_cents),
    discount: dollars(invoice?.amounts.discount_cents),
    received: dollars(invoice?.amounts.received_cents),
    deposit: String(invoice?.type === "proforma" ? invoice.amounts.deposit_percent : defaults.deposit_percent),
  });
  const [lines, setLines] = useState<LineRow[]>(() =>
    invoice
      ? invoice.lines.map((line) => ({
          key: nextKey++,
          description: line.description,
          details: line.details ?? "",
          hs_code: line.hs_code ?? "",
          qty: String(line.qty),
          unit: line.unit,
          price: (line.unit_price_cents / 100).toFixed(2),
        }))
      : [newLine(initialType, defaults)],
  );

  // A new invoice follows the type's defaults until staff change the field themselves.
  const changeType = (next: InvoiceType) => {
    if (dueDate === (defaults.due_dates[type] ?? "")) setDueDate(defaults.due_dates[next] ?? "");
    if (delivery === deliveryDefault(type, defaults)) setDelivery(deliveryDefault(next, defaults));
    if (terms === defaults.terms[type]) setTerms(defaults.terms[next]);
    setType(next);
  };

  const action = saveInvoice.bind(null, invoice?.id ?? null, type);

  return (
    <AdminForm action={action} className="grid grid-cols-1 gap-6">
      {!invoice ? (
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">Kind of invoice</legend>
          {TYPES.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-2xl border bg-white p-4 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
                type === option.value ? "border-denim-700 shadow-[inset_0_0_0_1px_var(--color-denim-700)]" : "hover:border-denim-300",
              )}
            >
              <input type="radio" name="type" value={option.value} checked={type === option.value} onChange={() => changeType(option.value)} className="sr-only" />
              <span className="flex items-center justify-between gap-2">
                <span className="font-heading font-semibold">{option.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{option.prefix}-…</span>
              </span>
              <span className="text-sm text-muted-foreground">{option.text}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <Panel title="Buyer" description="Who the invoice is for. Fill it in from a buyer account, or type the details of a buyer who has no account.">
        <BuyerFields invoice={invoice} account={account} countries={countries} />
      </Panel>

      <Panel title="Invoice details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Invoice date" name="issue_date" type="date" defaultValue={invoice?.issue_date ?? defaults.today} required />
          <TextField
            label={type === "proforma" ? "Valid until" : "Due date"}
            name="due_date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            hint={type === "proforma" ? "How long the prices hold." : "Leave empty for “on receipt”."}
          />
          <SelectField
            label="Currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            options={defaults.currencies.map((code) => ({ value: code, label: code }))}
            hint="The bank account in Settings receives the transfer."
          />
          <TextField label="Buyer's reference" name="buyer_reference" defaultValue={invoice?.buyer_reference ?? ""} maxLength={60} placeholder="e.g. their PO number" />
          <TextField label="Ship by" name="shipping_method" defaultValue={invoice?.shipping_method ?? (type === "sample" && !invoice ? "DHL Express" : "")} maxLength={120} placeholder="e.g. DHL Express, sea freight" />
          <SelectField
            label="Incoterm"
            name="incoterm"
            defaultValue={invoice?.incoterm ?? ""}
            options={[{ value: "", label: "Not printed" }, ...defaults.incoterms.map((code) => ({ value: code, label: code }))]}
          />
          <TextField
            label={type === "sample" ? "Ready" : "Delivery"}
            name="delivery_time"
            value={delivery}
            onChange={(event) => setDelivery(event.target.value)}
            maxLength={160}
            fieldClassName="sm:col-span-2 lg:col-span-3"
          />
        </div>
      </Panel>

      <Panel title="Items" description="Each line prints with its description, details (style, color, sizes) and HS code if given.">
        <LinesEditor lines={lines} setLines={setLines} currency={currency} type={type} defaults={defaults} />
      </Panel>

      <Panel title="Charges and totals">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <TextField
              label={type === "sample" ? `Courier (${currency})` : `Freight (${currency})`}
              name="shipping"
              inputMode="decimal"
              value={charges.shipping}
              onChange={(event) => setCharges({ ...charges, shipping: event.target.value })}
              placeholder="0.00"
            />
            <TextField
              label={`Discount (${currency})`}
              name="discount"
              inputMode="decimal"
              value={charges.discount}
              onChange={(event) => setCharges({ ...charges, discount: event.target.value })}
              placeholder="0.00"
            />
            <TextField
              label={`Already received (${currency})`}
              name="received"
              inputMode="decimal"
              value={charges.received}
              onChange={(event) => setCharges({ ...charges, received: event.target.value })}
              placeholder="0.00"
              hint={type === "commercial" ? "e.g. the deposit paid on the proforma. It is deducted." : "Paid earlier and deducted, e.g. a sample credit."}
            />
            {type === "proforma" ? (
              <TextField
                label="Deposit (%)"
                name="deposit_percent"
                type="number"
                min={1}
                max={100}
                value={charges.deposit}
                onChange={(event) => setCharges({ ...charges, deposit: event.target.value })}
                hint="Share of the total due now. The rest is due before shipment."
              />
            ) : null}
          </div>
          <Totals lines={lines} charges={charges} type={type} currency={currency} />
        </div>
      </Panel>

      <Panel title="Notes and terms">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaField label="Notes" name="notes" defaultValue={invoice?.notes ?? ""} maxLength={2000} rows={4} hint="Printed on the invoice, e.g. “Samples for fit approval before the bulk order.”" />
          <TextAreaField label="Terms" name="terms" value={terms} onChange={(event) => setTerms(event.target.value)} maxLength={3000} rows={6} hint="Printed as a list, one term per line." />
          <TextAreaField label="Staff notes" name="staff_notes" defaultValue={invoice?.staff_notes ?? ""} maxLength={2000} rows={3} hint="Only staff see these. Never printed." fieldClassName="lg:col-span-2" />
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <FormError className="mr-auto" />
        <SubmitButton>{invoice ? "Save invoice" : "Create invoice"}</SubmitButton>
      </div>
    </AdminForm>
  );
}

function newLine(type: InvoiceType, defaults: InvoiceDefaults): LineRow {
  return { key: nextKey++, description: "", details: "", hs_code: "", qty: "1", unit: "pcs", price: type === "sample" ? dollars(defaults.sample_price_cents) : "" };
}

function BuyerFields({ invoice, account, countries }: { invoice?: Invoice; account?: { customerId: number; buyer: InvoiceParty; label: string } | null; countries: Country[] }) {
  const [buyer, setBuyer] = useState<InvoiceParty>(invoice?.buyer ?? account?.buyer ?? EMPTY_PARTY);
  const [linked, setLinked] = useState<{ id: number; label: string } | null>(
    invoice?.customer ? { id: invoice.customer.id, label: `${invoice.customer.company_name} · ${invoice.customer.email}` } : account ? { id: account.customerId, label: account.label } : null,
  );
  // Remount the inputs with the account's values when a buyer is picked.
  const [round, setRound] = useState(0);
  const [elsewhere, setElsewhere] = useState(invoice?.consignee != null);
  const consignee = invoice?.consignee ?? EMPTY_PARTY;

  return (
    <div className="grid gap-5">
      <BuyerSearch
        onPick={(picked) => {
          setBuyer(picked.buyer);
          setLinked({ id: picked.customerId, label: picked.label });
          setRound((value) => value + 1);
        }}
      />
      <input type="hidden" name="customer_id" value={linked?.id ?? ""} />
      {linked ? (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-denim-50 px-3 py-2 text-sm text-denim-800">
          Made for the account <strong className="font-medium">{linked.label}</strong>
          <button type="button" onClick={() => setLinked(null)} className="ml-auto inline-flex items-center gap-1 text-xs hover:underline">
            <XIcon className="size-3" /> Unlink
          </button>
        </p>
      ) : null}
      <PartyFields key={round} prefix="buyer" party={buyer} countries={countries} />

      <div className="flex items-start gap-3 border-t pt-4">
        <Switch id="field-ship_elsewhere" name="ship_elsewhere" value="on" checked={elsewhere} onCheckedChange={setElsewhere} className="mt-0.5" />
        <div className="grid gap-0.5">
          <label htmlFor="field-ship_elsewhere" className="text-sm font-medium">
            Ship to another address
          </label>
          <p className="text-xs text-muted-foreground">Otherwise the invoice says “Ship to: same as the buyer”.</p>
        </div>
      </div>
      {elsewhere ? <PartyFields prefix="consignee" party={consignee} countries={countries} /> : null}
    </div>
  );
}

function PartyFields({ prefix, party, countries }: { prefix: "buyer" | "consignee"; party: InvoiceParty; countries: Country[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Company" name={`${prefix}.company`} defaultValue={party.company ?? ""} maxLength={160} autoComplete="off" />
      <TextField label="Contact name" name={`${prefix}.contact_name`} defaultValue={party.contact_name ?? ""} maxLength={120} autoComplete="off" />
      {prefix === "buyer" ? (
        <TextField label="Email" name="buyer.email" type="email" defaultValue={party.email ?? ""} hint="The invoice is emailed here by default." autoComplete="off" />
      ) : null}
      <TextField label="Phone" name={`${prefix}.phone`} type="tel" defaultValue={party.phone ?? ""} autoComplete="off" />
      <TextAreaField label="Address" name={`${prefix}.address`} defaultValue={party.address ?? ""} maxLength={500} rows={3} placeholder={"Street and number\nPostcode and city"} fieldClassName="sm:row-span-2" />
      <SelectField
        label="Country"
        name={`${prefix}.country_code`}
        defaultValue={party.country_code ?? ""}
        options={[{ value: "", label: "Choose a country" }, ...countries.map((country) => ({ value: country.code, label: country.name }))]}
      />
      <TextField label="Tax / import ID" name={`${prefix}.tax_id`} defaultValue={party.tax_id ?? ""} maxLength={60} placeholder="VAT, EORI or import number" autoComplete="off" />
    </div>
  );
}

/** Find a buyer account by company, contact or email, and copy its details into the invoice. */
function BuyerSearch({ onPick }: { onPick: (picked: { customerId: number; buyer: InvoiceParty; label: string }) => void }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<BuyerMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, startSearch] = useTransition();
  const [loading, startLoad] = useTransition();
  const latest = useRef("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    latest.current = q;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const found = await searchBuyers(q);
        // Ignore answers to older searches that arrive late.
        if (latest.current === q) setMatches(found);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = (match: BuyerMatch) =>
    startLoad(async () => {
      const result = await buyerFromAccount(match.id);
      if (!result) return;
      onPick({ ...result, label: `${match.company_name} · ${match.email}` });
      setQuery("");
      setMatches([]);
      setOpen(false);
    });

  return (
    <div className="relative">
      <label htmlFor="buyer-search" className="text-sm font-medium">
        Fill in from a buyer account
      </label>
      <div className="relative mt-1.5">
        <UserRoundSearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="buyer-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (event.target.value.trim().length < 2) setMatches([]);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            // Enter picks the first match instead of submitting the invoice.
            if (event.key === "Enter") {
              event.preventDefault();
              if (matches[0]) pick(matches[0]);
            }
          }}
          placeholder="Search by company, contact or email"
          autoComplete="off"
          className={cn(inputClass, "pl-9")}
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls="buyer-search-results"
        />
        {searching || loading ? <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      </div>
      {open && query.trim().length >= 2 && !searching ? (
        <ul id="buyer-search-results" role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white p-1 shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No buyer account matches. Type the details below.</li>
          ) : (
            matches.map((match) => (
              <li key={match.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(match)}
                  className="grid w-full gap-0.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-cotton-50"
                >
                  <span className="font-medium">{match.company_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {match.contact_name} · {match.email} · {match.country_code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function LinesEditor({
  lines,
  setLines,
  currency,
  type,
  defaults,
}: {
  lines: LineRow[];
  setLines: Dispatch<SetStateAction<LineRow[]>>;
  currency: string;
  type: InvoiceType;
  defaults: InvoiceDefaults;
}) {
  const { state } = useAdminForm();
  const update = (key: number, changes: Partial<LineRow>) => setLines((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  const error = (index: number, field: string) => state.fields?.[`lines.${index}.${field}`];
  const cell = "grid gap-1 text-xs text-muted-foreground";

  return (
    <div className="grid gap-3">
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(lines.map(({ description, details, hs_code, qty, unit, price }) => ({ description, details, hs_code, qty, unit, price })))}
      />
      {lines.map((row, index) => {
        const amount = (Number(row.qty) || 0) * toCents(row.price);
        const rowErrors = ["description", "details", "hs_code", "qty", "unit", "price"].map((field) => error(index, field)).filter(Boolean);
        return (
          <div key={row.key} className="rounded-xl border p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_5rem_5rem_7rem]">
              <label className={cn(cell, "col-span-2 sm:col-span-1")}>
                <span>
                  {index + 1}. Description
                </span>
                <input
                  value={row.description}
                  onChange={(event) => update(row.key, { description: event.target.value })}
                  maxLength={200}
                  placeholder={type === "sample" ? "e.g. Men's slim fit jeans, sample" : "e.g. Men's slim fit jeans"}
                  aria-invalid={error(index, "description") ? true : undefined}
                  className={cn(inputClass, "text-foreground")}
                />
              </label>
              <label className={cell}>
                HS code
                <input value={row.hs_code} onChange={(event) => update(row.key, { hs_code: event.target.value })} maxLength={20} placeholder="6203.42" aria-invalid={error(index, "hs_code") ? true : undefined} className={cn(inputClass, "text-foreground")} />
              </label>
              <label className={cell}>
                Qty
                <input type="number" min={1} value={row.qty} onChange={(event) => update(row.key, { qty: event.target.value })} aria-invalid={error(index, "qty") ? true : undefined} className={cn(inputClass, "text-foreground")} />
              </label>
              <label className={cell}>
                Unit
                <input value={row.unit} onChange={(event) => update(row.key, { unit: event.target.value })} maxLength={20} placeholder="pcs" className={cn(inputClass, "text-foreground")} />
              </label>
              <label className={cell}>
                Price ({currency})
                <input inputMode="decimal" value={row.price} onChange={(event) => update(row.key, { price: event.target.value })} placeholder="0.00" aria-invalid={error(index, "price") ? true : undefined} className={cn(inputClass, "text-foreground")} />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <input
                value={row.details}
                onChange={(event) => update(row.key, { details: event.target.value })}
                maxLength={500}
                placeholder="Details: style no., color, sizes"
                aria-label={`Line ${index + 1} details`}
                className={cn(inputClass, "col-span-2 h-9 text-[13px] sm:col-span-1")}
              />
              <span className="text-right text-sm font-medium tabular-nums sm:min-w-24">{formatMoney(amount, currency)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove line ${index + 1}`}
                disabled={lines.length === 1}
                onClick={() => setLines((current) => current.filter((r) => r.key !== row.key))}
                className="text-muted-foreground"
              >
                <XIcon />
              </Button>
            </div>
            {rowErrors.length > 0 ? <p className="mt-2 text-sm text-destructive">{rowErrors.join(" ")}</p> : null}
          </div>
        );
      })}
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setLines((current) => [...current, newLine(type, defaults)])} disabled={lines.length >= 50}>
          <PlusIcon /> Add a line
        </Button>
      </div>
      {state.fields?.lines ? <p className="text-sm text-destructive">{state.fields.lines}</p> : null}
    </div>
  );
}

/** The same sums as the API (App\Services\Invoices::totals), shown while typing. */
function Totals({ lines, charges, type, currency }: { lines: LineRow[]; charges: { shipping: string; discount: string; received: string; deposit: string }; type: InvoiceType; currency: string }) {
  const subtotal = lines.reduce((sum, row) => sum + (Number(row.qty) || 0) * toCents(row.price), 0);
  const shipping = toCents(charges.shipping);
  const discount = toCents(charges.discount);
  const received = toCents(charges.received);
  const total = Math.max(0, subtotal + shipping - discount);
  const balance = Math.max(0, total - received);
  const percent = Math.min(100, Math.max(1, Number(charges.deposit) || 100));
  const dueNow = type === "proforma" ? Math.min(balance, Math.max(0, Math.round((total * percent) / 100) - received)) : balance;
  const money = (cents: number) => formatMoney(cents, currency);
  const pieces = lines.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);

  return (
    <dl className="grid h-fit gap-2 rounded-xl bg-cotton-50 p-4 text-sm">
      <Row label={`Subtotal (${pieces} ${pieces === 1 ? "pc" : "pcs"})`} value={money(subtotal)} />
      {shipping > 0 ? <Row label={type === "sample" ? "Courier" : "Freight"} value={money(shipping)} /> : null}
      {discount > 0 ? <Row label="Discount" value={`−${money(discount)}`} /> : null}
      <div className="border-t border-denim-900/20 pt-2">
        <Row label="Total" value={money(total)} strong />
      </div>
      {received > 0 ? <Row label="Already received" value={`−${money(received)}`} /> : null}
      <div className="mt-1 rounded-lg bg-orange-50 px-3 py-2 text-stitch-700">
        <Row label={type === "proforma" && percent < 100 ? `Deposit due now (${percent}%)` : "Amount due"} value={money(dueNow)} strong />
      </div>
      {type === "proforma" && balance - dueNow > 0 ? <Row label="Balance before shipment" value={money(balance - dueNow)} /> : null}
    </dl>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", strong && "font-semibold")}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
