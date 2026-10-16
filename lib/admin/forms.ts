import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ApiError } from "@/lib/api";
import type { FormState } from "@/lib/admin/form-state";

export type { FormState } from "@/lib/admin/form-state";

export function success(message: string): FormState {
  return { status: "success", message };
}

export function failure(message: string, fields?: Record<string, string>): FormState {
  return { status: "error", message, fields };
}

/** Turns an API error into a form message. Next.js redirects and other control flow pass through. */
export function errorState(error: unknown): FormState {
  unstable_rethrow(error);
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return failure("Please check the highlighted fields.", error.fields);
    }
    if (error.status === 403 || error.status === 404 || error.status === 429) {
      return failure(error.message);
    }
    if (error.status === 503) {
      return failure("The server could not be reached. Please try again in a moment.");
    }
  }
  console.error(error);
  return failure("Something went wrong. Please try again.");
}

/** Text field: trimmed, "" when missing. */
export function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Optional text field: null when empty. */
export function optional(form: FormData, name: string): string | null {
  return text(form, name) || null;
}

/** Number field: null when empty or not a number. */
export function number(form: FormData, name: string): number | null {
  const value = text(form, name);
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Checkbox or switch: true when sent as "on" / "true" / "1". */
export function checked(form: FormData, name: string): boolean {
  return ["on", "true", "1"].includes(text(form, name));
}

/** A JSON list sent in a hidden input. */
export function jsonList<T>(form: FormData, name: string): T[] {
  try {
    const value: unknown = JSON.parse(text(form, name) || "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}
