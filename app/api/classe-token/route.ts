import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: NextRequest) {
  const session = req.nextUrl.searchParams.get("session");
  const identite = req.nextUrl.searchParams.get("identite");

  if (!session || !identite) {
    return NextResponse.json(
      { erreur: "session et identite requis" },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { erreur: "configuration LiveKit manquante" },
      { status: 500 }
    );
  }

  // Creation du badge d'entree
  const at = new AccessToken(apiKey, apiSecret, {
    identity: identite,
    // Un stagiaire ne peut rester que 3h max dans la salle
    ttl: "3h",
  });

  at.addGrant({
    room: session,
    roomJoin: true,
    canPublish: true,       // micro/camera (fermes par defaut cote page)
    canSubscribe: true,     // voir et entendre les autres
    canPublishData: true,   // ecrire dans le chat
  });

  const token = await at.toJwt();
  return NextResponse.json({ token });
}
