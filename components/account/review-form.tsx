"use client";

import { useState, type ReactNode } from "react";
import { CircleCheck, Star } from "lucide-react";
import { ActionForm, FormMessage, SubmitButton, TextAreaInput, useActionForm } from "@/components/forms/action-form";
import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";

/** What the review form shows about the order (GET /v1/reviews/{token} or /v1/account/orders/{no}/review). */
export type ReviewContext = {
  order_no: string;
  company_name: string;
  business_type_label: string;
  country_code: string | null;
  total_pcs: number;
  delivered_at: string | null;
  styles: string[];
  submitted: boolean;
  review: { rating: number; body: string; show_as: "company" | "business" } | null;
};

/** Stars, the review and how the buyer is named. Reviews appear on the website only after staff approve them. */
export function ReviewForm({
  context,
  country,
  action,
  after,
}: {
  context: ReviewContext;
  /** The buyer's country name, shown with the name choices. */
  country: string;
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  /** Shown under the thank-you, e.g. a link back to the order. */
  after?: ReactNode;
}) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <CircleCheck aria-hidden className="size-8 text-emerald-600" />
        <p className="mt-4 text-xl font-semibold">Thank you for your review.</p>
        <p className="mt-2 text-sm text-muted-foreground">We read every review before it appears on the product pages of the styles you ordered.</p>
        {after ? <div className="mt-5">{after}</div> : null}
      </div>
    );
  }

  const names = [
    { value: "business", label: `${context.business_type_label}${country ? `, ${country}` : ""}`, note: "Your type of business and country only" },
    { value: "company", label: `${context.company_name}${country ? `, ${country}` : ""}`, note: "Your company name" },
  ];

  return (
    <ActionForm action={action} onSuccess={() => setDone(true)} className="grid grid-cols-1 gap-6">
      <StarRating />
      <TextAreaInput
        label="Your review"
        name="body"
        rows={6}
        required
        maxLength={2000}
        placeholder="The quality and fit, our communication, the delivery…"
        hint="At least 20 characters."
      />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Show my review as</legend>
        {names.map((name) => (
          <label key={name.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white p-3 text-sm has-[:checked]:border-denim-600">
            <input type="radio" name="show_as" value={name.value} defaultChecked={name.value === "business"} className="mt-0.5 accent-denim-600" />
            <span>
              <span className="block font-medium">{name.label}</span>
              <span className="text-xs text-muted-foreground">{name.note}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <FormMessage />
      <SubmitButton size="lg" pendingLabel="Sending…" className="justify-self-start">
        Send review
      </SubmitButton>
    </ActionForm>
  );
}

function StarRating() {
  const { state } = useActionForm();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const error = state.fields?.rating;
  const shown = hover || rating;

  return (
    <fieldset>
      <legend className="text-sm font-medium">
        Your rating <span className="text-stitch-600">*</span>
      </legend>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((stars) => (
          <label
            key={stars}
            onMouseEnter={() => setHover(stars)}
            className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40"
          >
            <input
              type="radio"
              name="rating"
              value={stars}
              checked={rating === stars}
              onChange={() => setRating(stars)}
              aria-label={`${stars} of 5 stars`}
              className="sr-only"
            />
            <Star aria-hidden className={cn("size-8 transition-colors", shown >= stars ? "fill-stitch-500 text-stitch-500" : "text-cotton-300")} />
          </label>
        ))}
      </div>
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </fieldset>
  );
}
