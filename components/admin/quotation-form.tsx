"use client";

import { useState, type ComponentProps, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, CopyPlusIcon, PlusIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { AdminForm, FormError, SelectField, SubmitButton, TextAreaField, TextField, useAdminForm } from "@/components/admin/form";
import { BuyerSearch, PartyFields } from "@/components/admin/invoice-form";
import { Panel } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { Button } from "@/components/ui/button";
import { saveQuotation, type QuotationStyleInput } from "@/lib/admin/actions/quotations";
import { amountToCents, centsToText, formatPaisa, profitShare, QUOTATION_COST_KEYS, scaled, stylePrice, type StylePrice } from "@/lib/admin/quotation-price";
import type { InvoiceParty, Quotation, QuotationCostKey, QuotationDefaults, QuotationStyle } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Country = { code: string; name: string };
type StyleRow = QuotationStyleInput & { key: number };
/** The fields typed as text (the fabric unit and profit type are picked). */
type TextKey = Exclude<keyof QuotationStyleInput, "fabric_unit" | "profit_type">;

/** Where a new quotation starts from: a buyer account (?customer=) or a quote request (?inquiry=). */
export type QuotationStart = {
  buyer: InvoiceParty;
  customer: { id: number; label: string } | null;
  inquiry: { id: number; reference: string } | null;
};

const EMPTY_PARTY: InvoiceParty = { company: null, contact_name: null, email: null, phone: null, address: null, country_code: "", tax_id: null };
const MAX_STYLES = 50;

let nextKey = 1;

const costs = (make: (key: QuotationCostKey) => string) => Object.fromEntries(QUOTATION_COST_KEYS.map((key) => [key, make(key)])) as Record<QuotationCostKey, string>;

function emptyRow(): StyleRow {
  return {
    key: nextKey++,
    article_no: "",
    description: "",
    fabric: "",
    colors: "",
    sizes: "",
    details: "",
    qty: "",
    fabric_rate: "",
    fabric_unit: "m",
    fabric_consumption: "",
    ...costs(() => ""),
    extra_label: "",
    profit_type: "percent",
    profit_percent: "",
    profit_amount: "",
  };
}

function rowFromStyle(style: QuotationStyle): StyleRow {
  return {
    key: nextKey++,
    article_no: style.article_no ?? "",
    description: style.description ?? "",
    fabric: style.fabric ?? "",
    colors: style.colors ?? "",
    sizes: style.sizes ?? "",
    details: style.details ?? "",
    qty: style.qty === null ? "" : String(style.qty),
    fabric_rate: centsToText(style.fabric_rate_cents),
    fabric_unit: style.fabric_unit,
    fabric_consumption: style.fabric_consumption === "0" ? "" : style.fabric_consumption,
    ...costs((key) => centsToText(style[`${key}_cents`])),
    extra_label: style.extra_label ?? "",
    profit_type: style.profit_type,
    profit_percent: style.profit_percent ?? "",
    profit_amount: style.profit_type === "amount" ? centsToText(style.profit_cents) : "",
  };
}

const cleanRate = (rate: string) => rate.replace(/rs\.?|[,\s]/gi, "");
const pieces = (qty: string) => {
  const clean = qty.replace(/[,\s]/g, "");
  return /^\d+$/.test(clean) ? Number(clean) : 0;
};

/** The same figures as the API (App\Services\Quotations::price), shown while typing. */
function rowPrice(row: StyleRow, currency: string, rate: string): StylePrice {
  return stylePrice(
    {
      fabricRateCents: amountToCents(row.fabric_rate) ?? 0,
      fabricConsumption: row.fabric_consumption,
      costs: Object.fromEntries(QUOTATION_COST_KEYS.map((key) => [key, amountToCents(row[key]) ?? 0])) as Record<QuotationCostKey, number>,
      profitType: row.profit_type,
      profitPercent: row.profit_percent,
      profitCents: amountToCents(row.profit_amount) ?? 0,
    },
    currency,
    cleanRate(rate),
  );
}

/**
 * Create or edit a quotation: the buyer (typed in, or from an account or a quote request), dates, currency and
 * exchange rate, then each style with its own costs per piece, its price worked out as staff type, and the printed
 * notes and terms.
 */
export function QuotationForm({ quotation, defaults, countries, start }: { quotation?: Quotation; defaults: QuotationDefaults; countries: Country[]; start?: QuotationStart | null }) {
  const [currency, setCurrency] = useState(quotation?.currency ?? "USD");
  // One rate per currency, so switching back and forth keeps what was typed.
  const [rates, setRates] = useState<Record<string, string>>(() => ({ ...defaults.exchange_rates, ...(quotation?.exchange_rate ? { [quotation.currency]: quotation.exchange_rate } : {}) }));
  const rate = rates[currency] ?? "";
  const [incoterm, setIncoterm] = useState(quotation ? (quotation.incoterm ?? "") : "FOB");
  const [shipping, setShipping] = useState(quotation ? centsToText(quotation.shipping_cents) : "");
  const shippingCents = amountToCents(shipping) ?? 0;
  // With these the buyer pays the freight, so a shipping charge contradicts the price basis.
  const buyerPaysFreight = ["EXW", "FCA", "FOB"].includes(incoterm);
  const [rows, setRows] = useState<StyleRow[]>(() => (quotation?.styles?.length ? quotation.styles.map(rowFromStyle) : [emptyRow()]));
  const action = saveQuotation.bind(null, quotation?.id ?? null);

  return (
    <AdminForm action={action} className="grid grid-cols-1 gap-6">
      <Panel title="Buyer" description="Who the quotation is for. Fill it in from a buyer account, or type the details of a buyer who has no account.">
        <BuyerSection quotation={quotation} start={start} countries={countries} />
      </Panel>

      <Panel title="Quotation details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Date" name="issue_date" type="date" defaultValue={quotation?.issue_date ?? defaults.today} required />
          <TextField label="Valid until" name="valid_until" type="date" defaultValue={quotation ? (quotation.valid_until ?? "") : defaults.valid_until} hint="How long the prices hold." />
          <TextField label="Buyer's reference" name="buyer_reference" defaultValue={quotation?.buyer_reference ?? ""} maxLength={60} placeholder="e.g. their RFQ number" />
          <SelectField
            label="Quote in"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            options={defaults.currencies.map((code) => ({ value: code, label: code === "PKR" ? "PKR (rupees)" : code }))}
            hint="Costs are always typed in rupees."
          />
          {currency !== "PKR" ? (
            <TextField
              label={`Exchange rate (Rs for 1 ${currency})`}
              name="exchange_rate"
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRates({ ...rates, [currency]: event.target.value })}
              placeholder="e.g. 280.50"
              hint={defaults.exchange_rates[currency] ? `Last used: Rs ${defaults.exchange_rates[currency]}.` : "The rupee price is divided by this."}
            />
          ) : null}
          <SelectField
            label="Incoterm"
            name="incoterm"
            value={incoterm}
            onChange={(event) => setIncoterm(event.target.value)}
            options={[{ value: "", label: "Not printed" }, ...defaults.incoterms.map((code) => ({ value: code, label: code }))]}
            hint="What the price includes, e.g. FOB."
          />
          <TextField
            label={`Shipping (${currency})`}
            name="shipping"
            inputMode="decimal"
            value={shipping}
            onChange={(event) => setShipping(event.target.value)}
            placeholder="0.00"
            hint={
              shippingCents > 0 && buyerPaysFreight ? (
                <span className="text-stitch-700">With {incoterm} the buyer pays the freight. Choose CFR, CIF, DAP or DDP if this shipping is included.</span>
              ) : (
                "For the whole order: added to the total, not to the prices per piece."
              )
            }
          />
          <TextField
            label="Delivery"
            name="delivery_time"
            defaultValue={quotation ? (quotation.delivery_time ?? "") : defaults.delivery_time}
            maxLength={160}
            fieldClassName={currency === "PKR" ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2"}
          />
        </div>
      </Panel>

      <Panel
        title="Styles"
        description="Each style has its own costs per piece, in rupees. The buyer's PDF shows only the price per piece; the costing sheet shows staff how it was made."
      >
        <StylesEditor rows={rows} setRows={setRows} currency={currency} rate={rate} shippingCents={shippingCents} defaults={defaults} />
      </Panel>

      <Panel title="Notes and terms">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaField label="Notes" name="notes" defaultValue={quotation?.notes ?? ""} maxLength={2000} rows={4} hint="Printed on the quotation, e.g. “Prices for the first order.”" />
          <TextAreaField label="Terms" name="terms" defaultValue={quotation ? (quotation.terms ?? "") : defaults.terms} maxLength={3000} rows={6} hint="Printed as a list, one term per line." />
          <TextAreaField
            label="Staff notes"
            name="staff_notes"
            defaultValue={quotation?.staff_notes ?? ""}
            maxLength={2000}
            rows={3}
            hint="Never printed for the buyer; shown on the costing sheet. E.g. where the fabric rate came from."
            fieldClassName="lg:col-span-2"
          />
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <FormError className="mr-auto" />
        <SubmitButton>{quotation ? "Save quotation" : "Create quotation"}</SubmitButton>
      </div>
    </AdminForm>
  );
}

function BuyerSection({ quotation, start, countries }: { quotation?: Quotation; start?: QuotationStart | null; countries: Country[] }) {
  const [buyer, setBuyer] = useState<InvoiceParty>(quotation?.buyer ?? start?.buyer ?? EMPTY_PARTY);
  const [linked, setLinked] = useState<{ id: number; label: string } | null>(
    quotation ? (quotation.customer ? { id: quotation.customer.id, label: `${quotation.customer.company_name} · ${quotation.customer.email}` } : null) : (start?.customer ?? null),
  );
  const [inquiry, setInquiry] = useState(quotation ? quotation.inquiry : (start?.inquiry ?? null));
  // Remount the inputs with the account's values when a buyer is picked.
  const [round, setRound] = useState(0);

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
      <input type="hidden" name="inquiry_id" value={inquiry?.id ?? ""} />
      {inquiry ? (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-cotton-100 px-3 py-2 text-sm">
          Answers the quote request{" "}
          <Link href={`/admin/inquiries/${inquiry.id}`} target="_blank" className="font-mono font-medium text-denim-600 hover:underline">
            {inquiry.reference}
          </Link>
          <span className="text-xs text-muted-foreground">(emailing the quotation marks it “Quote sent”)</span>
          <button type="button" onClick={() => setInquiry(null)} className="ml-auto inline-flex items-center gap-1 text-xs hover:underline">
            <XIcon className="size-3" /> Unlink
          </button>
        </p>
      ) : null}
      {linked ? (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-denim-50 px-3 py-2 text-sm text-denim-800">
          Made for the account <strong className="font-medium">{linked.label}</strong>
          <button type="button" onClick={() => setLinked(null)} className="ml-auto inline-flex items-center gap-1 text-xs hover:underline">
            <XIcon className="size-3" /> Unlink
          </button>
        </p>
      ) : null}
      <PartyFields key={round} prefix="buyer" party={buyer} countries={countries} document="quotation" />
    </div>
  );
}

