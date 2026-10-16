"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/admin/styles";
import { login } from "@/lib/admin/actions/auth";
import { idle, type FormState } from "@/lib/admin/form-state";

export function LoginForm() {
  const [state, setState] = useState<FormState>(idle);
  const [pending, startTransition] = useTransition();
  const passwordInput = useRef<HTMLInputElement>(null);
  const params = useSearchParams();
  const ended = params.get("ended") === "1";
  // Next.js keeps visited pages alive in the background: clear the form when this page is hidden,
  // so a typed password never stays in the browser. (Stable callback: React would otherwise run
  // the cleanup on every re-render.)
  const clearWhenHidden = useCallback((form: HTMLFormElement | null) => () => form?.reset(), []);

  return (
    <form
      className="mt-6 grid gap-4"
      ref={clearWhenHidden}
      onSubmit={(event) => {
        // Submitted from here (not the action prop) so the email stays filled in after a failed attempt.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await login(state, data);
          // On success the action redirects; otherwise show why and ask for the password again.
          if (result) {
            setState(result);
            if (passwordInput.current) passwordInput.current.value = "";
            passwordInput.current?.focus();
          }
        });
      }}
    >
      {state.status === "error" ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : ended ? (
        <p role="status" className="rounded-lg bg-denim-50 px-3 py-2 text-sm text-denim-800">
          Your session has ended. Please log in again.
        </p>
      ) : null}
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="username" required autoFocus className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <input ref={passwordInput} name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Log in
      </Button>
      <p className="text-xs text-muted-foreground">Forgot your password? Ask an administrator to reset it.</p>
    </form>
  );
}
