"use client";

import { useState } from "react";
import { Field, TextField } from "@/components/admin/form";
import { Panel } from "@/components/admin/page-parts";
import { PhotoList } from "@/components/admin/photo-list";
import type { UploadFolder } from "@/components/admin/image-field";
import { inputClass } from "@/components/admin/styles";
import { cn } from "@/lib/utils";

/**
 * The first color of a new style or listing with its photos, saved together with it (the API checks the color first,
 * so a taken code saves nothing). Optional: left empty, the color is added on the style's page. The fields are called
 * "color_*" (see firstColor in lib/admin/forms).
 */
export function FirstColorPanel({
  title,
  description,
  folder,
  codePlaceholder,
  codeHint,
  setsInStock = false,
}: {
  title: string;
  description: string;
  folder: UploadFolder;
  codePlaceholder: string;
  codeHint: string;
  /** Stock listings: the sets in stock so far, logged as received. */
  setsInStock?: boolean;
}) {
  const [hex, setHex] = useState("#4a6fa5");

  return (
    <Panel title={title} description={description}>
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Color name" name="color_name" placeholder="e.g. Sky blue" maxLength={80} />
          <TextField label="Code" name="color_code" placeholder={codePlaceholder} maxLength={40} hint={codeHint} />
          <Field label="Swatch color" name="color_hex">
            {(control) => (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hex}
                  onChange={(event) => setHex(event.target.value)}
                  aria-label="Pick the swatch color"
                  className="h-10 w-12 cursor-pointer rounded-lg border bg-white p-1"
                />
                <input {...control} value={hex} onChange={(event) => setHex(event.target.value)} className={cn(inputClass, "font-mono")} maxLength={7} />
              </div>
            )}
          </Field>
          {setsInStock ? (
            <TextField
              label="Sets in stock now"
              name="color_sets_in_stock"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              hint="Logged as received. Change it later with Stock."
            />
          ) : null}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Photos</p>
          <PhotoList name="color_images" folder={folder} initial={[]} columns="grid-cols-2 sm:grid-cols-3" aspect="aspect-[2/3]" />
        </div>
      </div>
    </Panel>
  );
}
