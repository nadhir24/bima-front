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

    // Do NOT forward cookies to avoid backend auth on this public endpoint
    const userAgent = req.headers.get("user-agent") || undefined;
    const referer = req.headers.get("referer") || undefined;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(userAgent ? { "User-Agent": userAgent } : {}),
        ...(referer ? { Referer: referer } : {}),
      },
      // No credentials to avoid sending any cookies implicitly
      credentials: "omit",
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
