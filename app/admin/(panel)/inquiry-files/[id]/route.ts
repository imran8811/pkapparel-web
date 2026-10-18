import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** A file attached to a quote request (tech pack, spec sheet, photo). */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/inquiry-files/[id]">) {
  const { id } = await params;
  return adminDownload(request, `/v1/admin/inquiry-files/${Number(id) || 0}`);
}
