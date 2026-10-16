"use server";

import { unstable_rethrow } from "next/navigation";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin/session";
import type { Upload } from "@/lib/admin/types";

export type UploadResult = { ok: true; upload: Upload } | { ok: false; error: string };

const FOLDERS = ["blog", "pages", "products", "factory", "certificates"];
const MAX_BYTES = 9 * 1024 * 1024;

/** Uploads one image to the API, which checks, resizes and stores it. */
export async function uploadImage(form: FormData): Promise<UploadResult> {
  const file = form.get("file");
  const folder = form.get("folder");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_BYTES) return { ok: false, error: "The image is too large. The limit is 9 MB." };
  if (typeof folder !== "string" || !FOLDERS.includes(folder)) return { ok: false, error: "Unknown upload folder." };

  const body = new FormData();
  body.set("folder", folder);
  body.set("file", file, file.name || "image.jpg");

  try {
    const upload = await adminApi<Upload>("/v1/admin/uploads", { method: "POST", body, timeoutMs: 60_000 });
    return { ok: true, upload };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { ok: false, error: error.fields.file ?? error.fields.folder ?? error.message };
    }
    console.error(error);
    return { ok: false, error: "The upload failed. Please try again." };
  }
}
