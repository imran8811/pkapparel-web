"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CircleCheckIcon, CopyIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, Pill } from "@/components/admin/page-parts";
import { copyFromWholesale } from "@/lib/admin/actions/stock";
import type { StockFromWholesaleRow } from "@/lib/admin/types";
import { isStockSegment, setContents, stockSegmentInfo } from "@/lib/stock";
import { cn } from "@/lib/utils";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * The wholesale shop's jeans for men (and boys), ticked to be copied into the stock as drafts. A style copied before
 * (a stock style has its web address) links to that stock style; the others say why they cannot be copied.
 */
export function StockFromWholesale({ rows }: { rows: StockFromWholesaleRow[] }) {
  const copyable = rows.filter((row) => row.stock_style_id === null && row.problem === null);
  const [chosen, setChosen] = useState(() => new Set(copyable.map((row) => row.product_id)));
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // After a copy the page reloads its rows: styles copied by then are no longer copyable.
  const selected = copyable.filter((row) => chosen.has(row.product_id));

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
      const outcome = await copyFromWholesale(selected.map((row) => row.product_id));
      if (outcome.ok) setCopied(outcome.copied.length);
      else setError(outcome.message);
    });
  };

  return (
    <div className="grid gap-6">
      {copied !== null ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CircleCheckIcon className="size-5 shrink-0" />
          <p className="min-w-0 flex-1">
            {copied === 0
              ? "Nothing was copied: those styles are in the stock already."
              : `${plural(copied, "style")} copied as ${copied === 1 ? "a draft" : "drafts"}. Open each one to enter its price per set and its sets in stock, then show it.`}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/stock?status=draft">Stock drafts</Link>
          </Button>
        </div>
      ) : null}

      <Panel
        title="Men's jeans in the wholesale shop"
        description="Ticked styles are copied as stock drafts: name, details, the set (the wholesale sizes and pieces per size), colors and photos. They have no price and no stock yet, and stay hidden until you add both and show them. Description paragraphs about made-to-order wholesale are left out."
      >
        <ul className="grid gap-3">
          {rows.map((row) => {
            const inStock = row.stock_style_id !== null;
            const canCopy = !inStock && row.problem === null;
            const pieces = row.set_sizes.reduce((sum, size) => sum + size.pcs, 0);
            return (
              <li key={row.product_id} className={cn("flex flex-wrap items-start gap-3 rounded-xl border p-3 sm:flex-nowrap", canCopy ? "bg-white" : "bg-cotton-50")}>
                <span className="flex size-5 shrink-0 items-center justify-center pt-1">
                  {canCopy ? (
                    <input
                      type="checkbox"
                      checked={chosen.has(row.product_id)}
                      onChange={(event) => toggle(row.product_id, event.target.checked)}
                      disabled={pending}
                      aria-label={`Copy ${row.name}`}
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
                  <p className="font-medium">
                    {row.name} {row.style_no ? <span className="font-mono text-xs text-muted-foreground">{row.style_no}</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isStockSegment(row.segment) ? stockSegmentInfo(row.segment).title : row.segment}
                    {" · "}
                    {plural(row.colors, "color")} · {plural(row.photos, "photo")}
                    {row.set_sizes.length > 0 ? ` · set of ${pieces}: ${setContents(row.set_sizes)}` : ""}
                  </p>
                  {!inStock && row.problem ? <p className="mt-1 text-xs text-stitch-700">{row.problem}</p> : null}
                  {canCopy && row.skipped_colors.length > 0 ? (
                    <p className="mt-1 text-xs text-stitch-700">
                      Not copied: {row.skipped_colors.join(", ")}. Other stock styles use {row.skipped_colors.length === 1 ? "this color code" : "these color codes"}.
                    </p>
                  ) : null}
                  {canCopy && row.left_out.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">Left out of the description: {row.left_out.map((text) => `“${text}”`).join(" ")}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                  {row.wholesale_status === "draft" ? <Pill tone="neutral">Wholesale draft</Pill> : null}
                  {inStock ? (
                    <>
                      <Pill tone="green">In stock</Pill>
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
          {copyable.length > 0 ? (
            <Button type="button" onClick={copy} disabled={pending || selected.length === 0}>
              {pending ? <Loader2Icon className="animate-spin" /> : <CopyIcon />}
              Copy {plural(selected.length, "style")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing left to copy: every style is in the stock already, or cannot be copied.</p>
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
