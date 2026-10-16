"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminForm } from "@/components/admin/form";
import { useImageUpload, type UploadFolder } from "@/components/admin/image-field";
import { inputClass } from "@/components/admin/styles";
import { nameToAlt } from "@/lib/admin/prepare-image";
import { cn } from "@/lib/utils";

export type Photo = { path: string; alt: string };

/**
 * Photos with descriptions, in order: upload, describe, move and remove.
 * Sent as JSON in a hidden input called `name`; errors come back as "{name}.{index}.alt" etc.
 */
export function PhotoList({
  name,
  folder,
  initial,
  max = 12,
  columns = "sm:grid-cols-2",
  aspect = "aspect-[4/3]",
}: {
  name: string;
  folder: UploadFolder;
  initial: Photo[];
  max?: number;
  columns?: string;
  aspect?: string;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const pendingAlt = useRef("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { state } = useAdminForm();
  const { busy, error, upload } = useImageUpload(folder, (path) => setPhotos((current) => [...current, { path, alt: pendingAlt.current }]));

  const move = (index: number, offset: number) =>
    setPhotos((current) => {
      const next = [...current];
      const [photo] = next.splice(index, 1);
      next.splice(index + offset, 0, photo);
      return next;
    });

  return (
    <div className="grid gap-4">
      <input type="hidden" name={name} value={JSON.stringify(photos.map(({ path, alt }) => ({ path, alt })))} />
      {photos.length > 0 ? (
        <ul className={cn("grid gap-4", columns)}>
          {photos.map((photo, index) => {
            const photoError = state.fields?.[`${name}.${index}.alt`] ?? state.fields?.[`${name}.${index}.path`];
            return (
              <li key={photo.path} className="overflow-hidden rounded-xl border bg-white">
                <div className={cn("relative bg-cotton-100", aspect)}>
                  <Image src={`/${photo.path}`} alt="" fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                  {index === 0 ? (
                    <span className="absolute top-2 left-2 rounded-full bg-denim-900/85 px-2 py-0.5 text-xs text-white">Main photo</span>
                  ) : null}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <IconButton label="Move earlier" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowLeftIcon />
                    </IconButton>
                    <IconButton label="Move later" disabled={index === photos.length - 1} onClick={() => move(index, 1)}>
                      <ArrowRightIcon />
                    </IconButton>
                    <IconButton label="Remove photo" onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}>
                      <XIcon />
                    </IconButton>
                  </div>
                </div>
                <div className="grid gap-1 p-3">
                  <input
                    value={photo.alt}
                    onChange={(event) => setPhotos((current) => current.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)))}
                    placeholder="What the photo shows"
                    aria-label={`Photo ${index + 1} description`}
                    aria-invalid={photoError ? true : undefined}
                    maxLength={200}
                    className={inputClass}
                  />
                  {photoError ? <p className="text-sm text-destructive">{photoError}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      )}
      {photos.length < max ? (
        <div>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? <Loader2Icon className="animate-spin" /> : <ImagePlusIcon />}
            Add photo
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              pendingAlt.current = nameToAlt(file.name);
              void upload(file);
            }}
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {state.fields?.[name] ? <p className="text-sm text-destructive">{state.fields[name]}</p> : null}
    </div>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full bg-white/90 text-denim-900 shadow-sm hover:bg-white disabled:opacity-40 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
