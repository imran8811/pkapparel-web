import type { Metadata } from "next";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { SelectField, SwitchField, TextAreaField, TextField } from "@/components/admin/form";
import { ItemDialog } from "@/components/admin/item-dialog";
import { EmptyState, NoAccess, PageHeader, Pill } from "@/components/admin/page-parts";
import { deleteAddon, saveAddon } from "@/lib/admin/actions/commerce";
import { ADDON_PRICING } from "@/lib/admin/labels";
import { can } from "@/lib/admin/permissions";
import { adminApi, getStaff } from "@/lib/admin/session";
import type { AdminAddon } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";
import { isKnit, isProductType, productTypes, typeInfo } from "@/lib/nav";

export const metadata: Metadata = { title: "Add-ons" };

export default async function AddonsPage() {
  const staff = await getStaff();
  if (!can(staff.role, "commerce")) return <NoAccess />;

  const addons = await adminApi<AdminAddon[]>("/v1/admin/addons");

  return (
    <>
      <PageHeader
        title="Add-ons"
        description="Private-label extras buyers can tick at checkout. Priced add-ons count toward the deposit; “price on request” ones are quoted and added to the balance."
        actions={
          <ItemDialog
            title="Add an add-on"
            action={saveAddon}
            submitLabel="Add"
            trigger={
              <Button size="sm">
                <PlusIcon />
                Add an add-on
              </Button>
            }
          >
            <AddonFields />
          </ItemDialog>
        }
      />

      {addons.length === 0 ? (
        <EmptyState title="No add-ons yet">Add labels, hang tags, patches or packaging that buyers can choose at checkout.</EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-white">
          {addons.map((addon) => (
            <li key={addon.id} className="flex items-start gap-3 border-b px-4 py-3.5 last:border-b-0 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{addon.name}</p>
                {addon.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{addon.description}</p> : null}
              </div>
              {addon.product_types.length > 0 ? <Pill tone="neutral">{typesLabel(addon.product_types)}</Pill> : null}
              <Pill tone={addon.pricing === "on_request" ? "neutral" : "blue"}>{priceLabel(addon)}</Pill>
              {addon.is_active ? null : <Pill tone="muted">Hidden</Pill>}
              <div className="flex shrink-0 items-center">
                <ItemDialog
                  title="Edit add-on"
                  action={saveAddon}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit “${addon.name}”`}>
                      <PencilIcon />
                    </Button>
                  }
                >
                  <input type="hidden" name="id" value={addon.id} />
                  <AddonFields addon={addon} />
                </ItemDialog>
                <DeleteButton
                  iconOnly
                  label={`Delete “${addon.name}”`}
                  title="Delete this add-on?"
                  description={`${addon.name}. Orders that include it keep their copy.`}
                  onConfirm={deleteAddon.bind(null, addon.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function priceLabel(addon: AdminAddon): string {
  if (addon.pricing === "on_request" || addon.price_cents === null) return "On request";
  return addon.pricing === "per_piece" ? `${formatMoney(addon.price_cents)} per piece` : `${formatMoney(addon.price_cents)} per order`;
}

/** "Denim and twill" / "Tops" for the usual groups, otherwise the type names. */
function typesLabel(types: string[]): string {
  const knit = productTypes.filter((type) => isKnit(type.slug)).map((type) => type.slug as string);
  const woven = productTypes.filter((type) => !isKnit(type.slug)).map((type) => type.slug as string);
  const same = (group: string[]) => group.length === types.length && group.every((slug) => types.includes(slug));
  if (same(woven)) return "Denim and twill only";
  if (same(knit)) return "Tops only";
  return `${types.map((slug) => (isProductType(slug) ? typeInfo(slug).label : slug)).join(", ")} only`;
}

function AddonFields({ addon }: { addon?: AdminAddon }) {
  return (
    <>
      <TextField label="Name" name="name" defaultValue={addon?.name} maxLength={120} placeholder="e.g. Your woven brand labels" />
      <TextAreaField label="Description" name="description" defaultValue={addon?.description ?? ""} rows={3} maxLength={500} hint="Shown at checkout under the name." />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Pricing" name="pricing" defaultValue={addon?.pricing ?? "on_request"} options={ADDON_PRICING} />
        <TextField
          label="Price (USD)"
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={addon?.price_cents != null ? (addon.price_cents / 100).toFixed(2) : ""}
          hint="Leave empty for “price on request”."
        />
      </div>
      <fieldset className="grid gap-2 border-t pt-4">
        <legend className="text-sm font-medium">Offer with</legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {productTypes.map((type) => (
            <label key={type.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="product_types"
                value={type.slug}
                defaultChecked={addon?.product_types.includes(type.slug) ?? false}
                className="size-4 accent-denim-700"
              />
              {type.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Checkout offers it when the cart has one of these. Tick none to offer it with every product.</p>
      </fieldset>
      <div className="grid items-start gap-4 border-t pt-4 sm:grid-cols-2">
        <TextField label="Order" name="sort_order" type="number" min={0} defaultValue={addon?.sort_order} placeholder="At the end" hint="Lower numbers come first." />
        <div className="sm:pt-9">
          <SwitchField label="Offer at checkout" name="is_active" defaultChecked={addon?.is_active ?? true} />
        </div>
      </div>
    </>
  );
}
