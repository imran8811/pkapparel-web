import type { NextRequest } from "next/server";
import { buyerDownload, ORDER_NO } from "@/lib/account/download";

/** A file staff shared on the order (commercial invoice, packing list, B/L or AWB, QC report…). */
export async function GET(request: NextRequest, { params }: RouteContext<"/account/orders/[orderNo]/documents/[id]">) {
  const { orderNo, id } = await params;
  if (!ORDER_NO.test(orderNo) || !/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  return buyerDownload(request, `/v1/account/orders/${orderNo}/documents/${id}`);
}
