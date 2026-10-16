"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminForm, Field, FormError, SelectField, SubmitButton, SwitchField, TextAreaField, TextField } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Panel } from "@/components/admin/page-parts";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { inputClass } from "@/components/admin/styles";
import { deleteProduct, saveProduct } from "@/lib/admin/actions/products";
import type { AdminProduct, AdminSizeChart } from "@/lib/admin/types";
import { segments, typesFor, type Segment } from "@/lib/nav";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (not in the shop)" },
  { value: "active", label: "In the shop" },
  { value: "archived", label: "Archived (hidden)" },
];

const STRETCH_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "stretch", label: "Stretch" },
  { value: "non-stretch", label: "Rigid (no stretch)" },
];

/** Dollars for an input: 520 → "5.20" */
const dollars = (cents: number | null | undefined) => (cents == null ? "" : (cents / 100).toFixed(2));

export type ShopDefaults = { moq_per_color: number; set_pcs_per_size: number; lead_time_days: number; sample_price_cents: number };

export function ProductForm({ product, charts, defaults }: { product: AdminProduct | null; charts: AdminSizeChart[]; defaults: ShopDefaults }) {
  // A new style opens in its own editor once saved; the "new style" form then starts empty again.
  const [version, setVersion] = useState(0);
  return (
    <ProductEditor
      key={version}
      product={product}
      charts={charts}
      defaults={defaults}
      onSaved={product ? undefined : () => setVersion((current) => current + 1)}
    />
  );
}

function ProductEditor({
  product,
  charts,
  defaults,
  onSaved,
}: {
  product: AdminProduct | null;
  charts: AdminSizeChart[];
  defaults: ShopDefaults;
  onSaved?: () => void;
}) {
  const [segment, setSegment] = useState<Segment>((product?.segment as Segment) ?? "men");
  const types = typesFor(segment);

  return (
    <AdminForm action={saveProduct} onSuccess={onSaved} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {product ? (
        <>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="original_slug" value={product.slug} />
        </>
      ) : null}

      <div className="grid min-w-0 gap-6">
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" name="name" defaultValue={product?.name} placeholder="e.g. Men's slim stretch jeans" fieldClassName="sm:col-span-2" className="h-12 text-lg font-medium" />
            <SelectField
              label="For"
              name="segment"
              value={segment}
              onChange={(event) => setSegment(event.target.value as Segment)}
              options={segments.map((s) => ({ value: s.slug, label: s.label }))}
            />
            <SelectField
              key={segment}
              label="Product type"
              name="product_type"
              defaultValue={types.some((t) => t.slug === product?.product_type) ? product?.product_type : types[0].slug}
              options={types.map((t) => ({ value: t.slug, label: t.label }))}
            />
            <TextField
              label="Web address"
              name="slug"
              defaultValue={product?.slug}
              placeholder="made-from-the-name"
              hint={product ? "Changing it breaks links people saved." : "Leave empty to make it from the name."}
            />
            <TextField label="Style no." name="style_no" defaultValue={product?.style_no ?? ""} placeholder="Optional" maxLength={40} />
          </div>
        </Panel>

        <Panel title="Fabric and fit" description="Shown in the specifications. A color can change these in its own settings.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Fit" name="fit" defaultValue={product?.fit ?? ""} placeholder="e.g. Slim, Relaxed, Wide leg" />
            <TextField label="Fabric" name="fabric" defaultValue={product?.fabric ?? ""} placeholder="e.g. Stretch denim" />
            <TextField label="Composition" name="composition" defaultValue={product?.composition ?? ""} placeholder="e.g. 98% cotton, 2% spandex" />
            <TextField label="Fabric weight" name="fabric_weight" defaultValue={product?.fabric_weight ?? ""} placeholder="e.g. 11 oz or 320 GSM" />
            <SelectField label="Stretch" name="stretch" defaultValue={product?.stretch ?? ""} options={STRETCH_OPTIONS} />
            <TextField label="Wash" name="wash" defaultValue={product?.wash ?? ""} placeholder="e.g. Stone wash" />
            <TextField label="Closure" name="closure" defaultValue={product?.closure ?? ""} placeholder="e.g. Zip fly" />
          </div>
        </Panel>

        <Panel>
          <div className="grid gap-5">
            <RichTextEditor name="description_html" label="Description" defaultValue={product?.description_html ?? ""} folder="products" placeholder="What makes this style good for your buyers…" />
            <TextAreaField
              label="Features"
              name="features"
              defaultValue={product?.features.join("\n") ?? ""}
              rows={4}
              hint="One per line, e.g. “Five-pocket styling”. Shown as tags under the description."
            />
          </div>
        </Panel>

        <Panel title="Sizes">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Sizes"
              name="sizes"
              defaultValue={product?.sizes.join(", ") ?? ""}
              placeholder="30, 32, 34, 36, 38, 40"
              hint="In order, separated by commas."
            />
            <SelectField
              label="Size chart"
              name="size_chart_id"
              defaultValue={product?.size_chart_id ? String(product.size_chart_id) : ""}
              options={[{ value: "", label: "None (sent with the quote)" }, ...charts.map((chart) => ({ value: String(chart.id), label: chart.name }))]}
              hint="Charts are managed under Size charts."
            />
          </div>
        </Panel>

        <Panel title="Packing" description="Used for freight estimates. Leave empty if not known yet.">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Weight per piece (g)" name="piece_weight_g" type="number" min={1} defaultValue={product?.piece_weight_g ?? ""} />
            <TextField label="Pieces per carton" name="pcs_per_carton" type="number" min={1} defaultValue={product?.pcs_per_carton ?? ""} />
            <TextField label="Empty carton (kg)" name="carton_weight" type="number" min={0} step="0.01" defaultValue={product?.carton_weight_g != null ? product.carton_weight_g / 1000 : ""} />
            <TextField label="Carton length (cm)" name="carton_length" type="number" min={1} step="0.1" defaultValue={product?.carton_length_mm != null ? product.carton_length_mm / 10 : ""} />
            <TextField label="Carton width (cm)" name="carton_width" type="number" min={1} step="0.1" defaultValue={product?.carton_width_mm != null ? product.carton_width_mm / 10 : ""} />
            <TextField label="Carton height (cm)" name="carton_height" type="number" min={1} step="0.1" defaultValue={product?.carton_height_mm != null ? product.carton_height_mm / 10 : ""} />
          </div>
        </Panel>

        <Panel title="Search engines" description="Optional. Without these, the name and description are used.">
          <div className="grid gap-4">
            <TextField label="SEO title" name="seo_title" defaultValue={product?.seo_title ?? ""} maxLength={200} />
            <TextAreaField label="SEO description" name="seo_description" defaultValue={product?.seo_description ?? ""} rows={3} maxLength={320} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel>
          <div className="grid gap-4">
            {product ? (
              <SelectField label="Status" name="status" defaultValue={product.status} options={STATUS_OPTIONS} hint="A style needs a color with a photo before it can be shown." />
            ) : (
              <p className="text-sm text-muted-foreground">New styles start as drafts. Add colors and photos, then show the style in the shop.</p>
            )}
            <SwitchField label="Featured" name="is_featured" defaultChecked={product?.is_featured ?? false} hint="Shown first in the shop." />
            <FormError />
            <SubmitButton className="w-full">{product ? "Save style" : "Create style"}</SubmitButton>
          </div>
        </Panel>

        <Panel title="Price">
          <div className="grid gap-4">
            <TextField label="Price per piece (USD)" name="price" inputMode="decimal" defaultValue={dollars(product?.price_cents)} placeholder="5.00" hint="FOB Pakistan. A color can have its own price." />
            <TiersField initial={product?.tiers ?? []} />
          </div>
        </Panel>

        <Panel title="Order rules" description="Leave empty to use the site settings.">
          <div className="grid gap-4">
            <TextField label="Minimum per color (pcs)" name="moq_per_color" type="number" min={1} defaultValue={product?.moq_per_color ?? ""} placeholder={`${defaults.moq_per_color} (default)`} />
            <TextField label="Pieces per size in a set" name="set_pcs_per_size" type="number" min={1} defaultValue={product?.set_pcs_per_size ?? ""} placeholder={`${defaults.set_pcs_per_size} (default)`} />
            <TextField label="Production time (days)" name="lead_time_days" type="number" min={1} defaultValue={product?.lead_time_days ?? ""} placeholder={`${defaults.lead_time_days} (default)`} />
            <TextField label="Sample price (USD)" name="sample_price" inputMode="decimal" defaultValue={dollars(product?.sample_price_cents)} placeholder={`${dollars(defaults.sample_price_cents)} (default)`} />
            <TextField label="Order in lists" name="sort_order" type="number" min={0} defaultValue={product?.sort_order ?? 0} hint="Lower numbers come first." />
          </div>
        </Panel>

        {product ? (
          <DeleteButton
            label="Delete style"
            title={`Delete “${product.name}”?`}
            description="The style, its colors and photos are removed from the shop. Old links to it will show the category page. This cannot be undone."
            onConfirm={() => deleteProduct(product.id, product.slug)}
          />
        ) : null}
      </div>
    </AdminForm>
  );
}

