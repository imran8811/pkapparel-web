import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shared 404 content, used with and without the site header/footer. */
export function NotFoundPanel({ showLogo = false, className }: { showLogo?: boolean; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-denim-900 text-cotton-50", className)}>
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <div className="relative mx-auto w-full max-w-2xl px-6 py-24 text-center sm:py-32">
        {showLogo && (
          <div className="mb-14 flex justify-center">
            <Logo tone="light" />
          </div>
        )}
        <p className="font-mono text-xs tracking-[0.25em] text-stitch-400 uppercase">Error 404</p>
        <h1 className="mt-4 text-5xl leading-none font-bold tracking-[-0.03em] sm:text-6xl">
          This page isn&apos;t <span className="stitch-underline">stitched</span> yet.
        </h1>
        <p className="mt-6 text-lg text-cotton-50/70">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Try the shop or get in touch.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline-inverse" size="lg">
            <Link href="/wholesale-shop">Shop wholesale</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