function StylesEditor({
  rows,
  setRows,
  currency,
  rate,
  shippingCents,
  defaults,
}: {
  rows: StyleRow[];
  setRows: Dispatch<SetStateAction<StyleRow[]>>;
  currency: string;
  rate: string;
  shippingCents: number;
  defaults: QuotationDefaults;
}) {
  const { state } = useAdminForm();
  const prices = rows.map((row) => rowPrice(row, currency, rate));
  const quantity = rows.reduce((sum, row) => sum + pieces(row.qty), 0);
  const total = rows.reduce((sum, row, index) => sum + pieces(row.qty) * prices[index].unitPriceCents, 0);

  const update = (key: number, changes: Partial<StyleRow>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  const move = (index: number, by: -1 | 1) =>
    setRows((current) => {
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(index + by, 0, row);
      return next;
    });
  // A copy for a similar style: the same costs, a new article no. to type.
  const copy = (index: number) =>
    setRows((current) => {
      const next = [...current];
      next.splice(index + 1, 0, { ...current[index], key: nextKey++, article_no: "" });
      return next;
    });

  return (
    <div className="grid gap-4">
      {/* The rows without their React keys. */}
      <input type="hidden" name="styles" value={JSON.stringify(rows, (name, value: unknown) => (name === "key" ? undefined : value))} />
      {rows.map((row, index) => (
        <StyleCard
          key={row.key}
          row={row}
          index={index}
          count={rows.length}
          price={prices[index]}
          currency={currency}
          rate={rate}
          defaults={defaults}
          onChange={(changes) => update(row.key, changes)}
          onMove={(by) => move(index, by)}
          onCopy={() => copy(index)}
          onRemove={() => setRows((current) => current.filter((r) => r.key !== row.key))}
        />
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => setRows((current) => [...current, emptyRow()])} disabled={rows.length >= MAX_STYLES}>
          <PlusIcon /> Add a style
        </Button>
        <p className="text-sm text-muted-foreground tabular-nums">
          {rows.length} {rows.length === 1 ? "style" : "styles"}
          {quantity > 0 ? (
            <>
              {" · "}
              {quantity.toLocaleString("en-US")} pcs ·{" "}
              {shippingCents > 0 ? `${formatMoney(total, currency)} + ${formatMoney(shippingCents, currency)} shipping = ` : null}
              <strong className="font-semibold text-foreground">{formatMoney(total + shippingCents, currency)}</strong>
            </>
          ) : shippingCents > 0 ? (
            ` · ${formatMoney(shippingCents, currency)} shipping for the order`
          ) : null}
        </p>
      </div>
      {state.fields?.styles ? <p className="text-sm text-destructive">{state.fields.styles}</p> : null}
    </div>
  );
}

function StyleCard({
  row,
  index,
  count,
  price,
  currency,
  rate,
  defaults,
  onChange,
  onMove,
  onCopy,
  onRemove,
}: {
  row: StyleRow;
  index: number;
  count: number;
  price: StylePrice;
  currency: string;
  rate: string;
  defaults: QuotationDefaults;
  onChange: (changes: Partial<StyleRow>) => void;
  onMove: (by: -1 | 1) => void;
  onCopy: () => void;
  onRemove: () => void;
}) {
  const { state } = useAdminForm();
  const error = (field: string) => state.fields?.[`styles.${index}.${field}`];
  const field = (name: TextKey) => ({ value: row[name], onChange: (value: string) => onChange({ [name]: value } as Partial<StyleRow>), error: error(name) });
  const title = [row.article_no, row.description].filter(Boolean).join(" · ");
  const unit = row.fabric_unit;

  return (
    <section aria-labelledby={`style-${row.key}`} className="overflow-hidden rounded-2xl border bg-white">
      <header className="flex items-center gap-1 border-b bg-cotton-50 py-1.5 pr-2 pl-4">
        <h3 id={`style-${row.key}`} className="min-w-0 flex-1 truncate text-sm font-semibold">
          <span className="text-muted-foreground">Style {index + 1}</span>
          {title ? <span> · {title}</span> : null}
        </h3>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move style ${index + 1} up`} title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUpIcon />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move style ${index + 1} down`} title="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
          <ArrowDownIcon />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Copy style ${index + 1}`} title="Copy: a similar style with the same costs" disabled={count >= MAX_STYLES} onClick={onCopy}>
          <CopyPlusIcon />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove style ${index + 1}`} title="Remove" disabled={count === 1} onClick={onRemove} className="text-muted-foreground">
          <XIcon />
        </Button>
      </header>

      <div className="grid gap-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_8rem]">
          <Cell label="Article no." placeholder="The buyer's" maxLength={60} {...field("article_no")} />
          <Cell label="Description" placeholder="e.g. Men's slim fit 5-pocket jeans" maxLength={200} {...field("description")} />
          <Cell label="Quantity (pcs)" placeholder="Optional" inputMode="numeric" {...field("qty")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Cell label="Fabric" placeholder="e.g. 12 oz 98/2 stretch denim" maxLength={200} {...field("fabric")} />
          <Cell label="Colors" placeholder="e.g. Indigo rinse, black" maxLength={200} {...field("colors")} />
          <Cell label="Sizes" placeholder="e.g. 28–38" maxLength={200} {...field("sizes")} />
        </div>
        <Cell label="Details" placeholder="Printed under the style: wash, trims, labels…" maxLength={500} {...field("details")} />

        <div className="grid gap-4 rounded-xl border border-cotton-200 bg-cotton-50/60 p-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="grid content-start gap-5">
            <fieldset>
              <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Fabric</legend>
              <div className="mt-2 grid grid-cols-2 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)_auto]">
                <Cell label="Rate (Rs)" placeholder="e.g. 850" inputMode="decimal" {...field("fabric_rate")} />
                <label className="grid gap-1 text-xs text-muted-foreground">
                  <span>Per</span>
                  <select value={unit} onChange={(event) => onChange({ fabric_unit: event.target.value as StyleRow["fabric_unit"] })} className={cn(inputClass, "text-foreground")}>
                    {defaults.fabric_units.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Cell label={`Consumption (${unit} per piece)`} placeholder="e.g. 1.35" inputMode="decimal" {...field("fabric_consumption")} />
                <p className="col-span-2 self-center text-sm text-muted-foreground sm:col-span-1 sm:pt-5">
                  = <strong className="text-foreground tabular-nums">{formatPaisa(price.fabricCostCents)}</strong>
                </p>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Rate × consumption. Leave both empty when the buyer supplies the fabric (CMT).</p>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Costs per piece (Rs)</legend>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {defaults.costs.map(({ key, label }) => (
                  <Cell key={key} label={label} placeholder="0" inputMode="decimal" {...field(key)} />
                ))}
              </div>
              {row.extra || row.extra_label ? (
                <Cell label="The extra cost is for" placeholder="e.g. lab testing (shown on the costing sheet)" maxLength={60} className="mt-3" {...field("extra_label")} />
              ) : null}
            </fieldset>

            <fieldset>
              <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Profit</legend>
              <div className="mt-2 flex flex-wrap items-start gap-3">
                <div role="radiogroup" aria-label="Profit as" className="mt-5 flex h-10 items-center rounded-lg border bg-white p-0.5">
                  {(
                    [
                      ["percent", "% of the cost"],
                      ["amount", "Rs per piece"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={row.profit_type === value}
                      onClick={() => onChange({ profit_type: value })}
                      className={cn(
                        "h-full rounded-md px-3 text-sm whitespace-nowrap transition-colors",
                        row.profit_type === value ? "bg-denim-900 text-white" : "text-muted-foreground hover:text-denim-900",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {row.profit_type === "percent" ? (
                  <Cell label="Profit (%)" placeholder="e.g. 15" inputMode="decimal" className="w-32" {...field("profit_percent")} />
                ) : (
                  <Cell label="Profit (Rs)" placeholder="e.g. 150" inputMode="decimal" className="w-32" {...field("profit_amount")} />
                )}
              </div>
            </fieldset>
          </div>

          <PriceSummary price={price} row={row} currency={currency} rate={rate} error={error("price")} />
        </div>
      </div>
    </section>
  );
}

/** How the price is made, as the costing sheet prints it, with the price per piece the buyer will see. */
function PriceSummary({ price, row, currency, rate, error }: { price: StylePrice; row: StyleRow; currency: string; rate: string; error?: string }) {
  const rupees = formatPaisa;
  const qty = pieces(row.qty);
  const missingRate = currency !== "PKR" && scaled(cleanRate(rate), 4) === 0;
  const share = profitShare(price.profitCents, price.costCents);

  return (
    <div className="grid h-fit gap-3 rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-cotton-200)] lg:sticky lg:top-4">
      <dl className="grid gap-1.5 text-sm">
        <SummaryRow label="Fabric" value={rupees(price.fabricCostCents)} />
        <SummaryRow label="Other costs" value={rupees(price.costCents - price.fabricCostCents)} />
        <div className="border-t border-denim-900/15 pt-1.5">
          <SummaryRow label="Total cost" value={rupees(price.costCents)} strong />
        </div>
        <SummaryRow label={share ? `Profit (${share})` : "Profit"} value={rupees(price.profitCents)} />
        <SummaryRow label="Price" value={rupees(price.priceCents)} strong />
      </dl>
      {price.costCents > 0 && price.profitCents === 0 ? (
        <p className="flex items-start gap-1.5 text-xs text-stitch-700">
          <TriangleAlertIcon className="mt-px size-3.5 shrink-0" /> No profit added yet.
        </p>
      ) : null}
      <div className="rounded-lg bg-denim-900 px-3 py-2.5 text-white">
        <p className="text-[11px] tracking-wide text-stitch-300 uppercase">Quoted per piece</p>
        <p className="font-heading text-2xl font-semibold tabular-nums">{missingRate ? "—" : formatMoney(price.unitPriceCents, currency)}</p>
        {missingRate ? <p className="text-xs text-cotton-200">Enter the exchange rate.</p> : null}
        {!missingRate && qty > 0 ? (
          <p className="text-xs text-cotton-200 tabular-nums">
            × {qty.toLocaleString("en-US")} pcs = {formatMoney(price.unitPriceCents * qty, currency)}
          </p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", strong && "font-semibold")}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** A labelled input of a style, with its error underneath. */
function Cell({
  label,
  value,
  onChange,
  error,
  className,
  ...props
}: { label: string; value: string; onChange: (value: string) => void; error?: string; className?: string } & Omit<ComponentProps<"input">, "value" | "onChange" | "className">) {
  return (
    <label className={cn("grid content-start gap-1 text-xs text-muted-foreground", className)}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} className={cn(inputClass, "text-foreground")} {...props} />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
