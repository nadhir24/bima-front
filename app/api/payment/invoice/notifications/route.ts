import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Call your API endpoint with the token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payment/invoice/notifications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
