import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** An empty file with the columns of the new-listings import, to fill in Excel. */
export async function GET(request: NextRequest) {
  return adminDownload(request, "/v1/admin/stock/import-listings/template");
}
