import type { Metadata } from "next";
import { PostForm } from "@/components/admin/post-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { getStaff } from "@/lib/admin/session";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  return (
    <>
      <PageHeader back={{ href: "/admin/blog", label: "Blog" }} title="New post" />
      <PostForm post={null} />
    </>
  );
}
