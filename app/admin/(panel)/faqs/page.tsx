import type { Metadata } from "next";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField, TextAreaField, TextField } from "@/components/admin/form";
import { ItemDialog, ListItemSettings } from "@/components/admin/item-dialog";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { deleteFaq, saveFaq } from "@/lib/admin/actions/content";
import { FAQ_CATEGORIES } from "@/lib/admin/labels";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Faq } from "@/lib/admin/types";

export const metadata: Metadata = { title: "FAQs" };

export default async function FaqsPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const faqs = await adminApi<Faq[]>("/v1/admin/faqs");

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions and answers on the FAQ page. A few also appear on the home, shipping and samples pages, by topic."
        actions={
          <ItemDialog
            title="Add a question"
            action={saveFaq}
            submitLabel="Add question"
            trigger={
              <Button size="sm">
                <PlusIcon />
                Add question
              </Button>
            }
          >
            <FaqFields />
          </ItemDialog>
        }
      />

      {faqs.length === 0 ? <EmptyState title="No questions yet" /> : null}

      <div className="grid gap-8">
        {FAQ_CATEGORIES.map((category) => {
          const items = faqs.filter((faq) => faq.category === category.value);
          if (items.length === 0) return null;
          return (
            <section key={category.value}>
              <h2 className="mb-3 flex items-baseline gap-2 font-heading text-lg font-semibold">
                {category.label}
                <span className="text-sm font-normal text-muted-foreground">{items.length}</span>
              </h2>
              <ul className="overflow-hidden rounded-2xl border bg-white">
                {items.map((faq) => (
                  <li key={faq.id} className="flex items-start gap-3 border-b px-4 py-3.5 last:border-b-0 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{faq.question}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                    {faq.is_published ? null : <Pill tone="neutral">Hidden</Pill>}
                    <div className="flex shrink-0 items-center">
                      <ItemDialog
                        title="Edit question"
                        action={saveFaq}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit “${faq.question}”`}>
                            <PencilIcon />
                          </Button>
                        }
                      >
                        <input type="hidden" name="id" value={faq.id} />
                        <FaqFields faq={faq} />
                      </ItemDialog>
                      <DeleteButton
                        iconOnly
                        label={`Delete “${faq.question}”`}
                        title="Delete this question?"
                        description={faq.question}
                        onConfirm={deleteFaq.bind(null, faq.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

function FaqFields({ faq }: { faq?: Faq }) {
  return (
    <>
      <SelectField label="Topic" name="category" defaultValue={faq?.category ?? "ordering"} options={FAQ_CATEGORIES} />
      <TextField label="Question" name="question" defaultValue={faq?.question} maxLength={300} />
      <TextAreaField label="Answer" name="answer" defaultValue={faq?.answer} rows={6} maxLength={5000} />
      <ListItemSettings sortOrder={faq?.sort_order} published={faq?.is_published ?? true} />
    </>
  );
}
