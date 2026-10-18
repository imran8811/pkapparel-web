"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, CheckIcon, Loader2Icon, PlayIcon, RotateCcwIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { AdminForm, FormError, SelectField, SubmitButton, SwitchField, TextAreaField, TextField } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ItemDialog } from "@/components/admin/item-dialog";
import { inputClass } from "@/components/admin/styles";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  addOrderNote,
  cancelOrderAsStaff,
  changeDueDate,
  confirmPayment,
  deleteDocument,
  deletePhoto,
  deliverOrder,
  holdOrder,
  readyToShip,
  recordPayment,
  rejectPayment,
  resumeOrder,
  saveCharges,
  sendPrice,
  shipOrder,
  updateStage,
  uploadDocument,
  uploadPhoto,
} from "@/lib/admin/actions/orders";
import type { FormState } from "@/lib/admin/form-state";
import { prepareImage } from "@/lib/admin/prepare-image";
import type { AdminOrder, AdminPayment } from "@/lib/admin/types";
import type { OrderStatus, ProductionPhoto, ProductionStage } from "@/lib/account/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/* The working parts of the admin order page. The API checks every action's role again. */

/** A button that asks for confirmation, then runs an action without form fields. */
export function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  action,
  variant = "default",
  icon,
}: {
  label: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  action: () => Promise<FormState>;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant={variant}>
          {icon}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Not now</AlertDialogCancel>
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await action();
                if (result.status === "success") {
                  if (result.message) toast.success(result.message);
                  setOpen(false);
                } else if (result.message) {
                  toast.error(result.message);
                }
              })
            }
          >
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const CANCELLABLE: OrderStatus[] = ["awaiting_price", "awaiting_deposit", "payment_review", "confirmed", "in_production", "ready_to_ship", "on_hold"];
const HOLDABLE: OrderStatus[] = ["awaiting_price", "awaiting_deposit", "payment_review", "confirmed", "in_production", "ready_to_ship"];

