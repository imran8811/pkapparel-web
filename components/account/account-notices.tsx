"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, MailWarning } from "lucide-react";
import { resendVerification } from "@/lib/account/actions/auth";
import type { FormState } from "@/lib/form-state";
import { useSearchParam } from "@/lib/use-search-param";

/** One-off messages after a redirect (?welcome=1, ?verified=1 …), read after hydration. */
export function AccountNotice() {
  const welcome = useSearchParam("welcome");
  const verified = useSearchParam("verified");
  const verify = useSearchParam("verify");
  const password = useSearchParam("password");

  const text = welcome
    ? "Welcome to PK Apparel! Your buyer account is ready. Please confirm your email address with the link we just sent."
    : verified
      ? "Thank you, your email address is confirmed. You can now place orders."
      : password === "reset"
        ? "Your new password is saved, and you are logged in."
        : null;

  if (verify === "failed") {
    return (
      <p role="status" className="mb-6 rounded-2xl bg-orange-50 px-5 py-4 text-sm text-stitch-700">
        That confirmation link is no longer valid. Use the button below to get a new one.
      </p>
    );
  }
  if (!text) return null;
  return (
    <p role="status" className="mb-6 flex items-start gap-2.5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      {text}
    </p>
  );
}

/**
 * Shown until the buyer confirms their email address (needed to place orders). The link is usually opened in another
 * tab or on a phone, so whenever the buyer comes back to this tab the page asks the server again: the banner then
 * disappears and the order button turns on, without a reload.
 */
export function VerifyEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [result, setResult] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let last = 0;
    const recheck = () => {
      // Focus and visibility often fire together: one check is enough.
      if (document.visibilityState !== "visible" || Date.now() - last < 2000) return;
      last = Date.now();
      router.refresh();
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [router]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <MailWarning aria-hidden className="mt-0.5 size-5 shrink-0 text-stitch-600" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-stitch-700">Please confirm your email address</p>
          <p className="mt-1 break-words text-stitch-700">
            We sent a link to <strong>{email}</strong>. You need a confirmed address to place orders.
          </p>
          {result?.message ? (
            <p role="status" className={result.status === "success" ? "mt-2 text-emerald-800" : "mt-2 text-destructive"}>
              {result.message}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await resendVerification()))}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-stitch-300 bg-white px-4 py-2 text-sm font-medium text-stitch-700 transition-colors hover:bg-orange-100 disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Send a new link
      </button>
    </div>
  );
}
