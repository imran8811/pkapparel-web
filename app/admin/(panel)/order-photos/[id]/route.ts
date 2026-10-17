import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** A production photo (?size=full for the large version; the preview otherwise). */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/order-photos/[id]">) {
  const { id } = await params;
  const size = request.nextUrl.searchParams.get("size") === "full" ? "full" : "preview";
  return adminDownload(request, `/v1/admin/order-photos/${Number(id) || 0}?size=${size}`, { inline: true });
}
