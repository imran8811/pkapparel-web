"use client";

import type { ReactNode } from "react";
import { useAdminForm } from "@/components/admin/form";

/** Checkboxes sent under one name (read with form.getAll), with the field's error from the form or a hint. */
export function CheckboxGroup({
  legend,
  name,
  options,
  checked,
  hint,
}: {
  legend: ReactNode;
  name: string;
  options: { value: string; label: string }[];
  checked: string[];
  hint?: ReactNode;
}) {
  const { state } = useAdminForm();
  const error = state.fields?.[name];
  const noteId = `field-${name}-note`;

  return (
    <fieldset className="grid gap-2" aria-describedby={error || hint ? noteId : undefined}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={checked.includes(option.value)}
              aria-invalid={error ? true : undefined}
              className="size-4 accent-denim-700"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? (
        <p id={noteId} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
