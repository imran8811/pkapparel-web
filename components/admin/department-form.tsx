"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminForm, FormError, SubmitButton, SwitchField, TextAreaField, TextField, useAdminForm } from "@/components/admin/form";
import { inputClass } from "@/components/admin/styles";
import { useImageUpload } from "@/components/admin/image-field";
import { Panel } from "@/components/admin/page-parts";
import { saveDepartment } from "@/lib/admin/actions/factory";
import { nameToAlt } from "@/lib/admin/prepare-image";
import type { Department } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const MAX_STATS = 6;
const MAX_PHOTOS = 12;

export function DepartmentForm({ department }: { department: Department }) {
  return (
    <AdminForm action={saveDepartment.bind(null, department.slug)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid min-w-0 gap-6">
        <Panel>
          <div className="grid gap-4">
            <TextField label="Name" name="name" defaultValue={department.name} maxLength={120} />
            <TextAreaField label="Description" name="summary" defaultValue={department.summary} rows={5} maxLength={2000} />
          </div>
        </Panel>
        <Panel title="Photos" description="The first photo is the main one. Use the arrows to change the order.">
          <PhotosEditor initial={department.images} />
        </Panel>
        <Panel title="Numbers" description="Optional facts shown next to the description, e.g. “Monthly capacity — 30,000+ pcs”. Only add confirmed numbers.">
          <StatsEditor initial={department.stats} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <Panel>
          <div className="grid gap-4">
            <SwitchField label="Show on the website" name="is_published" defaultChecked={department.is_published} />
            <TextField label="Order" name="sort_order" type="number" min={0} defaultValue={department.sort_order} hint="Lower numbers come first." />
            <FormError />
            <SubmitButton className="w-full">Save department</SubmitButton>
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}

function StatsEditor({ initial }: { initial: Department["stats"] }) {
  const [stats, setStats] = useState(initial);
  const { state } = useAdminForm();

  const update = (index: number, key: "label" | "value", value: string) =>
    setStats((current) => current.map((stat, i) => (i === index ? { ...stat, [key]: value } : stat)));

  return (
    <div className="grid gap-3">
      <input type="hidden" name="stats" value={JSON.stringify(stats)} />
      {stats.length === 0 ? <p className="text-sm text-muted-foreground">No numbers yet.</p> : null}
      {stats.map((stat, index) => {
        const labelError = state.fields?.[`stats.${index}.label`];
        const valueError = state.fields?.[`stats.${index}.value`];
        return (
          <div key={index} className="grid gap-1">
            <div className="flex gap-2">
              <input
                value={stat.label}
                onChange={(event) => update(index, "label", event.target.value)}
                placeholder="Label, e.g. Monthly capacity"
                aria-label={`Number ${index + 1} label`}
                aria-invalid={labelError ? true : undefined}
                maxLength={40}
                className={inputClass}
              />
              <input
                value={stat.value}
                onChange={(event) => update(index, "value", event.target.value)}
                placeholder="Value, e.g. 30,000+ pcs"
                aria-label={`Number ${index + 1} value`}
                aria-invalid={valueError ? true : undefined}
                maxLength={40}
                className={cn(inputClass, "max-w-48")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-1 shrink-0"
                aria-label={`Remove number ${index + 1}`}
                onClick={() => setStats((current) => current.filter((_, i) => i !== index))}
              >
                <XIcon />
              </Button>
            </div>
            {labelError || valueError ? <p className="text-sm text-destructive">{labelError ?? valueError}</p> : null}
          </div>
        );
      })}
      {stats.length < MAX_STATS ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setStats((current) => [...current, { label: "", value: "" }])}>
            <PlusIcon />
            Add number
          </Button>
        </div>
      ) : null}
      {state.fields?.stats ? <p className="text-sm text-destructive">{state.fields.stats}</p> : null}
    </div>
  );
}

function PhotosEditor({ initial }: { initial: Department["images"] }) {
  const [photos, setPhotos] = useState(initial);
  const pendingAlt = useRef("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { state } = useAdminForm();
  const { busy, error, upload } = useImageUpload("factory", (path) =>
    setPhotos((current) => [...current, { path, alt: pendingAlt.current }]),
  );

  const move = (index: number, offset: number) =>
    setPhotos((current) => {
      const next = [...current];
      const [photo] = next.splice(index, 1);
      next.splice(index + offset, 0, photo);
      return next;
    });

  return (
    <div className="grid gap-4">
      <input type="hidden" name="images" value={JSON.stringify(photos)} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {photos.map((photo, index) => {
          const altError = state.fields?.[`images.${index}.alt`] ?? state.fields?.[`images.${index}.path`];
          return (
            <li key={photo.path} className="overflow-hidden rounded-xl border bg-white">
              <div className="relative aspect-[4/3] bg-cotton-100">
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
                  onChange={(event) =>
                    setPhotos((current) => current.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)))
                  }
                  placeholder="What the photo shows"
                  aria-label={`Photo ${index + 1} description`}
                  aria-invalid={altError ? true : undefined}
                  maxLength={200}
                  className={inputClass}
                />
                {altError ? <p className="text-sm text-destructive">{altError}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
      {photos.length < MAX_PHOTOS ? (
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
      {state.fields?.images ? <p className="text-sm text-destructive">{state.fields.images}</p> : null}
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
