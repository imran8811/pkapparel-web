import { Eyebrow } from "@/components/brand/eyebrow";
import { cn } from "@/lib/utils";

/** Eyebrow, heading and optional description at the top of a section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
  align = "split",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: "dark" | "light";
  /** "split": title left, description right on large screens. "stack": one column. */
  align?: "split" | "stack";
  className?: string;
}) {
  const muted = tone === "light" ? "text-cotton-50/70" : "text-muted-foreground";

  return (
    <div className={cn(align === "split" ? "grid gap-6 lg:grid-cols-12 lg:items-end" : "max-w-3xl", className)}>
      <div className={align === "split" ? "lg:col-span-7" : undefined}>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <h2 className="mt-5 text-4xl leading-[1.02] font-bold tracking-[-0.03em] sm:text-5xl">{title}</h2>
      </div>
      {description && (
        <div className={cn("text-lg leading-relaxed", muted, align === "split" ? "lg:col-span-5" : "mt-5")}>
          {description}
        </div>
      )}
    </div>
  );
}
