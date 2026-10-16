import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostForm } from "@/components/admin/post-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Post } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const post = await adminApi<Post>(`/v1/admin/posts/${id}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  return (
    <>
      <PageHeader
        back={{ href: "/admin/blog", label: "Blog" }}
        title={post.title}
        actions={
          post.visibility === "published" ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/post/${post.slug}`} target="_blank">
                <ExternalLinkIcon />
                View on website
              </Link>
            </Button>
          ) : null
        }
      />
      <PostForm key={post.updated_at} post={post} />
    </>
  );
}
