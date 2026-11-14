import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** The invoice's PDF: downloaded, or opened in the browser with ?view=1 ("Preview PDF"). */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/invoices/[id]/pdf">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/invoices/${Number(id) || 0}/pdf`, { inline: request.nextUrl.searchParams.get("view") === "1", cache: false });
}
