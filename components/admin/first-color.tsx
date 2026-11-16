"use client";

import { TextField } from "@/components/admin/form";
import { Panel } from "@/components/admin/page-parts";
import { PhotoList } from "@/components/admin/photo-list";
import type { UploadFolder } from "@/components/admin/image-field";

/**
 * The first thing on the add form: the photos of the first color, with its name, saved together with the new style or
 * listing (the API checks the color first, so nothing is half saved). The color's code is made by the API; the code and
 * swatch can be changed in the color's dialog afterwards. A photo and the name are required: the new style or listing
 * is shown as soon as it is created. The fields are called "color_*" (see firstColor in lib/admin/forms).
 */
export function FirstColorPanel({
  description,
  folder,
  setsInStock = false,
}: {
  description: string;
  folder: UploadFolder;
  /** Stock listings: the sets in stock so far, logged as received. */
  setsInStock?: boolean;
}) {
  return (
    <Panel title="Photos" description={description}>
      <div className="grid gap-5">
        <PhotoList name="color_images" folder={folder} initial={[]} columns="grid-cols-2 sm:grid-cols-3" aspect="aspect-[2/3]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Color name" name="color_name" placeholder="e.g. Sky blue" maxLength={80} hint="Shown to buyers with the photos." />
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
      </div>
    </Panel>
  );
}
