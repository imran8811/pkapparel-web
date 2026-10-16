"use client";

import { AdminForm, SelectField, SubmitButton, TextAreaField } from "@/components/admin/form";
import { updateInquiry } from "@/lib/admin/actions/inquiries";
import { INQUIRY_STATUSES } from "@/lib/admin/labels";
import type { InquiryStatus } from "@/lib/admin/types";

const OPTIONS = Object.entries(INQUIRY_STATUSES).map(([value, { label }]) => ({ value, label }));

export function InquiryFollowUpForm({ id, status, notes }: { id: number; status: InquiryStatus; notes: string }) {
  return (
    <AdminForm action={updateInquiry.bind(null, id)} className="grid gap-4">
      <SelectField label="Status" name="status" defaultValue={status} options={OPTIONS} fieldClassName="max-w-xs" />
      <TextAreaField
        label="Notes"
        name="notes"
        defaultValue={notes}
        rows={5}
        placeholder="e.g. Sent PI on 12 Oct. Buyer wants 3 colors, decides next week."
      />
      <div>
        <SubmitButton size="sm">Save</SubmitButton>
      </div>
    </AdminForm>
  );
}
