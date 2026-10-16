"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminForm, FormError, SubmitButton, SwitchField, TextField } from "@/components/admin/form";
import type { FormState } from "@/lib/admin/form-state";

/** A button that opens a form in a dialog; the dialog closes once the save succeeds. */
export function ItemDialog({
  title,
  description,
  trigger,
  action,
  submitLabel = "Save",
  children,
}: {
  title: string;
  description?: string;
  trigger: ReactNode;
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  submitLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <AdminForm action={action} onSuccess={() => setOpen(false)} className="grid gap-4">
          {children}
          <FormError />
          <DialogFooter>
            <SubmitButton>{submitLabel}</SubmitButton>
          </DialogFooter>
        </AdminForm>
      </DialogContent>
    </Dialog>
  );
}

/** "Order" and "Show on the website", shared by every list item form. */
export function ListItemSettings({ sortOrder, published = true }: { sortOrder?: number; published?: boolean }) {
  return (
    <div className="grid items-start gap-4 border-t pt-4 sm:grid-cols-2">
      <TextField
        label="Order"
        name="sort_order"
        type="number"
        min={0}
        defaultValue={sortOrder}
        placeholder="At the end"
        hint="Lower numbers come first."
      />
      <div className="sm:pt-9">
        <SwitchField label="Show on the website" name="is_published" defaultChecked={published} />
      </div>
    </div>
  );
}
