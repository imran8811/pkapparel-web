"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * When a public page fails (e.g. the API cannot be reached). The site header and footer stay, so the
 * contact details and the WhatsApp button are still there.
 */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="relative overflow-hidden bg-denim-900 text-cotton-50">
      <div aria-hidden className="absolute inset-0 twill-texture" />
      <div role="alert" className="relative mx-auto w-full max-w-2xl px-6 py-24 text-center sm:py-32">
        <p className="font-mono text-xs tracking-[0.25em] text-stitch-400 uppercase">Something went wrong</p>
        <h1 className="mt-4 text-5xl leading-none font-bold tracking-[-0.03em] sm:text-6xl">
          A loose <span className="stitch-underline">thread.</span>
        </h1>
        <p className="mt-6 text-lg text-cotton-50/70">
          This page could not load just now. Please try again in a moment. If it keeps happening, contact us on WhatsApp or by email: the
          details are at the bottom of the page.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="accent" size="lg" onClick={() => retry()}>
            <RotateCcw /> Try again
          </Button>
          <Button asChild variant="outline-inverse" size="lg">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
        {error.digest ? <p className="mt-8 font-mono text-xs text-cotton-50/40">Reference {error.digest}</p> : null}
      </div>
    </div>
  );
}
