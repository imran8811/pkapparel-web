"use client";

import { AdminForm, FormError, SelectField, SubmitButton, TextAreaField } from "@/components/admin/form";
import { updateCustomer } from "@/lib/admin/actions/customers";
import type { AdminCustomer } from "@/lib/admin/types";

export function CustomerStatusForm({ customer }: { customer: AdminCustomer }) {
  return (
    <AdminForm action={updateCustomer.bind(null, customer.id)} className="grid grid-cols-1 gap-4">
      <SelectField
        label="Status"
        name="status"
        defaultValue={customer.status}
        options={[
          { value: "active", label: "Active: can log in and order" },
          { value: "blocked", label: "Blocked: cannot log in" },
        ]}
      />
      <TextAreaField label="Notes for the team" name="staff_notes" rows={4} defaultValue={customer.staff_notes ?? ""} hint="Only staff see these." />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="sm">Save</SubmitButton>
        <FormError className="flex-1" />
      </div>
    </AdminForm>
  );
}
