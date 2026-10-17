import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** A file attached to an order (commercial invoice, packing list, B/L or AWB, QC report…). */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/order-documents/[id]">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/order-documents/${Number(id) || 0}`);
}
