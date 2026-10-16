"use client";

import { useActionState, useRef, useSyncExternalStore } from "react";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type InquiryState, type InquiryType, submitInquiry } from "@/lib/actions/inquiries";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-xl border border-input bg-white px-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-sm";

type ExtraField = {
  name: string;
  label: string;
  type?: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

const EXTRA_FIELDS: Record<InquiryType, ExtraField[]> = {
  contact: [],
  quote: [
    {
      name: "details.product",
      label: "Product",
      type: "select",
      options: ["Jeans pants", "Denim jackets", "Jeans shorts", "Cargo trousers", "Chino pants", "Denim skirts", "Several products"],
    },
    { name: "details.quantity", label: "Quantity (pieces)", type: "number", placeholder: "e.g. 600" },
    { name: "details.target_price", label: "Target price per piece (USD)", placeholder: "Optional" },
    { name: "details.needed_by", label: "Needed by", placeholder: "e.g. end of March" },
  ],
  sample: [
    { name: "details.styles", label: "Styles", placeholder: "Style numbers (e.g. PK1058) or a short description" },
    { name: "details.sample_quantity", label: "Number of samples", type: "number", placeholder: "e.g. 3" },
  ],
};

const MESSAGE_PLACEHOLDER: Record<InquiryType, string> = {
  contact: "How can we help?",
  quote: "Tell us about fabric, wash, fit, sizes, colors and labels. You can also send tech packs to us by email or WhatsApp.",
  sample: "Sizes and colors you need, and anything else we should know.",
};

const INITIAL: InquiryState = { status: "idle", attempt: 0 };

/**
 * Links may fill in the form, e.g. a product page sends ?product=Jeans%20pants&quantity=216&message=…
 * Query parameter => form field, per form type.
 */
const PREFILL: Record<InquiryType, Record<string, string>> = {
  contact: { message: "message" },
  quote: { product: "details.product", quantity: "details.quantity", message: "message" },
  sample: { styles: "details.styles", quantity: "details.sample_quantity", message: "message" },
};

const noSubscription = () => () => {};

/** The page's query string, read after hydration so the page itself can stay static. */
function useQueryString(): string {
  return useSyncExternalStore(noSubscription, () => window.location.search, () => "");
}

function prefillValues(type: InquiryType, search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const values: Record<string, string> = {};
  for (const [param, field] of Object.entries(PREFILL[type])) {
    const value = params.get(param)?.trim();
    if (value) values[field] = value.slice(0, field === "message" ? 3000 : 200);
  }
  return values;
}

export function InquiryForm({
  type,
  countries,
  whatsappUrl,
  submitLabel = "Send message",
  className,
}: {
  type: InquiryType;
  countries: { code: string; name: string }[];
  whatsappUrl: string;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, INITIAL);
  const startedAt = useRef<HTMLInputElement>(null);
  const search = useQueryString();
  const prefill = prefillValues(type, search);

  // Record when the visitor starts filling in the form; the server rejects forms sent in under 3 seconds.
  const markStarted = () => {
    if (startedAt.current && !startedAt.current.value) {
      startedAt.current.value = String(Date.now());
    }
  };

  if (state.status === "success") {
    return (
      <div className={cn("rounded-3xl border border-border bg-card p-8 text-center sm:p-10", className)} role="status">
        <CircleCheck aria-hidden className="mx-auto size-12 text-emerald-600" />
        <h2 className="mt-5 text-2xl font-bold tracking-tight">Thank you, we have your message.</h2>
        <p className="mt-3 text-muted-foreground">
          Your reference is <strong className="font-mono text-foreground">{state.reference}</strong>. We have emailed you a
          copy, and our team will get back to you soon.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1fbe5b]"
        >
          <WhatsAppIcon className="size-4" /> Need a faster reply? WhatsApp us
        </a>
      </div>
    );
  }

  const value = (name: string) => state.values?.[name] ?? prefill[name] ?? "";
  const error = (name: string) => state.fields?.[name.replace(/^details\..*/, "details")];

  return (
    <form
      // Re-mounts with the visitor's values after an error, and once the link's prefill is known.
      key={`${state.attempt}${search}`}
      action={formAction}
      onFocus={markStarted}
      onInput={markStarted}
      noValidate
      className={cn("relative rounded-3xl border border-border bg-card p-6 sm:p-8", className)}
    >
      <input type="hidden" name="type" value={type} />
      <input ref={startedAt} type="hidden" name="started_at" defaultValue="" />
      {/* Honeypot: hidden from people, filled in by bots */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" required error={error("name")}>
          <Input id="name" name="name" autoComplete="name" defaultValue={value("name")} required aria-invalid={!!error("name")} className={fieldClass} />
        </Field>
        <Field label="Company" name="company" error={error("company")}>
          <Input id="company" name="company" autoComplete="organization" defaultValue={value("company")} aria-invalid={!!error("company")} className={fieldClass} />
        </Field>
        <Field label="Email" name="email" required error={error("email")}>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={value("email")} required aria-invalid={!!error("email")} className={fieldClass} />
        </Field>
        <Field label="Phone / WhatsApp" name="phone" error={error("phone")}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={value("phone")} aria-invalid={!!error("phone")} className={fieldClass} />
        </Field>
        <Field label="Country" name="country" required={type !== "contact"} error={error("country")}>
          <select id="country" name="country" defaultValue={value("country")} aria-invalid={!!error("country")} className={fieldClass}>
            <option value="">Select your country</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </Field>

        {EXTRA_FIELDS[type].map((field) => (
          <Field key={field.name} label={field.label} name={field.name} error={error(field.name)}>
            {field.type === "select" ? (
              <select id={field.name} name={field.name} defaultValue={value(field.name)} className={fieldClass}>
                <option value="">Choose…</option>
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                min={field.type === "number" ? 1 : undefined}
                placeholder={field.placeholder}
                defaultValue={value(field.name)}
                className={fieldClass}
              />
            )}
          </Field>
        ))}

        <Field label="Message" name="message" required error={error("message")} className="sm:col-span-2">
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            placeholder={MESSAGE_PLACEHOLDER[type]}
            defaultValue={value("message")}
            aria-invalid={!!error("message")}
            className={cn(fieldClass, "h-auto min-h-32 py-3 leading-relaxed")}
          />
        </Field>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          We only use your details to answer you. See our{" "}
          <a href="/privacy" className="underline underline-offset-2">
            privacy policy
          </a>
          .
        </p>
        <Button type="submit" size="lg" disabled={pending} className="shrink-0">
          {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {pending ? "Sending…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-stitch-600">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
