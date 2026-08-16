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

// LE RYTHME, arrete le 16/08 : VINGT PAR JOUR, CENT PAR SEMAINE.
//
// LinkedIn tolere environ une centaine d invitations hebdomadaires et
// bloque si trop d entre elles restent sans reponse. Le plafond quotidien
// compte autant que l hebdomadaire : epuiser sa semaine en deux jours est
// precisement le comportement qui ressemble a une automatisation.
const PLAFOND_SEMAINE = 100;
const PLAFOND_JOUR = 20;

// Le compte des invitations sur une periode, toutes bases confondues :
// c est LE COMPTE LINKEDIN qui est plafonne, pas chaque base.
async function compterDepuis(depuis: string): Promise<number> {
  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .not("linkedin_le", "is", null)
      .gte("linkedin_le", depuis);
    total += count || 0;
  }
  return total;
}

function debutDuJour(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function ilYaSeptJours(): string {
  return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
}

async function compteurs() {
  const jour = await compterDepuis(debutDuJour());
  const semaine = await compterDepuis(ilYaSeptJours());

  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .not("linkedin_le", "is", null);
    total += count || 0;
  }

  return {
    jour: jour,
    semaine: semaine,
    total: total,
    plafond_jour: PLAFOND_JOUR,
    plafond_semaine: PLAFOND_SEMAINE,
    reste_jour: Math.max(PLAFOND_JOUR - jour, 0),
    reste_semaine: Math.max(PLAFOND_SEMAINE - semaine, 0),
  };
}

// LA FICHE SUIVANTE A INVITER.
//
// Un profil connu, jamais sollicite, dans la base demandee. On sert UNE
// fiche a la fois : c est ce qui permet d enchainer sans chercher ou on en
// etait, et ce qui evite de charger cinquante lignes pour n en traiter une.
async function suivante(base: string) {
  const table = TABLES[base];
  if (!table) return { erreur: "Base inconnue." };

  const { data, error } = await supabase
    .from(table)
    .select("id, raison_sociale, ville, code_postal, siren, dirigeant_prenom, dirigeant_nom, linkedin, email, telephone, site_web")
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .order("id", { ascending: true })
    .limit(1);

  if (error) return { erreur: error.message };
  if (!data || data.length === 0) return { fiche: null, epuise: true };

  // Ce qui reste a faire dans cette base, pour situer l effort.
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .not("linkedin", "is", null)
    .is("linkedin_le", null);

  return { fiche: data[0], restant: count || 0 };
}

export async function POST(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "marquer").trim();
    const base = String(body.base || "").trim();

    // La fiche suivante a traiter, sans rien modifier.
    if (action === "suivante") {
      const r: any = await suivante(base);
      if (r.erreur) return NextResponse.json({ ok: false, erreur: r.erreur }, { status: 400 });
      return NextResponse.json({ ok: true, ...r, compteurs: await compteurs() });
    }

    // L enregistrement de ce qui a ete fait a la main.
    const id = body.id;
    const statut = String(body.statut || "invite").trim();

    const table = TABLES[base];
    if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
    if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });
    if (STATUTS.indexOf(statut) < 0) {
      return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
    }

    // LE PLAFOND SE VERIFIE COTE SERVEUR, pas seulement a l ecran : un
    // bouton grise se contourne, une regle en base non.
    if (statut === "invite") {
      const c = await compteurs();
      if (c.reste_jour <= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Plafond du jour atteint (" + PLAFOND_JOUR + "). Reprenez demain.",
          compteurs: c,
        }, { status: 429 });
      }
      if (c.reste_semaine <= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Plafond de la semaine atteint (" + PLAFOND_SEMAINE + "). Attendez quelques jours.",
          compteurs: c,
        }, { status: 429 });
      }
    }

    // Marquer « invite » pose la date ; corriger en accepte ou refuse la
    // conserve, sans quoi le compteur de la semaine serait fausse.
    const champs: any = { linkedin_statut: statut };
    if (statut === "invite") champs.linkedin_le = new Date().toISOString();

    const { error } = await supabase.from(table).update(champs).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // On rend la fiche suivante dans la foulee : l ecran enchaine sans
    // avoir a redemander.
    const suite: any = base ? await suivante(base) : {};

    return NextResponse.json({
      ok: true,
      statut: statut,
      compteurs: await compteurs(),
      fiche: suite.fiche || null,
      restant: suite.restant,
      epuise: suite.epuise || false,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Les compteurs seuls, pour l affichage au chargement de l ecran.
export async function GET() {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }
    return NextResponse.json({ ok: true, ...(await compteurs()) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
