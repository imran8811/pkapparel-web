import type { NextRequest } from "next/server";
import { buyerDownload, ORDER_NO } from "@/lib/account/download";

/** The invoice for the balance (PDF), issued when the order is ready to ship. */
export async function GET(request: NextRequest, { params }: RouteContext<"/account/orders/[orderNo]/invoice">) {
  const { orderNo } = await params;
  if (!ORDER_NO.test(orderNo)) return new Response("Not found", { status: 404 });
  return buyerDownload(request, `/v1/account/orders/${orderNo}/invoice`);
}
