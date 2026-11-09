"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheckIcon, FileUpIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/admin/page-parts";
import { applyStockImport, previewStockImport } from "@/lib/admin/actions/stock";
import type { StockImportResult } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const MAX_BYTES = 512 * 1024;

/**
 * Stock counts from a CSV file: the file is read and checked first (what changes, which lines have a problem), and
 * only applied when you confirm. Every changed color gets a count correction in the stock history.
 */
export function StockImport() {
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<StockImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      const outcome = await previewStockImport(text);
      if (outcome.ok) setResult(outcome.result);
      else setError(outcome.message);
    });
  };

  const apply = () => {
    if (!csv) return;
    startTransition(async () => {
      const outcome = await applyStockImport(csv);
      if (outcome.ok) setResult(outcome.result);
      else setError(outcome.message);
    });
  };

  const canApply = result !== null && !result.applied && result.errors.length === 0 && result.changes.length > 0;

  return (
    <div className="grid gap-6">
      <Panel
        title="1. Choose the file"
        description="Download the stock list (Export CSV on the Stock page), count, change the “Sets in stock” column in Excel, and save it as CSV. Other columns are ignored."
      >
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
              if (file) read(file);
            }}
          />
        </label>
        {error ? (
          <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </Panel>

      {result ? (
        <Panel
          title={result.applied ? "Done" : "2. Check the changes"}
          description={
            result.applied
              ? `${result.changes.length} ${result.changes.length === 1 ? "color was" : "colors were"} updated. Each change is in the stock history as a count correction.`
              : `${result.changes.length} ${result.changes.length === 1 ? "color changes" : "colors change"}, ${result.unchanged} already ${result.unchanged === 1 ? "has" : "have"} the counted number.`
          }
        >
          {result.errors.length > 0 ? (
            <div role="alert" className="mb-5 rounded-xl bg-orange-50 p-4 text-sm text-stitch-700">
              <p className="font-medium">Correct these lines and choose the file again. Nothing changes until every line is right.</p>
              <ul className="mt-2 grid gap-1">
                {result.errors.map((problem, index) => (
                  <li key={index}>
                    {problem.line > 0 ? `Line ${problem.line}: ` : ""}
                    {problem.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.changes.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="bg-cotton-50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Style and color
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Sets now
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Counted
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.changes.map((change) => {
                    const difference = change.to - change.from;
                    return (
                      <tr key={change.code} className="border-t">
                        <td className="px-4 py-2.5">
                          {change.style}, {change.color} <span className="font-mono text-xs text-muted-foreground">{change.code}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{change.from}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">{change.to}</td>
                        <td className={cn("px-4 py-2.5 text-right tabular-nums", difference > 0 ? "text-emerald-700" : "text-stitch-700")}>
                          {difference > 0 ? `+${difference}` : difference}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : result.errors.length === 0 ? (
            <p className="text-sm text-muted-foreground">The file matches the stock: there is nothing to change.</p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {canApply ? (
              <Button type="button" onClick={apply} disabled={pending}>
                {pending ? <Loader2Icon className="animate-spin" /> : null}
                Update {result.changes.length} {result.changes.length === 1 ? "color" : "colors"}
              </Button>
            ) : null}
            {result.applied ? (
              <>
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <CircleCheckIcon className="size-4" /> The stock pages show the new counts now.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/stock">Back to the stock</Link>
                </Button>
              </>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
