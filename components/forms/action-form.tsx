"use client";

import { createContext, use, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/forms/styles";
import { idle, type FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";

/*
 * Forms of the buyer account, cart and checkout (the public counterpart of <AdminForm>).
 * - It submits from onSubmit, not the form's action prop, so typed values survive an error.
 * - Fields show the API's error messages next to them; other messages appear in <FormMessage>.
 * - After a login or logout the next page is loaded in full (fullReload), so every part of the
 *   site, including pages kept alive by the router, sees the new session.
 */

type FormAction = (previous: FormState, form: FormData) => Promise<FormState>;

const FormContext = createContext<{ state: FormState; pending: boolean }>({ state: idle, pending: false });

export function useActionForm() {
  return use(FormContext);
}

type ActionFormProps = Omit<ComponentProps<"form">, "action" | "onSubmit"> & {
  action: FormAction;
  /** Called after a successful save, e.g. to close a dialog. */
  onSuccess?: (state: FormState) => void;
  /** Open redirectTo with a full page load (after logging in or out). */
  fullReload?: boolean;
};

export function ActionForm({ action, onSuccess, fullReload, onInput, onChange, children, ...props }: ActionFormProps) {
  const [state, setState] = useState<FormState>(idle);
  // Fields changed since the last answer: their error message is hidden until the next submit.
  const [edited, setEdited] = useState<ReadonlySet<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const markEdited = (target: EventTarget) => {
    const name = (target as HTMLInputElement).name;
    if (name && state.fields?.[name] && !edited.has(name)) setEdited((current) => new Set(current).add(name));
  };
  const fields = state.fields && Object.fromEntries(Object.entries(state.fields).filter(([name]) => !edited.has(name)));

  return (
    <FormContext value={{ state: { ...state, fields }, pending }}>
      <form
        {...props}
        noValidate
        onInput={(event) => {
          markEdited(event.target);
          onInput?.(event);
        }}
        onChange={(event) => {
          markEdited(event.target);
          onChange?.(event);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await action(state, data);
            setEdited(new Set());
            if (result.status === "success" && result.redirectTo) {
              if (fullReload) {
                window.location.assign(result.redirectTo);
                // Keep the button busy until the next page has loaded.
                await new Promise<never>(() => {});
              }
              router.push(result.redirectTo);
            }
            setState(result);
            if (result.status === "success") onSuccess?.(result);
          });
        }}
      >
        {children}
      </form>
    </FormContext>
  );
}

type FieldProps = {
  label: ReactNode;
  name: string;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: (props: { id: string; name: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
};

/** Label, control and either the field's error or a hint. */
export function FormField({ label, name, required, hint, className, children }: FieldProps) {
  const { state } = useActionForm();
  const error = state.fields?.[name];
  const id = `field-${name}`;
  const noteId = error || hint ? `${id}-note` : undefined;

  return (
    // grid-cols-1 (minmax(0, 1fr)): wide controls such as file inputs must not widen the page on phones.
    <div className={cn("grid min-w-0 grid-cols-1 content-start gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="text-stitch-600"> *</span> : null}
      </label>
      {children({ id, name, "aria-invalid": error ? true : undefined, "aria-describedby": noteId })}
      {error ? (
        <p id={noteId} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextInputProps = Omit<ComponentProps<"input">, "name" | "id"> & { label: ReactNode; name: string; hint?: ReactNode; fieldClassName?: string };

export function TextInput({ label, name, hint, required, fieldClassName, className, ...input }: TextInputProps) {
  return (
    <FormField label={label} name={name} hint={hint} required={required} className={fieldClassName}>
      {(control) => <input {...control} {...input} required={required} className={cn(fieldClass, className)} />}
    </FormField>
  );
}

type TextAreaInputProps = Omit<ComponentProps<"textarea">, "name" | "id"> & { label: ReactNode; name: string; hint?: ReactNode; fieldClassName?: string };

export function TextAreaInput({ label, name, hint, required, fieldClassName, className, rows = 3, ...textarea }: TextAreaInputProps) {
  return (
    <FormField label={label} name={name} hint={hint} required={required} className={fieldClassName}>
      {(control) => (
        <textarea {...control} {...textarea} rows={rows} required={required} className={cn(fieldClass, "h-auto min-h-24 py-3 leading-relaxed", className)} />
      )}
    </FormField>
  );
}

type SelectInputProps = Omit<ComponentProps<"select">, "name" | "id"> & {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  fieldClassName?: string;
  placeholder?: string;
  options: readonly { value: string; label: string }[];
};

export function SelectInput({ label, name, hint, required, fieldClassName, className, placeholder, options, ...select }: SelectInputProps) {
  return (
    <FormField label={label} name={name} hint={hint} required={required} className={fieldClassName}>
      {(control) => (
        <select {...control} {...select} required={required} className={cn(fieldClass, "pr-9", className)}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

/** A checkbox with its label (e.g. accepting the terms). Sends "on" when ticked. */
export function CheckboxInput({ label, name, defaultChecked, className }: { label: ReactNode; name: string; defaultChecked?: boolean; className?: string }) {
  const { state } = useActionForm();
  const error = state.fields?.[name];
  const id = `field-${name}`;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          className="mt-0.5 size-4 shrink-0 rounded border-input accent-denim-600"
        />
        <span>{label}</span>
      </label>
      {error ? <p className="pl-7 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel, className, disabled, ...props }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useActionForm();
  return (
    <Button type="submit" disabled={pending || disabled} className={className} {...props}>
      {pending ? <LoaderCircle className="animate-spin" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

/** The form's overall result: an error that is not about one field, or a success message. */
export function FormMessage({ className }: { className?: string }) {
  const { state } = useActionForm();
  if (!state.message) return null;
  if (state.status === "success") {
    return (
      <p role="status" className={cn("flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800", className)}>
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
        {state.message}
      </p>
    );
  }
  return (
    <p role="alert" className={cn("rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive", className)}>
      {state.message}
    </p>
  );
}
