import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The PK Apparel logo: a vector redraw of the official mark ("pK", rule, APPAREL),
 * traced from the original PNG (assets/brand/pk-apparel-logo-original.png).
 * The colour follows `currentColor`, so set it with a text colour class.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="8 32 117 99" aria-hidden className={className} xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor">
        <g strokeLinecap="round" strokeWidth={7.45}>
          <circle cx="36.9" cy="60.7" r="24.1" />
          <path d="M12.9 60.7V107.8M76.9 37.8V108.1M120.3 37.7 76.9 81.1M90.3 67.7l29.6 40.2" />
        </g>
        <path strokeWidth={1.1} d="M9 115h114.5" />
        <path
          strokeWidth={1.35}
          strokeLinejoin="round"
          d="M20.4 130l4.75-11.8 4.75 11.8M22.2 125.5h5.9M36.3 130v-11.35h4.3a2.95 2.95 0 0 1 0 5.85h-4.3M50.3 130v-11.35h4.3a2.95 2.95 0 0 1 0 5.85h-4.3M62.4 130l4.7-11.8 4.7 11.8M64.2 125.5h5.8M77.3 130v-11.35h4.5a2.95 2.95 0 0 1 0 5.85h-4.5M81.5 124.5l4.5 5.5M100.6 118.65h-8.3v10.7h8.6M92.3 123.5h7.6M106.3 118v11.35h6.8"
        />
      </g>
    </svg>
  );
}

type LogoProps = {
  /** "dark" = brand blue logo for light backgrounds, "light" = white logo for dark backgrounds. */
  tone?: "dark" | "light";
  showTagline?: boolean;
  className?: string;
  /** Size of the mark, e.g. "h-14". Defaults to h-11 (44px). */
  markClassName?: string;
};

export function Logo({ tone = "dark", showTagline = true, className, markClassName }: LogoProps) {
  const light = tone === "light";

  return (
    <Link href="/" aria-label="PK Apparel, home" className={cn("flex shrink-0 items-center gap-3.5", className)}>
      <LogoMark className={cn("h-11 w-auto", light ? "text-white" : "text-brand", markClassName)} />
      {showTagline && (
        <span
          className={cn(
            "hidden border-l pl-3.5 font-mono text-[9.5px] leading-[1.7] tracking-[0.2em] uppercase sm:block",
            light ? "border-white/20 text-cotton-50/60" : "border-border text-muted-foreground",
          )}
        >
          Denim manufacturer
          <br />
          Made to order
        </span>
      )}
    </Link>
  );
}
