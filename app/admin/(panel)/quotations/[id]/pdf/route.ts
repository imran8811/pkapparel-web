import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** The quotation's PDF for the buyer (prices only): downloaded, or opened in the browser with ?view=1. */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/quotations/[id]/pdf">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/quotations/${Number(id) || 0}/pdf`, { inline: request.nextUrl.searchParams.get("view") === "1", cache: false });
}
