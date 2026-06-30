import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const THERAPEUTES: Record<string, { avatar_id: string; context_id: string }> = {
  "isabelle-morin": {
    avatar_id: "513fd1b7-7ef9-466d-9af2-344e51eeb833",
    context_id: "3d9908e3-6eb3-442e-bc25-ffbff5ba125d",
  },
  "sophie-laurent": {
    avatar_id: "260d706a-bf31-48fd-96d0-511553a9060e",
    context_id: "89fdd9a1-884c-4601-8a81-b30864e9afbf",
  },
  "marc-fontaine": {
    avatar_id: "91342979-4c4c-44f1-bd3b-1c846d20341e",
    context_id: "8be28d10-ee2b-41cb-bf73-72b2eb6ccb38",
  },
  "pierre-renaud": {
    avatar_id: "5761a14c-8720-4ce1-8c2b-3f351718fc79",
    context_id: "83849995-6f64-4864-b26a-ca382b32888b",
  },
  "sarah-mizrahi": {
    avatar_id: "40b4f000-f783-4bba-a327-ea58b1a6fdf2",
    context_id: "fbd41f33-7265-4110-bd7c-3bd82681bb55",
  },
  "claire-fontaine": {
    avatar_id: "075abc67-2fae-4548-8ca9-b815fcbd34c7",
    context_id: "bc559338-216b-45cd-a1e4-5b5a0d0b8790",
  },
  "laurent-benamou": {
    avatar_id: "0930fd59-c8ad-434d-ad53-b391a1768720",
    context_id: "1db54e70-fee8-4a93-96af-47fc57515302",
  },
  "alexandre-noir": {
    avatar_id: "e9844e6d-847e-4964-a92b-7ecd066f69df",
    context_id: "571be44e-1896-401c-8905-c8bfdf50047c",
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
