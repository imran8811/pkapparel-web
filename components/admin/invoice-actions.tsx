"use client";

import { useTransition } from "react";
import { BanIcon, CircleCheckIcon, CopyIcon, Loader2Icon, SendIcon, UndoIcon } from "lucide-react";
import { toast } from "sonner";
import { TextAreaField, TextField } from "@/components/admin/form";
import { ItemDialog } from "@/components/admin/item-dialog";
import { ConfirmAction } from "@/components/admin/order-manager";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cancelInvoice, duplicateInvoice, markInvoicePaid, markInvoiceUnpaid, sendInvoice } from "@/lib/admin/actions/invoices";
import type { Invoice, InvoiceType } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";

/** What can be done with the invoice in its status: email it, mark it paid (or not), cancel it, or start a new one from it. */
export function InvoiceActions({ invoice, today }: { invoice: Invoice; today: string }) {
  const open = invoice.status === "open";
  const money = (cents: number) => formatMoney(cents, invoice.currency);

  return (
    <div className="flex flex-wrap gap-2">
      {invoice.status !== "cancelled" ? (
        <ItemDialog
          title={`Email ${invoice.invoice_no}`}
          description="The buyer gets the PDF attached, the amount due and the bank details. Their replies come to the sales mailbox."
          action={sendInvoice.bind(null, invoice.id)}
          submitLabel="Send"
          trigger={
            <Button size="sm" variant={invoice.sent_at ? "outline" : "default"}>
              <SendIcon /> {invoice.sent_at ? "Send again" : "Send by email"}
            </Button>
          }
        >
          <TextField
            label="To"
            name="to"
            defaultValue={invoice.sent_to ?? invoice.buyer.email ?? ""}
            placeholder="buyer@example.com"
            hint="Separate several addresses with commas (at most 5)."
          />
          <TextAreaField label="Message" name="message" rows={4} maxLength={2000} placeholder="Optional: a few words of your own above the invoice details." />
        </ItemDialog>
      ) : null}

      {open ? (
        <ItemDialog
          title={`Mark ${invoice.invoice_no} as paid`}
          description={`Check the bank statement first: ${money(invoice.amounts.due_now_cents)} was due. The PDF then shows “Paid”.`}
          action={markInvoicePaid.bind(null, invoice.id)}
          submitLabel="Mark as paid"
          trigger={
            <Button size="sm" variant="outline">
              <CircleCheckIcon /> Mark as paid
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Received on" name="paid_on" type="date" defaultValue={today} max={today} />
            <TextField label="Transaction ID" name="payment_reference" maxLength={120} placeholder="Optional" />
          </div>
        </ItemDialog>
      ) : null}

      {invoice.status === "paid" ? (
        <ConfirmAction
          label="Mark as unpaid"
          icon={<UndoIcon />}
          variant="outline"
          title="Mark this invoice as unpaid?"
          description="Use this when it was marked as paid by mistake. The payment date and reference are removed."
          confirmLabel="Mark as unpaid"
          action={markInvoiceUnpaid.bind(null, invoice.id)}
        />
      ) : null}

      <DuplicateMenu id={invoice.id} />

      {open ? (
        <ConfirmAction
          label="Cancel invoice"
          icon={<BanIcon />}
          variant="ghost"
          title={`Cancel ${invoice.invoice_no}?`}
          description="It keeps its number and stays in the list as cancelled, so the numbering has no gaps. It cannot be sent or edited afterwards. To correct an invoice, edit it instead."
          confirmLabel="Cancel invoice"
          action={cancelInvoice.bind(null, invoice.id)}
        />
      ) : null}
    </div>
  );
}

const DUPLICATE_AS: { type: InvoiceType; label: string }[] = [
  { type: "sample", label: "Sample invoice" },
  { type: "proforma", label: "Proforma invoice" },
  { type: "commercial", label: "Invoice" },
];

/** A new invoice with the same buyer, lines and charges, e.g. the proforma for production once the samples are approved. */
function DuplicateMenu({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  const duplicate = (type: InvoiceType) =>
    startTransition(async () => {
      // On success the action opens the new invoice; it only returns when something went wrong.
      const result = await duplicateInvoice(id, type);
      if (result?.message) toast.error(result.message);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <CopyIcon />} Make a copy
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>New invoice from this one, as a…</DropdownMenuLabel>
        {DUPLICATE_AS.map((option) => (
          <DropdownMenuItem key={option.type} onSelect={() => duplicate(option.type)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
