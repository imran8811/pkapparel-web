"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminForm } from "@/components/admin/form";
import { uploadImage } from "@/lib/admin/actions/uploads";
import { prepareImage } from "@/lib/admin/prepare-image";
import { cn } from "@/lib/utils";

export type UploadFolder = "blog" | "pages" | "products" | "factory" | "certificates";

/** Uploads one image right away and keeps its path in a hidden input called `name`. */
export function ImageField({
  name,
  folder,
  label,
  hint,
  defaultValue,
  previewClassName = "aspect-[4/3] w-44",
}: {
  name: string;
  folder: UploadFolder;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  previewClassName?: string;
}) {
  const [path, setPath] = useState(defaultValue ?? "");
  const { busy, error, upload } = useImageUpload(folder, (uploaded) => setPath(uploaded));
  const fileInput = useRef<HTMLInputElement>(null);
  const { state } = useAdminForm();
  const message = error ?? state.fields?.[name];

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-start gap-4">
        <div className={cn("relative overflow-hidden rounded-lg border bg-cotton-100", previewClassName)}>
          {path ? (
            <Image src={`/${path}`} alt="" fill sizes="176px" className="object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <ImageIcon className="size-6" />
            </div>
          )}
          {busy ? (
            <div className="absolute inset-0 grid place-items-center bg-white/70">
              <Loader2Icon className="size-5 animate-spin text-denim-600" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
            {path ? "Replace image" : "Upload image"}
          </Button>
          {path ? (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setPath("")}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <input type="hidden" name={name} value={path} />
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Shrinks and uploads an image; reports the stored path or an error. */
export function useImageUpload(folder: UploadFolder, onUploaded: (path: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("folder", folder);
      data.set("file", await prepareImage(file));
      const result = await uploadImage(data);
      if (result.ok) onUploaded(result.upload.path);
      else setError(result.error);
    } catch {
      setError("The upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, upload };
}
