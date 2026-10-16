"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
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
import type { FormState } from "@/lib/admin/form-state";

/** A delete button that asks for confirmation, then runs a server action. */
export function DeleteButton({
  label,
  title,
  description,
  onConfirm,
  size = "sm",
  iconOnly = false,
}: {
  label: string;
  title: string;
  description: string;
  /** Returns nothing when the action redirects (e.g. back to the list). */
  onConfirm: () => Promise<FormState | void>;
  size?: "sm" | "icon-sm";
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size={iconOnly ? "icon-sm" : size} className="text-destructive hover:bg-destructive/10" aria-label={label}>
          <Trash2Icon />
          {iconOnly ? null : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await onConfirm();
                if (!result) return;
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
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
