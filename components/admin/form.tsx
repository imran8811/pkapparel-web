"use client";

import { createContext, use, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { inputClass } from "@/components/admin/styles";
import { idle, type FormState } from "@/lib/admin/form-state";
import { cn } from "@/lib/utils";

/*
 * Admin forms. <AdminForm> runs a server action and shares the result with the
 * fields inside it, which show their own error messages.
 *
 * - Submitting from onSubmit (not the form's action prop) keeps what was typed when
 *   the server rejects it; React would otherwise reset the form.
 * - The result is handled right where the action returns (not in an effect), so the
 *   toast still shows when the page re-renders the form with the saved data.
 * - Pages give edit forms a key made from the saved data (e.g. updated_at), so a form
 *   kept alive by Next.js between navigations shows fresh values once the data changed.
 */

type FormAction = (previous: FormState, form: FormData) => Promise<FormState>;

const FormContext = createContext<{ state: FormState; pending: boolean }>({ state: idle, pending: false });

export function useAdminForm() {
  return use(FormContext);
}

type AdminFormProps = Omit<ComponentProps<"form">, "action" | "onSubmit"> & {
  action: FormAction;
  /** Called after a successful save, e.g. to close a dialog or start a new empty form. */
  onSuccess?: (state: FormState) => void;
};

export function AdminForm({ action, onSuccess, children, ...props }: AdminFormProps) {
  const [state, setState] = useState<FormState>(idle);
  // Fields changed since the last answer: their error message is hidden until the next save.
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
        onInput={(event) => markEdited(event.target)}
        onChange={(event) => markEdited(event.target)}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await action(state, data);
            setState(result);
            setEdited(new Set());
            if (result.status === "success") {
              if (result.message) toast.success(result.message);
              if (result.redirectTo) router.push(result.redirectTo);
              onSuccess?.(result);
            } else if (result.message && !result.fields) {
              // Field errors are shown next to the fields; only other problems need a toast.
              toast.error(result.message);
            }
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
  hint?: ReactNode;
  className?: string;
  children: (props: { id: string; name: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
};

/** Label, control and either the field's error or a hint. */
export function Field({ label, name, hint, className, children }: FieldProps) {
  const { state } = useAdminForm();
  const error = state.fields?.[name];
  const id = `field-${name}`;
  const noteId = error || hint ? `${id}-note` : undefined;

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
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

type TextFieldProps = Omit<ComponentProps<"input">, "name" | "id"> & { label: ReactNode; name: string; hint?: ReactNode; fieldClassName?: string };

export function TextField({ label, name, hint, fieldClassName, className, ...input }: TextFieldProps) {
  return (
    <Field label={label} name={name} hint={hint} className={fieldClassName}>
      {(control) => <input {...control} {...input} className={cn(inputClass, className)} />}
    </Field>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<"textarea">, "name" | "id"> & { label: ReactNode; name: string; hint?: ReactNode; fieldClassName?: string };

export function TextAreaField({ label, name, hint, fieldClassName, className, rows = 4, ...textarea }: TextAreaFieldProps) {
  return (
    <Field label={label} name={name} hint={hint} className={fieldClassName}>
      {(control) => (
        <textarea {...control} {...textarea} rows={rows} className={cn(inputClass, "h-auto min-h-20 py-2 leading-relaxed", className)} />
      )}
    </Field>
  );
}

type SelectFieldProps = Omit<ComponentProps<"select">, "name" | "id"> & {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  fieldClassName?: string;
  options: { value: string; label: string }[];
};

export function SelectField({ label, name, hint, fieldClassName, className, options, ...select }: SelectFieldProps) {
  return (
    <Field label={label} name={name} hint={hint} className={fieldClassName}>
      {(control) => (
        <select {...control} {...select} className={cn(inputClass, "pr-8", className)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** On/off setting. Sends "on" when switched on (read it with checked() in the action). */
export function SwitchField({ label, name, hint, defaultChecked }: { label: ReactNode; name: string; hint?: ReactNode; defaultChecked?: boolean }) {
  const id = `field-${name}`;
  return (
    <div className="flex items-start gap-3">
      <Switch id={id} name={name} value="on" defaultChecked={defaultChecked} className="mt-0.5" />
      <div className="grid gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export function SubmitButton({ children, className, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useAdminForm();
  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending ? <Loader2Icon className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

/** The form's overall error message (e.g. when saving failed for a reason not tied to one field). */
export function FormError({ className }: { className?: string }) {
  const { state } = useAdminForm();
  if (state.status !== "error" || !state.message) return null;
  return (
    <p role="alert" className={cn("rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive", className)}>
      {state.message}
    </p>
  );
}
