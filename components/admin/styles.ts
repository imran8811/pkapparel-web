/*
 * Class names shared by admin server and client components. Kept out of the "use client"
 * form module: a server component importing a plain value from a client module gets a
 * client reference instead of the string.
 */

export const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15";
