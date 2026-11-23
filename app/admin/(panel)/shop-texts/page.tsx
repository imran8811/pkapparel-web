import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminShopPage, CatalogDefinitions } from "@/lib/admin/types";
import { formatDay } from "@/lib/admin/time";
import { placeIn } from "@/lib/admin/list-groups";
import { shopUrl } from "@/lib/nav";

export const metadata: Metadata = { title: "Shop category texts" };

export default async function ShopTextsPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;
  const [pages, catalog] = await Promise.all([adminApi<AdminShopPage[]>("/v1/admin/categories"), adminApi<CatalogDefinitions>("/v1/admin/product-types")]);
  const categoryOrder = catalog.categories.map((category) => category.slug);
  const categoryName = (slug: string) => catalog.categories.find((category) => category.slug === slug)?.name ?? slug;

  return (
    <>
      <PageHeader
        title="Shop category texts"
        description="The intro and questions on each shop page, such as /wholesale-shop/men or /wholesale-shop/men/jeans-pant. Good texts help these pages rank on Google. The pages come with the departments and the categories they sell (Shop categories)."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {catalog.departments.map((department) => (
          <section key={department.slug} className="overflow-hidden rounded-2xl border bg-white">
            <h2 className="border-b bg-cotton-50 px-5 py-3 font-heading font-semibold">{department.possessive} pages</h2>
            <ul>
              {pages
                .filter((category) => category.segment === department.slug)
                // The department's own page first, then its categories in the shop's order.
                .sort((a, b) => (a.product_type === "" ? -1 : b.product_type === "" ? 1 : placeIn(categoryOrder, a.product_type) - placeIn(categoryOrder, b.product_type)))
                .map((category) => (
                  <li key={category.id} className="border-b last:border-b-0">
                    <Link href={`/admin/shop-texts/${category.id}`} className="group flex items-center gap-3 px-5 py-3 hover:bg-cotton-50">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium group-hover:text-denim-600">
                          {category.product_type === "" ? `${department.name} (all)` : categoryName(category.product_type)}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {shopUrl(department.slug, category.product_type || undefined)}
                        </p>
                      </div>
                      <span className="hidden text-xs text-muted-foreground sm:block">
                        {category.faq.length} Q&amp;A · edited {formatDay(category.updated_at)}
                      </span>
                      <ArrowRightIcon className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
