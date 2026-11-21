"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addedSizeProblem, MAX_ADDED_SIZES, MAX_SIZE_LENGTH, tidySize } from "@/lib/shop";
import { cn } from "@/lib/utils";

/* The pieces per size of one color, on the product page and in the cart (owner request 2026-11-21: no sets). */

export const MAX_PER_SIZE = 100_000;

/** Whole pieces from what was typed: only its digits count, up to MAX_PER_SIZE. */
export function piecesFrom(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits === "" ? 0 : Math.min(MAX_PER_SIZE, Number(digits));
}

const fieldClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-white text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-stitch-500 aria-invalid:bg-orange-50";

/**
 * A box per size with its pieces. The sizes the buyer added (not listed for the style) have a dashed border and a
 * button that removes them. The arrow keys add or take away one piece.
 */
export function SizeBoxes({
  sizes,
  added,
  quantities,
  small,
  colorName,
  onChange,
  onRemove,
  className,
}: {
  /** Every size shown: the style's, then the added ones. */
  sizes: string[];
  added: string[];
  quantities: Record<string, number>;
  /** Sizes below the minimum per size. */
  small: string[];
  colorName: string;
  onChange: (size: string, pieces: number) => void;
  onRemove: (size: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {sizes.map((size) => {
        const pieces = quantities[size] ?? 0;
        const isAdded = added.includes(size);
        return (
          <div key={size} className="relative">
            <label
              className={cn(
                "grid h-full content-between gap-1 rounded-xl bg-cotton-50 p-2 text-center",
                isAdded && "border border-dashed border-denim-300 bg-denim-50/50",
              )}
            >
              <span className="font-mono text-xs break-words text-muted-foreground">{size}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pieces > 0 ? String(pieces) : ""}
                placeholder="0"
                onChange={(event) => onChange(size, piecesFrom(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                  event.preventDefault();
                  onChange(size, Math.max(0, Math.min(MAX_PER_SIZE, pieces + (event.key === "ArrowUp" ? 1 : -1))));
                }}
                aria-label={`Size ${size}, pieces of ${colorName}`}
                aria-invalid={small.includes(size) || undefined}
                className={cn(fieldClass, "text-center tabular-nums")}
              />
            </label>
            {isAdded ? (
              <button
                type="button"
                onClick={() => onRemove(size)}
                aria-label={`Remove size ${size}`}
                title={`Remove size ${size}`}
                className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-border outline-none hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * "Add another size": a link that opens the fields for a size the style does not list and its pieces,
 * e.g. 38 for jeans listed in 26–36. The new size gets a box of its own.
 */
export function AddSize({
  shown,
  addedCount,
  example,
  colorName,
  minPerSize,
  onAdd,
}: {
  /** The sizes already shown (a size cannot be added twice). */
  shown: string[];
  /** How many sizes were added already (at most MAX_ADDED_SIZES). */
  addedCount: number;
  /** A size to show as an example, e.g. "38". */
  example: string;
  colorName: string;
  minPerSize: number;
  onAdd: (size: string, pieces: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const [pieces, setPieces] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const id = useId();

  // Back to the link once the fields close, so the keyboard stays in place.
  useEffect(() => {
    if (!open && returnFocus.current) {
      returnFocus.current = false;
      toggle.current?.focus();
    }
  }, [open]);

  const close = () => {
    returnFocus.current = true;
    setOpen(false);
    setSize("");
    setPieces("");
    setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = tidySize(size);
    const problem = addedSizeProblem(label, shown) ?? (piecesFrom(pieces) === 0 ? `Enter the pieces of size ${label}.` : null);
    if (problem) {
      setError(problem);
      return;
    }
    onAdd(label, piecesFrom(pieces));
    close();
  };

  if (addedCount >= MAX_ADDED_SIZES) {
    return <p className="text-xs text-muted-foreground">You can add up to {MAX_ADDED_SIZES} sizes that are not listed.</p>;
  }

  if (!open) {
    return (
      <Button ref={toggle} type="button" variant="link" className="h-auto px-0 py-1 text-sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Add another size
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      aria-labelledby={`${id}-title`}
      className="grid w-full gap-3 rounded-xl border border-dashed border-denim-300 p-3"
    >
      <div>
        <p id={`${id}-title`} className="text-sm font-medium">
          Add a size that is not listed
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          For {colorName}. Each size needs at least {minPerSize} pieces.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
        <label className="grid gap-1 text-xs text-muted-foreground">
          Size
          <input
            // The fields open on request, so the size is where the buyer starts typing.
            autoFocus
            type="text"
            autoComplete="off"
            maxLength={MAX_SIZE_LENGTH}
            value={size}
            placeholder={`e.g. ${example}`}
            onChange={(event) => {
              setSize(event.target.value);
              setError(null);
            }}
            aria-invalid={error !== null || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(fieldClass, "px-3 text-foreground")}
          />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Pieces
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pieces}
            placeholder="0"
            onChange={(event) => {
              setPieces(event.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            className={cn(fieldClass, "text-center text-foreground tabular-nums")}
          />
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-stitch-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm">
          <Plus aria-hidden /> Add size
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={close}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
