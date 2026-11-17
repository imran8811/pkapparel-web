"use client";

import Link from "next/link";
import { CircleCheckIcon, ImagePlusIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvFileInput, CsvProblems, useCsvImport } from "@/components/admin/csv-import";
import { Panel } from "@/components/admin/page-parts";
import { applyStockListingImport, previewStockListingImport } from "@/lib/admin/actions/stock";
import type { StockListingImportRow } from "@/lib/admin/types";
import { formatRupees } from "@/lib/stock";

const listings = (count: number) => `${count} ${count === 1 ? "listing" : "listings"}`;

/**
 * New stock listings from a CSV file: the file is read and checked first (the listings it makes, which lines have a
 * problem), and the listings are only created when you confirm, all of them or none. They start as drafts until
 * their photos are added.
 */
export function StockListingImport() {
  const { fileName, result, error, pending, read, apply } = useCsvImport(previewStockListingImport, applyStockListingImport);
  const canApply = result !== null && !result.applied && result.errors.length === 0 && result.listings.length > 0;

  return (
    <div className="grid gap-6">
      <Panel title="2. Choose the file" description="In Excel, save the file as “CSV UTF-8”. You see every listing before anything is created.">
        <CsvFileInput fileName={fileName} pending={pending} error={error} onFile={read} />
      </Panel>

      {result ? (
        <Panel
          title={result.applied ? "Done" : "3. Check the listings"}
          description={
            result.applied
              ? `${listings(result.listings.length)} created as drafts. Add the photos of each, then show it on the stock pages.`
              : result.errors.length === 0
                ? `The file makes ${listings(result.listings.length)}. They are created as drafts: each needs its photos before it is shown.`
                : undefined
          }
        >
          <CsvProblems errors={result.errors} />

          {result.listings.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[44rem] text-sm">
                <thead className="bg-cotton-50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Listing
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Set
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Sets in stock
                    </th>
                    {result.applied ? <th scope="col" className="px-4 py-2.5" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {result.listings.map((listing) => (
                    <ListingRow key={listing.line} listing={listing} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {canApply ? (
              <Button type="button" onClick={apply} disabled={pending}>
                {pending ? <Loader2Icon className="animate-spin" /> : null}
                Create {listings(result.listings.length)}
              </Button>
            ) : null}
            {result.applied ? (
              <>
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <CircleCheckIcon className="size-4" /> Saved. Open each listing to add its photos.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/stock?status=draft">See the drafts</Link>
                </Button>
              </>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function ListingRow({ listing }: { listing: StockListingImportRow }) {
  return (
    <tr className="border-t align-top">
      <td className="px-4 py-2.5">
        <p className="flex items-center gap-2 font-medium">
          <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: listing.hex ?? "#c8d8f4" }} />
          {listing.name}, {listing.color}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <span className="font-mono">{listing.code}</span> · {listing.department_name} · {listing.category_name}
          {listing.style_no ? ` · ${listing.style_no}` : ""} · line {listing.line}
          {listing.specs > 0 ? ` · ${listing.specs} specification${listing.specs === 1 ? "" : "s"}` : ""}
        </p>
      </td>
      <td className="px-4 py-2.5">
        <p className="font-mono text-xs">{listing.set_sizes.map(({ size, pcs }) => `${size}×${pcs}`).join("  ")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{listing.set_pieces} pieces</p>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums">
        <p>{formatRupees(listing.piece_price_cents)} / piece</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatRupees(listing.set_price_cents)} / set</p>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums">{listing.sets_in_stock}</td>
      {listing.id !== null ? (
        <td className="px-4 py-2.5 text-right">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/stock/${listing.id}`}>
              <ImagePlusIcon /> Add photos
            </Link>
          </Button>
        </td>
      ) : null}
    </tr>
  );
}
