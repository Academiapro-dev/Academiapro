import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { avatarId } = await req.json().catch(() => ({}));

    const response = await fetch("https://api.liveavatar.com/v2/embeddings", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.LIVEAVATAR_API_KEY || "",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        avatar_id: avatarId || "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0",
        context_id: "158f5d55-2d4f-11f1-8d28-066a7fa2e369",
        is_sandbox: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, url: data.data?.url, script: data.data?.script });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
