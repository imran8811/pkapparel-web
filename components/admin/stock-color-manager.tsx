"use client";

import Image from "next/image";
import { ArrowUpDownIcon, ImageIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField, SwitchField, TextAreaField, TextField } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ItemDialog } from "@/components/admin/item-dialog";
import { Panel, Pill } from "@/components/admin/page-parts";
import { PhotoList } from "@/components/admin/photo-list";
import { inputClass } from "@/components/admin/styles";
import { changeStock, deleteStockColor, saveStockColor } from "@/lib/admin/actions/stock";
import type { AdminStockColor, AdminStockStyle } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const REASON_OPTIONS = [
  { value: "received", label: "Received (add sets)" },
  { value: "returned", label: "Returned by a buyer (add sets)" },
  { value: "sold", label: "Sold (take sets out)" },
  { value: "damaged", label: "Damaged or lost (take sets out)" },
  { value: "correction", label: "Count correction (sets counted)" },
];

/** The color of a stock listing (one each: a color is a listing of its own): code, swatch, photos, and the sets in stock with every change logged. */
export function StockColorManager({ style }: { style: AdminStockStyle }) {
  const action = saveStockColor.bind(null, style.id, style.slug);

  return (
    <Panel
      title="Color, photos and stock"
      description={`Each listing is one color. Stock is counted in sets of ${style.set_pieces} pieces. Every change is logged with its reason, under Stock history below.`}
    >
      {style.colors.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">No color yet. Add it with its photos and the sets in stock.</p> : null}
      <ul className="grid gap-3">
        {style.colors.map((color) => (
          <li key={color.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-3">
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
              </p>
            </div>
            <p className="text-right">
              <span className={cn("block font-heading text-xl font-semibold tabular-nums", color.sets_in_stock === 0 && "text-muted-foreground")}>
                {color.sets_in_stock}
              </span>
              <span className="text-xs text-muted-foreground">set{color.sets_in_stock === 1 ? "" : "s"} in stock</span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {color.is_active ? null : <Pill tone="neutral">Hidden</Pill>}
              {color.images.length === 0 ? <Pill tone="orange">No photo</Pill> : null}
              {color.is_active && color.sets_in_stock === 0 ? <Pill tone="muted">Sold out</Pill> : null}
            </div>
            <div className="flex shrink-0">
              <ItemDialog
                title={`Change the stock of ${color.name}`}
                description={`Now ${color.sets_in_stock} set${color.sets_in_stock === 1 ? "" : "s"} in stock.`}
                action={changeStock.bind(null, color.id, style.slug)}
                submitLabel="Save change"
                trigger={
                  <Button variant="outline" size="sm" aria-label={`Change the stock of ${color.name}`}>
                    <ArrowUpDownIcon /> Stock
                  </Button>
                }
              >
                <StockChangeFields />
              </ItemDialog>
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
                <ColorFields color={color} />
              </ItemDialog>
              <DeleteButton
                iconOnly
                label={`Delete ${color.name}`}
                title={`Delete ${color.name}?`}
                description="The color, its photos and its stock history are removed from the style."
                onConfirm={() => deleteStockColor(color.id, style.slug)}
              />
            </div>
          </li>
        ))}
      </ul>
      {/* One color per listing: another color is a listing of its own. */}
      {style.colors.length === 0 ? (
        <div className="mt-4">
          <ItemDialog
            title="Add the color"
            action={action}
            submitLabel="Add color"
            trigger={
              <Button size="sm">
                <PlusIcon /> Add the color
              </Button>
            }
          >
            <ColorFields color={null} />
          </ItemDialog>
        </div>
      ) : null}
    </Panel>
  );
}

function StockChangeFields() {
  const [reason, setReason] = useState("received");
  return (
    <>
      <SelectField label="What happened" name="reason" value={reason} onChange={(event) => setReason(event.target.value)} options={REASON_OPTIONS} />
      <TextField
        label={reason === "correction" ? "Sets counted" : "Sets"}
        name="sets"
        type="number"
        min={0}
        inputMode="numeric"
        hint={reason === "correction" ? "The number of sets actually in stock. The difference is logged." : undefined}
      />
      <TextAreaField label="Note" name="note" rows={2} maxLength={500} placeholder="Optional, e.g. the buyer's name or a cargo receipt" />
    </>
  );
}

function ColorFields({ color }: { color: AdminStockColor | null }) {
  const [hex, setHex] = useState(color?.hex ?? "#4a6fa5");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Color name" name="name" defaultValue={color?.name} placeholder="e.g. Mid blue" maxLength={80} />
        <TextField label="Code" name="code" defaultValue={color?.code} placeholder="e.g. ST-2051" maxLength={40} hint="Letters, digits and dashes. Unique in the stock." />
        <div className="grid gap-1.5">
          <label htmlFor="field-hex" className="text-sm font-medium">
            Swatch color
          </label>
          <div className="flex items-center gap-2">
            <input type="color" value={hex} onChange={(event) => setHex(event.target.value)} aria-label="Pick the swatch color" className="h-10 w-12 cursor-pointer rounded-lg border bg-white p-1" />
            <input id="field-hex" name="hex" value={hex} onChange={(event) => setHex(event.target.value)} className={cn(inputClass, "font-mono")} maxLength={7} />
          </div>
        </div>
        {color ? null : (
          <TextField label="Sets in stock now" name="sets_in_stock" type="number" min={0} inputMode="numeric" placeholder="0" hint="Logged as received. Change it later with Stock." />
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Photos</p>
        <PhotoList name="images" folder="stock" initial={color?.images.map(({ path, alt }) => ({ path, alt })) ?? []} columns="grid-cols-2 sm:grid-cols-3" aspect="aspect-[2/3]" />
      </div>

      <div className="grid items-start gap-4 border-t pt-4 sm:grid-cols-2">
        <TextField label="Order" name="sort_order" type="number" min={0} defaultValue={color?.sort_order} placeholder="At the end" />
        <div className="sm:pt-9">
          <SwitchField label="Show on the stock pages" name="is_active" defaultChecked={color?.is_active ?? true} />
        </div>
      </div>
    </>
  );
}
