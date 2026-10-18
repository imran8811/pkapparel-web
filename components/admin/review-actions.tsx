"use client";

import { useTransition } from "react";
import { CheckIcon, EyeOffIcon, HomeIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/admin/order-manager";
import { Button } from "@/components/ui/button";
import { approveReview, featureReview, hideReview } from "@/lib/admin/actions/reviews";
import type { FormState } from "@/lib/admin/form-state";
import type { OrderReview } from "@/lib/admin/types";

/** Approve, hide, or add an order review to the home page. */
export function ReviewActions({ review }: { review: OrderReview }) {
  const [pending, startTransition] = useTransition();
  const act = (action: (id: number) => Promise<FormState>) =>
    startTransition(async () => {
      const result = await action(review.id);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message ?? "That did not work. Please try again.");
    });

  return (
    <div className="flex flex-wrap gap-2">
      {pending ? <Loader2Icon aria-label="Saving" className="size-4 animate-spin self-center text-muted-foreground" /> : null}
      {review.status !== "approved" ? (
        <Button type="button" size="sm" disabled={pending} onClick={() => act(approveReview)}>
          <CheckIcon /> Approve
        </Button>
      ) : null}
      {review.status === "approved" && !review.featured ? (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => act(featureReview)}>
          <HomeIcon /> Add to the home page
        </Button>
      ) : null}
      {review.status !== "hidden" && review.featured ? (
        // Hiding also deletes the copy on the home page (with any edits made to it there).
        <ConfirmAction
          label="Hide"
          icon={<EyeOffIcon />}
          variant="ghost"
          title="Hide this review?"
          description="It disappears from the product pages, and its copy on the home page is deleted."
          confirmLabel="Hide review"
          action={hideReview.bind(null, review.id)}
        />
      ) : review.status !== "hidden" ? (
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => act(hideReview)}>
          <EyeOffIcon /> Hide
        </Button>
      ) : null}
    </div>
  );
}
