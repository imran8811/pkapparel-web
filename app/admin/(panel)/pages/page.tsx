import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import { formatDay } from "@/lib/admin/time";
import type { PageSummary } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Legal pages" };

export default async function PagesPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const pages = await adminApi<PageSummary[]>("/v1/admin/pages");

  return (
    <>
      <PageHeader
        title="Legal pages"
        description="Terms of sale, privacy and cookie policies. Have a lawyer review them before the shop opens."
      />
      <ul className="overflow-hidden rounded-2xl border bg-white">
        {pages.map((page) => (
          <li key={page.slug} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/pages/${page.slug}`} className="font-medium hover:text-denim-600">
                {page.title}
              </Link>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{page.slug}</p>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">Edited {formatDay(page.updated_at)}</span>
            {page.is_published ? <Pill tone="green">Published</Pill> : <Pill tone="neutral">Hidden</Pill>}
          </li>
        ))}
      </ul>
    </>
  );
}
