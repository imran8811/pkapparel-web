"use client";

import { useRef } from "react";
import Link from "next/link";
import { ActionForm, CheckboxInput, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/forms/action-form";
import { forgotPassword, login, resetPassword, signup } from "@/lib/account/actions/auth";
import { BUSINESS_TYPES } from "@/lib/account/types";
import { useHydrated, useSearchParam } from "@/lib/use-search-param";

type Country = { code: string; name: string };

/** Messages for links that open the login page (?ended=1 etc.). */
function LoginNotice() {
  const ended = useSearchParam("ended");
  const verified = useSearchParam("verified");
  const verify = useSearchParam("verify");
  const next = useSearchParam("next");

  const notice = ended
    ? { tone: "info", text: "Your session has ended. Please log in again." }
    : verified
      ? { tone: "success", text: "Thank you, your email address is confirmed. Log in to continue." }
      : verify === "failed"
        ? { tone: "info", text: "That confirmation link is not valid any more. Log in and we can send you a new one." }
        : next?.startsWith("/checkout")
          ? { tone: "info", text: "Log in or create a buyer account to check out. Your cart is kept." }
          : next?.startsWith("/samples/order")
            ? { tone: "info", text: "Log in or create a buyer account to order your samples. Your choice is kept." }
            : null;
  if (!notice) return null;

  return (
    <p
      role="status"
      className={
        notice.tone === "success"
          ? "mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          : "mb-6 rounded-xl bg-denim-50 px-4 py-3 text-sm text-denim-800"
      }
    >
      {notice.text}
    </p>
  );
}

export function LoginForm() {
  const next = useSearchParam("next") ?? "";
  return (
    <>
      <LoginNotice />
      {/* Keyed by the return path, which is only known after hydration. */}
      <ActionForm key={next} action={login} fullReload className="grid grid-cols-1 gap-5">
        <input type="hidden" name="next" value={next} />
        <TextInput label="Email" name="email" type="email" autoComplete="email" required autoFocus />
        <TextInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          hint={
            <Link href="/forgot-password" className="font-medium text-denim-600 hover:underline">
              Forgot your password?
            </Link>
          }
        />
        <FormMessage />
        <SubmitButton size="lg" pendingLabel="Logging in…">
          Log in
        </SubmitButton>
        <p className="text-sm text-muted-foreground">
          New to PK Apparel?{" "}
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-medium text-denim-600 hover:underline">
            Create a buyer account
          </Link>
        </p>
      </ActionForm>
    </>
  );
}

export function SignupForm({ countries }: { countries: Country[] }) {
  const next = useSearchParam("next") ?? "";
  const startedAt = useRef<HTMLInputElement>(null);
  // Record when the visitor starts filling in the form; the server rejects forms sent in under 3 seconds.
  const markStarted = () => {
    if (startedAt.current && !startedAt.current.value) startedAt.current.value = String(Date.now());
  };
  const countryOptions = countries.map((country) => ({ value: country.code, label: country.name }));

  return (
    <ActionForm key={next} action={signup} fullReload onFocus={markStarted} onKeyDown={markStarted} className="relative grid grid-cols-1 gap-5">
      <input type="hidden" name="next" value={next} />
      <input ref={startedAt} type="hidden" name="started_at" defaultValue="" />
      {/* Honeypot: hidden from people, filled in by bots */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Fax number
          <input type="text" name="fax_number" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="Company" name="company_name" autoComplete="organization" required />
        <TextInput label="Your name" name="contact_name" autoComplete="name" required />
        <TextInput label="Work email" name="email" type="email" autoComplete="email" required />
        <TextInput label="Phone / WhatsApp" name="phone" type="tel" autoComplete="tel" placeholder="+1 555 010 0000" required />
        <SelectInput label="Country" name="country_code" options={countryOptions} placeholder="Select your country" defaultValue="" required />
        <SelectInput label="Your business" name="business_type" options={BUSINESS_TYPES} placeholder="Choose…" defaultValue="" required />
        <TextInput label="Website or online store" name="website" type="url" placeholder="https://" fieldClassName="sm:col-span-2" hint="Optional. Helps us understand your market." />
        <TextInput label="Password" name="password" type="password" autoComplete="new-password" required hint="At least 8 characters." />
        <TextInput label="Repeat the password" name="password_confirmation" type="password" autoComplete="new-password" required />
      </div>

      <CheckboxInput
        name="accept_terms"
        label={
          <>
            I agree to the{" "}
            <Link href="/terms-of-sale" target="_blank" className="font-medium text-denim-600 underline-offset-2 hover:underline">
              terms of sale
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-denim-600 underline-offset-2 hover:underline">
              privacy policy
            </Link>
            .
          </>
        }
      />
      <FormMessage />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-denim-600 hover:underline">
            Log in
          </Link>
        </p>
        <SubmitButton size="lg" pendingLabel="Creating your account…">
          Create account
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={forgotPassword} className="grid grid-cols-1 gap-5">
      <TextInput label="Email" name="email" type="email" autoComplete="email" required autoFocus hint="The address you use to log in." />
      <FormMessage />
      <SubmitButton size="lg" pendingLabel="Sending…">
        Email me a link
      </SubmitButton>
      <p className="text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-denim-600 hover:underline">
          Log in
        </Link>
      </p>
    </ActionForm>
  );
}

export function ResetPasswordForm() {
  const token = useSearchParam("token");
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-64" aria-hidden />;
  if (token === null) {
    return (
      <p className="text-muted-foreground">
        This page opens from the link in our email. Need a new link?{" "}
        <Link href="/forgot-password" className="font-medium text-denim-600 hover:underline">
          Ask for one here
        </Link>
        .
      </p>
    );
  }

  return (
    <ActionForm action={resetPassword} fullReload className="grid grid-cols-1 gap-5">
      <input type="hidden" name="token" value={token} />
      <TextInput label="New password" name="password" type="password" autoComplete="new-password" required autoFocus hint="At least 8 characters." />
      <TextInput label="Repeat the new password" name="password_confirmation" type="password" autoComplete="new-password" required />
      <FormMessage />
      <SubmitButton size="lg" pendingLabel="Saving…">
        Save and log in
      </SubmitButton>
    </ActionForm>
  );
}
