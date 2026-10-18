"use client";

import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** When an admin page fails, usually because the API cannot be reached. */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-dashed bg-white/60 px-6 py-14 text-center">
      <p className="font-heading text-lg font-semibold">This page could not load</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Please try again. If it keeps happening, the API may be down or unreachable from the website; its log files (api/storage/logs) say why.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={() => retry()}>
          <RotateCcwIcon /> Try again
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin">Dashboard</Link>
        </Button>
      </div>
      {error.digest ? <p className="mt-6 font-mono text-xs text-muted-foreground">Reference {error.digest}</p> : null}
    </div>
  );
}
