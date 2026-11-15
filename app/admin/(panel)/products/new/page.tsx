import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminProduct, AdminSizeChart, CatalogDefinitions } from "@/lib/admin/types";
import { getSite } from "@/lib/site";

export const metadata: Metadata = { title: "New style" };

/** A new style: empty, or with ?copy={id} a duplicate of that style, its details filled in to change and save as new. */
export default async function NewProductPage({ searchParams }: PageProps<"/admin/products/new">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { copy } = await searchParams;
  const copyId = typeof copy === "string" && /^\d+$/.test(copy) ? copy : null;
  const [charts, catalog, site, original] = await Promise.all([
    adminApi<AdminSizeChart[]>("/v1/admin/size-charts"),
    adminApi<CatalogDefinitions>("/v1/admin/product-types"),
    getSite(),
    copyId
      ? adminApi<AdminProduct>(`/v1/admin/products/${copyId}`).catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 404) notFound();
          throw error;
        })
      : null,
  ]);

  return (
    <>
      <PageHeader
        back={original ? { href: `/admin/products/${original.id}`, label: original.name } : { href: "/admin/products", label: "Shop styles" }}
        title={original ? "Duplicate style" : "New style"}
        description={
          original
            ? `A copy of “${original.name}”. Change what is different, then create it as a new style. Colors and photos are not copied: add them once the style is created.`
            : undefined
        }
      />
      <ProductForm key={original?.id ?? "new"} product={null} copyOf={original} charts={charts} catalog={catalog} defaults={site.commerce} />
    </>
  );
}
