import type { NextRequest } from "next/server";
import { buyerDownload, ORDER_NO } from "@/lib/account/download";

/** A production photo of the order (?size=full for the large version; the preview otherwise). */
export async function GET(request: NextRequest, { params }: RouteContext<"/account/orders/[orderNo]/photos/[id]">) {
  const { orderNo, id } = await params;
  if (!ORDER_NO.test(orderNo) || !/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const size = request.nextUrl.searchParams.get("size") === "full" ? "full" : "preview";
  return buyerDownload(request, `/v1/account/orders/${orderNo}/photos/${id}?size=${size}`, { inline: true });
}
