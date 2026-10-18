import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField, TextAreaField, TextField } from "@/components/admin/form";
import { ItemDialog, ListItemSettings } from "@/components/admin/item-dialog";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { ReviewActions } from "@/components/admin/review-actions";
import { deleteTestimonial, saveTestimonial } from "@/lib/admin/actions/content";
import { can } from "@/lib/admin/permissions";
import { adminApi, adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/admin/time";
import type { OrderReview, Testimonial } from "@/lib/admin/types";
import { countryName, countryOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Buyer reviews" };

const COUNTRIES = [{ value: "", label: "Not shown" }, ...countryOptions().map((c) => ({ value: c.code, label: c.name }))];
const RATINGS = [
  { value: "", label: "No stars" },
  ...[5, 4, 3, 2, 1].map((stars) => ({ value: String(stars), label: `${stars} star${stars === 1 ? "" : "s"}` })),
];

/** Reviews buyers wrote about their delivered orders, by status. */
const ORDER_STATUSES = [
  { value: "pending", label: "To approve" },
  { value: "approved", label: "Published" },
  { value: "hidden", label: "Hidden" },
] as const;

type OrderReviewCounts = Record<OrderReview["status"], number>;

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const search = (await searchParams) as { tab?: string; status?: string };
  const tab = search.tab === "orders" ? "orders" : "home";
  const status = ORDER_STATUSES.find((option) => option.value === search.status)?.value ?? "pending";
  const [reviews, orderReviews] = await Promise.all([
    tab === "home" ? adminApi<Testimonial[]>("/v1/admin/testimonials") : Promise.resolve([]),
    adminApiWithMeta<OrderReview[], { counts: OrderReviewCounts }>("/v1/admin/reviews", { query: { status } }),
  ]);
  const counts = orderReviews.meta.counts;

  return (
    <>
      <PageHeader
        title="Buyer reviews"
        description={
          tab === "home"
            ? "What buyers say about PK Apparel, shown on the home and about pages. Only publish real reviews you have permission to use."
            : "Reviews buyers wrote about their delivered orders. Approved ones appear on the product pages of the styles they ordered."
        }
        actions={
          tab === "orders" ? null : (
            <ItemDialog
              title="Add a review"
              action={saveTestimonial}
              submitLabel="Add review"
              trigger={
                <Button size="sm">
                  <PlusIcon />
                  Add review
                </Button>
              }
            >
              <ReviewFields />
            </ItemDialog>
          )
        }
      />

      <nav aria-label="Reviews" className="mb-5 flex gap-4 border-b text-sm">
        {[
          { value: "home", label: "On the home page", href: "/admin/reviews" },
          { value: "orders", label: `From orders${counts.pending > 0 ? ` (${counts.pending} to approve)` : ""}`, href: "/admin/reviews?tab=orders" },
        ].map((option) => (
          <Link
            key={option.value}
            href={option.href}
            aria-current={option.value === tab ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-2",
              option.value === tab ? "border-denim-900 font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      {tab === "orders" ? (
        <OrderReviews reviews={orderReviews.data} status={status} counts={counts} />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet" />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col rounded-2xl border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-0.5 text-stitch-500" role="img" aria-label={review.rating ? `${review.rating} stars` : "No rating"}>
                  {Array.from({ length: review.rating ?? 0 }, (_, index) => (
                    <StarIcon key={index} className="size-4 fill-current" />
                  ))}
                </div>
                {review.is_published ? null : <Pill tone="neutral">Hidden</Pill>}
              </div>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed">“{review.quote}”</blockquote>
              <div className="mt-4 flex items-end justify-between gap-3 border-t pt-3">
                <p className="text-sm">
                  <span className="font-medium">{review.author_name ?? review.author_role}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[review.author_name ? review.author_role : null, review.company, countryName(review.country_code)].filter(Boolean).join(" · ")}
                  </span>
                </p>
                <div className="flex shrink-0">
                  <ItemDialog
                    title="Edit review"
                    action={saveTestimonial}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Edit review">
                        <PencilIcon />
                      </Button>
                    }
                  >
                    <input type="hidden" name="id" value={review.id} />
                    <ReviewFields review={review} />
                  </ItemDialog>
                  <DeleteButton
                    iconOnly
                    label="Delete review"
                    title="Delete this review?"
                    description={`“${review.quote.slice(0, 120)}${review.quote.length > 120 ? "…" : ""}”`}
                    onConfirm={deleteTestimonial.bind(null, review.id)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OrderReviews({ reviews, status, counts }: { reviews: OrderReview[]; status: OrderReview["status"]; counts: OrderReviewCounts }) {
  return (
    <>
      <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
        {ORDER_STATUSES.map((option) => (
          <Link
            key={option.value}
            href={`/admin/reviews?tab=orders${option.value === "pending" ? "" : `&status=${option.value}`}`}
            aria-current={option.value === status ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              option.value === status ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
            )}
          >
            {option.label}
            <span className={cn("text-xs tabular-nums", option.value === status ? "text-cotton-50/70" : "text-muted-foreground")}>{counts[option.value]}</span>
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState title={status === "pending" ? "Nothing to approve" : "No reviews here yet"}>
          {status === "pending" ? "Buyers are asked for a review a week after delivery. New reviews wait here until you approve them." : null}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-0.5 text-stitch-500" role="img" aria-label={`${review.rating} of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon key={index} className={cn("size-4", index < review.rating ? "fill-current" : "text-cotton-300")} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {review.featured ? <Pill tone="blue">On the home page</Pill> : null}
                  <Pill tone={review.status === "approved" ? "green" : review.status === "pending" ? "orange" : "muted"}>
                    {ORDER_STATUSES.find((option) => option.value === review.status)?.label}
                  </Pill>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{review.body}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <p className="min-w-0 text-sm">
                  <span className="font-medium">{review.display_name}</span>
                  {review.country_code ? <span className="text-muted-foreground"> · {countryName(review.country_code)}</span> : null}
                  <span className="block text-xs text-muted-foreground">
                    {review.show_as === "business" ? `${review.company_name}, shown as the business type · ` : ""}
                    <Link href={`/admin/orders?q=${encodeURIComponent(review.order_no)}`} className="font-mono text-denim-600 hover:underline">
                      {review.order_no}
                    </Link>{" "}
                    · {review.total_pcs} pcs of {review.styles.join(", ")} · {formatDateTime(review.submitted_at)}
                  </span>
                </p>
                <ReviewActions review={review} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ReviewFields({ review }: { review?: Testimonial }) {
  return (
    <>
      <TextAreaField label="Review" name="quote" defaultValue={review?.quote} rows={5} maxLength={2000} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Who (role)" name="author_role" defaultValue={review?.author_role} placeholder="e.g. Brand owner" maxLength={120} />
        <TextField label="Name" name="author_name" defaultValue={review?.author_name ?? ""} placeholder="Optional" maxLength={120} />
        <TextField label="Company" name="company" defaultValue={review?.company ?? ""} placeholder="Optional" maxLength={160} />
        <SelectField label="Country" name="country_code" defaultValue={review?.country_code ?? ""} options={COUNTRIES} />
        <SelectField label="Rating" name="rating" defaultValue={review?.rating ? String(review.rating) : ""} options={RATINGS} />
      </div>
      <ListItemSettings sortOrder={review?.sort_order} published={review?.is_published ?? true} />
    </>
  );
}
