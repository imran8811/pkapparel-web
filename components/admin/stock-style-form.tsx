"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { AdminForm, FormError, SelectField, SubmitButton, SwitchField, TextAreaField, TextField, useAdminForm } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Panel } from "@/components/admin/page-parts";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { inputClass } from "@/components/admin/styles";
import { deleteStockStyle, saveStockStyle } from "@/lib/admin/actions/stock";
import type { AdminStockStyle, CatalogSpec } from "@/lib/admin/types";
import { formatRupees, stockSegments } from "@/lib/stock";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (not shown)" },
  { value: "active", label: "Shown on the stock pages" },
  { value: "archived", label: "Archived (hidden)" },
];

const STRETCH_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "stretch", label: "Stretch" },
  { value: "non-stretch", label: "Rigid (no stretch)" },
];

/** Waist sizes in inches that a set can have (the API accepts the same). */
const SIZES = Array.from({ length: 48 - 16 + 1 }, (_, index) => String(16 + index));

const MAX_PCS = 24;

/** Rupees for an input: 98000 → "980". Empty for a listing without a price yet (copied from the wholesale shop). */
const rupees = (cents: number | null | undefined) => (cents ? String(Math.round(cents / 100)) : "");

type StockStyleFormProps = { style: AdminStockStyle | null; specs: CatalogSpec[] };

export function StockStyleForm(props: StockStyleFormProps) {
  // A new style opens in its own editor once saved; the "new style" form then starts empty again.
  const [version, setVersion] = useState(0);
  return <StockStyleEditor key={version} {...props} onSaved={props.style ? undefined : () => setVersion((current) => current + 1)} />;
}

function StockStyleEditor({ style, specs, onSaved }: StockStyleFormProps & { onSaved?: () => void }) {
  // The set and the price per piece, so the price panel shows what one set costs.
  const [pieces, setPieces] = useState<Record<string, number>>(() => Object.fromEntries((style?.set_sizes ?? []).map(({ size, pcs }) => [size, pcs])));
  const [price, setPrice] = useState(rupees(style?.piece_price_cents));
  const setTotal = Object.values(pieces).reduce((sum, pcs) => sum + pcs, 0);

  return (
    <AdminForm action={saveStockStyle} onSuccess={onSaved} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {style ? (
        <>
          <input type="hidden" name="id" value={style.id} />
          <input type="hidden" name="original_slug" value={style.slug} />
        </>
      ) : null}

      <div className="grid min-w-0 gap-6">
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" name="name" defaultValue={style?.name} placeholder="e.g. Men's slim stretch jeans" fieldClassName="sm:col-span-2" className="h-12 text-lg font-medium" />
            <SelectField label="For" name="segment" defaultValue={style?.segment ?? "men"} options={stockSegments.map((s) => ({ value: s.slug, label: s.title }))} />
            <TextField label="Style no." name="style_no" defaultValue={style?.style_no ?? ""} placeholder="Optional" maxLength={40} />
            <TextField
              label="Web address"
              name="slug"
              defaultValue={style?.slug}
              placeholder="made-from-the-name"
              hint={style ? "Changing it breaks links people saved (a shown style's old address redirects)." : "Leave empty to make it from the name."}
              fieldClassName="sm:col-span-2"
            />
          </div>
        </Panel>

        <Panel title="The set" description="Stock is sold by set only. Tick the waist sizes in one set and the pieces of each size.">
          <SetSizesField pieces={pieces} setPieces={setPieces} />
        </Panel>

        <Panel title="Specifications" description="Shown on the style's page in this order. Pick a suggestion or type your own.">
          <div className="grid gap-4 sm:grid-cols-2">
            {specs.map((spec) =>
              spec.key === "stretch" ? (
                <SelectField key={spec.key} label={spec.label} name="spec_stretch" defaultValue={style?.specs.stretch ?? ""} options={STRETCH_OPTIONS} />
              ) : (
                <SpecField key={spec.key} spec={spec} defaultValue={style?.specs[spec.key] ?? ""} />
              ),
            )}
          </div>
        </Panel>

        <Panel>
          <RichTextEditor name="description_html" label="Description" defaultValue={style?.description_html ?? ""} folder="stock" placeholder="What shopkeepers should know about this style…" />
        </Panel>

        <Panel title="Search engines" description="Optional. Without these, the name and description are used.">
          <div className="grid gap-4">
            <TextField label="SEO title" name="seo_title" defaultValue={style?.seo_title ?? ""} maxLength={200} />
            <TextAreaField label="SEO description" name="seo_description" defaultValue={style?.seo_description ?? ""} rows={3} maxLength={320} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel>
          <div className="grid gap-4">
            {style ? (
              <SelectField label="Status" name="status" defaultValue={style.status} options={STATUS_OPTIONS} hint="A listing needs its color with a photo before it can be shown." />
            ) : (
              <p className="text-sm text-muted-foreground">New listings start as drafts. Add the color, its photos and stock, then show the listing.</p>
            )}
            <SwitchField label="Featured" name="is_featured" defaultChecked={style?.is_featured ?? false} hint="Shown first." />
            <FormError />
            <SubmitButton className="w-full">{style ? "Save style" : "Create style"}</SubmitButton>
          </div>
        </Panel>

        <Panel title="Price">
          <TextField
            label="Price per piece (Rs)"
            name="piece_price"
            inputMode="numeric"
            defaultValue={rupees(style?.piece_price_cents)}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="980"
            hint={setPriceHint(price, setTotal)}
          />
        </Panel>

        <Panel>
          <TextField label="Order in lists" name="sort_order" type="number" min={0} defaultValue={style?.sort_order ?? 0} hint="Lower numbers come first." />
        </Panel>

        {style ? (
          <DeleteButton
            label="Delete style"
            title={`Delete “${style.name}”?`}
            description="The listing, its color, photos and stock history are removed. This cannot be undone."
            onConfirm={() => deleteStockStyle(style.id, style.slug)}
          />
        ) : null}
      </div>
    </AdminForm>
  );
}

