import { cn } from "@/lib/utils";

/** Small mono label above headings, with a stitched dash in front. */
export function Eyebrow({
  className,
  tone = "dark",
  children,
  ...props
}: React.ComponentProps<"p"> & { tone?: "dark" | "light" }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.2em] uppercase sm:text-xs",
        tone === "light" ? "text-cotton-50/70" : "text-denim-600",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="stitch-line w-8 shrink-0 text-stitch-500" />
      {children}
    </p>
  );
}
