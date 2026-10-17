import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { apiFile, ApiError } from "@/lib/api";
import { SESSION_COOKIE, SESSION_ENDED } from "@/lib/account/session";

/**
 * Streams a private file of the buyer's order from the API (PDFs, shared documents, production photos),
 * with the buyer's login token. Photos are shown inline and may be cached privately for a while.
 */
export async function buyerDownload(request: NextRequest, path: string, options: { inline?: boolean } = {}): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url), 303);

  try {
    const file = await apiFile(path, { token });
    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `${options.inline ? "inline" : "attachment"}; filename="${file.filename}"`,
        // Photos never change once uploaded; documents are always fetched fresh.
        "Cache-Control": options.inline ? "private, max-age=3600" : "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return NextResponse.redirect(new URL(SESSION_ENDED, request.url), 303);
    if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
      return new NextResponse(error.message, { status: error.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    throw error;
  }
}

/** Order numbers and receipt numbers in URLs (anything else is refused before calling the API). */
export const ORDER_NO = /^PK-[0-9-]+$/;
export const RECEIPT_NO = /^RCPT-[0-9-]+$/;