/** The next steps for this order, depending on its kind, its status and the staff member's role. */
export function OrderActions({ order, canManage, canPay, today }: { order: AdminOrder; canManage: boolean; canPay: boolean; today: string }) {
  const unpaid = order.amounts.total_cents - order.amounts.paid_cents;
  const inProduction = order.status === "confirmed" || order.status === "in_production";
  const sample = order.kind === "sample";
  // Samples ship once they are made (paid in full); bulk orders after "ready to ship".
  const canShip = sample ? inProduction : order.status === "ready_to_ship";
  const priced = order.amounts.freight_cents !== null && !order.amounts.has_quoted_addons;

  return (
    <div className="flex flex-wrap gap-2">
      {canManage && order.status === "awaiting_price" ? (
        <ConfirmAction
          label="Send the price"
          icon={<CheckIcon />}
          title="Send the price to the buyer?"
          description={
            priced
              ? `The buyer is emailed the sample invoice for ${formatMoney(order.amounts.total_cents)}, with the bank details. The price cannot change afterwards.`
              : "Enter the courier and the custom-design sample's price under Totals first."
          }
          confirmLabel="Send the price"
          action={sendPrice.bind(null, order.id)}
        />
      ) : null}
      {canManage && inProduction && !sample ? (
        <ConfirmAction
          label="Ready to ship"
          icon={<CheckIcon />}
          title="Mark this order ready to ship?"
          description="The balance invoice is issued with the final freight and add-on prices, and emailed to the buyer with the bank details."
          confirmLabel="Ready to ship"
          action={readyToShip.bind(null, order.id)}
        />
      ) : null}
      {canManage && canShip ? (
        <ItemDialog title="Mark as shipped" description="The buyer is emailed the tracking details." action={shipOrder.bind(null, order.id)} submitLabel="Mark as shipped" trigger={<Button size="sm">Mark as shipped</Button>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Carrier or forwarder" name="carrier" placeholder="e.g. Maersk, DHL" />
            <TextField label="Ship date" name="shipped_on" type="date" defaultValue={today} />
            <TextField label="Tracking, B/L or AWB number" name="tracking_no" />
            <TextField label="Tracking link" name="tracking_url" type="url" placeholder="https://" />
            <TextField label="Cartons" name="cartons" type="number" min={1} defaultValue={order.packing.cartons || ""} />
            <TextField label="Gross weight (kg)" name="gross_kg" type="number" min={0} step="0.1" defaultValue={order.packing.gross_g ? (order.packing.gross_g / 1000).toFixed(1) : ""} />
          </div>
          <TextAreaField label="Note for the buyer" name="note" rows={2} />
          {unpaid > 0 ? (
            <TextAreaField
              label={`Reason to ship with ${formatMoney(unpaid)} unpaid`}
              name="unpaid_reason"
              rows={2}
              hint="Needed only when the balance has not arrived. It is kept in the history for the team."
            />
          ) : null}
        </ItemDialog>
      ) : null}
      {canManage && order.status === "shipped" ? (
        <ConfirmAction label="Mark as delivered" title="Mark this order as delivered?" description="The buyer gets a short thank-you email." confirmLabel="Delivered" action={deliverOrder.bind(null, order.id)} />
      ) : null}
      {canPay && unpaid > 0 && !["cancelled", "delivered"].includes(order.status) ? (
        <ItemDialog
          title="Record a payment"
          description="For a transfer the buyer did not report on the website. It is confirmed at once and the receipt is emailed."
          action={recordPayment.bind(null, order.id)}
          submitLabel="Record and confirm"
          trigger={<Button size="sm" variant="outline">Record a payment</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Amount received (USD)" name="amount" inputMode="decimal" />
            <TextField label="Transaction ID" name="transaction_id" />
            <TextField label="Sent on" name="transferred_on" type="date" defaultValue={today} />
            <TextField label="Arrived on" name="received_on" type="date" defaultValue={today} />
            <TextField label="Sent by" name="payer_name" defaultValue={order.customer.company_name} />
            <TextField label="From bank" name="payer_bank" />
          </div>
          <TextAreaField label="Notes" name="notes" rows={2} />
          {order.amounts.paid_cents < order.amounts.deposit_cents ? (
            <SwitchField label="Start production even if the deposit is not complete" name="start_anyway" hint="For example when bank fees made it a little short." />
          ) : null}
        </ItemDialog>
      ) : null}
      {canManage && inProduction && order.production_due_on ? (
        <ItemDialog title="Change the ready date" action={changeDueDate.bind(null, order.id)} submitLabel="Change date" trigger={<Button size="sm" variant="outline">Change ready date</Button>}>
          <TextField label="New ready date" name="date" type="date" defaultValue={order.production_due_on} min={today} />
          <TextAreaField label="Reason" name="reason" rows={2} placeholder="e.g. Eid holidays, waiting for label artwork" />
          <SwitchField label="Email the buyer" name="notify" defaultChecked />
        </ItemDialog>
      ) : null}
      {canManage && order.status === "on_hold" ? (
        <ConfirmAction label="Resume" icon={<PlayIcon />} title="Resume this order?" description="It goes back to where it was before the hold, and the buyer is told." confirmLabel="Resume" action={resumeOrder.bind(null, order.id)} />
      ) : null}
      {canManage && HOLDABLE.includes(order.status) ? (
        <ItemDialog title="Put the order on hold" description="The buyer is emailed the reason." action={holdOrder.bind(null, order.id)} submitLabel="Put on hold" trigger={<Button size="sm" variant="outline">Put on hold</Button>}>
          <TextAreaField label="Reason" name="reason" rows={3} />
        </ItemDialog>
      ) : null}
      {canManage && CANCELLABLE.includes(order.status) ? (
        <ItemDialog
          title="Cancel this order"
          description={order.amounts.paid_cents > 0 ? `${formatMoney(order.amounts.paid_cents)} was paid: any refund is handled outside the website.` : "Nothing was paid yet."}
          action={cancelOrderAsStaff.bind(null, order.id)}
          submitLabel="Cancel order"
          trigger={<Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">Cancel order</Button>}
        >
          <TextAreaField label="Reason" name="reason" rows={3} />
          <SwitchField label="Email the buyer" name="notify" defaultChecked />
        </ItemDialog>
      ) : null}
    </div>
  );
}

/** Confirm or reject a reported transfer (admins only). */
export function PaymentReview({ payment, dueCents, today }: { payment: AdminPayment; dueCents: number; today: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <ItemDialog
        title="Confirm this payment"
        description="Only after you see the money in the bank statement. The buyer gets a receipt by email."
        action={confirmPayment.bind(null, payment.id ?? 0)}
        submitLabel="Confirm payment"
        trigger={<Button size="sm">Confirm</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Amount that arrived (USD)" name="received" inputMode="decimal" defaultValue={(payment.amount_cents / 100).toFixed(2)} hint={`Reported: ${formatMoney(payment.amount_cents)}. Due: ${formatMoney(dueCents)}.`} />
          <TextField label="Arrived on" name="received_on" type="date" defaultValue={today} />
        </div>
        {payment.kind === "deposit" ? (
          <SwitchField label="Start production even if it does not cover the deposit" name="start_anyway" hint="For example when bank fees made it a little short." />
        ) : null}
      </ItemDialog>
      <ItemDialog
        title="Reject this payment"
        description="The buyer is emailed the reason and can report the transfer again."
        action={rejectPayment.bind(null, payment.id ?? 0)}
        submitLabel="Reject payment"
        trigger={<Button size="sm" variant="outline">Reject</Button>}
      >
        <TextAreaField label="Reason" name="reason" rows={3} placeholder="e.g. The transfer is not on our statement yet" />
      </ItemDialog>
    </div>
  );
}

/** Production stages with dates, and photos (made for phones: the camera opens from the upload button). */
export function ProductionManager({
  orderId,
  stages,
  photos,
  canEdit,
  today,
}: {
  orderId: number;
  stages: ProductionStage[];
  photos: ProductionPhoto[];
  canEdit: boolean;
  today: string;
}) {
  return (
    <div className="grid gap-6">
      <ol className="divide-y rounded-xl border">
        {stages.map((stage) => (
          <li key={stage.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                stage.status === "done" ? "bg-emerald-600" : stage.status === "in_progress" ? "bg-denim-600" : "bg-cotton-300",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{stage.label}</p>
              <p className="text-xs text-muted-foreground">
                {stage.status === "done"
                  ? `Started ${stage.started_on} · done ${stage.completed_on}`
                  : stage.status === "in_progress"
                    ? `Started ${stage.started_on}`
                    : "Not started"}
                {stage.note ? ` · ${stage.note}` : ""}
              </p>
            </div>
            {canEdit ? (
              <div className="flex gap-1">
                {stage.status === "not_started" ? <StageDialog orderId={orderId} stage={stage} action="start" today={today} /> : null}
                {stage.status !== "done" ? <StageDialog orderId={orderId} stage={stage} action="done" today={today} /> : null}
                {stage.status !== "not_started" ? <StageDialog orderId={orderId} stage={stage} action="reset" today={today} /> : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {/* Keyed by the stage in progress, so the stage picker follows it after an update. */}
      {canEdit ? <PhotoUpload key={stages.find((s) => s.status === "in_progress")?.key ?? "none"} orderId={orderId} stages={stages} /> : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-xl border bg-white">
              <a href={`/admin/order-photos/${photo.id}?size=full`} target="_blank" rel="noopener noreferrer" className="block bg-cotton-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- private photo, served with the staff cookie by a route handler */}
                <img src={`/admin/order-photos/${photo.id}`} alt={photo.caption ?? "Production photo"} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </a>
              <div className="flex items-start gap-1 p-2">
                <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                  <span className="block font-medium text-foreground">{stages.find((s) => s.key === photo.stage)?.label ?? "General"}</span>
                  {photo.caption}
                </p>
                {canEdit ? (
                  <DeleteButton iconOnly label="Delete this photo" title="Delete this photo?" description="The buyer no longer sees it." onConfirm={deletePhoto.bind(null, photo.id)} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      )}
    </div>
  );
}

function StageDialog({ orderId, stage, action, today }: { orderId: number; stage: ProductionStage; action: "start" | "done" | "reset"; today: string }) {
  const labels = { start: "Start", done: "Done", reset: "Reset" };
  const icons = { start: <PlayIcon />, done: <CheckIcon />, reset: <RotateCcwIcon /> };
  return (
    <ItemDialog
      title={action === "reset" ? `Reset ${stage.label.toLowerCase()}?` : `${stage.label}: ${action === "start" ? "started" : "done"}`}
      description={action === "reset" ? "Clears the dates, to undo a mistake. The buyer is not told." : "The buyer sees this on their order page."}
      action={updateStage.bind(null, orderId, stage.key, action)}
      submitLabel={action === "reset" ? "Reset stage" : "Save"}
      trigger={
        <Button size="xs" variant={action === "done" ? "default" : "outline"} aria-label={`${labels[action]}: ${stage.label}`}>
          {icons[action]}
          <span className="hidden sm:inline">{labels[action]}</span>
        </Button>
      }
    >
      {action !== "reset" ? (
        <>
          <TextField label="Date" name="date" type="date" defaultValue={today} />
          <TextAreaField label="Note (optional)" name="note" rows={2} placeholder="e.g. All 600 pieces cut" />
          <SwitchField label="Email the buyer about it" name="notify" defaultChecked={action === "done"} />
        </>
      ) : null}
    </ItemDialog>
  );
}

function PhotoUpload({ orderId, stages }: { orderId: number; stages: ProductionStage[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState(() => stages.find((s) => s.status === "in_progress")?.key ?? "");
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const upload = (files: FileList) =>
    startTransition(async () => {
      const list = [...files];
      let done = 0;
      for (const file of list) {
        setProgress(`Uploading ${done + 1} of ${list.length}…`);
        // Shrink large phone photos first: the website accepts at most 4.5 MB per request.
        const prepared = await prepareImage(file);
        const form = new FormData();
        form.set("photo", prepared, prepared.name);
        form.set("stage", stage);
        form.set("caption", caption);
        const result = await uploadPhoto(orderId, form);
        if (result.status === "error") {
          toast.error(result.message ?? "A photo could not be uploaded.");
          break;
        }
        done++;
      }
      setProgress(null);
      if (done > 0) {
        toast.success(done === 1 ? "Photo added." : `${done} photos added.`);
        setCaption("");
        if (input.current) input.current.value = "";
        router.refresh();
      }
    });

  return (
    <div className="grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-end sm:p-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Stage
        <select value={stage} onChange={(event) => setStage(event.target.value)} className={inputClass}>
          <option value="">General</option>
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Caption (optional)
        <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={300} placeholder="e.g. Washing in progress" className={inputClass} />
      </label>
      <div className="grid gap-1.5">
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          id={`photos-${orderId}`}
          onChange={(event) => event.target.files && event.target.files.length > 0 && upload(event.target.files)}
        />
        <Button type="button" disabled={pending} onClick={() => input.current?.click()}>
          {pending ? <Loader2Icon className="animate-spin" /> : <CameraIcon />}
          {progress ?? "Add photos"}
        </Button>
      </div>
    </div>
  );
}

/** Final freight and totals for "on request" add-ons, before the balance invoice. */
export function ChargesForm({ order }: { order: AdminOrder }) {
  // Per-piece add-ons keep their checkout price; the others count once per order.
  const onRequest = order.addons.filter((addon) => addon.pricing !== "per_piece");
  const freightCents = order.amounts.freight_status === "final" ? order.amounts.freight_cents : null;
  const sample = order.kind === "sample";
  return (
    <AdminForm key={JSON.stringify([order.amounts, order.addons])} action={saveCharges.bind(null, order.id)} className="grid grid-cols-1 gap-4">
      {order.shipping_mode !== "forwarder" ? (
        <TextField
          label={sample ? "Courier (USD)" : "Final freight (USD)"}
          name="freight"
          inputMode="decimal"
          defaultValue={freightCents !== null ? (freightCents / 100).toFixed(2) : ""}
          placeholder={
            order.amounts.freight_status === "estimate" && order.amounts.freight_cents !== null
              ? `Estimate: ${(order.amounts.freight_cents / 100).toFixed(2)}`
              : sample
                ? "e.g. 45.00"
                : "Quote from the forwarder"
          }
          hint={sample ? "Express courier for the samples to the buyer's address." : "Empty: the estimate is used when you mark the order ready to ship."}
        />
      ) : null}
      {onRequest.map((addon) => (
        <TextField
          key={addon.id}
          label={`${addon.name}: ${sample ? "price" : "total for this order"} (USD)`}
          name={`addon_${addon.id}`}
          inputMode="decimal"
          defaultValue={addon.line_cents !== null ? (addon.line_cents / 100).toFixed(2) : ""}
          placeholder="Price on request"
          hint={sample ? `${addon.qty} ${addon.qty === 1 ? "piece" : "pieces"}, all together. See the buyer's notes and design files.` : undefined}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="sm">Save charges</SubmitButton>
        <FormError className="flex-1" />
      </div>
    </AdminForm>
  );
}

const DOCUMENT_TYPES = [
  { value: "commercial_invoice", label: "Commercial invoice" },
  { value: "packing_list", label: "Packing list" },
  { value: "bl", label: "Bill of lading (B/L)" },
  { value: "awb", label: "Air waybill (AWB)" },
  { value: "qc_report", label: "QC report" },
  { value: "other", label: "Other document" },
];

/** Upload a PDF or photo to the order (private; shared with the buyer unless switched off). */
export function DocumentUpload({ orderId }: { orderId: number }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <AdminForm ref={form} action={uploadDocument.bind(null, orderId)} onSuccess={() => form.current?.reset()} className="grid grid-cols-1 gap-3 rounded-xl border border-dashed p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Type" name="type" defaultValue="commercial_invoice" options={DOCUMENT_TYPES} />
        <TextField label="Title (optional)" name="title" placeholder="Shown to the buyer" />
      </div>
      <TextField label="File (PDF or photo, up to 4 MB)" name="file" type="file" accept="application/pdf,image/jpeg,image/png" className="py-1.5" />
      <SwitchField label="Show to the buyer" name="is_public" defaultChecked />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="sm">
          <UploadIcon /> Upload
        </SubmitButton>
        <FormError className="flex-1" />
      </div>
    </AdminForm>
  );
}

export function DeleteDocument({ id, title }: { id: number; title: string }) {
  return <DeleteButton iconOnly label={`Delete ${title}`} title="Delete this document?" description={title} onConfirm={deleteDocument.bind(null, id)} />;
}

export function NoteForm({ orderId }: { orderId: number }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <AdminForm ref={form} action={addOrderNote.bind(null, orderId)} onSuccess={() => form.current?.reset()} className="grid grid-cols-1 gap-3">
      <TextAreaField label="Add a note for the team" name="note" rows={2} placeholder="Only staff see notes." />
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" variant="secondary">
          Add note
        </SubmitButton>
        <FormError className="flex-1" />
      </div>
    </AdminForm>
  );
}

