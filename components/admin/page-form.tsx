"use client";

import { AdminForm, FormError, SubmitButton, SwitchField, TextAreaField, TextField } from "@/components/admin/form";
import { Panel } from "@/components/admin/page-parts";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { savePage } from "@/lib/admin/actions/pages";
import type { Page } from "@/lib/admin/types";

export function PageForm({ page }: { page: Page }) {
  return (
    <AdminForm action={savePage.bind(null, page.slug)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="min-w-0">
        <div className="grid gap-5">
          <TextField label="Title" name="title" defaultValue={page.title} className="h-12 text-lg font-medium" />
          <RichTextEditor name="body_html" label="Text" defaultValue={page.body_html} folder="pages" />
        </div>
      </Panel>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel>
          <div className="grid gap-4">
            <SwitchField label="Show on the website" name="is_published" defaultChecked={page.is_published} />
            <FormError />
            <SubmitButton className="w-full">Save page</SubmitButton>
          </div>
        </Panel>
        <Panel title="Search engines">
          <div className="grid gap-4">
            <TextField label="SEO title" name="seo_title" defaultValue={page.seo_title ?? ""} maxLength={200} />
            <TextAreaField label="SEO description" name="seo_description" defaultValue={page.seo_description ?? ""} rows={3} maxLength={320} />
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}
