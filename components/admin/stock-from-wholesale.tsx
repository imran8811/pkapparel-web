"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CircleCheckIcon, CopyIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, Pill } from "@/components/admin/page-parts";
import { copyFromWholesale } from "@/lib/admin/actions/stock";
import type { StockCopied, StockFromWholesaleRow } from "@/lib/admin/types";
import { isStockSegment, setContents, stockSegmentInfo } from "@/lib/stock";
import { cn } from "@/lib/utils";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Copied now, or copied before as a hidden draft and shown by copying again. */
const copyable = (row: StockFromWholesaleRow) => (row.stock_style_id === null && row.problem === null) || (row.hidden_copy && row.shown);

function doneMessage(done: StockCopied[]): string {
  if (done.length === 0) return "Nothing changed: those colors are in the stock already.";
  const added = done.filter((item) => item.new).length;
  const shown = done.filter((item) => item.shown).length;
  const parts = [added > 0 ? `${plural(added, "listing")} added` : null, shown > 0 ? `${plural(shown, "listing")} now on the stock pages` : null];
  return `${parts.filter(Boolean).join(", ")}. They show “Price on request” until you enter a price per set, and “Sold out” until you enter the sets in stock.`;
}

/**
 * Every color of the wholesale shop's jeans for men (and boys), ticked to be copied: each color becomes a stock listing
 * of its own. A color of a style shown in the wholesale shop is shown on the stock pages at once. A color in the
 * stock already links to its listing; the others say why they cannot be copied.
 */
export function StockFromWholesale({ rows }: { rows: StockFromWholesaleRow[] }) {
  const toCopy = rows.filter(copyable);
  const [chosen, setChosen] = useState(() => new Set(toCopy.map((row) => row.color_id)));
  const [done, setDone] = useState<StockCopied[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // After a copy the page reloads its rows: colors copied by then are no longer copyable.
  const selected = toCopy.filter((row) => chosen.has(row.color_id));

  const toggle = (id: number, on: boolean) =>
    setChosen((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const copy = () => {
    setError(null);
    startTransition(async () => {
      const outcome = await copyFromWholesale(selected.map((row) => row.color_id));
      if (outcome.ok) setDone(outcome.copied);
      else setError(outcome.message);
    });
  };

  return (
    <div className="grid gap-6">
      {done !== null ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CircleCheckIcon className="size-5 shrink-0" />
          <p className="min-w-0 flex-1">{doneMessage(done)}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/stock">Stock listings</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="/stock" target="_blank" rel="noopener noreferrer">
                Open the stock pages
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      <Panel
        title="Men's jeans colors in the wholesale shop"
        description="Each ticked color becomes a stock listing of its own: the style's name and details (with the color's own fabric details), the set (the wholesale sizes and pieces per size), the color and its photos. A color of a style shown in the wholesale shop is shown on the stock pages at once, with “Price on request” until you enter its price per set, and “Sold out” until you enter its sets in stock. Description paragraphs about made-to-order wholesale are left out."
      >
        <ul className="grid gap-3">
          {rows.map((row) => {
            const inStock = row.stock_style_id !== null;
            const canCopy = copyable(row);
            const pieces = row.set_sizes.reduce((sum, size) => sum + size.pcs, 0);
            return (
              <li key={row.color_id} className={cn("flex flex-wrap items-start gap-3 rounded-xl border p-3 sm:flex-nowrap", canCopy ? "bg-white" : "bg-cotton-50")}>
                <span className="flex size-5 shrink-0 items-center justify-center pt-1">
                  {canCopy ? (
                    <input
                      type="checkbox"
                      checked={chosen.has(row.color_id)}
                      onChange={(event) => toggle(row.color_id, event.target.checked)}
                      disabled={pending}
                      aria-label={`Copy ${row.name}, ${row.color}`}
                      className="size-4 accent-denim-600"
                    />
                  ) : null}
                </span>
                <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-cotton-100">
                  {row.thumbnail ? (
                    <Image src={`/${row.thumbnail}`} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <ImageIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{row.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm">
                    <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: row.hex ?? "#c8d8f4" }} />
                    {row.color} <span className="font-mono text-xs text-muted-foreground">{row.code}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isStockSegment(row.segment) ? stockSegmentInfo(row.segment).title : row.segment}
                    {" · "}
                    {plural(row.photos, "photo")}
                    {row.set_sizes.length > 0 ? ` · set of ${pieces}: ${setContents(row.set_sizes)}` : ""}
                  </p>
                  {!inStock && row.problem ? <p className="mt-1 text-xs text-stitch-700">{row.problem}</p> : null}
                  {canCopy && row.hidden_copy ? <p className="mt-1 text-xs text-emerald-700">Copied before but hidden: copying shows it on the stock pages.</p> : null}
                  {canCopy && !row.hidden_copy ? (
                    <p className={cn("mt-1 text-xs", row.shown ? "text-emerald-700" : "text-stitch-700")}>
                      {row.shown ? "Shown on the stock pages once copied." : `Copied as a hidden draft: ${row.draft_reason ?? "it cannot be shown yet."}`}
                    </p>
                  ) : null}
                  {canCopy && !row.hidden_copy && row.left_out.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">Left out of the description: {row.left_out.map((text) => `“${text}”`).join(" ")}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                  {row.wholesale_status === "draft" ? <Pill tone="neutral">Wholesale draft</Pill> : null}
                  {inStock ? (
                    <>
                      {canCopy ? <Pill tone="orange">Hidden in stock</Pill> : <Pill tone={row.shown ? "green" : "neutral"}>{row.shown ? "In stock" : "In stock, hidden"}</Pill>}
                      <Link href={`/admin/stock/${row.stock_style_id}`} className="text-sm font-medium text-denim-600 hover:underline">
                        Open
                      </Link>
                    </>
                  ) : row.problem ? (
                    <Pill tone="orange">Can&apos;t be copied</Pill>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {toCopy.length > 0 ? (
            <Button type="button" onClick={copy} disabled={pending || selected.length === 0}>
              {pending ? <Loader2Icon className="animate-spin" /> : <CopyIcon />}
              Copy {plural(selected.length, "color")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing left to copy: every color is in the stock already, or cannot be copied.</p>
          )}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