/** A spec with suggested values (a text field with a list, so other text is allowed too). */
function SpecField({ spec, defaultValue }: { spec: CatalogSpec; defaultValue: string }) {
  const listId = `stock-suggestions-${spec.key}`;
  return (
    <>
      <TextField
        label={spec.label}
        name={`spec_${spec.key}`}
        defaultValue={defaultValue}
        list={spec.suggestions.length > 0 ? listId : undefined}
        placeholder={spec.suggestions.length > 0 ? `e.g. ${spec.suggestions.slice(0, 2).join(", ")}` : undefined}
        maxLength={spec.max}
        autoComplete="off"
      />
      {spec.suggestions.length > 0 ? (
        <datalist id={listId}>
          {spec.suggestions.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}

/** "One set: 12 pieces × Rs 980 = Rs 11,760." as the price and the set are typed. */
function setPriceHint(price: string, pieces: number): string {
  const typed = Number(price.replace(/^rs\.?/i, "").replace(/[,\s]/g, ""));
  if (price.trim() === "" || !Number.isFinite(typed) || typed <= 0) return "Without a price the listing shows “Price on request”. A set costs its pieces times this price.";
  if (pieces === 0) return "Choose the sizes of the set to see what one set costs.";
  const piece = Math.round(typed * 100);
  return `One set: ${pieces} pieces × ${formatRupees(piece)} = ${formatRupees(piece * pieces)}.`;
}

/** Waist sizes of the set with the pieces of each; sent as JSON in the hidden "set_sizes" field. */
function SetSizesField({ pieces, setPieces }: { pieces: Record<string, number>; setPieces: Dispatch<SetStateAction<Record<string, number>>> }) {
  const { state } = useAdminForm();
  const error = state.fields?.set_sizes;
  const chosen = SIZES.filter((size) => pieces[size] !== undefined);
  const total = chosen.reduce((sum, size) => sum + pieces[size], 0);

  const toggle = (size: string) =>
    setPieces((current) => {
      const next = { ...current };
      if (next[size] === undefined) next[size] = 1;
      else delete next[size];
      return next;
    });

  return (
    <fieldset className="grid gap-4" aria-describedby="set-sizes-note">
      <legend className="sr-only">Sizes in one set</legend>
      <input type="hidden" name="set_sizes" value={JSON.stringify(chosen.map((size) => ({ size, pcs: pieces[size] })))} />
      <div className="flex flex-wrap gap-1.5">
        {SIZES.map((size) => (
          <label key={size} className="cursor-pointer">
            <input type="checkbox" className="peer sr-only" checked={pieces[size] !== undefined} onChange={() => toggle(size)} />
            <span className="inline-flex h-9 min-w-11 items-center justify-center rounded-lg border border-input bg-white px-2.5 font-mono text-sm transition-colors peer-checked:border-denim-900 peer-checked:bg-denim-900 peer-checked:text-white peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 hover:border-denim-300">
              {size}
            </span>
          </label>
        ))}
      </div>
      {chosen.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {chosen.map((size) => (
            <label key={size} className="grid gap-1 rounded-xl bg-cotton-50 p-2 text-center">
              <span className="font-mono text-xs text-muted-foreground">{size}</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_PCS}
                value={pieces[size]}
                onChange={(event) =>
                  setPieces((current) => ({ ...current, [size]: Math.max(1, Math.min(MAX_PCS, Math.floor(Number(event.target.value)) || 1)) }))
                }
                aria-label={`Pieces of size ${size} in one set`}
                className={cn(inputClass, "h-9 text-center tabular-nums")}
              />
            </label>
          ))}
        </div>
      ) : null}
      <p id="set-sizes-note" className={cn("leading-relaxed", error ? "text-sm text-destructive" : "text-xs text-muted-foreground")}>
        {error ??
          (chosen.length > 0
            ? `One set: ${total} pieces in ${chosen.length} size${chosen.length === 1 ? "" : "s"}.`
            : "Boys' sizes usually run 16 to 38, men's 28 and up.")}
      </p>
    </fieldset>
  );
}
