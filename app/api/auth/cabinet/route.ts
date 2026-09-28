import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sessionCourante, fabriquerJetonSession, NOM_COOKIE_SESSION, DUREE_COOKIE_SECONDES,
} from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — PASSER D UN CABINET A L AUTRE
//
// Une personne peut appartenir a plusieurs cabinets : un collaborateur qui
// travaille pour deux cabinets, ou celui qui produit la paie de plusieurs
// cabinets en sous-traitance. Sa session, elle, ne porte qu UN cabinet a la
// fois (l organisme signe dans le jeton) : c est ce qui cloisonne tout.
//
//   GET   les cabinets de la personne, et celui qui est ouvert ;
//   POST  { tenant_id } : ouvre ce cabinet. La session signee est reecrite,
//         avec les MEMES reglages de cookie que la connexion
//         (app/api/auth/valider) — sinon deux cookies se feraient
//         concurrence. Le choix est retenu : la prochaine connexion
//         rouvrira ce cabinet.
// ⛔ ON NE PEUT OUVRIR QU UN CABINET OU L ON EST RATTACHE ET ACTIF : le
// tenant_id envoye par l ecran n est jamais cru sur parole.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function json(corps: any, statut?: number) {
  return NextResponse.json(corps, { status: statut || 200, headers: { "Cache-Control": "no-store" } });
}

async function rattachements(email: string): Promise<any[]> {
  const { data: uid } = await supabase.rpc("utilisateur_par_email", { p_email: email });
  if (!uid) return [];
  const { data: membres } = await supabase.from("compliance_membres")
    .select("tenant_id, role, profil, actif").eq("user_id", uid).eq("actif", true);
  const liste = (membres || []) as any[];
  if (liste.length === 0) return [];
  const ids = liste.map(function (m) { return String(m.tenant_id); });
  const { data: fiches } = await supabase.from("organismes_formation")
    .select("tenant_id, raison_sociale").in("tenant_id", ids);
  const noms: any = {};
  for (const f of (fiches || [])) noms[String((f as any).tenant_id)] = (f as any).raison_sociale;
  return liste.map(function (m) {
    return { tenant_id: String(m.tenant_id), role: m.role || null, profil: m.profil || null,
      nom: noms[String(m.tenant_id)] || "Cabinet sans nom" };
  }).sort(function (a, b) { return a.nom.localeCompare(b.nom, "fr"); });
}

export async function GET() {
  const session = sessionCourante();
  if (!session) return json({ ok: false, erreur: "Connectez-vous." }, 401);
  const cabinets = await rattachements(session.email);
  return json({ ok: true, courant: session.tenantId, cabinets: cabinets });
}

export async function POST(req: Request) {
  const session = sessionCourante();
  if (!session) return json({ ok: false, erreur: "Connectez-vous." }, 401);

  const corps: any = await req.json().catch(function () { return {}; });
  const voulu = String(corps.tenant_id || "").trim();
  if (!voulu) return json({ ok: false, erreur: "Cabinet manquant." }, 400);

  const cabinets = await rattachements(session.email);
  const cible = cabinets.filter(function (c) { return c.tenant_id === voulu; })[0];
  if (!cible) {
    return json({ ok: false, erreur: "Vous n'êtes pas rattaché à ce cabinet." }, 403);
  }

  // Le choix est retenu pour la prochaine connexion.
  const { data: uid } = await supabase.rpc("utilisateur_par_email", { p_email: session.email });
  if (uid) {
    await supabase.from("compliance_membres").update({ dernier_choix_le: new Date().toISOString() })
      .eq("user_id", uid).eq("tenant_id", voulu);
  }

  const reponse = json({ ok: true, message: "Vous travaillez maintenant pour « " + cible.nom + " ».",
    courant: voulu });
  reponse.cookies.set({
    name: NOM_COOKIE_SESSION,
    value: fabriquerJetonSession(session.email, voulu, cible.role),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_COOKIE_SECONDES,
  });
  return reponse;
}
