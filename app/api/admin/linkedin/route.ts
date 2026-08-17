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

// QUATRE SOURCES, DONT UNE MANUELLE.
//
// Les trois premieres viennent de l open data enrichi. LA QUATRIEME,
// « manuel », pointe sur la table crm et recoit les profils que Jacques
// trouve LUI-MEME sur LinkedIn, au fil de son fil d actualite.
//
// POURQUOI LA TABLE crm ET PAS UNE QUATRIEME TABLE DE PROSPECTION : ces
// profils n ont PAS D ADRESSE, seulement un lien LinkedIn. Les loger dans le
// CRM leur donne d emblee un score, un statut commercial et un historique.
const TABLES: any = {
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  manuel: "crm",
};

// SEPT STATUTS, ET LA DISTINCTION AVEC OU SANS NOTE EST LA PLUS UTILE.
//
// invite      : partie AVEC une note personnalisee.
// invite_nu   : partie SANS note — LinkedIn plafonne les notes a quelques
//               unes par mois en compte gratuit.
// accepte / accepte_nu : la personne a accepte.
// relance     : le message long a ete envoye apres acceptation.
// refuse      : sans suite.
// ecarte      : decision de Jacques avant tout envoi.
const STATUTS = ["invite", "invite_nu", "accepte", "accepte_nu", "relance", "refuse", "ecarte"];

const EN_ATTENTE = ["invite", "invite_nu"];
const ACCEPTES = ["accepte", "accepte_nu"];

const PLAFOND_SEMAINE = 100;
const PLAFOND_JOUR = 20;

// 🚨 MILLE LIGNES, ET NON DEUX CENTS — porte le 17/08 au soir.
//
// A vingt invitations par jour, le plafond de 200 etait atteint en DIX
// JOURS : au-dela, les fiches les plus recentes n apparaissaient plus dans
// les listes, sans aucun avertissement. Mille lignes couvrent cinquante
// jours. La recherche de l ecran filtre ensuite dans ce qui est charge.
const LIMITE_LISTE = 1000;

// 🚨🚨 LE JOUR SE COMPTE A PARIS, PAS EN TEMPS UNIVERSEL — corrige le 18/08.
//
// LE DEFAUT, ET IL DUPAIT L UTILISATEUR CHAQUE NUIT. Cette fonction faisait
// `d.setHours(0,0,0,0)`, qui travaille dans le fuseau DU SERVEUR. Or Vercel
// tourne en UTC. A 1 h 30 du matin a Paris, il est 23 h 30 LA VEILLE pour le
// serveur : le « debut du jour » calcule renvoyait donc au matin de la
// veille, et le compteur additionnait encore les vingt invitations deja
// faites. ENTRE MINUIT ET DEUX HEURES DU MATIN, LE QUOTA NE SE REMETTAIT
// JAMAIS A ZERO et tous les boutons restaient grises.
//
// Jacques l a constate a 1 h 30 : « nous sommes le lendemain, il est 1 h 30
// du matin » — et il travaillait effectivement, comme souvent.
//
// COMMENT C EST CALCULE MAINTENANT : on mesure le decalage reel entre Paris
// et le temps universel a cet instant precis — ce qui gere l heure d ete et
// l heure d hiver sans table ni condition — puis on ramene minuit heure de
// Paris a l instant universel correspondant.
//
// ⚠️ NE PAS REVENIR A setHours() : la correction serait annulee, et le
// defaut ne se verrait qu apres minuit, quand personne ne teste.
function decalageParisEnMs(d: Date): number {
  const aParis = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const enUTC = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return aParis.getTime() - enUTC.getTime();
}

function debutDuJour(): string {
  const maintenant = new Date();
  const decalage = decalageParisEnMs(maintenant);
  // L instant courant, vu comme l heure affichee a une horloge parisienne.
  const murale = new Date(maintenant.getTime() + decalage);
  murale.setUTCHours(0, 0, 0, 0);
  // Retour a l instant reel correspondant a minuit parisien.
  return new Date(murale.getTime() - decalage).toISOString();
}

// La semaine est GLISSANTE — sept jours en arriere depuis maintenant. Elle
// n a donc pas besoin de la correction de fuseau.
function ilYaSeptJours(): string {
  return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
}

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

