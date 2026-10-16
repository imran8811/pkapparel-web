"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminForm, FormError, SubmitButton, SwitchField, TextAreaField, TextField, useAdminForm } from "@/components/admin/form";
import { inputClass } from "@/components/admin/styles";
import { Panel } from "@/components/admin/page-parts";
import { PhotoList } from "@/components/admin/photo-list";
import { saveDepartment } from "@/lib/admin/actions/factory";
import type { Department } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const MAX_STATS = 6;

export function DepartmentForm({ department }: { department: Department }) {
  return (
    <AdminForm action={saveDepartment.bind(null, department.slug)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid min-w-0 gap-6">
        <Panel>
          <div className="grid gap-4">
            <TextField label="Name" name="name" defaultValue={department.name} maxLength={120} />
            <TextAreaField label="Description" name="summary" defaultValue={department.summary} rows={5} maxLength={2000} />
          </div>
        </Panel>
        <Panel title="Photos" description="The first photo is the main one. Use the arrows to change the order.">
          <PhotoList name="images" folder="factory" initial={department.images} />
        </Panel>
        <Panel title="Numbers" description="Optional facts shown next to the description, e.g. “Monthly capacity — 30,000+ pcs”. Only add confirmed numbers.">
          <StatsEditor initial={department.stats} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel>
          <div className="grid gap-4">
            <SwitchField label="Show on the website" name="is_published" defaultChecked={department.is_published} />
            <TextField label="Order" name="sort_order" type="number" min={0} defaultValue={department.sort_order} hint="Lower numbers come first." />
            <FormError />
            <SubmitButton className="w-full">Save department</SubmitButton>
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}

function StatsEditor({ initial }: { initial: Department["stats"] }) {
  const [stats, setStats] = useState(initial);
  const { state } = useAdminForm();

  const update = (index: number, key: "label" | "value", value: string) =>
    setStats((current) => current.map((stat, i) => (i === index ? { ...stat, [key]: value } : stat)));

  return (
    <div className="grid gap-3">
      <input type="hidden" name="stats" value={JSON.stringify(stats)} />
      {stats.length === 0 ? <p className="text-sm text-muted-foreground">No numbers yet.</p> : null}
      {stats.map((stat, index) => {
        const labelError = state.fields?.[`stats.${index}.label`];
        const valueError = state.fields?.[`stats.${index}.value`];
        return (
          <div key={index} className="grid gap-1">
            <div className="flex gap-2">
              <input
                value={stat.label}
                onChange={(event) => update(index, "label", event.target.value)}
                placeholder="Label, e.g. Monthly capacity"
                aria-label={`Number ${index + 1} label`}
                aria-invalid={labelError ? true : undefined}
                maxLength={40}
                className={inputClass}
              />
              <input
                value={stat.value}
                onChange={(event) => update(index, "value", event.target.value)}
                placeholder="Value, e.g. 30,000+ pcs"
                aria-label={`Number ${index + 1} value`}
                aria-invalid={valueError ? true : undefined}
                maxLength={40}
                className={cn(inputClass, "max-w-48")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-1 shrink-0"
                aria-label={`Remove number ${index + 1}`}
                onClick={() => setStats((current) => current.filter((_, i) => i !== index))}
              >
                <XIcon />
              </Button>
            </div>
            {labelError || valueError ? <p className="text-sm text-destructive">{labelError ?? valueError}</p> : null}
          </div>
        );
      })}
      {stats.length < MAX_STATS ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setStats((current) => [...current, { label: "", value: "" }])}>
            <PlusIcon />
            Add number
          </Button>
        </div>
      ) : null}
      {state.fields?.stats ? <p className="text-sm text-destructive">{state.fields.stats}</p> : null}
    </div>
  );
}
