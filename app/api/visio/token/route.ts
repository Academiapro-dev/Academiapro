import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const THERAPEUTES: Record<string, { avatar_id: string; context_id: string }> = {
  "isabelle-morin": {
    avatar_id: "513fd1b7-7ef9-466d-9af2-344e51eeb833",
    context_id: "3d9908e3-6eb3-442e-bc25-ffbff5ba125d",
  },
  "default": {
    avatar_id: "513fd1b7-7ef9-466d-9af2-344e51eeb833",
    context_id: "3d9908e3-6eb3-442e-bc25-ffbff5ba125d",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { therapeute } = await req.json().catch(() => ({}));

    const config = THERAPEUTES[therapeute] || THERAPEUTES["default"];

    const response = await fetch("https://api.liveavatar.com/v2/embeddings", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.LIVEAVATAR_API_KEY || "",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        avatar_id: config.avatar_id,
        context_id: config.context_id,
        is_sandbox: false,
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
