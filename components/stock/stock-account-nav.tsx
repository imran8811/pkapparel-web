"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { logout } from "@/lib/account/actions/auth";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/stock/account", label: "Your orders" },
  { href: "/stock/account/profile", label: "Your details" },
];

/** Tabs of the stock account, with the current page marked. Reads the URL, so it sits inside <Suspense>. */
export function StockAccountNav() {
  return <Tabs pathname={usePathname()} />;
}

/** The same tabs without a marked page: the static fallback while the URL is read. */
export function StockAccountNavFallback() {
  return <Tabs pathname={null} />;
}

/** The stock account's tabs, and logging out (a full reload, so no page keeps the session). */
function Tabs({ pathname }: { pathname: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-end justify-between gap-4">
      <nav aria-label="Account" className="-mb-px flex min-w-0 gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          // Order pages belong to "Your orders".
          const active =
            pathname !== null && (tab.href === "/stock/account" ? pathname === tab.href || pathname.startsWith("/stock/account/orders") : pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4",
                active ? "border-stitch-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
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
