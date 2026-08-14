import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LA FILE DE TRAVAIL LINKEDIN.
//
// AUCUNE INVITATION N EST ENVOYEE PAR CETTE ROUTE, ET C EST VOLONTAIRE.
// L API officielle de LinkedIn ne permet pas d envoyer des invitations ;
// tout ce qui le fait passe par l automatisation du navigateur, qui viole
// les conditions d utilisation et fait restreindre puis supprimer le
// compte. Jacques clique lui-meme, profil par profil, avec un mot
// personnalise — cette route ne fait qu ENREGISTRER ce qu il a fait.
//
// Elle sert donc a deux choses : ne jamais inviter deux fois la meme
// personne, et savoir combien d invitations sont parties cette semaine.
const TABLES: any = {
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
};

const STATUTS = ["invite", "accepte", "refuse"];

// Le plafond hebdomadaire de LinkedIn tourne autour de cent invitations.
// On se tient volontairement en dessous : un compte restreint ne se
// repare pas, et les invitations sans reponse comptent contre soi.
const PLAFOND_SEMAINE = 80;

export async function POST(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const body = await req.json();
    const base = String(body.base || "").trim();
    const id = body.id;
    const statut = String(body.statut || "invite").trim();

    const table = TABLES[base];
    if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
    if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });
    if (STATUTS.indexOf(statut) < 0) {
      return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
    }

    // Marquer « invite » pose la date ; corriger en accepte ou refuse la
    // conserve, sans quoi le compteur de la semaine serait fausse.
    const champs: any = { linkedin_statut: statut };
    if (statut === "invite") champs.linkedin_le = new Date().toISOString();

    const { error } = await supabase.from(table).update(champs).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Le compte des sept derniers jours, toutes bases confondues : c est
    // le compte LinkedIn qui est plafonne, pas chaque base.
    const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    let semaine = 0;
    for (const cle of Object.keys(TABLES)) {
      const { count } = await supabase
        .from(TABLES[cle])
        .select("id", { count: "exact", head: true })
        .not("linkedin_le", "is", null)
        .gte("linkedin_le", depuis);
      semaine += count || 0;
    }

    return NextResponse.json({
      ok: true,
      statut: statut,
      semaine: semaine,
      plafond: PLAFOND_SEMAINE,
      reste: Math.max(PLAFOND_SEMAINE - semaine, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Le compteur seul, pour l affichage au chargement de l ecran.
export async function GET() {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    let semaine = 0;
    let total = 0;
    for (const cle of Object.keys(TABLES)) {
      const { count: s } = await supabase
        .from(TABLES[cle])
        .select("id", { count: "exact", head: true })
        .not("linkedin_le", "is", null)
        .gte("linkedin_le", depuis);
      semaine += s || 0;

      const { count: t } = await supabase
        .from(TABLES[cle])
        .select("id", { count: "exact", head: true })
        .not("linkedin_le", "is", null);
      total += t || 0;
    }

    return NextResponse.json({
      ok: true,
      semaine: semaine,
      total: total,
      plafond: PLAFOND_SEMAINE,
      reste: Math.max(PLAFOND_SEMAINE - semaine, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
