"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { ActionForm, FormField, FormMessage, SubmitButton, TextAreaInput, TextInput } from "@/components/forms/action-form";
import { submitPayment } from "@/lib/account/actions/orders";
import { prepareImage } from "@/lib/admin/prepare-image";
import { cn } from "@/lib/utils";

const MAX_SLIP_BYTES = 4 * 1024 * 1024;

/** The Confirm payment form: transaction ID, amount, date, sender, optional slip and notes. */
export function PaymentForm({ orderNo, dueCents, payerName, today }: { orderNo: string; dueCents: number; payerName: string; today: string }) {
  const [slipNote, setSlipNote] = useState<string | null>(null);

  return (
    <ActionForm action={submitPayment.bind(null, orderNo)} className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Transaction ID / reference"
          name="transaction_id"
          required
          autoComplete="off"
          hint="As shown on your bank's confirmation or transfer slip."
          fieldClassName="sm:col-span-2"
        />
        <TextInput
          label="Amount sent (USD)"
          name="amount"
          inputMode="decimal"
          required
          defaultValue={(dueCents / 100).toFixed(2)}
          hint="The amount in US dollars, before your bank's charges."
        />
        <TextInput label="Transfer date" name="transferred_on" type="date" required defaultValue={today} />
        <TextInput label="Sent by (account name)" name="payer_name" required defaultValue={payerName} autoComplete="organization" />
        <TextInput label="From bank" name="payer_bank" required placeholder="e.g. Barclays, London" />
      </div>

      <FormField
        label="Transfer slip"
        name="slip"
        hint={slipNote ?? "Optional: a photo, screenshot or PDF of the transfer confirmation (up to 4 MB). It helps us find your payment faster."}
      >
        {(control) => (
          <label
            htmlFor={control.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-white px-4 py-3 text-sm transition-colors hover:border-denim-300",
              control["aria-invalid"] && "border-destructive",
            )}
          >
            <FileUp aria-hidden className="size-5 shrink-0 text-denim-600" />
            <input
              {...control}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
              onChange={async (event) => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                setSlipNote(null);
                if (!file) return;
                // Large phone photos are scaled down in the browser before uploading.
                const prepared = file.type.startsWith("image/") ? await prepareImage(file) : file;
                if (prepared !== file) {
                  const transfer = new DataTransfer();
                  transfer.items.add(prepared);
                  input.files = transfer.files;
                }
                if (prepared.size > MAX_SLIP_BYTES) setSlipNote("This file is larger than 4 MB. Please choose a smaller one, or send it to us by email.");
              }}
            />
          </label>
        )}
      </FormField>

      <TextAreaInput label="Notes" name="notes" rows={3} placeholder="Anything we should know, e.g. the transfer was split in two." />
      <FormMessage />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">We check every transfer against our bank statement before confirming it.</p>
        <SubmitButton size="lg" pendingLabel="Sending…">
          Send payment details
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
