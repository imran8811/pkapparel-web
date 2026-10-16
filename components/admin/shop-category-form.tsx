"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminForm, FormError, SubmitButton, TextAreaField, TextField, useAdminForm } from "@/components/admin/form";
import { Panel } from "@/components/admin/page-parts";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { inputClass } from "@/components/admin/styles";
import { saveShopCategory } from "@/lib/admin/actions/shop-texts";
import type { AdminShopCategory } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/** Title, intro, FAQ and SEO of a shop segment or category page. */
export function ShopCategoryForm({ category }: { category: AdminShopCategory }) {
  return (
    <AdminForm action={saveShopCategory.bind(null, category.id)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid min-w-0 gap-6">
        <Panel>
          <div className="grid gap-5">
            <TextField label="Title" name="title" defaultValue={category.title} maxLength={160} className="h-12 text-lg font-medium" />
            <RichTextEditor name="intro_html" label="Intro" defaultValue={category.intro_html} folder="pages" placeholder="A few sentences about this category for buyers and Google…" />
          </div>
        </Panel>
        <Panel title="Questions and answers" description="Shown at the bottom of the page, and to Google as an FAQ.">
          <FaqEditor initial={category.faq} />
        </Panel>
      </div>
      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel>
          <div className="grid gap-4">
            <FormError />
            <SubmitButton className="w-full">Save page</SubmitButton>
          </div>
        </Panel>
        <Panel title="Search engines">
          <div className="grid gap-4">
            <TextField label="SEO title" name="seo_title" defaultValue={category.seo_title ?? ""} maxLength={200} />
            <TextAreaField label="SEO description" name="seo_description" defaultValue={category.seo_description ?? ""} rows={3} maxLength={320} />
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}

function FaqEditor({ initial }: { initial: { question: string; answer: string }[] }) {
  const [items, setItems] = useState(initial);
  const { state } = useAdminForm();
  const update = (index: number, key: "question" | "answer", value: string) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const move = (index: number, offset: number) =>
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + offset, 0, item);
      return next;
    });

  return (
    <div className="grid gap-4">
      <input type="hidden" name="faq" value={JSON.stringify(items)} />
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No questions yet.</p> : null}
      {items.map((item, index) => {
        const error = state.fields?.[`faq.${index}.question`] ?? state.fields?.[`faq.${index}.answer`];
        return (
          <div key={index} className="grid gap-2 rounded-xl border bg-cotton-50/60 p-3">
            <div className="flex items-center gap-2">
              <input
                value={item.question}
                onChange={(event) => update(index, "question", event.target.value)}
                placeholder="Question"
                aria-label={`Question ${index + 1}`}
                maxLength={300}
                className={cn(inputClass, "font-medium")}
              />
              <div className="flex shrink-0">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUpIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDownIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove question ${index + 1}`} onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
                  <XIcon />
                </Button>
              </div>
            </div>
            <textarea
              value={item.answer}
              onChange={(event) => update(index, "answer", event.target.value)}
              placeholder="Answer"
              aria-label={`Answer ${index + 1}`}
              rows={3}
              maxLength={2000}
              className={cn(inputClass, "h-auto py-2 leading-relaxed")}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        );
      })}
      {items.length < 10 ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, { question: "", answer: "" }])}>
            <PlusIcon /> Add question
          </Button>
        </div>
      ) : null}
      {state.fields?.faq ? <p className="text-sm text-destructive">{state.fields.faq}</p> : null}
    </div>
  );
}
