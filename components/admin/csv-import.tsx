"use client";

import { useState, useTransition } from "react";
import { FileUpIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

/** The API reads at most 512 KB per file. */
const MAX_BYTES = 512 * 1024;

type Outcome<R> = { ok: true; result: R } | { ok: false; message: string };

/**
 * A CSV import in two steps: choosing a file reads it and asks for a preview (nothing is saved), then `apply` sends the
 * same file again to save it. The API checks the file both times.
 */
export function useCsvImport<R>(preview: (csv: string) => Promise<Outcome<R>>, save: (csv: string) => Promise<Outcome<R>>) {
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handle = (outcome: Outcome<R>) => {
    if (outcome.ok) setResult(outcome.result);
    else setError(outcome.message);
  };

  const read = (file: File) => {
    setResult(null);
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("The file is larger than 512 KB. Import it in parts.");
      return;
    }
    startTransition(async () => {
      const text = await file.text();
      setCsv(text);
      setFileName(file.name);
      handle(await preview(text));
    });
  };

  const apply = () => {
    if (!csv) return;
    setError(null);
    startTransition(async () => handle(await save(csv)));
  };

  return { fileName, result, error, pending, read, apply };
}

/** The file picker of a CSV import, with the file's name, a spinner while it is read, and the error, if any. */
export function CsvFileInput({ fileName, pending, error, onFile }: { fileName: string | null; pending: boolean; error: string | null; onFile: (file: File) => void }) {
  return (
    <>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-white px-4 py-4 text-sm transition-colors hover:border-denim-300",
          pending && "pointer-events-none opacity-60",
        )}
      >
        {pending ? <Loader2Icon className="size-5 shrink-0 animate-spin text-denim-600" /> : <FileUpIcon className="size-5 shrink-0 text-denim-600" />}
        <span className="min-w-0 flex-1">{fileName ?? "Choose a CSV file"}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFile(file);
          }}
        />
      </label>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** The lines of a file that stop the import. */
export function CsvProblems({ errors }: { errors: { line: number; message: string }[] }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="mb-5 rounded-xl bg-orange-50 p-4 text-sm text-stitch-700">
      <p className="font-medium">Correct these lines and choose the file again. Nothing changes until every line is right.</p>
      <ul className="mt-2 grid gap-1">
        {errors.map((problem, index) => (
          <li key={index}>
            {problem.line > 0 ? `Line ${problem.line}: ` : ""}
            {problem.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
