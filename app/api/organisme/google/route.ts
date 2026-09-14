import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LA CONNEXION A GOOGLE AGENDA — 14/09.
//
// TROIS ROUTES, ET CELLE-CI EST LA PREMIERE :
//   connexion  — emmene le client chez Google pour qu il autorise
//   retour     — recoit l autorisation et garde les jetons
//   evenement  — pose un rendez-vous dans son agenda
//
// 🚨 CHAQUE CLIENT CONNECTE SON PROPRE AGENDA. Les jetons vivent dans
// organisme_google, bornes au tenant : personne ne voit l agenda d un
// autre, et l editeur pas davantage.
//
// ⚠️ `access_type=offline` ET `prompt=consent` SONT OBLIGATOIRES. Sans le
// premier, Google ne donne pas de jeton de rafraichissement et la
// connexion meurt au bout d une heure. Sans le second, il ne le redonne
// pas a la deuxieme connexion — et on se retrouve avec un client connecte
// qui cesse de fonctionner le lendemain, sans rien pour le rattraper.
//
// ⚠️ L ETAT (`state`) EST SIGNE. Il porte le tenant : sans signature,
// n importe qui pourrait rattacher SON agenda au compte d un autre en
// modifiant l adresse de retour.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const PORTEE = "https://www.googleapis.com/auth/calendar.events";

function sceau(charge: string): string {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(charge).digest("hex");
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  const email = emailDeSession();
  if (!tenant) {
    return NextResponse.json({ ok: false, erreur: "Connectez-vous à votre espace." }, { status: 401 });
  }

  const id = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const retour = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (!id || !retour) {
    return NextResponse.json({ ok: false, erreur: "La connexion à Google n'est pas configurée." }, { status: 503 });
  }

  const url = new URL(req.url);

  // ---- L ETAT DE LA CONNEXION ----
  if (url.searchParams.get("etat") === "1") {
    const { data } = await supabase
      .from("organisme_google")
      .select("email, calendar_id, actif, connecte_le, expire_le")
      .eq("tenant_id", tenant).maybeSingle();
    return NextResponse.json({ ok: true, connecte: !!(data && data.actif), compte: data || null });
  }

  // ---- DECONNECTER ----
  //
  // ⚠️ ON GARDE LA LIGNE, ON EFFACE LES JETONS. La date de connexion et le
  // compte restent lisibles : « vous aviez connecté tel agenda le tel
  // jour » vaut mieux qu une ligne disparue.
  if (url.searchParams.get("deconnecter") === "1") {
    await supabase.from("organisme_google").update({
      access_token: null, refresh_token: null, expire_le: null,
      actif: false, maj_le: new Date().toISOString(),
    }).eq("tenant_id", tenant);
    return NextResponse.json({ ok: true, message: "Agenda déconnecté. Les rendez-vous déjà créés restent dans votre agenda." });
  }

  // ---- ALLER CHEZ GOOGLE ----
  const charge = tenant + "|" + Date.now();
  const etat = charge + "|" + sceau(charge);

  const vers = "https://accounts.google.com/o/oauth2/v2/auth"
    + "?client_id=" + encodeURIComponent(id)
    + "&redirect_uri=" + encodeURIComponent(retour)
    + "&response_type=code"
    + "&scope=" + encodeURIComponent(PORTEE)
    + "&access_type=offline"
    + "&prompt=consent"
    + "&include_granted_scopes=true"
    + "&state=" + encodeURIComponent(etat)
    + (email ? "&login_hint=" + encodeURIComponent(email) : "");

  // Une redirection franche : le client part chez Google, revient sur la
  // route de retour. ⚠️ PAS DE JSON ICI : un lien doit emmener quelque part.
  return NextResponse.redirect(vers);
}
