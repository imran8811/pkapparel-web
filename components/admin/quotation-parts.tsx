import { Pill } from "@/components/admin/page-parts";
import { formatPaisa, profitShare, QUOTATION_COST_KEYS } from "@/lib/admin/quotation-price";
import { formatDay } from "@/lib/admin/time";
import type { InvoiceParty, Quotation, QuotationStage, QuotationStyle } from "@/lib/admin/types";
import { countryName, formatMoney } from "@/lib/format";

/* Pieces of the quotation pages (server components). */

const STAGE_TONES: Record<QuotationStage, "neutral" | "blue" | "green" | "orange" | "red" | "muted"> = {
  draft: "orange",
  sent: "blue",
  expired: "red",
  accepted: "green",
  declined: "muted",
};

export function QuotationStagePill({ quotation }: { quotation: Pick<Quotation, "stage" | "stage_label"> }) {
  return <Pill tone={STAGE_TONES[quotation.stage]}>{quotation.stage_label}</Pill>;
}

const COST_LABELS: Record<(typeof QUOTATION_COST_KEYS)[number], string> = {
  cutting: "Cutting",
  stitching: "Stitching",
  washing: "Washing",
  packing: "Packing",
  printing: "Printing",
  embroidery: "Embroidery",
  accessories: "Accessories",
  overhead: "Overhead",
  extra: "Extra",
};

/** "12 oz denim · Indigo · 28–38": what the buyer reads under the style's name. */
function specs(style: QuotationStyle): string {
  return [style.fabric, style.colors, style.sizes].filter(Boolean).join(" · ");
}

