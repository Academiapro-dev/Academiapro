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
const TABLES: any = {
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  manuel: "crm",
};

// SEPT STATUTS, ET LA DISTINCTION AVEC OU SANS NOTE EST LA PLUS UTILE.
const STATUTS = ["invite", "invite_nu", "accepte", "accepte_nu", "relance", "refuse", "ecarte"];

const EN_ATTENTE = ["invite", "invite_nu"];
const ACCEPTES = ["accepte", "accepte_nu"];
const RELANCES = ["relance"];

const PLAFOND_SEMAINE = 100;
const PLAFOND_JOUR = 20;

// A vingt invitations par jour, le plafond de 200 etait atteint en dix
// jours. Mille lignes couvrent cinquante jours.
const LIMITE_LISTE = 1000;

// 🚨🚨 LE JOUR SE COMPTE A PARIS, PAS EN TEMPS UNIVERSEL — corrige le 18/08.
//
// Le code faisait `d.setHours(0,0,0,0)`, qui travaille dans le fuseau DU
// SERVEUR. Or Vercel tourne en UTC. A 1 h 30 du matin a Paris, il est
// 23 h 30 LA VEILLE pour le serveur : le compteur additionnait encore les
// vingt invitations deja faites. ENTRE MINUIT ET DEUX HEURES DU MATIN, LE
// QUOTA NE SE REMETTAIT JAMAIS A ZERO.
//
// ⚠️ NE PAS REVENIR A setHours() : le defaut ne se verrait qu apres minuit.
function decalageParisEnMs(d: Date): number {
  const aParis = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const enUTC = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return aParis.getTime() - enUTC.getTime();
}

function debutDuJour(): string {
  const maintenant = new Date();
  const decalage = decalageParisEnMs(maintenant);
  const murale = new Date(maintenant.getTime() + decalage);
  murale.setUTCHours(0, 0, 0, 0);
  return new Date(murale.getTime() - decalage).toISOString();
}

// La semaine est GLISSANTE — sept jours en arriere depuis maintenant.
function ilYaSeptJours(): string {
  return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
}

// Une fiche ecartee ne compte jamais : rien n a ete envoye.
//
// 🚨 UNE FICHE EN ATTENTE NON PLUS. Depuis le 18/08, une fiche peut etre
// enregistree SANS invitation : elle porte alors linkedin_le a null, et
// n entre donc dans aucun compteur — c est precisement ce qu on veut.
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

