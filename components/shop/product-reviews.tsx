import { BadgeCheck, Star } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/site/section-heading";
import { countryName } from "@/lib/format";
import type { ProductReviews as Reviews } from "@/lib/shop";
import { cn } from "@/lib/utils";

const MONTH = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Reviews from buyers whose order included this style (approved by staff). */
export function ProductReviews({ reviews }: { reviews: Reviews }) {
  if (reviews.count === 0 || reviews.average === null) return null;
  return (
    <section aria-labelledby="reviews" className="border-t border-border py-16 sm:py-20">
      <Container className="max-w-4xl">
        <SectionHeading eyebrow="Buyer reviews" title="What buyers say about this style." align="stack" />
        <p className="mt-6 flex items-center gap-3">
          <Stars rating={reviews.average} className="size-5" />
          <span className="font-heading text-2xl font-semibold tabular-nums">{reviews.average.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">
            from {reviews.count} {reviews.count === 1 ? "verified order" : "verified orders"}
          </span>
        </p>
        <ul className="mt-8 grid gap-4">
          {reviews.items.map((review, index) => (
            <li key={index} className="rounded-3xl border border-border bg-card p-6">
              <Stars rating={review.rating} className="size-4" />
              <p className="mt-3 leading-relaxed whitespace-pre-line">{review.body}</p>
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{review.name}</span>
                {review.country_code ? <span>· {countryName(review.country_code)}</span> : null}
                <span>· {MONTH.format(new Date(review.date))}</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <BadgeCheck aria-hidden className="size-4" /> Verified order
                </span>
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating.toFixed(1)} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} aria-hidden className={cn(className, rating >= star - 0.25 ? "fill-stitch-500 text-stitch-500" : "text-cotton-300")} />
      ))}
    </span>
  );
}
