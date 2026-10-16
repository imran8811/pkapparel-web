import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, LockIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* Building blocks shared by admin pages. */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-denim-950 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, description, children, className }: { title?: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-white p-5 sm:p-6", className)}>
      {title ? (
        <header className="mb-5">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white/60 px-6 py-14 text-center">
      <p className="font-heading text-lg font-semibold">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}

export function NoAccess() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white px-6 py-14 text-center">
      <LockIcon className="mx-auto size-6 text-muted-foreground" />
      <p className="mt-3 font-heading text-lg font-semibold">No access</p>
      <p className="mt-1 text-sm text-muted-foreground">Your role does not include this part of the admin. Ask an administrator if you need it.</p>
    </div>
  );
}

/** Loading placeholder shown while an admin page fetches its data. */
export function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Small coloured label, e.g. a status. */
export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "blue" | "green" | "orange" | "red" | "muted"; children: ReactNode }) {
  const tones = {
    neutral: "bg-cotton-100 text-denim-900 ring-cotton-300",
    blue: "bg-denim-50 text-denim-700 ring-denim-200",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    orange: "bg-orange-50 text-stitch-700 ring-stitch-300",
    red: "bg-red-50 text-red-700 ring-red-200",
    muted: "bg-white text-muted-foreground ring-border",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", tones[tone])}>
      {children}
    </span>
  );
}

/** Page links for long lists (keeps the other filters in the URL). */
export function Pager({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (page: number) => string;
}) {
  if (pages <= 1) return null;
  const linkClass = "rounded-lg border bg-white px-3 py-1.5 text-sm hover:border-denim-300";
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass}>
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={linkClass}>
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
