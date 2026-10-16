"use client";

import { useRef } from "react";
import { AdminForm, FormError, SubmitButton, TextField } from "@/components/admin/form";
import { changePassword } from "@/lib/admin/actions/auth";

export function PasswordForm() {
  const form = useRef<HTMLFormElement>(null);

  return (
    <AdminForm ref={form} action={changePassword} onSuccess={() => form.current?.reset()} className="grid gap-4">
      <TextField label="Current password" name="current_password" type="password" autoComplete="current-password" />
      <TextField label="New password" name="password" type="password" autoComplete="new-password" minLength={10} />
      <TextField label="New password again" name="password_confirmation" type="password" autoComplete="new-password" />
      <FormError />
      <div>
        <SubmitButton size="sm">Change password</SubmitButton>
      </div>
    </AdminForm>
  );
}