/** Each style with its price per piece, how it was made (cost, profit), and the full breakdown on request. */
export function QuotationStyles({ quotation }: { quotation: Quotation }) {
  const rupees = formatPaisa;
  const quoted = (cents: number) => formatMoney(cents, quotation.currency);
  const styles = quotation.styles ?? [];

  return (
    <div className="grid gap-4">
      <ol className="grid gap-3">
        {styles.map((style, index) => {
          const share = profitShare(style.profit_cents, style.cost_cents);
          const lines = [
            ...(style.fabric_cost_cents > 0
              ? [{ label: "Fabric", note: `${rupees(style.fabric_rate_cents)} per ${style.fabric_unit} × ${style.fabric_consumption} ${style.fabric_unit}`, cents: style.fabric_cost_cents }]
              : []),
            ...QUOTATION_COST_KEYS.filter((key) => style[`${key}_cents`] > 0).map((key) => ({
              label: COST_LABELS[key],
              note: key === "extra" ? (style.extra_label ?? "") : "",
              cents: style[`${key}_cents`],
            })),
          ];
          return (
            <li key={index} className="rounded-xl border bg-white">
              <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}</span>
                    {style.article_no ? <span className="mr-2 font-mono text-denim-600">{style.article_no}</span> : null}
                    {style.description}
                  </p>
                  {specs(style) ? <p className="mt-0.5 text-sm text-muted-foreground">{specs(style)}</p> : null}
                  {style.details ? <p className="mt-0.5 text-sm text-muted-foreground">{style.details}</p> : null}
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                    Cost {rupees(style.cost_cents)} · Profit {rupees(style.profit_cents)}
                    {share ? ` (${share})` : ""} · Price {rupees(style.price_cents)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-heading text-xl font-semibold tabular-nums">{quoted(style.unit_price_cents)}</p>
                  <p className="text-xs text-muted-foreground">per piece</p>
                  {style.qty !== null && style.amount_cents !== null ? (
                    <p className="mt-1 text-sm tabular-nums">
                      × {style.qty.toLocaleString("en-US")} = <strong className="font-semibold">{quoted(style.amount_cents)}</strong>
                    </p>
                  ) : null}
                </div>
              </div>
              <details className="group border-t">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-denim-600 select-none hover:underline">How the price is made</summary>
                <table className="mx-4 mb-3 w-[calc(100%-2rem)] text-sm">
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.label} className="border-b border-dashed last:border-b-0">
                        <td className="py-1 pr-3">
                          {line.label}
                          {line.note ? <span className="ml-2 text-xs text-muted-foreground">{line.note}</span> : null}
                        </td>
                        <td className="py-1 text-right tabular-nums">{rupees(line.cents)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-denim-900/30 font-semibold">
                      <td className="py-1 pr-3">Total cost</td>
                      <td className="py-1 text-right tabular-nums">{rupees(style.cost_cents)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-3">
                        Profit
                        <span className="ml-2 text-xs text-muted-foreground">{style.profit_type === "percent" ? `${style.profit_percent ?? "0"}% of the cost` : "per piece"}</span>
                      </td>
                      <td className="py-1 text-right tabular-nums">{rupees(style.profit_cents)}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-1 pr-3">Price</td>
                      <td className="py-1 text-right tabular-nums">{rupees(style.price_cents)}</td>
                    </tr>
                    <tr className="text-denim-700">
                      <td className="py-1 pr-3">
                        Quoted per piece
                        <span className="ml-2 text-xs text-muted-foreground">
                          {quotation.currency === "PKR" ? "to the rupee" : `÷ ${quotation.exchange_rate} (Rs for 1 ${quotation.currency})`}
                        </span>
                      </td>
                      <td className="py-1 text-right font-semibold tabular-nums">{quoted(style.unit_price_cents)}</td>
                    </tr>
                  </tbody>
                </table>
              </details>
            </li>
          );
        })}
      </ol>
      {quotation.total_qty > 0 ? (
        <p className="flex items-baseline justify-between gap-3 rounded-xl bg-cotton-50 px-4 py-3 text-sm">
          <span>
            Total for {quotation.total_qty.toLocaleString("en-US")} pcs
            {styles.some((style) => style.qty === null) ? <span className="text-muted-foreground"> (the styles with a quantity)</span> : null}
          </span>
          <strong className="font-semibold tabular-nums">{formatMoney(quotation.total_cents, quotation.currency)}</strong>
        </p>
      ) : null}
    </div>
  );
}

/** The buyer, the dates and price basis, and the printed notes and terms. */
export function QuotationSummary({ quotation }: { quotation: Quotation }) {
  const terms = (quotation.terms ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <PartyBlock title="Prepared for" party={quotation.buyer} />
        <dl className="grid h-fit grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
          <dt className="col-span-2 mb-0.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Details</dt>
          <dt className="text-muted-foreground">Date</dt>
          <dd>{formatDay(quotation.issue_date)}</dd>
          <dt className="text-muted-foreground">Valid until</dt>
          <dd>{quotation.valid_until ? formatDay(quotation.valid_until) : "Not given"}</dd>
          {quotation.buyer_reference ? (
            <>
              <dt className="text-muted-foreground">Reference</dt>
              <dd>{quotation.buyer_reference}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Prices</dt>
          <dd>
            Per piece in {quotation.currency}
            {quotation.incoterm ? ` · ${quotation.incoterm}` : ""}
            {quotation.exchange_rate ? (
              <span className="block text-muted-foreground">
                1 {quotation.currency} = Rs {quotation.exchange_rate}
              </span>
            ) : null}
          </dd>
          {quotation.delivery_time ? (
            <>
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{quotation.delivery_time}</dd>
            </>
          ) : null}
        </dl>
      </div>
      {quotation.notes || terms.length > 0 ? (
        <div className="grid gap-5 border-t pt-5 text-sm sm:grid-cols-2">
          {quotation.notes ? (
            <div>
              <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Notes</p>
              <p className="whitespace-pre-line">{quotation.notes}</p>
            </div>
          ) : null}
          {terms.length > 0 ? (
            <div>
              <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Terms</p>
              <ul className="list-disc space-y-1 pl-4">
                {terms.map((term, index) => (
                  <li key={index}>{term}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PartyBlock({ title, party }: { title: string; party: InvoiceParty }) {
  return (
    <div className="text-sm">
      <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{title}</p>
      {party.company ? <p className="font-medium">{party.company}</p> : null}
      {party.contact_name ? <p className={party.company ? undefined : "font-medium"}>{party.contact_name}</p> : null}
      {party.address ? <p className="whitespace-pre-line text-muted-foreground">{party.address}</p> : null}
      {party.country_code ? <p className="text-muted-foreground">{countryName(party.country_code)}</p> : null}
      {party.email || party.phone ? <p className="mt-1 text-muted-foreground">{[party.phone, party.email].filter(Boolean).join(" · ")}</p> : null}
    </div>
  );
}
