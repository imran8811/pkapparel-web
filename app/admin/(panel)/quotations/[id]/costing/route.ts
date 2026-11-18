import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** The quotation's costing sheet for staff (every cost and the profit): downloaded, or opened with ?view=1. */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/quotations/[id]/costing">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/quotations/${Number(id) || 0}/costing`, { inline: request.nextUrl.searchParams.get("view") === "1", cache: false });
}
