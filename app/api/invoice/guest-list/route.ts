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

    const res = await fetch(url, {
      method: "GET",
      // From server to server; avoid browser CORS/cookie issues
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
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