/** Volume prices: from a total quantity of the style, a lower price per piece. */
function TiersField({ initial }: { initial: { min_qty: number; price_cents: number }[] }) {
  const [tiers, setTiers] = useState(initial.map((tier) => ({ min_qty: String(tier.min_qty), price: dollars(tier.price_cents) })));
  const update = (index: number, key: "min_qty" | "price", value: string) =>
    setTiers((current) => current.map((tier, i) => (i === index ? { ...tier, [key]: value } : tier)));

  return (
    <Field label="Volume prices" name="tiers" hint="Optional, e.g. from 500 pcs: 4.80. Counted over all colors of the style.">
      {() => (
        <div className="grid gap-2">
          <input type="hidden" name="tiers" value={JSON.stringify(tiers)} />
          {tiers.map((tier, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={tier.min_qty}
                onChange={(event) => update(index, "min_qty", event.target.value)}
                inputMode="numeric"
                placeholder="From pcs"
                aria-label={`Volume price ${index + 1}: from quantity`}
                className={cn(inputClass, "w-28")}
              />
              <input
                value={tier.price}
                onChange={(event) => update(index, "price", event.target.value)}
                inputMode="decimal"
                placeholder="Price"
                aria-label={`Volume price ${index + 1}: price per piece`}
                className={inputClass}
              />
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove volume price ${index + 1}`} onClick={() => setTiers((current) => current.filter((_, i) => i !== index))}>
                <XIcon />
              </Button>
            </div>
          ))}
          {tiers.length < 5 ? (
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => setTiers((current) => [...current, { min_qty: "", price: "" }])}>
                <PlusIcon /> Add volume price
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </Field>
  );
}
