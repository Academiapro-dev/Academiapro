import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const brut = req.cookies.get("sb_user")?.value ?? null;

  let decode: string | null = null;
  let parseDirect: unknown = null;
  let parseDecode: unknown = null;
  let erreurDirect: string | null = null;
  let erreurDecode: string | null = null;

  if (brut) {
    try {
      parseDirect = JSON.parse(brut);
    } catch (e) {
      erreurDirect = e instanceof Error ? e.message : String(e);
    }

    try {
      decode = decodeURIComponent(brut);
      parseDecode = JSON.parse(decode);
    } catch (e) {
      erreurDecode = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    cookie_present: brut !== null,
    cookie_brut: brut,
    parse_direct: parseDirect,
    erreur_parse_direct: erreurDirect,
    parse_apres_decode: parseDecode,
    erreur_parse_decode: erreurDecode,
    tous_les_cookies: req.cookies.getAll().map((c) => c.name),
  });
}
