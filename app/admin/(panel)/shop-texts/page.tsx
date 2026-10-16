import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminShopCategory } from "@/lib/admin/types";
import { formatDay } from "@/lib/admin/time";
import { isProductType, segments, shopUrl, typeInfo } from "@/lib/nav";

export const metadata: Metadata = { title: "Shop category texts" };

export default async function ShopTextsPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;
  const categories = await adminApi<AdminShopCategory[]>("/v1/admin/categories");

  return (
    <>
      <PageHeader
        title="Shop category texts"
        description="The intro and questions on each shop page, such as /wholesale-shop/men or /wholesale-shop/men/jeans-pant. Good texts help these pages rank on Google."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {segments.map((segment) => (
          <section key={segment.slug} className="overflow-hidden rounded-2xl border bg-white">
            <h2 className="border-b bg-cotton-50 px-5 py-3 font-heading font-semibold">{segment.possessive} pages</h2>
            <ul>
              {categories
                .filter((category) => category.segment === segment.slug)
                .map((category) => (
                  <li key={category.id} className="border-b last:border-b-0">
                    <Link href={`/admin/shop-texts/${category.id}`} className="group flex items-center gap-3 px-5 py-3 hover:bg-cotton-50">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium group-hover:text-denim-600">
                          {category.product_type === "" ? `${segment.label} (all)` : isProductType(category.product_type) ? typeInfo(category.product_type).label : category.product_type}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {category.product_type === "" ? shopUrl(segment.slug) : `${shopUrl(segment.slug)}/${category.product_type}`}
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
