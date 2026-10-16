import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ImageIcon } from "lucide-react";
import { NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { Department } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Factory" };

export default async function FactoryPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const departments = await adminApi<Department[]>("/v1/admin/factory/departments");

  return (
    <>
      <PageHeader
        title="Factory"
        description="The departments shown on the factory page, in production order, with their photos and numbers."
      />
      {can(staff.role, "settings") ? (
        <p className="-mt-3 mb-6 text-sm text-muted-foreground">
          Headline numbers (monthly capacity, machines, workers) are under{" "}
          <Link href="/admin/settings#factory" className="font-medium text-denim-600 hover:underline">
            Company &amp; business
          </Link>
          .
        </p>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => {
          const cover = department.images[0];
          return (
            <li key={department.slug}>
              <Link href={`/admin/factory/${department.slug}`} className="group block overflow-hidden rounded-2xl border bg-white hover:border-denim-300">
                <div className="relative aspect-[16/10] bg-cotton-100">
                  {cover ? (
                    <Image src={`/${cover.path}`} alt="" fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover" />
                  ) : (
                    <ImageIcon className="absolute inset-0 m-auto size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium group-hover:text-denim-600">{department.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {department.images.length} photo{department.images.length === 1 ? "" : "s"}
                      {department.stats.length ? ` · ${department.stats.length} number${department.stats.length === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  {department.is_published ? (
                    <ArrowRightIcon className="mt-1 size-4 text-muted-foreground group-hover:text-denim-600" />
                  ) : (
                    <Pill tone="neutral">Hidden</Pill>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
