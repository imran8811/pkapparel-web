import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { ShopCategoryForm } from "@/components/admin/shop-category-form";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminShopCategory } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Shop category text" };

export default async function ShopTextPage({ params }: PageProps<"/admin/shop-texts/[id]">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { id } = await params;
  const categories = await adminApi<AdminShopCategory[]>("/v1/admin/categories");
  const category = categories.find((c) => String(c.id) === id);
  if (!category) notFound();
  const url = `/wholesale-shop/${category.segment}${category.product_type ? `/${category.product_type}` : ""}`;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/shop-texts", label: "Shop category texts" }}
        title={category.title}
        description={url}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={url} target="_blank">
              <ExternalLinkIcon /> View page
            </Link>
          </Button>
        }
      />
      <ShopCategoryForm key={category.updated_at} category={category} />
    </>
  );
}