async function compterStatuts(statuts: string[]): Promise<number> {
  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .in("linkedin_statut", statuts);
    total += count || 0;
  }
  return total;
}

function taux(acceptes: number, refuses: number) {
  const repondu = acceptes + refuses;
  return repondu > 0 ? Math.round((acceptes / repondu) * 100) : null;
}

async function compteurs() {
  const jour = await compterDepuis(debutDuJour());
  const semaine = await compterDepuis(ilYaSeptJours());

  const attente_note = await compterStatuts(["invite"]);
  const attente_nu = await compterStatuts(["invite_nu"]);
  const accepte_note = await compterStatuts(["accepte"]);
  const accepte_nu = await compterStatuts(["accepte_nu"]);
  const relances = await compterStatuts(["relance"]);
  const refuses = await compterStatuts(["refuse"]);
  const ecartes = await compterStatuts(["ecarte"]);

  // LE TAUX SE CALCULE SUR CE QUI A RECU UNE REPONSE, pas sur tout ce qui
  // est parti : une invitation d hier n a pas eu le temps d etre acceptee.
  return {
    jour, semaine,
    en_attente: attente_note + attente_nu,
    attente_note, attente_nu,
    acceptes: accepte_note + accepte_nu,
    accepte_note, accepte_nu,
    relances, refuses, ecartes,
    taux_note: taux(accepte_note, 0) === null ? null : taux(accepte_note + relances * 0, refuses),
    taux_global: taux(accepte_note + accepte_nu + relances, refuses),
    plafond_jour: PLAFOND_JOUR,
    plafond_semaine: PLAFOND_SEMAINE,
    reste_jour: Math.max(PLAFOND_JOUR - jour, 0),
    reste_semaine: Math.max(PLAFOND_SEMAINE - semaine, 0),
  };
}

// LES COLONNES DIFFERENT SELON LA TABLE. Les trois bases de prospection
// portent raison_sociale, siren, code_postal ; la table crm porte nom et
// organisme. Demander les mauvaises colonnes ferait echouer la requete.
const COLONNES_PROSPECTS =
  "id, raison_sociale, ville, code_postal, siren, dirigeant_prenom, dirigeant_nom, " +
  "linkedin, email, telephone, site_web, linkedin_le, linkedin_statut";

const COLONNES_CRM =
  "id, nom, organisme, ville, dirigeant_prenom, dirigeant_nom, " +
  "linkedin, email, telephone, linkedin_le, linkedin_statut";

function colonnesDe(cle: string): string {
  return cle === "manuel" ? COLONNES_CRM : COLONNES_PROSPECTS;
}

// L ecran attend partout raison_sociale et dirigeant. Une fiche du CRM
// n en a pas : on la presente sous la meme forme.
function uniformiser(l: any, cle: string) {
  if (cle !== "manuel") return { ...l, base: cle };
  return {
    ...l,
    raison_sociale: l.organisme || l.nom || "-",
    code_postal: null,
    siren: null,
    site_web: null,
    base: cle,
  };
}

async function suivante(base: string) {
  const table = TABLES[base];
  if (!table) return { erreur: "Base inconnue." };

  const { data, error } = await supabase
    .from(table)
    .select(colonnesDe(base))
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

  return { fiche: uniformiser(data[0], base), restant: count || 0 };
}