// Les fiches manuelles enregistrees sans invitation, en attente d etre
// invitees. Elles vivent dans la table crm, sans date ni statut.
async function compterEnFile(): Promise<number> {
  const { count } = await supabase
    .from("crm")
    .select("id", { count: "exact", head: true })
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte");
  return count || 0;
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
  const en_file = await compterEnFile();

  // 🚨 « ACCEPTEES » COMPTE AUSSI LES RELANCEES — corrige le 18/08.
  //
  // LE DEFAUT. Le compteur ne totalisait que `accepte` et `accepte_nu`.
  // Des qu un message partait, la fiche passait en `relance` et sortait du
  // total : le tableau de bord affichait ZERO ACCEPTATION alors que treize
  // personnes avaient accepte. Le travail accompli faisait BAISSER le
  // chiffre au lieu de le monter.
  const acceptees = accepte_note + accepte_nu + relances;

  return {
    jour, semaine,
    en_attente: attente_note + attente_nu,
    attente_note, attente_nu,
    acceptes: acceptees,
    en_attente_reponse: accepte_note + accepte_nu,
    accepte_note, accepte_nu,
    relances, refuses, ecartes,
    en_file,
    taux_note: taux(accepte_note, 0) === null ? null : taux(accepte_note + relances * 0, refuses),
    taux_global: taux(acceptees, refuses),
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
  "linkedin, email, telephone, site_web, linkedin_le, linkedin_relance_le, linkedin_statut, notes";

const COLONNES_CRM =
  "id, nom, organisme, ville, dirigeant_prenom, dirigeant_nom, " +
  "linkedin, email, telephone, linkedin_le, linkedin_relance_le, linkedin_statut, notes";

function colonnesDe(cle: string): string {
  return cle === "manuel" ? COLONNES_CRM : COLONNES_PROSPECTS;
}

// CE QUI EST MODIFIABLE DEPUIS LA FICHE COMPLETE.
//
// ⚠️ LES DEUX LISTES SONT DISTINCTES PARCE QUE LES TABLES LE SONT.
//
// 🚨 NI LE STATUT NI LES DATES NE SONT MODIFIABLES ICI. Corriger une
// coordonnee ne doit jamais faire avancer une fiche dans le parcours.
const MODIFIABLES_PROSPECTS = [
  "raison_sociale", "ville", "code_postal", "siren",
  "dirigeant_prenom", "dirigeant_nom",
  "linkedin", "email", "telephone", "site_web", "notes",
];

const MODIFIABLES_CRM = [
  "nom", "organisme", "ville",
  "dirigeant_prenom", "dirigeant_nom",
  "linkedin", "email", "telephone", "notes",
];

function modifiablesDe(cle: string): string[] {
  return cle === "manuel" ? MODIFIABLES_CRM : MODIFIABLES_PROSPECTS;
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
async function lister(statuts: string[], limite: number, colonneTri?: string) {
  const tri = colonneTri || "linkedin_le";
  const lignes: any[] = [];
  for (const cle of Object.keys(TABLES)) {
    const { data } = await supabase
      .from(TABLES[cle])
      .select(colonnesDe(cle))
      .in("linkedin_statut", statuts)
      .order(tri, { ascending: true })
      .limit(limite);
    for (const l of (data || [])) lignes.push(uniformiser(l, cle));
  }
  lignes.sort(function (a, b) {
    return String(a[tri] || "").localeCompare(String(b[tri] || ""));
  });
  return lignes.slice(0, limite);
}

// 🆕 LES FICHES ENREGISTREES SANS INVITATION — ajoute le 18/08.
//
// Elles n ont ni date ni statut : elles attendent simplement d etre
// invitees. On les liste a part pour que Jacques les retrouve.
async function listerEnFile(limite: number) {
  const { data } = await supabase
    .from("crm")
    .select(COLONNES_CRM)
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte")
    .order("created_at", { ascending: false })
    .limit(limite);
  return (data || []).map(function (l: any) { return uniformiser(l, "manuel"); });
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

    // MODIFIER UNE FICHE COMPLETE.
    if (action === "modifier") {
      const id = body.id;
      const table = TABLES[base];
      if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
      if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });

      const permis = modifiablesDe(base);
      const champs: any = {};

      for (const cle of permis) {
        if (body[cle] === undefined) continue;
        const valeur = propre(body[cle], cle === "notes" ? 4000 : 300);
        champs[cle] = valeur || null;
      }

      if (Object.keys(champs).length === 0) {
        return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
      }

      if (base === "manuel") champs.derniere_interaction = new Date().toISOString();

      const { data, error } = await supabase
        .from(table)
        .update(champs)
        .eq("id", id)
        .select(colonnesDe(base))
        .maybeSingle();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        fiche: data ? uniformiser(data, base) : null,
        message: "Fiche enregistrée.",
      });
    }

    // ENREGISTRER UNE OBSERVATION SUR UNE FICHE.
    //
    // ⚠️ CETTE ACTION NE TOUCHE NI AU STATUT NI AUX DATES.
    if (action === "note") {
      const id = body.id;
      const table = TABLES[base];
      if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
      if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });

      const texte = propre(body.notes, 4000);

      const champs: any = { notes: texte || null };
      if (base === "manuel") champs.derniere_interaction = new Date().toISOString();

      const { error } = await supabase.from(table).update(champs).eq("id", id);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, notes: texte, message: "Observation enregistrée." });
    }

    // LA FILE D ATTENTE : les fiches enregistrees sans invitation.
    if (action === "en_file") {
      const lignes = await listerEnFile(LIMITE_LISTE);
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    // AJOUTER UN PROFIL TROUVE A LA MAIN.
    //
    // 🚨🚨 TROIS FACONS D ENREGISTRER, ET LA DISTINCTION EST ESSENTIELLE —
    // corrigee le 18/08 apres un defaut de conception.
    //
    // LE DEFAUT. Les deux seuls boutons disponibles etaient « Invitee avec
    // une note » et « Invitee sans note ». ENREGISTRER UNE FICHE ET
    // DECLARER UNE INVITATION ETAIENT DONC LA MEME ACTION — impossible de
    // ranger un profil croise le soir pour l inviter le lendemain. Et une
    // fois le plafond du jour atteint, les deux boutons se grisaient : la
    // fiche etait perdue. Ses mots : « envoyer une fiche sans invitation,
    // pour moi ca ne veut pas dire enregistrer la fiche ».
    //
    // LES TROIS MODES :
    //   mode « file »     : la fiche est rangee, SANS invitation, SANS
    //                       toucher au quota. Elle attend son tour.
    //   mode « invite »   : l invitation est partie AVEC une note.
    //   mode « invite_nu » : l invitation est partie SANS note.
    //
    // Seuls les deux derniers consomment le quota.
    if (action === "ajouter") {
      const nom = propre(body.nom, 120);
      const lien = propre(body.linkedin, 300);

      // Compatibilite avec l ancien appel, qui envoyait avec_note.
      let mode = String(body.mode || "").trim();
      if (!mode) mode = body.avec_note === true ? "invite" : "invite_nu";
      if (["file", "invite", "invite_nu"].indexOf(mode) < 0) {
        return NextResponse.json({ ok: false, erreur: "Mode d enregistrement inconnu." }, { status: 400 });
      }

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
        .select("id, nom, linkedin_statut, linkedin_le")
        .eq("linkedin", lien)
        .maybeSingle();

      if (deja) {
        const etat = deja.linkedin_le
          ? "statut " + (deja.linkedin_statut || "aucun")
          : "en attente d invitation";
        return NextResponse.json({
          ok: false,
          erreur: "Ce profil est deja dans votre file (" + (deja.nom || "sans nom") + ", " + etat + ").",
        }, { status: 409 });
      }

      // LE QUOTA N EST VERIFIE QUE SI UNE INVITATION EST DECLAREE.
      if (mode !== "file") {
        const c = await compteurs();
        if (c.reste_jour <= 0) {
          return NextResponse.json({
            ok: false,
            erreur: "Plafond du jour atteint (" + PLAFOND_JOUR + "). Enregistrez la fiche "
              + "sans invitation : elle vous attendra demain.",
            compteurs: c,
          }, { status: 429 });
        }
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
        // 🚨 EN MODE FILE, NI STATUT NI DATE. C est cette absence de date qui
        // tient la fiche hors de tous les compteurs.
        linkedin_statut: mode === "file" ? null : mode,
        linkedin_le: mode === "file" ? null : new Date().toISOString(),
        source: "linkedin",
        statut: mode === "file" ? "prospect" : "contacte",
        score: mode === "file" ? 35 : 45,
        notes: propre(body.notes, 4000) ||
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

      const mot = mode === "file"
        ? nom + " est enregistre, en attente d invitation. Aucune unite de quota consommee."
        : nom + " est ajoute a votre file, " +
          (mode === "invite" ? "invitation avec note" : "invitation sans note") + ".";

      return NextResponse.json({
        ok: true,
        ajoute: cree,
        mode: mode,
        message: mot,
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

    // Les messages envoyes, du plus ancien au plus recent : ceux qui
    // attendent depuis le plus longtemps arrivent en tete.
    if (action === "envoyes") {
      const lignes = await lister(RELANCES, LIMITE_LISTE, "linkedin_relance_le");
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

    // La date du message, distincte de celle de l invitation. Sans elle, on
    // ne saurait pas depuis combien de temps un message attend sa reponse.
    if (statut === "relance") {
      champs.linkedin_relance_le = new Date().toISOString();
    }

    if (body.notes !== undefined) {
      champs.notes = propre(body.notes, 4000) || null;
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
