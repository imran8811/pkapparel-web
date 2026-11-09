"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LoaderCircle, LogOut } from "lucide-react";
import { logout } from "@/lib/account/actions/auth";

/** The stock account's heading bar: back to the overview, and logging out (a full reload, so no page keeps the session). */
export function StockAccountNav() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-end justify-between gap-4">
      <nav aria-label="Account" className="-mb-px flex min-w-0 gap-1">
        <Link href="/stock/account" className="shrink-0 border-b-2 border-stitch-500 px-3 py-3 text-sm font-medium sm:px-4">
          Your orders
        </Link>
        <Link href="/stock" className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground sm:px-4">
          Shop the stock
        </Link>
      </nav>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await logout().catch(() => undefined);
            window.location.replace("/stock");
          })
        }
        className="mb-2 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
        Log out
      </button>
    </div>
  );
}
