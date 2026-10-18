import { Check, Circle, ExternalLink, FileDown, FileText, LoaderCircle, Ship } from "lucide-react";
import { shortDate } from "@/components/account/order-parts";
import type { Order, OrderDocumentItem, ProductionPhoto, ProductionStage, Shipment } from "@/lib/account/types";
import { cn } from "@/lib/utils";

/* Production, documents and shipment of an order: shared by the buyer's order page and the admin. */

/** "Due 12 Nov 2026 (in 9 days)" / "3 days late" while the order waits for production or is in it; null otherwise. */
export function dueText(order: Pick<Order, "status" | "production_due_on" | "production_days_left">): string | null {
  if (!order.production_due_on || !["confirmed", "in_production", "on_hold"].includes(order.status)) return null;
  const days = order.production_days_left;
  const when = shortDate(order.production_due_on);
  if (days === null) return `Ready date ${when}`;
  if (days < 0) return `Due ${when} (${-days} ${days === -1 ? "day" : "days"} late)`;
  if (days === 0) return `Due today (${when})`;
  return `Due ${when} (in ${days} ${days === 1 ? "day" : "days"})`;
}

/** Where the order stands on its way to the buyer, for the Delivery panel; null for a cancelled order. */
export function readyText(
  order: Pick<Order, "kind" | "status" | "production_due_on" | "production_days_left" | "lead_time_days" | "shipment" | "shipped_at" | "delivered_at">,
): string | null {
  const shippedOn = order.shipment?.shipped_on ?? order.shipped_at;
  switch (order.status) {
    case "cancelled":
      return null;
    case "ready_to_ship":
      return "Production is finished.";
    case "shipped":
      return shippedOn ? `Shipped ${shortDate(shippedOn)}` : "Shipped";
    case "delivered":
      return order.delivered_at ? `Delivered ${shortDate(order.delivered_at)}` : "Delivered";
    default:
      return dueText(order) ?? `Ready about ${order.lead_time_days} days after the ${order.kind === "sample" ? "payment" : "deposit"} is confirmed.`;
  }
}

export function ProductionTimeline({
  stages,
  photos,
  photoSrc,
}: {
  stages: ProductionStage[];
  photos: ProductionPhoto[];
  /** URL of a photo: the preview, or the full size when `full` is set. */
  photoSrc: (id: number, full: boolean) => string;
}) {
  return (
    <ol className="grid gap-4">
      {stages.map((stage) => {
        const stagePhotos = photos.filter((photo) => photo.stage === stage.key);
        return (
          <li key={stage.key} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
            <span
              className={cn(
                "mt-0.5 grid size-7 place-items-center rounded-full",
                stage.status === "done" && "bg-emerald-600 text-white",
                stage.status === "in_progress" && "bg-denim-600 text-white",
                stage.status === "not_started" && "bg-cotton-200 text-muted-foreground",
              )}
              aria-hidden
            >
              {stage.status === "done" ? <Check className="size-4" /> : stage.status === "in_progress" ? <LoaderCircle className="size-4" /> : <Circle className="size-3" />}
            </span>
            <div className="min-w-0">
              <p className={cn("font-medium", stage.status === "not_started" && "text-muted-foreground")}>
                {stage.label}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {stage.status === "done"
                    ? `done ${shortDate(stage.completed_on)}`
                    : stage.status === "in_progress"
                      ? `started ${shortDate(stage.started_on)}`
                      : ""}
                </span>
              </p>
              {stage.note ? <p className="mt-0.5 text-sm text-muted-foreground">{stage.note}</p> : null}
              {stagePhotos.length > 0 ? <PhotoGrid photos={stagePhotos} photoSrc={photoSrc} /> : null}
            </div>
          </li>
        );
      })}
      {photos.some((photo) => photo.stage === null) ? (
        <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
          <span />
          <div className="min-w-0">
            <p className="font-medium">More photos</p>
            <PhotoGrid photos={photos.filter((photo) => photo.stage === null)} photoSrc={photoSrc} />
          </div>
        </li>
      ) : null}
    </ol>
  );
}

function PhotoGrid({ photos, photoSrc }: { photos: ProductionPhoto[]; photoSrc: (id: number, full: boolean) => string }) {
  return (
    <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.id}>
          <a href={photoSrc(photo.id, true)} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-xl bg-cotton-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- private photo, served with the login cookie by a route handler */}
            <img src={photoSrc(photo.id, false)} alt={photo.caption ?? "Production photo"} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
          </a>
          {photo.caption ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{photo.caption}</p> : null}
        </li>
      ))}
    </ul>
  );
}

const SIZE_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** "240 KB" / "1.4 MB" */
function fileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${SIZE_FORMAT.format(bytes / 1024 / 1024)} MB`;
}

export function DocumentList({
  documents,
  href,
  action,
}: {
  documents: OrderDocumentItem[];
  href: (document: OrderDocumentItem) => string;
  /** Something shown next to a document, e.g. a delete button in the admin. */
  action?: (document: OrderDocumentItem) => React.ReactNode;
}) {
  return (
    <ul className="divide-y divide-border">
      {documents.map((document) => (
        <li key={document.kind === "file" ? `file-${document.id}` : `${document.kind}-${document.number}`} className="flex items-center gap-2">
          <a href={href(document)} download className="flex min-w-0 flex-1 items-center gap-3 py-3 text-sm hover:text-denim-600">
            <FileText aria-hidden className="size-5 shrink-0 text-denim-600" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{document.title}</span>
              <span className="block text-xs text-muted-foreground">
                {document.kind === "file"
                  ? `${document.type_label} · ${shortDate(document.date)} · ${fileSize(document.size_bytes)}`
                  : `${document.number}${document.date ? ` · ${shortDate(document.date)}` : ""}`}
                {document.kind === "file" && document.is_public === false ? " · staff only" : ""}
              </span>
            </span>
            <FileDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </a>
          {action ? action(document) : null}
        </li>
      ))}
    </ul>
  );
}

export function ShipmentCard({ shipment }: { shipment: Shipment }) {
  return (
    <div className="grid gap-2 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <Ship aria-hidden className="size-4 text-denim-600" /> {shipment.carrier}, shipped {shortDate(shipment.shipped_on)}
      </p>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-[8rem_minmax(0,1fr)]">
        {shipment.tracking_no ? (
          <>
            <dt>Tracking number</dt>
            <dd className="font-mono text-foreground">{shipment.tracking_no}</dd>
          </>
        ) : null}
        {shipment.cartons ? (
          <>
            <dt>Cartons</dt>
            <dd className="text-foreground">{shipment.cartons}</dd>
          </>
        ) : null}
        {shipment.gross_g ? (
          <>
            <dt>Gross weight</dt>
            <dd className="text-foreground">{(shipment.gross_g / 1000).toFixed(1)} kg</dd>
          </>
        ) : null}
      </dl>
      {shipment.note ? <p className="text-muted-foreground">{shipment.note}</p> : null}
      {shipment.tracking_url ? (
        <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-denim-600 hover:underline">
          Track the shipment <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </div>
  );
}
