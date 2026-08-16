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
// compte. Jacques clique lui-meme — cette route ne fait qu ENREGISTRER.
const TABLES: any = {
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
};

// CINQ STATUTS.
//
// invite   : l invitation est partie, la date est posee, elle compte au quota.
// accepte  : la personne a accepte — c est la que le vrai message devient
//            possible, sans limite de caracteres et lu par quelqu un qui a
//            deja dit oui.
// relance  : le message long a ete envoye apres acceptation. Distinguer
//            « accepte » de « relance » evite d ecrire deux fois a la meme
//            personne, et mesure ce que la connexion a reellement produit.
// refuse   : la personne n a pas donne suite — c est SON choix.
// ecarte   : Jacques a decide de ne pas inviter — c est SA decision, prise
//            avant tout envoi.
const STATUTS = ["invite", "accepte", "relance", "refuse", "ecarte"];

// LE RYTHME, arrete le 16/08 : VINGT PAR JOUR, CENT PAR SEMAINE.
const PLAFOND_SEMAINE = 100;
const PLAFOND_JOUR = 20;

// Une fiche ecartee ne compte jamais : rien n a ete envoye.
async function compterDepuis(depuis: string): Promise<number> {
  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .not("linkedin_le", "is", null)
      .neq("linkedin_statut", "ecarte")
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

async function compterStatut(statut: string): Promise<number> {
  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .eq("linkedin_statut", statut);
    total += count || 0;
  }
  return total;
}

async function compteurs() {
  const jour = await compterDepuis(debutDuJour());
  const semaine = await compterDepuis(ilYaSeptJours());

  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .not("linkedin_le", "is", null)
      .neq("linkedin_statut", "ecarte");
    total += count || 0;
  }

  const en_attente = await compterStatut("invite");
  const acceptes = await compterStatut("accepte");
  const relances = await compterStatut("relance");
  const refuses = await compterStatut("refuse");
  const ecartes = await compterStatut("ecarte");

  // LE TAUX D ACCEPTATION se calcule sur ce qui a recu une reponse, pas
  // sur tout ce qui est parti : une invitation de la veille n a pas encore
  // eu le temps d etre acceptee, la compter comme un echec fausserait tout.
  const repondu = acceptes + relances + refuses;
  const taux = repondu > 0 ? Math.round(((acceptes + relances) / repondu) * 100) : null;

  return {
    jour, semaine, total,
    en_attente, acceptes, relances, refuses, ecartes,
    taux_acceptation: taux,
    plafond_jour: PLAFOND_JOUR,
    plafond_semaine: PLAFOND_SEMAINE,
    reste_jour: Math.max(PLAFOND_JOUR - jour, 0),
    reste_semaine: Math.max(PLAFOND_SEMAINE - semaine, 0),
  };
}

const COLONNES = "id, raison_sociale, ville, code_postal, siren, dirigeant_prenom, dirigeant_nom, linkedin, email, telephone, site_web, linkedin_le, linkedin_statut";

// LA FICHE SUIVANTE A INVITER : un profil connu, jamais sollicite,
// jamais ecarte.
async function suivante(base: string) {
  const table = TABLES[base];
  if (!table) return { erreur: "Base inconnue." };

  const { data, error } = await supabase
    .from(table)
    .select(COLONNES)
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte")
    .order("id", { ascending: true })
    .limit(1);

  if (error) return { erreur: error.message };
  if (!data || data.length === 0) return { fiche: null, epuise: true };

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte");

  return { fiche: data[0], restant: count || 0 };
}

// LA LISTE DES FICHES A UN STATUT DONNE, TOUTES BASES CONFONDUES.
//
// Sert a deux ecrans : « Mes invitations » (statut invite, en attente de
// reponse) et « A relancer » (statut accepte, message long a envoyer).
// La cle de base est renvoyee avec chaque ligne — sans elle, l ecran ne
// saurait pas dans quelle table ecrire au moment de marquer.
async function lister(statut: string, limite: number) {
  const lignes: any[] = [];
  for (const cle of Object.keys(TABLES)) {
    const { data } = await supabase
      .from(TABLES[cle])
      .select(COLONNES)
      .eq("linkedin_statut", statut)
      .order("linkedin_le", { ascending: true })
      .limit(limite);
    for (const l of (data || [])) lignes.push({ ...l, base: cle });
  }
  // Les plus anciennes d abord : une invitation qui date de trois semaines
  // merite une reponse avant celle d hier.
  lignes.sort(function (a, b) {
    return String(a.linkedin_le || "").localeCompare(String(b.linkedin_le || ""));
  });
  return lignes.slice(0, limite);
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

    if (action === "suivante") {
      const r: any = await suivante(base);
      if (r.erreur) return NextResponse.json({ ok: false, erreur: r.erreur }, { status: 400 });
      return NextResponse.json({ ok: true, ...r, compteurs: await compteurs() });
    }

    // Les invitations en attente de reponse.
    if (action === "en_attente") {
      const lignes = await lister("invite", 200);
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    // Les acceptations pas encore relancees.
    if (action === "a_relancer") {
      const lignes = await lister("accepte", 200);
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    const id = body.id;
    const statut = String(body.statut || "invite").trim();

    const table = TABLES[base];
    if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
    if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });
    if (STATUTS.indexOf(statut) < 0) {
      return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
    }

    // LE PLAFOND SE VERIFIE COTE SERVEUR, pas seulement a l ecran.
    // Il ne concerne QUE l invitation : marquer une acceptation ou envoyer
    // un message a quelqu un de deja connecte n est plafonne par rien.
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

    // La date d envoi initial est CONSERVEE quand on marque une reponse :
    // c est elle qui dit quand l invitation est partie, et le compteur de
    // la semaine s appuie dessus.
    const champs: any = { linkedin_statut: statut };
    if (statut === "invite" || statut === "ecarte") {
      champs.linkedin_le = new Date().toISOString();
    }

    const { error } = await supabase.from(table).update(champs).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Pour la file d invitation, on rend la fiche suivante dans la foulee.
    const suite: any = (statut === "invite" || statut === "ecarte") ? await suivante(base) : {};

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
