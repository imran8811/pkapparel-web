import { getImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders rich text from the API (blog posts, legal pages). The HTML is already
 * sanitised by the API (App\Core\HtmlSanitizer) before it is stored; tables get a
 * scroll wrapper so they never break the layout on phones.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  // The table wrapper scrolls sideways on phones, so keyboard users can focus it and scroll with the arrow keys.
  const withTableWrappers = responsiveImages(orderedHeadings(html))
    .replace(/<table\b/g, '<div class="pk-table-wrap" tabindex="0" role="region" aria-label="Table"><table')
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

/**
 * Headings follow the page's h1 without skipping a level (for screen readers and search engines), whatever levels
 * the editor or the old site used: each heading becomes one level below the nearest higher one before it, so
 * h2 → h4 becomes h2 → h3, and an article starting with h3 starts with h2. Siblings stay siblings.
 */
function orderedHeadings(html: string): string {
  const path: { from: number; to: number }[] = [];
  let open = 0;
  return html.replace(/<(\/?)h([1-6])\b/gi, (_match, closing: string, level: string) => {
    if (closing) return `</h${open || level}`;
    const from = Number(level);
    while (path.length > 0 && path[path.length - 1].from >= from) path.pop();
    open = Math.min(6, (path[path.length - 1]?.to ?? 1) + 1);
    path.push({ from, to: open });
    return `<h${open}`;
  });
}

const attribute = (tag: string, name: string): string | undefined => new RegExp(`\\s${name}="([^"]*)"`, "i").exec(tag)?.[1];

/**
 * Uploaded images with a known size (the API adds it) are served by the image optimizer at the width the reader
 * needs, in a modern format, and load lazily. Their size is reserved, so the text does not jump while they load.
 */
function responsiveImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = attribute(tag, "src")?.replace(/^\/?uploads\//, "/uploads/");
    const width = Number(attribute(tag, "width"));
    const height = Number(attribute(tag, "height"));
    if (!src?.startsWith("/uploads/") || !width || !height) return tag;

    const { props } = getImageProps({ src, alt: "", width, height, sizes: "(min-width: 768px) 768px, 100vw" });
    const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const title = attribute(tag, "title");
    return (
      `<img src="${escape(props.src)}" srcset="${escape(props.srcSet ?? "")}" sizes="${escape(props.sizes ?? "")}" width="${width}" height="${height}" ` +
      `alt="${attribute(tag, "alt") ?? ""}"${title ? ` title="${title}"` : ""} loading="lazy" decoding="async">`
    );
  });
}
