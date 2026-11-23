import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckboxGroup } from "@/components/admin/checkbox-group";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField, TextField } from "@/components/admin/form";
import { ItemDialog } from "@/components/admin/item-dialog";
import { NoAccess, PageHeader } from "@/components/admin/page-parts";
import { deleteShopCategory, deleteShopDepartment, saveShopCategory, saveShopDepartment } from "@/lib/admin/actions/shop-sections";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminShopCategory, AdminShopDepartment, CatalogDefinitions, CatalogType } from "@/lib/admin/types";
import { inSentence, possessive } from "@/lib/format";
import { shopUrl } from "@/lib/nav";

export const metadata: Metadata = { title: "Shop categories" };

/**
 * The wholesale shop's departments (Men, Women…) and categories (Jeans pants, T-shirts…): add, rename, reorder and
 * delete (owner request 2026-11-23). Each department has a page, and one for each category it sells; their texts are
 * under Category texts. One with styles cannot be deleted.
 */
export default async function ShopCategoriesPage() {
  const staff = await getStaff();
  if (!can(staff.role, "content")) return <NoAccess />;

  const [departments, categories, catalog] = await Promise.all([
    adminApi<AdminShopDepartment[]>("/v1/admin/shop/departments"),
    adminApi<AdminShopCategory[]>("/v1/admin/shop/categories"),
    adminApi<CatalogDefinitions>("/v1/admin/product-types"),
  ]);
  const kinds = catalog.types;
  const kindLabel = (slug: string) => kinds.find((kind) => kind.slug === slug)?.label ?? slug;
  const departmentNames = (slugs: string[]) => slugs.map((slug) => departments.find((department) => department.slug === slug)?.name ?? slug).join(", ");

  return (
    <>
      <PageHeader
        title="Shop categories"
        description="The wholesale shop's departments and the categories each one sells, such as Men's jeans pants. They make the shop's menus, filters and pages."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/shop-texts">Page texts</Link>
          </Button>
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section aria-labelledby="shop-departments">
          <SectionHeader
            id="shop-departments"
            title="Departments"
            description="Men, Women… Each has a page at /wholesale-shop/{web address}, and a page for each category it sells. A new page starts with a short text: write a better one under Category texts."
            action={
              <ItemDialog title="Add a department" action={saveShopDepartment} submitLabel="Add department" trigger={<AddButton label="Add department" />}>
                <DepartmentFields />
              </ItemDialog>
            }
          />
          <ul className="overflow-hidden rounded-2xl border bg-white">
            {departments.map((department) => (
              <SectionRow
                key={department.id}
                name={department.name}
                detail={<span className="font-mono">{shopUrl(department.slug)}</span>}
                styles={department.styles}
                edit={
                  <ItemDialog title={`Edit ${department.name}`} action={saveShopDepartment} trigger={<EditButton name={department.name} />}>
                    <input type="hidden" name="id" value={department.id} />
                    <DepartmentFields department={department} />
                  </ItemDialog>
                }
                remove={
                  department.styles === 0 && departments.length > 1 ? (
                    <DeleteButton
                      iconOnly
                      label={`Delete ${department.name}`}
                      title={`Delete ${department.name}?`}
                      description="Its page and its category pages are removed from the shop, with their texts. Their addresses then lead to the shop. It has no styles."
                      onConfirm={deleteShopDepartment.bind(null, department.id)}
                    />
                  ) : null
                }
              />
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">A department with styles can&apos;t be deleted: move its styles first. Nor can one that is the only department of a category.</p>
        </section>

        <section aria-labelledby="shop-categories">
          <SectionHeader
            id="shop-categories"
            title="Categories"
            description="Jeans pants, T-shirts… Each is sold in the departments you tick, and its styles have the specifications and sizes of a kind of product: cargo shorts could have those of jeans shorts."
            action={
              <ItemDialog title="Add a category" action={saveShopCategory} submitLabel="Add category" trigger={<AddButton label="Add category" />}>
                <CategoryFields kinds={kinds} departments={departments} />
              </ItemDialog>
            }
          />
          <ul className="overflow-hidden rounded-2xl border bg-white">
            {categories.map((category) => (
              <SectionRow
                key={category.id}
                name={category.name}
                detail={`${departmentNames(category.departments)} · Like ${inSentence(kindLabel(category.kind))}`}
                styles={category.styles}
                edit={
                  <ItemDialog title={`Edit ${category.name}`} action={saveShopCategory} trigger={<EditButton name={category.name} />}>
                    <input type="hidden" name="id" value={category.id} />
                    <CategoryFields kinds={kinds} departments={departments} category={category} />
                  </ItemDialog>
                }
                remove={
                  category.styles === 0 && categories.length > 1 ? (
                    <DeleteButton
                      iconOnly
                      label={`Delete ${category.name}`}
                      title={`Delete ${category.name}?`}
                      description="Its pages are removed from the shop, with their texts. Their addresses then lead to the departments' pages. It has no styles."
                      onConfirm={deleteShopCategory.bind(null, category.id)}
                    />
                  ) : null
                }
              />
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            A category with styles can&apos;t be deleted: move its styles first. Add-ons for a new category are chosen under Add-ons.
          </p>
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

function SectionRow({ name, detail, styles, edit, remove }: { name: string; detail: React.ReactNode; styles: number; edit: React.ReactNode; remove: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">{styles > 0 ? `${styles} style${styles === 1 ? "" : "s"}` : "No styles"}</span>
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

/** The web address is chosen once, when it is added: it is part of the shop's addresses. */
function AddressField({ slug, address, placeholder, max }: { slug?: string; address: string; placeholder: string; max: number }) {
  return slug ? (
    <p className="text-sm text-muted-foreground">
      Web address: <span className="font-mono text-foreground">{address}</span>. It stays the same when you rename it, so links and Google rankings keep working.
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

function DepartmentFields({ department }: { department?: AdminShopDepartment }) {
  // Left empty while it is the one made from the name, so it follows a new name.
  const typed = department && department.possessive !== possessive(department.name) ? department.possessive : "";
  return (
    <>
      <TextField label="Name" name="name" defaultValue={department?.name} placeholder="e.g. Boys" maxLength={60} />
      <TextField
        label="Name in titles"
        name="possessive"
        defaultValue={typed}
        placeholder={department ? possessive(department.name) : "e.g. Boys'"}
        maxLength={60}
        hint="As in “Men's jeans pants”. Leave it empty to make it from the name."
      />
      <AddressField slug={department?.slug} address={department ? shopUrl(department.slug) : ""} placeholder="e.g. boys" max={20} />
      <OrderField sortOrder={department?.sort_order} />
    </>
  );
}

function CategoryFields({ kinds, departments, category }: { kinds: CatalogType[]; departments: AdminShopDepartment[]; category?: AdminShopCategory }) {
  return (
    <>
      <TextField label="Name" name="name" defaultValue={category?.name} placeholder="e.g. Cargo shorts" maxLength={60} />
      <CheckboxGroup
        legend="Sold in"
        name="departments"
        options={departments.map((department) => ({ value: department.slug, label: department.name }))}
        checked={category?.departments ?? (departments[0] ? [departments[0].slug] : [])}
        hint="Each ticked department gets a page for it, and styles of it."
      />
      <SelectField
        label="Specifications and sizes like"
        name="kind"
        defaultValue={category?.kind ?? kinds[0]?.slug}
        options={kinds.map((kind) => ({ value: kind.slug, label: kind.label }))}
        hint="Its styles get the specifications (fit, fabric, wash…) and the size systems of this kind of product. Styles keep what they have when you change it."
      />
      <AddressField
        slug={category?.slug}
        address={category ? `/wholesale-shop/…/${category.slug}` : ""}
        placeholder="e.g. cargo-shorts"
        max={40}
      />
      <OrderField sortOrder={category?.sort_order} />
    </>
  );
}
