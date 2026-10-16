import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DepartmentForm } from "@/components/admin/department-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Department } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Factory department" };

export default async function DepartmentPage({ params }: PageProps<"/admin/factory/[slug]">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const department = await adminApi<Department>(`/v1/admin/factory/departments/${slug}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader back={{ href: "/admin/factory", label: "Factory" }} title={department.name} />
      <DepartmentForm key={department.updated_at} department={department} />
    </>
  );
}
