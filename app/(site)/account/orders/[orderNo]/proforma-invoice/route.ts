import { NextResponse, type NextRequest } from "next/server";
import { apiFile, ApiError } from "@/lib/api";
import { SESSION_COOKIE, SESSION_ENDED } from "@/lib/account/session";

/** Downloads the order's proforma invoice (PDF) for the logged-in buyer. */
export async function GET(request: NextRequest, { params }: RouteContext<"/account/orders/[orderNo]/proforma-invoice">) {
  const { orderNo } = await params;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url), 303);
  if (!/^PK-[0-9-]+$/.test(orderNo)) return new NextResponse("Not found", { status: 404 });

  try {
    const file = await apiFile(`/v1/account/orders/${orderNo}/proforma`, { token });
    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "private, no-store",
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
