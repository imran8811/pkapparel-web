"use client";

import { useTransition } from "react";
import { CircleCheckIcon, CircleXIcon, CopyIcon, Loader2Icon, SendIcon, UndoIcon } from "lucide-react";
import { toast } from "sonner";
import { TextAreaField, TextField } from "@/components/admin/form";
import { ItemDialog } from "@/components/admin/item-dialog";
import { ConfirmAction } from "@/components/admin/order-manager";
import { Button } from "@/components/ui/button";
import { duplicateQuotation, sendQuotation, setQuotationStatus } from "@/lib/admin/actions/quotations";
import type { Quotation } from "@/lib/admin/types";

/** What can be done with the quotation: email it, record the buyer's answer (or undo it), or start a revised one. */
export function QuotationActions({ quotation }: { quotation: Quotation }) {
  const open = quotation.status === "open";

  return (
    <div className="flex flex-wrap gap-2">
      <ItemDialog
        title={`Email ${quotation.quotation_no}`}
        description="The buyer gets the quotation as a PDF, with the prices per piece (never the costs). Their replies come to the sales mailbox."
        action={sendQuotation.bind(null, quotation.id)}
        submitLabel="Send"
        trigger={
          <Button size="sm" variant={quotation.sent_at ? "outline" : "default"}>
            <SendIcon /> {quotation.sent_at ? "Send again" : "Send by email"}
          </Button>
        }
      >
        <TextField
          label="To"
          name="to"
          defaultValue={quotation.sent_to ?? quotation.buyer.email ?? ""}
          placeholder="buyer@example.com"
          hint="Separate several addresses with commas (at most 5)."
        />
        <TextAreaField label="Message" name="message" rows={4} maxLength={2000} placeholder="Optional: a few words of your own above the prices." />
      </ItemDialog>

      {open ? (
        <>
          <ConfirmAction
            label="Buyer accepted"
            icon={<CircleCheckIcon />}
            variant="outline"
            title={`Did the buyer accept ${quotation.quotation_no}?`}
            description="It is marked as accepted and can no longer be edited (you can reopen it). Next, make the proforma invoice for the deposit."
            confirmLabel="Mark as accepted"
            action={setQuotationStatus.bind(null, quotation.id, "accepted")}
          />
          <ConfirmAction
            label="Buyer declined"
            icon={<CircleXIcon />}
            variant="outline"
            title={`Did the buyer decline ${quotation.quotation_no}?`}
            description="It is marked as declined. To offer other prices, make a copy and change it."
            confirmLabel="Mark as declined"
            action={setQuotationStatus.bind(null, quotation.id, "declined")}
          />
        </>
      ) : (
        <ConfirmAction
          label="Reopen"
          icon={<UndoIcon />}
          variant="outline"
          title={`Reopen ${quotation.quotation_no}?`}
          description={`It was marked as ${quotation.status}. Reopened, it can be edited again.`}
          confirmLabel="Reopen"
          action={setQuotationStatus.bind(null, quotation.id, "open")}
        />
      )}

      <CopyButton id={quotation.id} />
    </div>
  );
}

/** A revised quotation: a new number, dated today, with the same buyer and styles, opened for editing. */
function CopyButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // On success the action opens the copy; it only returns when something went wrong.
          const result = await duplicateQuotation(id);
          if (result?.message) toast.error(result.message);
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <CopyIcon />} Make a revised copy
    </Button>
  );
}
