import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** The transfer slip a buyer attached to a payment report (a private file). */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/payments/[id]/slip">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/payments/${Number(id) || 0}/slip`);
}
