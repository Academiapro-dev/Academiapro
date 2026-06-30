import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const THERAPEUTES: Record<string, { avatar_id: string; context_id: string }> = {
  "isabelle-morin": { avatar_id: "513fd1b7-7ef9-466d-9af2-344e51eeb833", context_id: "3d9908e3-6eb3-442e-bc25-ffbff5ba125d" },
  "sophie-laurent": { avatar_id: "260d706a-bf31-48fd-96d0-511553a9060e", context_id: "89fdd9a1-884c-4601-8a81-b30864e9afbf" },
  "marc-fontaine": { avatar_id: "91342979-4c4c-44f1-bd3b-1c846d20341e", context_id: "8be28d10-ee2b-41cb-bf73-72b2eb6ccb38" },
  "pierre-renaud": { avatar_id: "5761a14c-8720-4ce1-8c2b-3f351718fc79", context_id: "83849995-6f64-4864-b26a-ca382b32888b" },
  "sarah-mizrahi": { avatar_id: "40b4f000-f783-4bba-a327-ea58b1a6fdf2", context_id: "fbd41f33-7265-4110-bd7c-3bd82681bb55" },
  "claire-fontaine": { avatar_id: "075abc67-2fae-4548-8ca9-b815fcbd34c7", context_id: "bc559338-216b-45cd-a1e4-5b5a0d0b8790" },
  "laurent-benamou": { avatar_id: "64b526e4-741c-43b6-a918-4e40f3261c7a", context_id: "84077c1f-487d-4173-bc41-4e63600c0ea5" },
  "alexandre-noir": { avatar_id: "e9844e6d-847e-4964-a92b-7ecd066f69df", context_id: "571be44e-1896-401c-8905-c8bfdf50047c" },
  "lucas-martin": { avatar_id: "16141106-96b5-4dd9-9846-593728c5d0ed", context_id: "1660d1fd-7408-40bc-bbf2-fe7673b03b3b" },
  "henri-mercier": { avatar_id: "9650a758-1085-4d49-8bf3-f347565ec229", context_id: "00c5dd9c-e83c-402b-aa78-d8f01ca5381d" },
  "sophie-leblanc": { avatar_id: "260d706a-bf31-48fd-96d0-511553a9060e", context_id: "5ed9d978-983d-424b-bb8c-2530ff8226c4" },
  "sophie-marchand": { avatar_id: "513fd1b7-7ef9-466d-9af2-344e51eeb833", context_id: "7dbae29a-77e8-4dcb-b072-7577a7e14a31" },
  "clara-vidal": { avatar_id: "075abc67-2fae-4548-8ca9-b815fcbd34c7", context_id: "c11c743b-81a7-4521-aead-906d199bbd30" },
  "alain-rousseau": { avatar_id: "5761a14c-8720-4ce1-8c2b-3f351718fc79", context_id: "c1ad82ef-6d69-4bd0-a7bf-0b4c3c8f471a" },
  "thomas-berger": { avatar_id: "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a", context_id: "f6bd4a9e-aa83-4e55-86dd-77b20d5f1dc6" },
  "eleonore-petit": { avatar_id: "3f291b22-0267-4fb6-a25b-847fb63604b0", context_id: "9db8d2e5-7414-48d3-84e2-180acb16f7ed" },
  "nadia-benali": { avatar_id: "40b4f000-f783-4bba-a327-ea58b1a6fdf2", context_id: "434372a2-1d32-40ee-a751-8baad8a226d4" },
  "julien-castex": { avatar_id: "e9844e6d-847e-4964-a92b-7ecd066f69df", context_id: "31c99dd6-028d-4ce2-a712-42cee61d2c39" },
  "nathalie-ledoux": { avatar_id: "f86e8b45-3389-424a-b3d7-7f6e8729e36d", context_id: "7f340816-e334-4d4b-8544-cc2ffd1de561" },
  "rav-isaac-goldstein": { avatar_id: "0930fd59-c8ad-434d-ad53-b391a1768720", context_id: "29a6b602-6bb5-4624-9649-1f7e773d3472" },
  "default": { avatar_id: "513fd1b7-7ef9-466d-9af2-344e51eeb833", context_id: "3d9908e3-6eb3-442e-bc25-ffbff5ba125d" },
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
