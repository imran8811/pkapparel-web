import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon, ImageIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/admin/styles";
import { EmptyState, NoAccess, PageHeader, Pager, Pill } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import { formatDay } from "@/lib/admin/time";
import type { Pagination, PostCounts, PostSummary } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: PageProps<"/admin/blog">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const search = (await searchParams) as { status?: string; q?: string; page?: string };
  const status = search.status === "draft" || search.status === "published" ? search.status : undefined;
  const q = search.q?.trim() || undefined;
  const page = Math.max(1, Number(search.page) || 1);

  const { data: posts, meta } = await adminApiWithMeta<PostSummary[], { pagination: Pagination; counts: PostCounts }>("/v1/admin/posts", {
    query: { status, q, page },
  });
  const href = (changes: { status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const next = { status, q, ...changes };
    if (next.status) params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    return `/admin/blog${params.size ? `?${params}` : ""}`;
  };

  const tabs = [
    { value: undefined, label: "All" },
    { value: "published", label: `Published (${meta.counts.published + meta.counts.scheduled})` },
    { value: "draft", label: `Drafts (${meta.counts.drafts})` },
  ];

  return (
    <>
      <PageHeader
        title="Blog"
        description="Articles for buyers. Published posts appear on /blog and in Google."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/blog/new">
              <PlusIcon />
              New post
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={href({ status: tab.value })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              tab.value === status ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
            )}
          >
            {tab.label}
          </Link>
        ))}
        <form action="/admin/blog" className="relative ml-auto w-full sm:w-72">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search titles" aria-label="Search posts" className={cn(inputClass, "pl-9")} />
        </form>
      </div>

      {posts.length === 0 ? (
        <EmptyState title={q ? "No posts match" : "No posts yet"}>{q ? "Try another search." : "Write the first article with “New post”."}</EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {posts.map((post) => {
            return (
              <li key={post.id} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:px-5">
                <div className="relative hidden aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-cotton-100 sm:block">
                  {post.cover ? (
                    <Image src={`/${post.cover.path}`} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <ImageIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/blog/${post.id}`} className="font-medium hover:text-denim-600">
                    {post.title}
                  </Link>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/post/{post.slug}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  {post.visibility === "draft" ? (
                    <Pill tone="neutral">Draft</Pill>
                  ) : post.visibility === "scheduled" ? (
                    <Pill tone="blue">Scheduled</Pill>
                  ) : (
                    <Pill tone="green">Published</Pill>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {post.status === "draft" ? `Edited ${formatDay(post.updated_at)}` : formatDay(post.published_at)}
                  </span>
                </div>
                {post.visibility === "published" ? (
                  <Link
                    href={`/post/${post.slug}`}
                    target="_blank"
                    aria-label={`View “${post.title}” on the website`}
                    className="hidden rounded-lg p-2 text-muted-foreground hover:bg-cotton-100 hover:text-foreground sm:block"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </Link>
                ) : (
                  <span className="hidden w-8 sm:block" />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pager page={meta.pagination.page} pages={meta.pagination.pages} href={(target) => href({ page: target })} />
    </>
  );
}
