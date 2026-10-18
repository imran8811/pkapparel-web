"use client";

import { useTransition } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ignoreMissingPage, restoreMissingPage } from "@/lib/admin/actions/redirects";

/** Ignore a missing address (bot noise, typos), or show an ignored one again. */
export function MissingPageActions({ id, ignored }: { id: number; ignored: boolean }) {
  const [pending, startTransition] = useTransition();
  const run = () =>
    startTransition(async () => {
      const result = await (ignored ? restoreMissingPage(id) : ignoreMissingPage(id));
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message ?? "That did not work. Please try again.");
    });

  return (
    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={run}>
      {ignored ? <EyeIcon /> : <EyeOffIcon />} {ignored ? "Show again" : "Ignore"}
    </Button>
  );
}
