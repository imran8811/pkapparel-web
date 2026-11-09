"use client";

import { useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Minus, Plus, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { mediaSrc } from "@/lib/media";
import type { ProductImage } from "@/lib/shop";
import { cn } from "@/lib/utils";

/** Sideways movement, in pixels, that counts as a swipe. */
const SWIPE_DISTANCE = 40;

/** The large photo zooms up to 4 times; a double tap zooms to 2.5 times. */
const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;

/** How the large photo is zoomed: scale, and its shift from the middle in pixels. */
type View = { scale: number; x: number; y: number };
type Point = { x: number; y: number };
const UNZOOMED: View = { scale: 1, x: 0, y: 0 };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

  return (
    <div className="lg:sticky lg:top-28">
      <div className="relative aspect-[4/5] touch-pan-y touch-pinch-zoom overflow-hidden rounded-[2rem] bg-white ring-1 ring-border" {...main.handlers}>
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
            Photo {index + 1} of {count}. Pinch, double-tap or use the zoom buttons to see details.{" "}
            {count > 1 ? "Swipe, or use the arrows or arrow keys, for the other photos." : ""}
          </DialogDescription>
          {image ? (
            <ZoomableImage key={image.path} image={image} onSwipe={step} />
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

/**
 * The photo in the large view, zoomed with two fingers (pinch), a double tap or double click, the mouse wheel or the
 * buttons, and moved around with one finger or the mouse while zoomed. Unzoomed, a swipe shows the next photo. The
 * original upload (up to 2400 px) is shown, so zooming shows the details. Keyed by photo, so each opens unzoomed.
 */
function ZoomableImage({ image, onSwipe }: { image: ProductImage; onSwipe: (direction: 1 | -1) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  // The gesture under way: the view and touch points it started from.
  const gesture = useRef<{ view: View; start: Point; spread: number; anchor: Point; moved: boolean; swipe: boolean } | null>(null);
  const lastTap = useRef(0);
  const [view, setView] = useState<View>(UNZOOMED);
  // The newest view for the handlers: pinch and wheel events can come faster than the photo is drawn.
  const latest = useRef<View>(UNZOOMED);
  const apply = (next: View) => {
    latest.current = next;
    setView(next);
  };
  const [touching, setTouching] = useState(false);

  /** Keeps the scale between 1 and MAX_ZOOM, and the photo covering its frame. */
  const fit = (next: View): View => {
    const rect = box.current?.getBoundingClientRect();
    const scale = clamp(next.scale, 1, MAX_ZOOM);
    if (!rect || scale <= 1.01) return UNZOOMED;
    const maxX = ((scale - 1) * rect.width) / 2;
    const maxY = ((scale - 1) * rect.height) / 2;
    return { scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  };

  /** Zooms to scale, keeping the point of the photo that was at anchor under to (screen coordinates). */
  const zoomTo = (from: View, scale: number, anchor: Point, to: Point = anchor): View => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return from;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const photoX = (anchor.x - centerX - from.x) / from.scale;
    const photoY = (anchor.y - centerY - from.y) / from.scale;
    const next = clamp(scale, 1, MAX_ZOOM);
    return fit({ scale: next, x: to.x - centerX - next * photoX, y: to.y - centerY - next * photoY });
  };

  const center = (): Point => {
    const rect = box.current?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 };
  };

  const begin = (current: View, swipe: boolean) => {
    const points = [...pointers.current.values()];
    gesture.current =
      points.length >= 2
        ? { view: current, start: middle(points[0], points[1]), spread: distance(points[0], points[1]), anchor: middle(points[0], points[1]), moved: true, swipe: false }
        : { view: current, start: points[0], spread: 0, anchor: points[0], moved: false, swipe };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setTouching(true);
    // A second finger turns a swipe or a move into a pinch.
    begin(latest.current, pointers.current.size === 1);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const now = gesture.current;
    if (points.length >= 2 && now.spread > 0) {
      apply(zoomTo(now.view, now.view.scale * (distance(points[0], points[1]) / now.spread), now.anchor, middle(points[0], points[1])));
      return;
    }
    const dx = points[0].x - now.start.x;
    const dy = points[0].y - now.start.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) now.moved = true;
    if (now.view.scale > 1) apply(fit({ scale: now.view.scale, x: now.view.x + dx, y: now.view.y + dy }));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    const ended = gesture.current;
    if (pointers.current.size > 0) {
      // One finger left after a pinch: it moves the zoomed photo from here, and never swipes.
      begin(latest.current, false);
      return;
    }
    gesture.current = null;
    setTouching(false);
    if (!ended) return;

    const dx = event.clientX - ended.start.x;
    const dy = event.clientY - ended.start.y;
    if (ended.swipe && ended.view.scale === 1 && Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) {
      onSwipe(dx < 0 ? 1 : -1);
      return;
    }
    if (ended.moved) return;
    // A tap: two in a row zoom in on that spot, or back out.
    const now = event.timeStamp;
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      const current = latest.current;
      apply(current.scale > 1 ? UNZOOMED : zoomTo(current, TAP_ZOOM, { x: event.clientX, y: event.clientY }));
    } else {
      lastTap.current = now;
    }
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const current = latest.current;
    apply(zoomTo(current, current.scale * Math.exp(-event.deltaY * 0.002), { x: event.clientX, y: event.clientY }));
  };

  const zoomed = view.scale > 1;

  return (
    <>
      <div
        ref={box}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className={cn("absolute inset-x-2 top-16 bottom-16 touch-none overflow-hidden select-none sm:inset-x-20", zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
      >
        <div
          className={cn("absolute inset-0 will-change-transform", !touching && "transition-transform duration-200 ease-out")}
          style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
        >
          <Image src={mediaSrc(image.path)} alt={image.alt} fill unoptimized draggable={false} className="pointer-events-none object-contain" />
        </div>
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-full bg-white/10 p-1 sm:left-5">
        <button
          type="button"
          onClick={() => apply(zoomTo(latest.current, latest.current.scale / 1.5, center()))}
          disabled={!zoomed}
          aria-label="Zoom out"
          className="grid size-9 place-items-center rounded-full text-white transition hover:bg-white/15 disabled:opacity-40"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => apply(UNZOOMED)}
          disabled={!zoomed}
          aria-label="Show the whole photo"
          className="min-w-12 rounded-full px-2 font-mono text-xs text-white tabular-nums transition hover:bg-white/15 disabled:hover:bg-transparent"
        >
          {Math.round(view.scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => apply(zoomTo(latest.current, latest.current.scale * 1.5, center()))}
          disabled={view.scale >= MAX_ZOOM}
          aria-label="Zoom in"
          className="grid size-9 place-items-center rounded-full text-white transition hover:bg-white/15 disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </>
  );
}
