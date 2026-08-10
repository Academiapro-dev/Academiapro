import { NextRequest, NextResponse } from "next/server";
import { NOM_COOKIE_SESSION, lireSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sonde de diagnostic. Elle ne renvoie AUCUN secret :
// seulement des presences, des longueurs et des comptes.
export async function GET(req: NextRequest) {
  const brut = req.headers.get("cookie") || "";

  const paires = brut
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const noms = paires.map((p) => {
    const i = p.indexOf("=");
    return i > 0 ? p.slice(0, i) : p;
  });

  const occurrences = noms.filter((n) => n === NOM_COOKIE_SESSION).length;

  const valeurs = paires
    .filter((p) => p.indexOf(NOM_COOKIE_SESSION + "=") === 0)
    .map((p) => p.slice(NOM_COOKIE_SESSION.length + 1));

  const details = valeurs.map((v, index) => {
    const morceaux = String(v).split(".");
    let charge: any = null;
    let emailLu: string | null = null;
    let expire: string | null = null;

    if (morceaux.length === 2) {
      try {
        charge = JSON.parse(
          Buffer.from(morceaux[0], "base64url").toString("utf8")
        );
        emailLu = charge && charge.email ? String(charge.email) : null;
        expire =
          charge && typeof charge.exp === "number"
            ? new Date(charge.exp).toISOString()
            : null;
      } catch (e) {
        charge = null;
      }
    }

    const session = lireSession(v);

    return {
      rang: index + 1,
      longueur: String(v).length,
      nombre_de_morceaux: morceaux.length,
      email_dans_la_charge: emailLu,
      expire_le: expire,
      expire_depasse:
        charge && typeof charge.exp === "number"
          ? Date.now() > charge.exp
          : null,
      signature_acceptee: session !== null,
      session_lue: session,
    };
  });

  let lectureViaHeaders: any = null;
  let erreurHeaders: string | null = null;
  try {
    const mod = await import("next/headers");
    const jar: any = (mod as any).cookies();
    if (jar && typeof jar.then === "function") {
      erreurHeaders = "cookies() renvoie une promesse : acces synchrone invalide";
      const resolu = await jar;
      lectureViaHeaders = resolu.get(NOM_COOKIE_SESSION)?.value ? "present" : "absent";
    } else {
      lectureViaHeaders = jar.get(NOM_COOKIE_SESSION)?.value ? "present" : "absent";
    }
  } catch (e: any) {
    erreurHeaders = String(e && e.message ? e.message : e);
  }

  return NextResponse.json({
    secret_present: Boolean(process.env.SESSION_SECRET),
    secret_longueur: (process.env.SESSION_SECRET || "").length,
    hote: req.headers.get("host"),
    tous_les_cookies: noms,
    occurrences_du_cookie_session: occurrences,
    details,
    lecture_via_next_headers: lectureViaHeaders,
    erreur_next_headers: erreurHeaders,
  });
}
