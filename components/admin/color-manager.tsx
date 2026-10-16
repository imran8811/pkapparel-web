"use client";

import Image from "next/image";
import { ImageIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField, SwitchField, TextField } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ItemDialog } from "@/components/admin/item-dialog";
import { Panel, Pill } from "@/components/admin/page-parts";
import { PhotoList } from "@/components/admin/photo-list";
import { inputClass } from "@/components/admin/styles";
import { deleteColor, saveColor } from "@/lib/admin/actions/products";
import type { AdminColor, AdminProduct } from "@/lib/admin/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The colors of a style: each with a code, swatch, optional own price and fabric details, and photos. */
export function ColorManager({ product }: { product: AdminProduct }) {
  const action = saveColor.bind(null, product.id, product.slug);

  return (
    <Panel
      title="Colors"
      description="Each color has its own code (shown to buyers) and photos. Old article numbers stay as the codes of imported colors, so old links keep working."
    >
      {product.colors.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">No colors yet. Add the first one with its photos.</p> : null}
      <ul className="grid gap-3">
        {product.colors.map((color) => (
          <li key={color.id} className="flex items-center gap-4 rounded-xl border bg-white p-3">
            <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
              {color.images[0] ? (
                <Image src={`/${color.images[0].path}`} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <ImageIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
              )}
            </div>
            <span className="size-5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color.hex ?? "#c8d8f4" }} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {color.name} <span className="font-mono text-xs text-muted-foreground">{color.code}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {color.images.length} photo{color.images.length === 1 ? "" : "s"}
                {color.price_cents !== null ? ` · ${formatMoney(color.price_cents)} per piece` : ""}
                {Object.keys(color.spec_overrides).length > 0 ? " · own fabric details" : ""}
              </p>
            </div>
            {color.is_active ? null : <Pill tone="neutral">Hidden</Pill>}
            {color.images.length === 0 ? <Pill tone="orange">No photo</Pill> : null}
            <div className="flex shrink-0">
              <ItemDialog
                title={`Edit ${color.name}`}
                action={action}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${color.name}`}>
                    <PencilIcon />
                  </Button>
                }
              >
                <input type="hidden" name="id" value={color.id} />
                <ColorFields color={color} product={product} />
              </ItemDialog>
              <DeleteButton
                iconOnly
                label={`Delete ${color.name}`}
                title={`Delete ${color.name}?`}
                description="The color and its photos are removed from the style."
                onConfirm={() => deleteColor(color.id, product.slug)}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <ItemDialog
          title="Add a color"
          action={action}
          submitLabel="Add color"
          trigger={
            <Button size="sm" variant="outline">
              <PlusIcon /> Add color
            </Button>
          }
        >
          <ColorFields color={null} product={product} />
        </ItemDialog>
      </div>
    </Panel>
  );
}

function ColorFields({ color, product }: { color: AdminColor | null; product: AdminProduct }) {
  const [hex, setHex] = useState(color?.hex ?? "#4a6fa5");
  const [showSpecs, setShowSpecs] = useState(Object.keys(color?.spec_overrides ?? {}).length > 0);
  const specs = color?.spec_overrides ?? {};

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Color name" name="name" defaultValue={color?.name} placeholder="e.g. Sky blue" maxLength={80} />
        <TextField label="Code" name="code" defaultValue={color?.code} placeholder="e.g. 1051" maxLength={40} hint="Letters, digits and dashes. Unique in the shop." />
        <div className="grid gap-1.5">
          <label htmlFor="field-hex" className="text-sm font-medium">
            Swatch color
          </label>
          <div className="flex items-center gap-2">
            <input type="color" value={hex} onChange={(event) => setHex(event.target.value)} aria-label="Pick the swatch color" className="h-10 w-12 cursor-pointer rounded-lg border bg-white p-1" />
            <input id="field-hex" name="hex" value={hex} onChange={(event) => setHex(event.target.value)} className={cn(inputClass, "font-mono")} maxLength={7} />
          </div>
        </div>
        <TextField
          label="Own price (USD)"
          name="price"
          inputMode="decimal"
          defaultValue={color?.price_cents != null ? (color.price_cents / 100).toFixed(2) : ""}
          placeholder={`${(product.price_cents / 100).toFixed(2)} (style price)`}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Photos</p>
        <PhotoList name="images" folder="products" initial={color?.images.map(({ path, alt }) => ({ path, alt })) ?? []} columns="grid-cols-2 sm:grid-cols-3" aspect="aspect-[2/3]" />
      </div>

      {showSpecs ? (
        <div className="grid gap-4 rounded-xl border bg-cotton-50/60 p-4 sm:grid-cols-2">
          <p className="text-sm text-muted-foreground sm:col-span-2">Only fill in what differs from the style. Empty fields use the style&apos;s details.</p>
          <TextField label="Fabric" name="spec_fabric" defaultValue={specs.fabric ?? ""} placeholder={product.fabric ?? ""} />
          <TextField label="Composition" name="spec_composition" defaultValue={specs.composition ?? ""} placeholder={product.composition ?? ""} />
          <TextField label="Fabric weight" name="spec_fabric_weight" defaultValue={specs.fabric_weight ?? ""} placeholder={product.fabric_weight ?? ""} />
          <SelectField
            label="Stretch"
            name="spec_stretch"
            defaultValue={specs.stretch ?? ""}
            options={[
              { value: "", label: "Same as the style" },
              { value: "stretch", label: "Stretch" },
              { value: "non-stretch", label: "Rigid (no stretch)" },
            ]}
          />
          <TextField label="Wash" name="spec_wash" defaultValue={specs.wash ?? ""} placeholder={product.wash ?? ""} />
          <TextField label="Closure" name="spec_closure" defaultValue={specs.closure ?? ""} placeholder={product.closure ?? ""} />
        </div>
      ) : (
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowSpecs(true)}>
            This color has different fabric details
          </Button>
        </div>
      )}

      <div className="grid items-start gap-4 border-t pt-4 sm:grid-cols-2">
        <TextField label="Order" name="sort_order" type="number" min={0} defaultValue={color?.sort_order} placeholder="At the end" />
        <div className="sm:pt-9">
          <SwitchField label="Show in the shop" name="is_active" defaultChecked={color?.is_active ?? true} />
        </div>
      </div>
    </>
  );
}
