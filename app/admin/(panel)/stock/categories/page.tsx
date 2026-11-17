import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField, TextField } from "@/components/admin/form";
import { ItemDialog } from "@/components/admin/item-dialog";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { deleteStockCategory, deleteStockDepartment, saveStockCategory, saveStockDepartment } from "@/lib/admin/actions/stock";
import { can } from "@/lib/admin/permissions";
import { getStaff } from "@/lib/admin/session";
import { getStockSectionsAdmin } from "@/lib/admin/stock-sections";
import type { AdminStockCategory, AdminStockDepartment } from "@/lib/admin/types";
import { DEFAULT_STOCK_SEGMENT, sectionTitle, stockCategoryUrl, stockUrl } from "@/lib/stock";

export const metadata: Metadata = { title: "Stock categories" };

type ProductType = { slug: string; label: string };

/**
 * The stock's departments (Men, Women, Boys…) and categories (Jeans, Cotton pants…): add, rename, reorder and delete.
 * A department's listings are at /stock/{slug}; its categories filter them. One with listings cannot be deleted.
 */
export default async function StockCategoriesPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const { departments, categories, catalog } = await getStockSectionsAdmin();
  // Stock sets are in waist sizes, so a category's specifications come from a wholesale product type sold in them.
  const types: ProductType[] = catalog.types.filter((type) => type.size_systems.includes("waist")).map(({ slug, label }) => ({ slug, label }));
  const typeLabel = (slug: string) => types.find((type) => type.slug === slug)?.label ?? slug;
  // An example for the descriptions: "Boys' cotton pants".
  const example = departments.length > 0 && categories.length > 0 ? sectionTitle(departments[departments.length - 1].name, categories[categories.length - 1].name) : null;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/stock", label: "Stock" }}
        title="Stock categories"
        description={`Every stock listing is in a department and a category${example ? `, such as ${example}` : ""}. The stock pages list each department, with its categories as filters.`}
      />

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section aria-labelledby="stock-departments">
          <SectionHeader
            id="stock-departments"
            title="Departments"
            description="Men, Women, Boys… Each is a page of the stock: the men's at /stock, the others at /stock/{web address}. A department appears there once it has a listing shown."
            action={
              <ItemDialog title="Add a department" action={saveStockDepartment} submitLabel="Add department" trigger={<AddButton label="Add department" />}>
                <DepartmentFields />
              </ItemDialog>
            }
          />
          <ul className="overflow-hidden rounded-2xl border bg-white">
            {departments.map((department) => (
              <SectionRow
                key={department.id}
                name={department.name}
                detail={<span className="font-mono">{stockUrl(department.slug)}</span>}
                listings={department.styles}
                listingsHref={`/admin/stock?segment=${department.slug}`}
                edit={
                  <ItemDialog title={`Edit ${department.name}`} action={saveStockDepartment} trigger={<EditButton name={department.name} />}>
                    <input type="hidden" name="id" value={department.id} />
                    <DepartmentFields department={department} />
                  </ItemDialog>
                }
                remove={
                  department.styles === 0 && department.slug !== DEFAULT_STOCK_SEGMENT && departments.length > 1 ? (
                    <DeleteButton
                      iconOnly
                      label={`Delete ${department.name}`}
                      title={`Delete ${department.name}?`}
                      description="The department and its page on the stock pages are removed. It has no listings."
                      onConfirm={deleteStockDepartment.bind(null, department.id)}
                    />
                  ) : null
                }
              />
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">A department with listings can&apos;t be deleted: move its listings first. The men&apos;s stay, as they are /stock itself.</p>
        </section>

        <section aria-labelledby="stock-categories">
          <SectionHeader
            id="stock-categories"
            title="Categories"
            description="Jeans, Cotton pants… Each has the specifications of a product of the wholesale shop: a cotton pants listing has a fit, an inseam and a finish, like chino pants."
            action={
              <ItemDialog title="Add a category" action={saveStockCategory} submitLabel="Add category" trigger={<AddButton label="Add category" />}>
                <CategoryFields types={types} />
              </ItemDialog>
            }
          />
          <ul className="overflow-hidden rounded-2xl border bg-white">
            {categories.map((category) => (
              <SectionRow
                key={category.id}
                name={category.name}
                detail={`Specifications of ${typeLabel(category.product_type).toLowerCase()}`}
                listings={category.styles}
                listingsHref={`/admin/stock?category=${category.slug}`}
                edit={
                  <ItemDialog title={`Edit ${category.name}`} action={saveStockCategory} trigger={<EditButton name={category.name} />}>
                    <input type="hidden" name="id" value={category.id} />
                    <CategoryFields types={types} category={category} />
                  </ItemDialog>
                }
                remove={
                  category.styles === 0 && categories.length > 1 ? (
                    <DeleteButton
                      iconOnly
                      label={`Delete ${category.name}`}
                      title={`Delete ${category.name}?`}
                      description="The category is removed from the stock pages' filters. It has no listings."
                      onConfirm={deleteStockCategory.bind(null, category.id)}
                    />
                  ) : null
                }
              />
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">A category with listings can&apos;t be deleted: move its listings first.</p>
        </section>
      </div>
    </>
  );
}

function SectionHeader({ id, title, description, action }: { id: string; title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 id={id} className="font-heading text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function SectionRow({
  name,
  detail,
  listings,
  listingsHref,
  edit,
  remove,
}: {
  name: string;
  detail: React.ReactNode;
  listings: number;
  listingsHref: string;
  edit: React.ReactNode;
  remove: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      {listings > 0 ? (
        <Link href={listingsHref} className="text-sm text-muted-foreground tabular-nums hover:text-denim-600 hover:underline">
          {listings} listing{listings === 1 ? "" : "s"}
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">No listings</span>
      )}
      <div className="flex shrink-0 items-center">
        {edit}
        {remove}
      </div>
    </li>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <Button size="sm">
      <PlusIcon />
      {label}
    </Button>
  );
}

function EditButton({ name }: { name: string }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${name}`}>
      <PencilIcon />
    </Button>
  );
}

/** The web address is chosen once, when it is added: it is part of the stock pages' addresses. */
function AddressField({ slug, prefix, placeholder, max }: { slug?: string; prefix: string; placeholder: string; max: number }) {
  return slug ? (
    <p className="text-sm text-muted-foreground">
      Web address: <span className="font-mono text-foreground">{prefix}</span>. It stays the same when you rename it, so links keep working.
    </p>
  ) : (
    <TextField
      label="Web address"
      name="slug"
      placeholder={placeholder}
      maxLength={max}
      hint="Optional: leave it empty to make it from the name. It can't be changed later."
    />
  );
}

function OrderField({ sortOrder }: { sortOrder?: number }) {
  return <TextField label="Order" name="sort_order" type="number" min={0} defaultValue={sortOrder} placeholder="At the end" hint="Lower numbers come first in menus and lists." />;
}

function DepartmentFields({ department }: { department?: AdminStockDepartment }) {
  return (
    <>
      <TextField label="Name" name="name" defaultValue={department?.name} placeholder="e.g. Girls" maxLength={60} />
      <AddressField slug={department?.slug} prefix={department ? stockUrl(department.slug) : ""} placeholder="e.g. girls" max={20} />
      <OrderField sortOrder={department?.sort_order} />
    </>
  );
}

function CategoryFields({ types, category }: { types: ProductType[]; category?: AdminStockCategory }) {
  return (
    <>
      <TextField label="Name" name="name" defaultValue={category?.name} placeholder="e.g. Cargo trousers" maxLength={60} />
      <SelectField
        label="Specifications like"
        name="product_type"
        defaultValue={category?.product_type ?? "jeans-pant"}
        options={types.map((type) => ({ value: type.slug, label: type.label }))}
        hint="Its listings get the specifications of this product in the wholesale shop (fit, rise, fabric…). Listings keep what they have when you change it."
      />
      <AddressField slug={category?.slug} prefix={category ? stockCategoryUrl(DEFAULT_STOCK_SEGMENT, category.slug) : ""} placeholder="e.g. cargo-trousers" max={40} />
      <OrderField sortOrder={category?.sort_order} />
    </>
  );
}
