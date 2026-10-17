import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** The order's balance invoice (PDF), issued when it was marked ready to ship. */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/orders/[id]/invoice">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/orders/${Number(id) || 0}/invoice`);
}
