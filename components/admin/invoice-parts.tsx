import { Pill } from "@/components/admin/page-parts";
import type { Invoice, InvoiceParty, InvoiceStage } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";
import { formatDay } from "@/lib/admin/time";

/* Pieces of the invoice pages (server components). */

const STAGE_TONES: Record<InvoiceStage, "neutral" | "blue" | "green" | "orange" | "red" | "muted"> = {
  not_sent: "orange",
  sent: "blue",
  overdue: "red",
  paid: "green",
  cancelled: "muted",
};

export function InvoiceStagePill({ invoice }: { invoice: Pick<Invoice, "stage" | "stage_label"> }) {
  return <Pill tone={STAGE_TONES[invoice.stage]}>{invoice.stage_label}</Pill>;
}

/** "SI-2026-00001" → the type in words, shown next to the number. */
export function InvoiceTypePill({ invoice }: { invoice: Pick<Invoice, "type_label"> }) {
  return <Pill tone="muted">{invoice.type_label}</Pill>;
}

/** The invoice as the buyer will read it (the PDF has the same content, with the company and bank details). */
export function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  const { amounts } = invoice;
  const proformaDeposit = invoice.type === "proforma" && amounts.deposit_percent < 100;

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <PartyBlock title="Bill to" party={invoice.buyer} />
        {invoice.consignee ? <PartyBlock title="Ship to" party={invoice.consignee} /> : (
          <div className="text-sm">
            <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Ship to</p>
            <p className="text-muted-foreground">Same as the buyer</p>
          </div>
        )}
        <dl className="grid h-fit grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
          <dt className="col-span-2 mb-0.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Details</dt>
          <dt className="text-muted-foreground">Date</dt>
          <dd>{formatDay(invoice.issue_date)}</dd>
          <dt className="text-muted-foreground">{invoice.type === "proforma" ? "Valid until" : "Due"}</dt>
          <dd>{invoice.due_date ? formatDay(invoice.due_date) : "On receipt"}</dd>
          {invoice.buyer_reference ? (
            <>
              <dt className="text-muted-foreground">Reference</dt>
              <dd>{invoice.buyer_reference}</dd>
            </>
          ) : null}
          {invoice.shipping_method ? (
            <>
              <dt className="text-muted-foreground">Ship by</dt>
              <dd>
                {invoice.shipping_method}
                {invoice.incoterm ? ` · ${invoice.incoterm}` : ""}
              </dd>
            </>
          ) : null}
          {invoice.delivery_time ? (
            <>
              <dt className="text-muted-foreground">{invoice.type === "sample" ? "Ready" : "Delivery"}</dt>
              <dd>{invoice.delivery_time}</dd>
            </>
          ) : null}
        </dl>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Item</th>
              <th className="py-2 pr-3 text-right font-medium">Qty</th>
              <th className="py-2 pr-3 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr key={index} className="border-b align-top last:border-b-0">
                <td className="py-2.5 pr-3">
                  <p className="font-medium">{line.description}</p>
                  {line.details || line.hs_code ? (
                    <p className="text-xs text-muted-foreground">{[line.details, line.hs_code ? `HS ${line.hs_code}` : null].filter(Boolean).join(" · ")}</p>
                  ) : null}
                </td>
                <td className="py-2.5 pr-3 text-right whitespace-nowrap tabular-nums">
                  {line.qty} {line.unit}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{money(line.unit_price_cents)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">{money(line.amount_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid content-start gap-3 text-sm">
          {invoice.notes ? (
            <div>
              <p className="mb-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Notes</p>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </div>
          ) : null}
          {invoice.terms ? (
            <div>
              <p className="mb-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Terms</p>
              <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
                {invoice.terms
                  .split("\n")
                  .map((term) => term.trim())
                  .filter(Boolean)
                  .map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
        <dl className="grid h-fit gap-1.5 rounded-xl bg-cotton-50 p-4 text-sm">
          <Amount label="Subtotal" value={money(amounts.subtotal_cents)} />
          {amounts.shipping_cents > 0 ? <Amount label={invoice.type === "sample" ? "Courier" : "Freight"} value={money(amounts.shipping_cents)} /> : null}
          {amounts.discount_cents > 0 ? <Amount label="Discount" value={`−${money(amounts.discount_cents)}`} /> : null}
          <div className="mt-1 border-t border-denim-900/20 pt-2">
            <Amount label="Total" value={money(amounts.total_cents)} strong />
          </div>
          {amounts.received_cents > 0 ? <Amount label="Already received" value={`−${money(amounts.received_cents)}`} /> : null}
          {invoice.status === "open" ? (
            <div className="mt-1 rounded-lg bg-orange-50 px-3 py-2 text-stitch-700">
              <Amount label={proformaDeposit ? `Deposit due now (${amounts.deposit_percent}%)` : "Amount due"} value={money(amounts.due_now_cents)} strong />
            </div>
          ) : null}
          {invoice.status === "open" && amounts.balance_after_cents > 0 ? <Amount label="Balance before shipment" value={money(amounts.balance_after_cents)} /> : null}
        </dl>
      </div>
    </div>
  );
}

function PartyBlock({ title, party }: { title: string; party: InvoiceParty }) {
  return (
    <address className="text-sm leading-relaxed not-italic">
      <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{title}</p>
      <p className="font-medium">{party.company ?? party.contact_name}</p>
      {party.company && party.contact_name ? <p>Attn: {party.contact_name}</p> : null}
      {party.address ? <p className="whitespace-pre-line">{party.address}</p> : null}
      <p>{countryName(party.country_code)}</p>
      {party.email || party.phone ? <p className="mt-1 text-muted-foreground">{[party.phone, party.email].filter(Boolean).join(" · ")}</p> : null}
      {party.tax_id ? <p className="text-muted-foreground">Tax / import ID: {party.tax_id}</p> : null}
    </address>
  );
}

function Amount({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-baseline justify-between gap-3 font-semibold" : "flex items-baseline justify-between gap-3"}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
