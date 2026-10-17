import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { apiFile, ApiError } from "@/lib/api";
import { ADMIN_COOKIE } from "@/lib/admin/session";

/**
 * Streams a private file from the admin API (invoices, receipts, payment slips, documents, production photos)
 * to a logged-in staff member. Photos are shown inline and may be cached privately for a while.
 */
export async function adminDownload(request: NextRequest, path: string, options: { inline?: boolean } = {}): Promise<NextResponse> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  try {
    const file = await apiFile(path, { token });
    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `${options.inline ? "inline" : "attachment"}; filename="${file.filename}"`,
        "Cache-Control": options.inline ? "private, max-age=3600" : "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return NextResponse.redirect(new URL("/admin/session-ended", request.url), 303);
    if (error instanceof ApiError && [403, 404, 409].includes(error.status)) {
      return new NextResponse(error.message, { status: error.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    throw error;
  }
}