// La cle de base est renvoyee avec chaque ligne — sans elle, l ecran ne
// saurait pas dans quelle table ecrire au moment de marquer.
async function lister(statuts: string[], limite: number) {
  const lignes: any[] = [];
  for (const cle of Object.keys(TABLES)) {
    const { data } = await supabase
      .from(TABLES[cle])
      .select(colonnesDe(cle))
      .in("linkedin_statut", statuts)
      .order("linkedin_le", { ascending: true })
      .limit(limite);
    for (const l of (data || [])) lignes.push(uniformiser(l, cle));
  }
  lignes.sort(function (a, b) {
    return String(a.linkedin_le || "").localeCompare(String(b.linkedin_le || ""));
  });
  return lignes.slice(0, limite);
}

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
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

    // AJOUTER UN PROFIL TROUVE A LA MAIN.
    //
    // La fiche entre directement au statut d invitation : si Jacques la
    // saisit, c est qu il vient d envoyer la demande.
    if (action === "ajouter") {
      const nom = propre(body.nom, 120);
      const lien = propre(body.linkedin, 300);
      const avecNote = body.avec_note === true;

      if (nom.length < 2) {
        return NextResponse.json({ ok: false, erreur: "Indiquez le nom du contact." }, { status: 400 });
      }
      if (lien.indexOf("linkedin.com") < 0) {
        return NextResponse.json(
          { ok: false, erreur: "Collez l adresse complete du profil LinkedIn." },
          { status: 400 }
        );
      }

      // Le meme profil ne se saisit pas deux fois.
      const { data: deja } = await supabase
        .from("crm")
        .select("id, nom, linkedin_statut")
        .eq("linkedin", lien)
        .maybeSingle();

      if (deja) {
        return NextResponse.json({
          ok: false,
          erreur: "Ce profil est deja dans votre file (" + (deja.nom || "sans nom") +
            ", statut " + (deja.linkedin_statut || "aucun") + ").",
        }, { status: 409 });
      }

      const c = await compteurs();
      if (c.reste_jour <= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Plafond du jour atteint (" + PLAFOND_JOUR + "). Reprenez demain.",
          compteurs: c,
        }, { status: 429 });
      }

      const morceaux = nom.split(/\s+/);
      const prenom = morceaux.length > 1 ? morceaux[0] : "";
      const patronyme = morceaux.length > 1 ? morceaux.slice(1).join(" ") : nom;

      const fiche: any = {
        tenant_id: null,
        nom: nom,
        organisme: propre(body.organisme, 160) || null,
        ville: propre(body.ville, 80) || null,
        dirigeant_prenom: prenom || null,
        dirigeant_nom: patronyme || null,
        linkedin: lien,
        linkedin_statut: avecNote ? "invite" : "invite_nu",
        linkedin_le: new Date().toISOString(),
        source: "linkedin",
        statut: "contacte",
        score: 45,
        notes: propre(body.notes, 1000) ||
          "Profil trouve sur LinkedIn et ajoute a la main. Aucune adresse connue : " +
          "le joindre par la messagerie LinkedIn.",
        derniere_interaction: new Date().toISOString(),
      };

      const { data: cree, error } = await supabase
        .from("crm")
        .insert(fiche)
        .select("id, nom, linkedin_statut")
        .maybeSingle();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        ajoute: cree,
        message: nom + " est ajoute a votre file, " +
          (avecNote ? "invitation avec note" : "invitation sans note") + ".",
        compteurs: await compteurs(),
      });
    }

    if (action === "suivante") {
      const r: any = await suivante(base);
      if (r.erreur) return NextResponse.json({ ok: false, erreur: r.erreur }, { status: 400 });
      return NextResponse.json({ ok: true, ...r, compteurs: await compteurs() });
    }

    if (action === "en_attente") {
      const lignes = await lister(EN_ATTENTE, LIMITE_LISTE);
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    if (action === "a_relancer") {
      const lignes = await lister(ACCEPTES, LIMITE_LISTE);
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

    // LE PLAFOND SE VERIFIE COTE SERVEUR, pas seulement a l ecran. Il
    // concerne les DEUX formes d invitation. Marquer une acceptation n est
    // plafonne par rien.
    if (statut === "invite" || statut === "invite_nu") {
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

    // La date d envoi initial est CONSERVEE quand on marque une reponse.
    const champs: any = { linkedin_statut: statut };
    if (statut === "invite" || statut === "invite_nu" || statut === "ecarte") {
      champs.linkedin_le = new Date().toISOString();
    }

    // Sur une fiche du CRM, une acceptation vaut un signal commercial :
    // le statut et le score suivent.
    if (base === "manuel") {
      champs.derniere_interaction = new Date().toISOString();
      if (statut === "accepte" || statut === "accepte_nu") {
        champs.statut = "interesse";
        champs.score = 60;
      }
      if (statut === "relance") champs.score = 65;
      if (statut === "refuse") champs.statut = "perdu";
    }

    const { error } = await supabase.from(table).update(champs).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const enFile = (statut === "invite" || statut === "invite_nu" || statut === "ecarte");
    const suite: any = enFile ? await suivante(base) : {};

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
