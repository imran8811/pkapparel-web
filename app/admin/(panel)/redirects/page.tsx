import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CornerDownRightIcon, PencilIcon, PlusIcon, SearchIcon } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { TextField } from "@/components/admin/form";
import { ItemDialog } from "@/components/admin/item-dialog";
import { MissingPageActions } from "@/components/admin/missing-page-actions";
import { EmptyState, NoAccess, PageHeader, Pager, Pill } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { Button } from "@/components/ui/button";
import { deleteRedirect, saveRedirect } from "@/lib/admin/actions/redirects";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatDateTime, formatRelative } from "@/lib/admin/time";
import type { AdminRedirect, MissingPage, Pagination, RedirectCounts } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Redirects" };

type Tab = "redirects" | "missing" | "ignored";
type Meta = { pagination: Pagination; counts: RedirectCounts };

export default async function RedirectsPage({ searchParams }: PageProps<"/admin/redirects">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const search = (await searchParams) as { tab?: string; q?: string; page?: string };
  const tab: Tab = search.tab === "missing" || search.tab === "ignored" ? search.tab : "redirects";
  const q = search.q?.trim() || undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const result =
    tab === "redirects"
      ? await adminApiWithMeta<AdminRedirect[], Meta>("/v1/admin/redirects", { query: { q, page } })
      : await adminApiWithMeta<MissingPage[], Meta>("/v1/admin/missing-pages", { query: { status: tab === "ignored" ? "ignored" : "open", page } });
  const { counts, pagination } = result.meta;
  const href = (changes: { tab?: Tab; page?: number }) => {
    const params = new URLSearchParams();
    const next = { tab: changes.tab ?? tab, q: changes.tab && changes.tab !== tab ? undefined : q, page: changes.page };
    if (next.tab !== "redirects") params.set("tab", next.tab);
    if (next.q && next.tab === "redirects") params.set("q", next.q);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    return `/admin/redirects${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Redirects"
        description="Old addresses that lead to a page of the website, so links and Google results keep working. A redirect only applies where no page exists. Changing a style's or post's address adds one automatically."
        actions={
          <ItemDialog
            title="Add a redirect"
            action={saveRedirect}
            submitLabel="Add redirect"
            trigger={
              <Button size="sm">
                <PlusIcon /> Add redirect
              </Button>
            }
          >
            <RedirectFields />
          </ItemDialog>
        }
      />

      <nav aria-label="Redirects" className="mb-5 flex gap-4 overflow-x-auto border-b text-sm">
        {(
          [
            ["redirects", `Redirects (${counts.redirects})`],
            ["missing", `Not found (${counts.missing})`],
            ["ignored", `Ignored (${counts.ignored})`],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={href({ tab: value })}
            aria-current={value === tab ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-2",
              value === tab ? "border-denim-900 font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "redirects" ? (
        <>
          <form action="/admin/redirects" className="mb-5 flex flex-wrap gap-2">
            <div className="relative min-w-60 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input name="q" defaultValue={q} placeholder="Search old or new addresses" aria-label="Search redirects" className={cn(inputClass, "pl-9")} />
            </div>
            <button type="submit" className="h-10 rounded-lg bg-denim-900 px-4 text-sm font-medium text-white hover:bg-denim-800">
              Search
            </button>
          </form>
          <RedirectList redirects={result.data as AdminRedirect[]} searching={q !== undefined} />
        </>
      ) : (
        <MissingList pages={result.data as MissingPage[]} ignored={tab === "ignored"} />
      )}

      <Pager page={pagination.page} pages={pagination.pages} href={(target) => href({ page: target })} />
    </>
  );
}

function RedirectList({ redirects, searching }: { redirects: AdminRedirect[]; searching: boolean }) {
  if (redirects.length === 0) {
    return (
      <EmptyState title={searching ? "No redirects match" : "No redirects yet"}>
        {searching ? "Try another search." : "Addresses visitors hit that do not exist appear under “Not found”, ready to redirect."}
      </EmptyState>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border bg-white">
      {redirects.map((redirect) => (
        <li key={redirect.id} className="grid grid-cols-1 gap-2 border-b px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm">{redirect.from_path}</p>
            <p className="flex min-w-0 items-center gap-1.5 text-sm text-denim-700">
              <CornerDownRightIcon aria-label="leads to" className="size-4 shrink-0 text-muted-foreground" />
              <a href={redirect.to_path} target="_blank" rel="noreferrer" className="truncate font-mono hover:underline">
                {redirect.to_path}
              </a>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {redirect.source_label}
              {redirect.created_by ? ` by ${redirect.created_by}` : ""} · {formatDateTime(redirect.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {redirect.source !== "staff" ? <Pill tone="muted">Automatic</Pill> : null}
            <ItemDialog
              title="Edit redirect"
              action={saveRedirect}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Edit redirect from ${redirect.from_path}`}>
                  <PencilIcon />
                </Button>
              }
            >
              <input type="hidden" name="id" value={redirect.id} />
              <RedirectFields from={redirect.from_path} to={redirect.to_path} />
            </ItemDialog>
            <DeleteButton
              iconOnly
              label={`Delete redirect from ${redirect.from_path}`}
              title="Delete this redirect?"
              description={`${redirect.from_path} will show “page not found” again.`}
              onConfirm={deleteRedirect.bind(null, redirect.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MissingList({ pages, ignored }: { pages: MissingPage[]; ignored: boolean }) {
  if (pages.length === 0) {
    return (
      <EmptyState title={ignored ? "Nothing ignored" : "No missing pages"}>
        {ignored ? null : "When visitors open an address that does not exist, it appears here, most visited first, so you can redirect it."}
      </EmptyState>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border bg-white">
      {pages.map((page) => (
        <li key={page.id} className="grid grid-cols-1 gap-2 border-b px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5">
          <div className="min-w-0">
            <a href={page.path} target="_blank" rel="noreferrer" className="block truncate font-mono text-sm hover:underline">
              {page.path}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              {page.hits} {page.hits === 1 ? "visit" : "visits"} · last {formatRelative(page.last_seen_at)}
              {page.last_referrer ? ` · from ${referrerHost(page.last_referrer)}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {ignored ? null : (
              <ItemDialog
                title="Redirect this address"
                description={page.path}
                action={saveRedirect}
                submitLabel="Add redirect"
                trigger={
                  <Button size="sm" variant="outline">
                    <ArrowRightIcon /> Redirect
                  </Button>
                }
              >
                <RedirectFields from={page.path} fixedFrom />
              </ItemDialog>
            )}
            <MissingPageActions id={page.id} ignored={ignored} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RedirectFields({ from, to, fixedFrom = false }: { from?: string; to?: string; fixedFrom?: boolean }) {
  return (
    <>
      {fixedFrom ? (
        <input type="hidden" name="from_path" value={from} />
      ) : (
        <TextField
          label="Old address"
          name="from_path"
          defaultValue={from}
          placeholder="/old-page"
          hint="The path after the domain, or paste the whole old link."
        />
      )}
      <TextField
        label="New address"
        name="to_path"
        defaultValue={to}
        placeholder="/wholesale-shop/men/jeans-pant"
        hint="A page of this website, or a full https:// link to another website."
      />
    </>
  );
}

function referrerHost(referrer: string): string {
  try {
    return new URL(referrer).host;
  } catch {
    return referrer;
  }
}
