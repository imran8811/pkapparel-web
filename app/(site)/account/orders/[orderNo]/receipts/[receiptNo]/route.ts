import type { NextRequest } from "next/server";
import { buyerDownload, ORDER_NO, RECEIPT_NO } from "@/lib/account/download";

/** A payment receipt (PDF). */
export async function GET(request: NextRequest, { params }: RouteContext<"/account/orders/[orderNo]/receipts/[receiptNo]">) {
  const { orderNo, receiptNo } = await params;
  if (!ORDER_NO.test(orderNo) || !RECEIPT_NO.test(receiptNo)) return new Response("Not found", { status: 404 });
  return buyerDownload(request, `/v1/account/orders/${orderNo}/receipts/${receiptNo}`);
}
