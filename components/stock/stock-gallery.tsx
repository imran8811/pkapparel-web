"use client";

import { useRef, useState, type TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { mediaSrc } from "@/lib/media";
import type { ProductImage } from "@/lib/shop";
import { cn } from "@/lib/utils";

/** Sideways movement, in pixels, that counts as a swipe. */
const SWIPE_DISTANCE = 40;

/**
 * Swiping on a touch screen (phones, iPad): left shows the next photo, right the previous one. Mostly vertical
 * movements are left alone, so the page still scrolls. `afterSwipe()` tells the tap that ends a swipe to do nothing.
 */
function useSwipe(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  return {
    /** True once, right after a swipe. */
    afterSwipe: () => {
      const was = swiped.current;
      swiped.current = false;
      return was;
    },
    handlers: {
      onTouchStart: (event: TouchEvent) => {
        const touch = event.touches[0];
        start.current = event.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null;
        swiped.current = false;
      },
      onTouchEnd: (event: TouchEvent) => {
        const from = start.current;
        const touch = event.changedTouches[0];
        start.current = null;
        if (!from || !touch) return;
        const dx = touch.clientX - from.x;
        const dy = touch.clientY - from.y;
        if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) {
          swiped.current = true;
          onSwipe(dx < 0 ? 1 : -1);
        }
      },
    },
  };
}

/**
 * The photos of a stock listing: the main photo (swipe or the arrows for the others), thumbnails, and a larger
 * view in a full-screen window when the photo is tapped or clicked (swipe, the arrows or the arrow keys there too).
 */
export function StockGallery({ images, photo, onPhoto, title }: { images: ProductImage[]; photo: number; onPhoto: (index: number) => void; title: string }) {
  const [open, setOpen] = useState(false);
  const count = images.length;
  const index = Math.min(photo, Math.max(count - 1, 0));
  const image = images[index];

  const step = (direction: 1 | -1) => {
    if (count > 1) onPhoto((index + direction + count) % count);
  };
  const main = useSwipe(step);
  const large = useSwipe(step);

  return (
    <div className="lg:sticky lg:top-28">
      <div className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-[2rem] bg-white ring-1 ring-border" {...main.handlers}>
        {image ? (
          <button
            type="button"
            onClick={() => {
              if (!main.afterSwipe()) setOpen(true);
            }}
            aria-label={`Open a larger photo: ${image.alt}`}
            className="group absolute inset-0 cursor-zoom-in"
          >
            <Image key={image.path} src={mediaSrc(image.path)} alt={image.alt} fill preload sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain" />
            <span aria-hidden className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-white/90 text-denim-950 shadow-sm ring-1 ring-black/5 transition group-hover:scale-105">
              <Expand className="size-4" />
            </span>
          </button>
        ) : null}
        {count > 1 ? (
          <>
            <StepButton direction={-1} onStep={step} className="left-3" />
            <StepButton direction={1} onStep={step} className="right-3" />
            <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-denim-950/70 px-2.5 py-1 font-mono text-[11px] text-white tabular-nums">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Photos">
          {images.map((thumb, position) => (
            <li key={thumb.path} className="shrink-0">
              <button
                type="button"
                onClick={() => onPhoto(position)}
                aria-label={`Show photo ${position + 1}: ${thumb.alt}`}
                aria-current={position === index ? "true" : undefined}
                className={cn(
                  "relative block h-24 w-18 overflow-hidden rounded-xl bg-white ring-1 ring-border transition",
                  position === index ? "ring-2 ring-denim-600" : "opacity-80 hover:opacity-100",
                )}
              >
                <Image src={mediaSrc(thumb.path)} alt="" fill sizes="72px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={open && image !== undefined} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") step(1);
            if (event.key === "ArrowLeft") step(-1);
          }}
          className="top-0 left-0 block h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none bg-denim-950/95 p-0 text-white ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Photo {index + 1} of {count}. {count > 1 ? "Swipe, or use the arrows or arrow keys, for the other photos." : ""}
          </DialogDescription>
          {image ? (
            <div className="absolute inset-x-2 top-16 bottom-16 touch-pan-y sm:inset-x-20" {...large.handlers}>
              <Image key={image.path} src={mediaSrc(image.path)} alt={image.alt} fill sizes="100vw" className="object-contain" />
            </div>
          ) : null}
          {count > 1 ? (
            <>
              <StepButton direction={-1} onStep={step} className="left-3 sm:left-5" dark />
              <StepButton direction={1} onStep={step} className="right-3 sm:right-5" dark />
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs text-white/80 tabular-nums">
                {index + 1} / {count}
              </p>
            </>
          ) : null}
          <DialogClose className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepButton({ direction, onStep, className, dark }: { direction: 1 | -1; onStep: (direction: 1 | -1) => void; className?: string; dark?: boolean }) {
  const Icon = direction === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={() => onStep(direction)}
      aria-label={direction === 1 ? "Next photo" : "Previous photo"}
      className={cn(
        "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full transition focus-visible:ring-3 focus-visible:outline-none",
        dark
          ? "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50"
          : "bg-white/90 text-denim-950 shadow-sm ring-1 ring-black/5 hover:bg-white focus-visible:ring-ring/40",
        className,
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
