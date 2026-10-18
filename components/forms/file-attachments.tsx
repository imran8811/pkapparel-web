"use client";

import { useRef, useState } from "react";
import { FileText, LoaderCircle, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadInquiryFile } from "@/lib/actions/inquiries";
import { prepareImage } from "@/lib/admin/prepare-image";

export type AttachedFile = { token: string; name: string; size_bytes: number };

const ACCEPT = ".pdf,.ai,.xlsx,.docx,image/jpeg,image/png";

function size(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Files attached to a quote request or a custom sample: each one is uploaded on its own as soon as it is chosen
 * (the website accepts at most 4.5 MB per request), and the form sends their tokens ("files") with a copy of the
 * list ("files_meta"), so the list survives a form error.
 */
export function FileAttachments({ initial = [], max = 5, label = "Tech pack, sketches or photos", hint }: { initial?: AttachedFile[]; max?: number; label?: string; hint?: string }) {
  const [files, setFiles] = useState<AttachedFile[]>(initial);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (list: FileList) => {
    setError(null);
    const chosen = [...list].slice(0, Math.max(0, max - files.length));
    if (chosen.length < list.length) setError(`You can attach up to ${max} files.`);
    for (const [index, file] of chosen.entries()) {
      setProgress(`Uploading ${index + 1} of ${chosen.length}…`);
      // Phone photos are often large: shrink them first (PDFs and Office files go as they are).
      const prepared = file.type.startsWith("image/") ? await prepareImage(file) : file;
      const form = new FormData();
      form.set("file", prepared, prepared.name);
      const result = await uploadInquiryFile(form);
      if (result.ok) {
        setFiles((current) => [...current, { token: result.token, name: result.name, size_bytes: result.size_bytes }]);
      } else {
        setError(result.message);
      }
    }
    setProgress(null);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-2">
      <span className="text-sm font-medium">{label}</span>
      {files.length > 0 ? (
        <ul className="grid gap-2">
          {files.map((file) => (
            <li key={file.token} className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 text-sm">
              <FileText aria-hidden className="size-4 shrink-0 text-denim-600" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{size(file.size_bytes)}</span>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((item) => item.token !== file.token))}
                aria-label={`Remove ${file.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
              <input type="hidden" name="files" value={file.token} />
            </li>
          ))}
        </ul>
      ) : null}
      <input type="hidden" name="files_meta" value={JSON.stringify(files)} />
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        aria-label={label}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) void upload(event.target.files);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={progress !== null || files.length >= max}>
          {progress ? <LoaderCircle className="animate-spin" /> : <Paperclip />}
          {progress ?? (files.length > 0 ? "Attach more" : "Attach files")}
        </Button>
        <span className="text-xs text-muted-foreground">{hint ?? `PDF, Excel, Word, Illustrator, JPG or PNG. Up to ${max} files, 4 MB each.`}</span>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
