import type { NextRequest } from "next/server";
import { adminDownload } from "@/lib/admin/download";

/** Every stock color with its sets in stock, as a CSV file (opens in Excel). */
export async function GET(request: NextRequest) {
  return adminDownload(request, "/v1/admin/stock/export");
}
