import { cn } from "@/lib/utils";

/**
 * Renders rich text from the API (blog posts, legal pages). The HTML is already
 * sanitised by the API (App\Core\HtmlSanitizer) before it is stored; tables get a
 * scroll wrapper so they never break the layout on phones.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  const withTableWrappers = html
    .replace(/<table\b/g, '<div class="pk-table-wrap"><table')
    .replace(/<\/table>/g, "</table></div>");

  return (
    <div
      className={cn(
        "prose prose-lg prose-pk max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-a:font-medium prose-a:underline-offset-2 prose-img:rounded-2xl",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: withTableWrappers }}
    />
  );
}
