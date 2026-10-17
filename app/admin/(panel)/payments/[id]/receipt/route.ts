import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** The receipt (PDF) of a confirmed payment. */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/payments/[id]/receipt">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/payments/${Number(id) || 0}/receipt`);
}
