import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { avatarId } = await req.json();

    const response = await fetch("https://api.liveavatar.com/v2/embeddings", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.LIVEAVATAR_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_id: avatarId || "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0",
        is_sandbox: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, url: data.data?.url });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
