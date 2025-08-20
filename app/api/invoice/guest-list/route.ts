import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    if (!guestId) {
      return NextResponse.json({ success: false, message: "guestId is required" }, { status: 400 });
    }

    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) {
      return NextResponse.json({ success: false, message: "API URL not configured" }, { status: 500 });
    }

    const url = `${api}/payment/invoice/guest-list?guestId=${encodeURIComponent(guestId)}&page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;

    // Forward the caller's cookies so the backend can validate the same guest session
    const cookie = req.headers.get("cookie") || "";
    const userAgent = req.headers.get("user-agent") || undefined;
    const referer = req.headers.get("referer") || undefined;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      // Important: forward cookies so Rails/Nest session middleware can match guestId
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(userAgent ? { "User-Agent": userAgent } : {}),
        ...(referer ? { Referer: referer } : {}),
      },
      // Ensure the fetch library keeps cookies attached in node runtime (harmless if none)
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Proxy error" },
      { status: 500 }
    );
  }
}
