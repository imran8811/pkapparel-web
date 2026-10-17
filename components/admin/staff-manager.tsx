"use client";

import { useState, useTransition } from "react";
import { CheckIcon, CopyIcon, KeyRoundIcon, Loader2Icon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { AdminForm, FormError, SelectField, SubmitButton, SwitchField, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createStaff, resetStaffPassword, updateStaff, type PasswordState } from "@/lib/admin/actions/staff";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import type { FormState } from "@/lib/admin/form-state";
import type { Role } from "@/lib/admin/types";

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((role) => ({ value: role, label: ROLE_LABELS[role] }));

/** Shows a generated password once, with a copy button. */
function PasswordReveal({ password, email }: { password: string; email?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-3">
      <p className="text-sm">
        Give this password to {email ? <strong>{email}</strong> : "the person"} in person or by phone. It is shown only once; they can change it under <em>My account</em>.
      </p>
      <div className="flex items-center gap-2 rounded-lg border bg-cotton-50 px-3 py-2">
        <code className="min-w-0 flex-1 font-mono text-base tracking-wider break-all">{password}</code>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Copy the password"
          onClick={async () => {
            await navigator.clipboard.writeText(password).catch(() => undefined);
            setCopied(true);
          }}
        >
          {copied ? <CheckIcon className="text-emerald-600" /> : <CopyIcon />}
        </Button>
      </div>
    </div>
  );
}

export function AddStaffButton() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ password: string; email: string } | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCreated(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> Add a staff member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{created ? "Account created" : "Add a staff member"}</DialogTitle>
          <DialogDescription>{created ? "Copy the password now." : "A password is made for them; they change it after logging in."}</DialogDescription>
        </DialogHeader>
        {created ? (
          <>
            <PasswordReveal password={created.password} email={created.email} />
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <AdminForm
            action={async (previous: FormState, form: FormData) => {
              const result: PasswordState = await createStaff(previous, form);
              if (result.status === "success" && result.password) setCreated({ password: result.password, email: String(form.get("email") ?? "") });
              return result;
            }}
            className="grid grid-cols-1 gap-4"
          >
            <TextField label="Name" name="name" autoComplete="off" />
            <TextField label="Email" name="email" type="email" autoComplete="off" />
            <SelectField
              label="Role"
              name="role"
              defaultValue="sales"
              options={ROLE_OPTIONS}
              hint="Administrator: everything. Editor: website content. Sales: orders, customers, inquiries. Production: production updates and photos."
            />
            <FormError />
            <DialogFooter>
              <SubmitButton>Create account</SubmitButton>
            </DialogFooter>
          </AdminForm>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function EditStaffButton({ account, isSelf }: { account: { id: number; name: string; email: string; role: Role; is_active: boolean }; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`Edit ${account.name}`}>
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {account.name}</DialogTitle>
          <DialogDescription>{account.email}</DialogDescription>
        </DialogHeader>
        <AdminForm action={updateStaff.bind(null, account.id)} onSuccess={() => setOpen(false)} className="grid grid-cols-1 gap-4">
          <TextField label="Name" name="name" defaultValue={account.name} />
          <SelectField label="Role" name="role" defaultValue={account.role} options={ROLE_OPTIONS} disabled={isSelf} />
          {isSelf ? <input type="hidden" name="role" value={account.role} /> : null}
          {isSelf ? (
            <input type="hidden" name="is_active" value="on" />
          ) : (
            <SwitchField label="Active" name="is_active" defaultChecked={account.is_active} hint="Switching it off logs the person out everywhere at once." />
          )}
          <FormError />
          <DialogFooter>
            <SubmitButton>Save</SubmitButton>
          </DialogFooter>
        </AdminForm>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordButton({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPassword(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`New password for ${name}`}>
          <KeyRoundIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New password for {name}</DialogTitle>
          <DialogDescription>{password ? "Copy it now." : "Their current password stops working, and they are logged out everywhere."}</DialogDescription>
        </DialogHeader>
        {password ? (
          <PasswordReveal password={password} />
        ) : (
          <DialogFooter>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await resetStaffPassword(id);
                  if (result.status === "success" && result.password) setPassword(result.password);
                  else toast.error(result.message ?? "The password could not be reset.");
                })
              }
            >
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              Make a new password
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
