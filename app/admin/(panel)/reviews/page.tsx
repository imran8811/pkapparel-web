import type { Metadata } from "next";
import { PencilIcon, PlusIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField, TextAreaField, TextField } from "@/components/admin/form";
import { ItemDialog, ListItemSettings } from "@/components/admin/item-dialog";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { deleteTestimonial, saveTestimonial } from "@/lib/admin/actions/content";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Testimonial } from "@/lib/admin/types";
import { countryName, countryOptions } from "@/lib/format";

export const metadata: Metadata = { title: "Buyer reviews" };

const COUNTRIES = [{ value: "", label: "Not shown" }, ...countryOptions().map((c) => ({ value: c.code, label: c.name }))];
const RATINGS = [
  { value: "", label: "No stars" },
  ...[5, 4, 3, 2, 1].map((stars) => ({ value: String(stars), label: `${stars} star${stars === 1 ? "" : "s"}` })),
];

export default async function ReviewsPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const reviews = await adminApi<Testimonial[]>("/v1/admin/testimonials");

  return (
    <>
      <PageHeader
        title="Buyer reviews"
        description="What buyers say about PK Apparel. Shown on the home and about pages. Only publish real reviews you have permission to use."
        actions={
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
        }
      />

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col rounded-2xl border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-0.5 text-stitch-500" aria-label={review.rating ? `${review.rating} stars` : "No rating"}>
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
