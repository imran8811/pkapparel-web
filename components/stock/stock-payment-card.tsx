import { CopyButton } from "@/components/account/copy-button";
import type { StockPaymentDetails } from "@/lib/account/types";

/** Where to pay a stock order: the bank account, JazzCash and Easypaisa (those that are set up), with the reference. */
export function StockPaymentCard({ payment, reference }: { payment: StockPaymentDetails | null; reference: string }) {
  if (!payment) {
    return <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-stitch-700">We will send you the payment details shortly.</p>;
  }
  const groups = [
    {
      title: "Bank transfer",
      rows: [
        ["Account title", payment.account_title],
        ["Bank", payment.bank_name],
        ["Account number", payment.account_number],
        ["IBAN", payment.iban],
      ],
      shown: Boolean(payment.account_number || payment.iban),
    },
    { title: "JazzCash", rows: [["Name", payment.jazzcash_name], ["Number", payment.jazzcash_number]], shown: Boolean(payment.jazzcash_number) },
    { title: "Easypaisa", rows: [["Name", payment.easypaisa_name], ["Number", payment.easypaisa_number]], shown: Boolean(payment.easypaisa_number) },
  ].filter((group) => group.shown);

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <div key={group.title} className="rounded-2xl bg-cotton-50 p-4">
          <p className="font-mono text-[11px] tracking-[0.16em] text-stitch-700 uppercase">{group.title}</p>
          <dl className="mt-2 grid gap-1.5 text-sm">
            {group.rows
              .filter((row): row is [string, string] => Boolean(row[1]))
              .map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="flex items-center gap-1.5 font-medium">
                    <span className="font-mono">{value}</span>
                    {label === "Account number" || label === "IBAN" || label === "Number" ? <CopyButton value={value} label={label === "Number" ? `${group.title} number` : label.toLowerCase()} /> : null}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
      <p className="text-sm">
        Payment reference: <span className="font-mono font-medium">{reference}</span>
      </p>
      {payment.notes ? <p className="text-sm text-muted-foreground">{payment.notes}</p> : null}
    </div>
  );
}
