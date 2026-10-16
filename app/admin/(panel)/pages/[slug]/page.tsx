import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageForm } from "@/components/admin/page-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Page } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[slug]">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const page = await adminApi<Page>(`/v1/admin/pages/${slug}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        back={{ href: "/admin/pages", label: "Legal pages" }}
        title={page.title}
        actions={
          page.is_published ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${page.slug}`} target="_blank">
                <ExternalLinkIcon />
                View on website
              </Link>
            </Button>
          ) : null
        }
      />
      <PageForm key={page.updated_at} page={page} />
    </>
  );
}
