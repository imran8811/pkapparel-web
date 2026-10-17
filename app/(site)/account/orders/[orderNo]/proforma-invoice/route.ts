import type { NextRequest } from "next/server";
import { buyerDownload, ORDER_NO } from "@/lib/account/download";

/** Downloads the order's proforma invoice (PDF) for the logged-in buyer. */
export async function GET(request: NextRequest, { params }: RouteContext<"/account/orders/[orderNo]/proforma-invoice">) {
  const { orderNo } = await params;
  if (!ORDER_NO.test(orderNo)) return new Response("Not found", { status: 404 });
  return buyerDownload(request, `/v1/account/orders/${orderNo}/proforma`);
}
