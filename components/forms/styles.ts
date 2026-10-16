/*
 * Class names for the public site's forms, shared by server and client components.
 * Kept out of "use client" modules: a server component importing a plain value from a
 * client module gets a client reference instead of the string.
 */

export const fieldClass =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-sm";

/** White card that holds a form or a block of account content. */
export const panelClass = "rounded-3xl border border-border bg-card p-6 sm:p-8";
