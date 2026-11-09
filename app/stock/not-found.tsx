import Link from "next/link";
import { Button } from "@/components/ui/button";
import { stockSegments, stockUrl } from "@/lib/stock";

/** 404 inside the stock pages (keeps the stock header and footer). */
export default function StockNotFound() {
  return (
    <div className="relative overflow-hidden bg-denim-900 text-cotton-50">
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <div className="relative mx-auto w-full max-w-2xl px-6 py-24 text-center sm:py-32">
        <p className="font-mono text-xs tracking-[0.25em] text-stitch-400 uppercase">Error 404</p>
        <h1 className="mt-4 text-5xl leading-none font-bold tracking-[-0.03em] sm:text-6xl">
          This page isn&apos;t <span className="stitch-underline">in stock.</span>
        </h1>
        <p className="mt-6 text-lg text-cotton-50/70">The page you&apos;re looking for doesn&apos;t exist or has moved. See what is in stock now.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {stockSegments.map((segment) => (
            <Button key={segment.slug} asChild variant={segment.slug === "men" ? "accent" : "outline-inverse"} size="lg">
              <Link href={stockUrl(segment.slug)}>{segment.title}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
