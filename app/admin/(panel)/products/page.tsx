import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { inputClass } from "@/components/admin/styles";
import { can } from "@/lib/admin/permissions";
import { adminApiWithMeta, getStaff } from "@/lib/admin/session";
import type { AdminProductSummary, Pagination, ProductStatus } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";
import { isProductType, isSegment } from "@/lib/nav";
import { categoryLabel } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop styles" };

const STATUS: Record<ProductStatus, { label: string; tone: "green" | "neutral" | "muted" }> = {
  active: { label: "In the shop", tone: "green" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "muted" },
};

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const search = (await searchParams) as { status?: string; q?: string };
  const status = search.status && search.status in STATUS ? (search.status as ProductStatus) : undefined;
  const q = search.q?.trim() || undefined;
  const { data: products, meta } = await adminApiWithMeta<AdminProductSummary[], { pagination: Pagination; counts: Record<ProductStatus, number> }>(
    "/v1/admin/products",
    { query: { status, q, per_page: 100 } },
  );
  const total = Object.values(meta.counts).reduce((sum, count) => sum + count, 0);
  const tabs: { value?: ProductStatus; label: string; count: number }[] = [
    { label: "All", count: total },
    ...(Object.keys(STATUS) as ProductStatus[]).map((value) => ({ value, label: STATUS[value].label, count: meta.counts[value] })),
  ];

  return (
    <>
      <PageHeader
        title="Shop styles"
        description="Each style is one product page in the wholesale shop, with its colors, photos, sizes and price."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <PlusIcon /> New style
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={`/admin/products${tab.value || q ? `?${new URLSearchParams({ ...(tab.value ? { status: tab.value } : {}), ...(q ? { q } : {}) })}` : ""}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
              tab.value === status ? "border-denim-900 bg-denim-900 text-white" : "bg-white hover:border-denim-300",
            )}
          >
            {tab.label}
            <span className={cn("text-xs tabular-nums", tab.value === status ? "text-cotton-50/70" : "text-muted-foreground")}>{tab.count}</span>
          </Link>
        ))}
        <form action="/admin/products" className="relative ml-auto w-full sm:w-72">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Name, style no. or color code" aria-label="Search styles" className={cn(inputClass, "pl-9")} />
        </form>
      </div>

      {products.length === 0 ? (
        <EmptyState title={q ? "No styles match" : "No styles yet"}>{q ? "Try another search." : "Add the first one with “New style”."}</EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:px-5">
              <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
                {product.thumbnail ? (
                  <Image src={`/${product.thumbnail}`} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <ImageIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-denim-600">
                  {product.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {isSegment(product.segment) && isProductType(product.product_type) ? categoryLabel(product.segment, product.product_type) : product.product_type}
                  {" · "}
                  {product.color_count} color{product.color_count === 1 ? "" : "s"}
                  {product.style_no ? ` · ${product.style_no}` : ""}
                </p>
              </div>
              <span className="hidden text-sm tabular-nums sm:block">{formatMoney(product.price_cents)}</span>
              {product.is_featured ? <Pill tone="blue">Featured</Pill> : null}
              <Pill tone={STATUS[product.status].tone}>{STATUS[product.status].label}</Pill>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
