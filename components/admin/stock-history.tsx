import { EmptyState, Pager } from "@/components/admin/page-parts";
import { STOCK_REASONS } from "@/lib/admin/labels";
import type { AdminStockMovement } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });

/** Every change to the stock, newest first: color, change, the stock after it, why, and who made it. */
export function StockHistory({
  movements,
  page,
  pages,
  href,
  showStyle = false,
}: {
  movements: AdminStockMovement[];
  page: number;
  pages: number;
  href: (page: number) => string;
  showStyle?: boolean;
}) {
  if (movements.length === 0) {
    return <EmptyState title="No stock changes yet">Changes appear here once sets are added or taken out.</EmptyState>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-cotton-50 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">
                When
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                {showStyle ? "Style and color" : "Color"}
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Change
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                In stock after
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Why
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                By
              </th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id} className="border-t align-top">
                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{when.format(new Date(movement.created_at))}</td>
                <td className="px-4 py-2.5">
                  {showStyle ? <span className="block">{movement.style_name}</span> : null}
                  {movement.color_name} <span className="font-mono text-xs text-muted-foreground">{movement.color_code}</span>
                </td>
                <td className={cn("px-4 py-2.5 text-right font-medium tabular-nums", movement.change_sets > 0 ? "text-emerald-700" : "text-stitch-700")}>
                  {movement.change_sets > 0 ? `+${movement.change_sets}` : movement.change_sets}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{movement.sets_after}</td>
                <td className="px-4 py-2.5">
                  {STOCK_REASONS[movement.reason] ?? movement.reason}
                  {movement.note ? <span className="block text-xs text-muted-foreground">{movement.note}</span> : null}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{movement.staff_name ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={pages} href={href} />
    </>
  );
}
