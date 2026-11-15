"use client";

import Link from "next/link";
import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvFileInput, CsvProblems, useCsvImport } from "@/components/admin/csv-import";
import { Panel } from "@/components/admin/page-parts";
import { applyStockImport, previewStockImport } from "@/lib/admin/actions/stock";
import { cn } from "@/lib/utils";

/**
 * Stock counts from a CSV file: the file is read and checked first (what changes, which lines have a problem), and
 * only applied when you confirm. Every changed color gets a count correction in the stock history.
 */
export function StockImport() {
  const { fileName, result, error, pending, read, apply } = useCsvImport(previewStockImport, applyStockImport);

  const canApply = result !== null && !result.applied && result.errors.length === 0 && result.changes.length > 0;

  return (
    <div className="grid gap-6">
      <Panel
        title="1. Choose the file"
        description="Download the stock list (Export CSV on the Stock page), count, change the “Sets in stock” column in Excel, and save it as CSV. Other columns are ignored."
      >
        <CsvFileInput fileName={fileName} pending={pending} error={error} onFile={read} />
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
          <CsvProblems errors={result.errors} />

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
