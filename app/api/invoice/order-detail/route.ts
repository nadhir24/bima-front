import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) {
      return NextResponse.json(
        { success: false, message: "API URL not configured" },
        { status: 500 }
      );
    }

    const url = `${api}/payment/snap/order-detail?orderId=${encodeURIComponent(orderId)}`;

    const cookie = req.headers.get("cookie") || "";
    const userAgent = req.headers.get("user-agent") || undefined;
    const referer = req.headers.get("referer") || undefined;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(userAgent ? { "User-Agent": userAgent } : {}),
        ...(referer ? { Referer: referer } : {}),
      },
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
