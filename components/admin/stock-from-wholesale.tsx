"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CircleCheckIcon, CopyIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, Pill } from "@/components/admin/page-parts";
import { copyFromWholesale } from "@/lib/admin/actions/stock";
import type { StockCopied, StockFromWholesaleRow } from "@/lib/admin/types";
import { productTypes } from "@/lib/nav";
import { inSentence, sectionTitle, setContents } from "@/lib/stock";
import { cn } from "@/lib/utils";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Copied now, or copied before as a hidden draft and shown by copying again. */
const copyable = (row: StockFromWholesaleRow) => (row.stock_style_id === null && row.problem === null) || (row.hidden_copy && row.shown);

type Group = { category: string; name: string; productType: string; rows: StockFromWholesaleRow[] };

/** The colors by the stock category they go in, in the order the API lists them (the categories in staff order). */
function byCategory(rows: StockFromWholesaleRow[]): Group[] {
  const groups = new Map<string, Group>();
  for (const row of rows) {
    const group = groups.get(row.category) ?? { category: row.category, name: row.category_name, productType: row.product_type, rows: [] };
    group.rows.push(row);
    groups.set(row.category, group);
  }
  return [...groups.values()];
}

/** "chino pants": the wholesale type a category's copies come from. */
const typeName = (slug: string) => inSentence(productTypes.find((type) => type.slug === slug)?.label ?? slug);

function doneMessage(done: StockCopied[]): string {
  if (done.length === 0) return "Nothing changed: those colors are in the stock already.";
  const added = done.filter((item) => item.new).length;
  const shown = done.filter((item) => item.shown).length;
  const parts = [added > 0 ? `${plural(added, "listing")} added` : null, shown > 0 ? `${plural(shown, "listing")} now on the stock pages` : null];
  return `${parts.filter(Boolean).join(", ")}. They show “Price on request” until you enter a price per set, and “Sold out” until you enter the sets in stock.`;
}

/**
 * Every color of the wholesale shop's styles for men (and boys) of the types the stock has a category for, by the
 * category they go in (jeans into Jeans, chino pants into Cotton pants…), ticked to be copied: each color becomes a
 * stock listing of its own. A category's colors are ticked or unticked together with one click. A color of a style
 * shown in the wholesale shop is shown on the stock pages at once. A color in the stock already links to its listing;
 * the others say why they cannot be copied.
 */
export function StockFromWholesale({ rows }: { rows: StockFromWholesaleRow[] }) {
  const toCopy = rows.filter(copyable);
  const [chosen, setChosen] = useState(() => new Set(toCopy.map((row) => row.color_id)));
  const [done, setDone] = useState<StockCopied[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // After a copy the page reloads its rows: colors copied by then are no longer copyable.
  const selected = toCopy.filter((row) => chosen.has(row.color_id));

  const choose = (ids: number[], on: boolean) =>
    setChosen((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
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
        title="Colors in the wholesale shop"
        description="Each ticked color becomes a stock listing of its own, in the stock category with the details of its type: the style's name and details (with the color's own fabric details), the set (the wholesale sizes and pieces per size), the color and its photos. A color of a style shown in the wholesale shop is shown on the stock pages at once, with “Price on request” until you enter its price per set, and “Sold out” until you enter its sets in stock. Description paragraphs about made-to-order wholesale are left out."
      >
        <div className="grid gap-8">
          {byCategory(rows).map((group) => {
            const groupToCopy = group.rows.filter(copyable);
            const allChosen = groupToCopy.length > 0 && groupToCopy.every((row) => chosen.has(row.color_id));
            return (
              <section key={group.category} aria-labelledby={`copy-${group.category}`}>
                <header className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b pb-2">
                  <div className="min-w-0">
                    <h3 id={`copy-${group.category}`} className="font-semibold">
                      {group.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      From the wholesale {typeName(group.productType)} · {plural(group.rows.length, "color")}, {groupToCopy.length === 0 ? "none" : groupToCopy.length} to copy
                    </p>
                  </div>
                  {groupToCopy.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => choose(groupToCopy.map((row) => row.color_id), !allChosen)}
                      disabled={pending}
                      className="text-sm font-medium text-denim-600 hover:underline disabled:opacity-50"
                    >
                      {allChosen ? "Untick all" : "Tick all"} {inSentence(group.name)}
                    </button>
                  ) : null}
                </header>
                <ul className="grid gap-3">
                  {group.rows.map((row) => (
                    <ColorRow key={row.color_id} row={row} chosen={chosen.has(row.color_id)} onChoose={(on) => choose([row.color_id], on)} pending={pending} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
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

function ColorRow({ row, chosen, onChoose, pending }: { row: StockFromWholesaleRow; chosen: boolean; onChoose: (on: boolean) => void; pending: boolean }) {
  const inStock = row.stock_style_id !== null;
  const canCopy = copyable(row);
  const pieces = row.set_sizes.reduce((sum, size) => sum + size.pcs, 0);
  return (
    <li className={cn("flex flex-wrap items-start gap-3 rounded-xl border p-3 sm:flex-nowrap", canCopy ? "bg-white" : "bg-cotton-50")}>
      <span className="flex size-5 shrink-0 items-center justify-center pt-1">
        {canCopy ? (
          <input
            type="checkbox"
            checked={chosen}
            onChange={(event) => onChoose(event.target.checked)}
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
          {sectionTitle(row.department_name, row.category_name)}
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
      {row.wholesale_status === "draft" || inStock || row.problem ? (
        // On phones, a line of its own under the text (lined up with it), so the text keeps the width.
        <div className="flex w-full flex-wrap items-center gap-1.5 pl-23 sm:w-auto sm:justify-end sm:pl-0">
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
      ) : null}
    </li>
  );
}
