import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorManager } from "@/components/admin/color-manager";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { ProductForm } from "@/components/admin/product-form";
import { ApiError } from "@/lib/api";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminProduct, AdminSizeChart, CatalogDefinitions } from "@/lib/admin/types";
import { productUrl } from "@/lib/shop";
import { getSite } from "@/lib/site";

export const metadata: Metadata = { title: "Edit style" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [product, charts, catalog, site] = await Promise.all([
    adminApi<AdminProduct>(`/v1/admin/products/${id}`).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    adminApi<AdminSizeChart[]>("/v1/admin/size-charts"),
    adminApi<CatalogDefinitions>("/v1/admin/product-types"),
    getSite(),
  ]);
  // The fabric details a color may change, among those of the style's type.
  const fabricSpecs = catalog.types.find((type) => type.slug === product.product_type)?.specs.filter((spec) => spec.per_color) ?? [];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: "Shop styles" }}
        title={product.name}
        actions={
          product.status === "active" ? (
            <Button asChild variant="outline" size="sm">
              <Link href={productUrl(product)} target="_blank">
                <ExternalLinkIcon /> View in the shop
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="grid gap-6">
        <ColorManager product={product} fabricSpecs={fabricSpecs} />
        <ProductForm key={product.updated_at} product={product} charts={charts} catalog={catalog} defaults={site.commerce} />
      </div>
    </>
  );
}
