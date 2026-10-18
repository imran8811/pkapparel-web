"use client";

import { useState } from "react";
import { CircleCheck, PartyPopper } from "lucide-react";
import { ActionForm, FormMessage, SubmitButton, TextAreaInput } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cancelOrder } from "@/lib/account/actions/orders";
import type { OrderKind } from "@/lib/account/types";
import { useSearchParam } from "@/lib/use-search-param";

/** "Thank you" after checkout (?placed=1) or after reporting a payment (?payment=sent). */
export function OrderNotice({ orderNo, leadTime, kind = "bulk", pricing = false }: { orderNo: string; leadTime: number; kind?: OrderKind; pricing?: boolean }) {
  const placed = useSearchParam("placed");
  const payment = useSearchParam("payment");

  if (placed && kind === "sample") {
    return (
      <div role="status" className="mb-8 rounded-3xl bg-denim-900 p-6 text-cotton-50 sm:p-8">
        <div className="flex items-start gap-4">
          <PartyPopper aria-hidden className="mt-1 size-6 shrink-0 text-stitch-400" />
          <div>
            <p className="text-xl font-semibold">Thank you, your sample order {orderNo} is placed.</p>
            {pricing ? (
              <p className="mt-3 text-sm text-cotton-50/80">
                We confirm the price within 1 to 2 working days and email you the sample invoice with the bank details. Then you pay, and we prepare
                your samples (about {leadTime} days).
              </p>
            ) : (
              <ol className="mt-4 grid gap-2 text-sm text-cotton-50/80 sm:grid-cols-3 sm:gap-6">
                <li>
                  <span className="font-mono text-stitch-300">01</span> Transfer the amount below, with {orderNo} as the reference.
                </li>
                <li>
                  <span className="font-mono text-stitch-300">02</span> Tell us the transaction ID on the Confirm payment page.
                </li>
                <li>
                  <span className="font-mono text-stitch-300">03</span> We confirm it, email your receipt and prepare your samples (about {leadTime} days).
                </li>
              </ol>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (placed) {
    return (
      <div role="status" className="mb-8 rounded-3xl bg-denim-900 p-6 text-cotton-50 sm:p-8">
        <div className="flex items-start gap-4">
          <PartyPopper aria-hidden className="mt-1 size-6 shrink-0 text-stitch-400" />
          <div>
            <p className="text-xl font-semibold">Thank you, your order {orderNo} is placed.</p>
            <ol className="mt-4 grid gap-2 text-sm text-cotton-50/80 sm:grid-cols-3 sm:gap-6">
              <li>
                <span className="font-mono text-stitch-300">01</span> Transfer the deposit to the account below, with {orderNo} as the reference.
              </li>
              <li>
                <span className="font-mono text-stitch-300">02</span> Tell us the transaction ID on the Confirm payment page.
              </li>
              <li>
                <span className="font-mono text-stitch-300">03</span> We confirm it, email your receipt and start production (about {leadTime} days).
              </li>
            </ol>
            <p className="mt-4 text-sm text-cotton-50/60">We have also emailed you the proforma invoice and these details.</p>
          </div>
        </div>
      </div>
    );
  }
  if (payment === "sent") {
    return (
      <p role="status" className="mb-8 flex items-start gap-2.5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
        Thank you, we received your payment details. We will check the transfer and email you a receipt as soon as it is confirmed.
      </p>
    );
  }
  return null;
}

/** Cancel an order before anything is paid. */
export function CancelOrderButton({ orderNo }: { orderNo: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          Cancel this order
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel order {orderNo}?</DialogTitle>
          <DialogDescription>Nothing has been paid yet, so you can cancel it here. Your cart is not restored.</DialogDescription>
        </DialogHeader>
        <ActionForm action={cancelOrder.bind(null, orderNo)} onSuccess={() => setOpen(false)} className="grid grid-cols-1 gap-4">
          <TextAreaInput label="Reason (optional)" name="reason" rows={3} placeholder="e.g. ordered the wrong colors" />
          <FormMessage />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Keep the order
            </Button>
            <SubmitButton variant="destructive" pendingLabel="Cancelling…">
              Cancel order
            </SubmitButton>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
