import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ReviewForm, type ReviewContext } from "@/components/account/review-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { panelClass } from "@/components/forms/styles";
import { api, ApiError } from "@/lib/api";
import { submitReviewByToken } from "@/lib/account/actions/reviews";
import { countryName } from "@/lib/format";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Review your order", "/review");

/** The review page opened from the email a week after delivery (the link works without logging in). */
export default function ReviewPage({ searchParams }: PageProps<"/review">) {
  return (
    <Container className="max-w-3xl py-14 lg:py-20">
      <p className="font-mono text-xs font-medium tracking-[0.2em] text-stitch-600 uppercase">Your review</p>
      <Suspense
        fallback={
          <div className="mt-4 grid gap-4" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-10 w-96 max-w-full rounded-xl" />
            <Skeleton className="h-72 rounded-3xl" />
          </div>
        }
      >
        <ReviewContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function ReviewContent({ searchParams }: { searchParams: PageProps<"/review">["searchParams"] }) {
  const { token } = (await searchParams) as { token?: string };
  const context = await load(token);

  if (context === null) {
    return (
      <>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">This link does not work anymore</h1>
        <p className="mt-3 text-muted-foreground">Review links work for 90 days. You can still write your review from your order page.</p>
        <Button asChild className="mt-6">
          <Link href="/account/orders">Your orders</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">How did order {context.order_no} go?</h1>
      <p className="mt-3 text-muted-foreground">
        {context.styles.join(", ")} · {context.total_pcs} pcs. Your review helps other buyers, and appears on the product pages once we have read it.
      </p>
      <div className={`${panelClass} mt-8 min-w-0`}>
        {context.submitted ? (
          <p className="text-lg font-semibold">Thank you, we already have your review of this order.</p>
        ) : (
          <ReviewForm
            context={context}
            country={countryName(context.country_code)}
            action={submitReviewByToken.bind(null, String(token))}
            after={
              <Button asChild variant="outline">
                <Link href="/wholesale-shop">Back to the shop</Link>
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}

async function load(token: string | undefined): Promise<ReviewContext | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    return await api<ReviewContext>(`/v1/reviews/${token}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
