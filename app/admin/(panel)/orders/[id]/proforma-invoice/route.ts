import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** The order's proforma invoice (PDF), with the bank details. */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/orders/[id]/proforma-invoice">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/orders/${Number(id) || 0}/proforma`);
}
