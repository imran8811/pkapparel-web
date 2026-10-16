import { Quote } from "lucide-react";
import type { Testimonial } from "@/lib/content";
import { countryName } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TestimonialGrid({ testimonials, className }: { testimonials: Testimonial[]; className?: string }) {
  return (
    <ul className={cn("grid gap-4 md:grid-cols-3", className)}>
      {testimonials.map((item) => (
        <li key={item.id}>
          <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-7">
            <Quote aria-hidden className="size-7 text-stitch-500" />
            <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-foreground">“{item.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-dashed border-border pt-5 text-sm">
              <span className="grid size-9 place-items-center rounded-full bg-denim-50 font-mono text-[11px] font-semibold text-denim-600">
                {item.country_code ?? "··"}
              </span>
              <span>
                <span className="block font-semibold">{item.author_name ?? item.author_role}</span>
                <span className="text-muted-foreground">
                  {[item.author_name ? item.author_role : null, item.company, countryName(item.country_code)]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
