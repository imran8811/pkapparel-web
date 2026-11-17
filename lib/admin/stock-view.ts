import { cookies } from "next/headers";

/** How the stock list shows its listings: as rows, or as cards with bigger photos. Each browser keeps its choice. */
export type StockView = "list" | "cards";

export const STOCK_VIEW_COOKIE = "pk_admin_stock_view";

/** The view chosen in this browser: rows until cards are chosen (see setStockView). */
export async function getStockView(): Promise<StockView> {
  return (await cookies()).get(STOCK_VIEW_COOKIE)?.value === "cards" ? "cards" : "list";
}
