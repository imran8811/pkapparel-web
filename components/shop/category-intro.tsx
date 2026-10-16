import { cn } from "@/lib/utils";

/** Intro text of a shop category, written in the admin (HTML cleaned by the API), on the dark page header. */
export function CategoryIntro({ html, className }: { html: string; className?: string }) {
  if (!html.trim()) return null;
  return (
    <div
      className={cn("grid gap-4 [&_a]:text-cotton-50 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-cotton-50", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
