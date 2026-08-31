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

// CINQ SOURCES, DONT UNE MANUELLE.
//
// Les quatre premieres viennent de l open data enrichi. LA CINQUIEME,
// « manuel », pointe sur la table crm et recoit les profils que Jacques
// trouve LUI-MEME sur LinkedIn, au fil de son fil d actualite.
//
// 🚨 LES CABINETS COMPTABLES ONT ETE AJOUTES LE 01/09 A 00h40, ET LEUR
// ABSENCE AVAIT DES CONSEQUENCES.
//
// CE QUI SE PASSAIT. La table prospects_cabinets porte 353 profils
// LinkedIn, dont 118 DEJA INVITES — verifie en base. Mais elle ne figurait
// pas ici : aucun compteur ne les voyait, aucune liste ne les rendait,
// aucune acceptation ni aucun refus ne pouvait etre marque. Cent
// dix-huit invitations parties, et un outil qui l ignorait.
//
// ⚠️ CES 118 N ONT PAS PU PARTIR DEPUIS CET ECRAN, qui ne connaissait pas
// la table. Leur origine reste a elucider — version anterieure du code, ou
// saisie directe en base. A verifier avant de tirer une conclusion sur les
// chiffres de la semaine.
//
// ⚠️ CONSEQUENCE ATTENDUE DE L AJOUT : tous les compteurs vont MONTER d un
// coup, y compris `semaine` et `jour` si des invitations cabinets portent
// une date recente. Ce n est pas une anomalie — c est ce qui etait cache
// qui devient visible.
const TABLES: any = {
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  cabinets: "prospects_cabinets",
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

// ---------------------------------------------------------------------------
// 🚨 LA LENTEUR DE L ECRAN — DIAGNOSTIQUEE ET CORRIGEE LE 31/08 AU SOIR.
//
// CE QUI SE PASSAIT. La fonction compteurs() lancait TRENTE-SIX COMPTAGES,
// LES UNS APRES LES AUTRES : deux passages de compterDepuis (quatre tables
// chacun), sept passages de compterStatuts (quatre tables chacun), plus la
// file. Chaque requete attendait la fin de la precedente.
//
// PIRE : sur une invitation, elle etait appelee DEUX FOIS — une premiere
// pour verifier le plafond, une seconde pour la reponse. Soit SOIXANTE-DOUZE
// comptages sequentiels sur des tables de dizaines de milliers de lignes,
// pour enregistrer une date. Et l ecran enchainait derriere avec les trente-
// six comptages de /api/admin/prospection.
//
// LES DEUX CORRECTIONS, ET AUCUNE NE CHANGE UN SEUL CHIFFRE :
//   1. Les comptages partent TOUS EN MEME TEMPS (Promise.all). Le temps
//      total devient celui du plus lent, non la somme.
//   2. Le calcul fait avant l ecriture est REUTILISE dans la reponse, au
//      lieu d etre refait a l identique.
//
// ⚠️ AVEC LA CINQUIEME TABLE, LE NOMBRE DE COMPTAGES PASSE DE 36 A 45.
// C est precisement pour cela que la parallelisation devait etre faite
// AVANT d ajouter les cabinets : en serie, l ajout aurait allonge encore
// l attente.
//
// ⚠️ NE PAS REVENIR A UNE BOUCLE `for` AVEC `await` A L INTERIEUR. C est
// la forme qui a produit la lenteur, et elle se reintroduit sans y penser
// des qu on ajoute un compteur ou une table.
// ---------------------------------------------------------------------------

// Une fiche ecartee ne compte jamais : rien n a ete envoye.
//
// 🚨 UNE FICHE EN ATTENTE NON PLUS. Depuis le 18/08, une fiche peut etre
// enregistree SANS invitation : elle porte alors linkedin_le a null, et
// n entre donc dans aucun compteur — c est precisement ce qu on veut.
async function compterDepuis(depuis: string): Promise<number> {
  const parTable = await Promise.all(
    Object.keys(TABLES).map(async function (cle) {
      const { count } = await supabase
        .from(TABLES[cle])
        .select("id", { count: "exact", head: true })
        .not("linkedin_le", "is", null)
        .neq("linkedin_statut", "ecarte")
        .gte("linkedin_le", depuis);
      return count || 0;
    })
  );
  return parTable.reduce(function (s, n) { return s + n; }, 0);
}

async function compterStatuts(statuts: string[]): Promise<number> {
  const parTable = await Promise.all(
    Object.keys(TABLES).map(async function (cle) {
      const { count } = await supabase
        .from(TABLES[cle])
        .select("id", { count: "exact", head: true })
        .in("linkedin_statut", statuts);
      return count || 0;
    })
  );
  return parTable.reduce(function (s, n) { return s + n; }, 0);
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

// ⚠️ LES NEUF FAMILLES DE COMPTAGE PARTENT ENSEMBLE, et chacune interroge
// ses cinq tables ensemble : quarante-cinq requetes lancees d un coup, au
// lieu de quarante-cinq attentes enchainees.
async function compteurs() {
  const [
    jour,
    semaine,
    attente_note,
    attente_nu,
    accepte_note,
    accepte_nu,
    relances,
    refuses,
    ecartes,
    en_file,
  ] = await Promise.all([
    compterDepuis(debutDuJour()),
    compterDepuis(ilYaSeptJours()),
    compterStatuts(["invite"]),
    compterStatuts(["invite_nu"]),
    compterStatuts(["accepte"]),
    compterStatuts(["accepte_nu"]),
    compterStatuts(["relance"]),
    compterStatuts(["refuse"]),
    compterStatuts(["ecarte"]),
    compterEnFile(),
  ]);

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

// Les compteurs apres une ecriture : ceux calcules avant, corriges de ce
// que l ecriture vient de changer.
//
// ⚠️ POURQUOI NE PAS LES RECALCULER. Refaire quarante-cinq comptages pour
// apprendre qu une invitation de plus est partie double le temps d attente
// sans rien apprendre. Le seul chiffre qui bouge est connu d avance.
function compteursApresInvitation(avant: any) {
  const jour = (avant.jour || 0) + 1;
  const semaine = (avant.semaine || 0) + 1;
  return Object.assign({}, avant, {
    jour: jour,
    semaine: semaine,
    reste_jour: Math.max(PLAFOND_JOUR - jour, 0),
    reste_semaine: Math.max(PLAFOND_SEMAINE - semaine, 0),
  });
}

// LES COLONNES DIFFERENT SELON LA TABLE. Les quatre bases de prospection
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

// La fiche suivante et le nombre restant : deux requetes independantes,
// lancees ensemble.
async function suivante(base: string) {
  const table = TABLES[base];
  if (!table) return { erreur: "Base inconnue." };

  const [lecture, comptage] = await Promise.all([
    supabase
      .from(table)
      .select(colonnesDe(base))
      .not("linkedin", "is", null)
      .is("linkedin_le", null)
      .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte")
      .order("id", { ascending: true })
      .limit(1),
    supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .not("linkedin", "is", null)
      .is("linkedin_le", null)
      .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte"),
  ]);

  if (lecture.error) return { erreur: lecture.error.message };
  if (!lecture.data || lecture.data.length === 0) return { fiche: null, epuise: true };

  return { fiche: uniformiser(lecture.data[0], base), restant: comptage.count || 0 };
}

// La cle de base est renvoyee avec chaque ligne — sans elle, l ecran ne
// saurait pas dans quelle table ecrire au moment de marquer.
//
// ⚠️ LES CINQ TABLES SONT LUES ENSEMBLE, pas l une apres l autre.
async function lister(statuts: string[], limite: number, colonneTri?: string) {
  const tri = colonneTri || "linkedin_le";

  const parTable = await Promise.all(
    Object.keys(TABLES).map(async function (cle) {
      const { data } = await supabase
        .from(TABLES[cle])
        .select(colonnesDe(cle))
        .in("linkedin_statut", statuts)
        .order(tri, { ascending: true })
        .limit(limite);
      return (data || []).map(function (l: any) { return uniformiser(l, cle); });
    })
  );

  const lignes: any[] = [];
  for (const lot of parTable) for (const l of lot) lignes.push(l);

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
    //
    // ⚠️ LA LISTE ET LES COMPTEURS PARTENT ENSEMBLE : ils ne dependent pas
    // l un de l autre.
    if (action === "en_file") {
      const [lignes, c] = await Promise.all([listerEnFile(LIMITE_LISTE), compteurs()]);
      return NextResponse.json({ ok: true, lignes, compteurs: c });
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

      // Le doublon et les compteurs se verifient ENSEMBLE : les deux
      // lectures sont independantes.
      const [dejaR, avant] = await Promise.all([
        supabase
          .from("crm")
          .select("id, nom, linkedin_statut, linkedin_le")
          .eq("linkedin", lien)
          .maybeSingle(),
        compteurs(),
      ]);

      const deja = dejaR.data;

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
      if (mode !== "file" && avant.reste_jour <= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Plafond du jour atteint (" + PLAFOND_JOUR + "). Enregistrez la fiche "
            + "sans invitation : elle vous attendra demain.",
          compteurs: avant,
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

      // En mode file, rien n a bouge cote quota : on rend le calcul fait
      // avant l ecriture, sans le refaire.
      return NextResponse.json({
        ok: true,
        ajoute: cree,
        mode: mode,
        message: mot,
        compteurs: mode === "file" ? avant : compteursApresInvitation(avant),
      });
    }

    if (action === "suivante") {
      const [r, c] = await Promise.all([suivante(base), compteurs()]);
      if ((r as any).erreur) {
        return NextResponse.json({ ok: false, erreur: (r as any).erreur }, { status: 400 });
      }
      return NextResponse.json({ ok: true, ...r, compteurs: c });
    }

    if (action === "en_attente") {
      const [lignes, c] = await Promise.all([lister(EN_ATTENTE, LIMITE_LISTE), compteurs()]);
      return NextResponse.json({ ok: true, lignes, compteurs: c });
    }

    if (action === "a_relancer") {
      const [lignes, c] = await Promise.all([lister(ACCEPTES, LIMITE_LISTE), compteurs()]);
      return NextResponse.json({ ok: true, lignes, compteurs: c });
    }

    // Les messages envoyes, du plus ancien au plus recent : ceux qui
    // attendent depuis le plus longtemps arrivent en tete.
    if (action === "envoyes") {
      const [lignes, c] = await Promise.all([
        lister(RELANCES, LIMITE_LISTE, "linkedin_relance_le"),
        compteurs(),
      ]);
      return NextResponse.json({ ok: true, lignes, compteurs: c });
    }

    const id = body.id;
    const statut = String(body.statut || "invite").trim();

    const table = TABLES[base];
    if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
    if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });
    if (STATUTS.indexOf(statut) < 0) {
      return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
    }

    const estInvitation = (statut === "invite" || statut === "invite_nu");

    // LE PLAFOND SE VERIFIE COTE SERVEUR, pas seulement a l ecran. Il
    // concerne les DEUX formes d invitation. Marquer une acceptation n est
    // plafonne par rien — et n a donc pas besoin des compteurs avant
    // ecriture.
    let avant: any = null;

    if (estInvitation) {
      avant = await compteurs();
      if (avant.reste_jour <= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Plafond du jour atteint (" + PLAFOND_JOUR + "). Reprenez demain.",
          compteurs: avant,
        }, { status: 429 });
      }
      if (avant.reste_semaine <= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Plafond de la semaine atteint (" + PLAFOND_SEMAINE + "). Attendez quelques jours.",
          compteurs: avant,
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

    const enFile = (estInvitation || statut === "ecarte");

    // ⚠️ SUR UNE INVITATION, LES COMPTEURS NE SONT PAS RECALCULES : celui
    // d avant est corrige de l unite qui vient d etre consommee. Refaire
    // quarante-cinq comptages pour apprendre « un de plus » doublait
    // l attente a chaque clic.
    //
    // Sur les autres statuts — acceptation, refus, relance — aucun calcul
    // n a ete fait avant, on le fait maintenant, en parallele de la lecture
    // de la fiche suivante.
    if (estInvitation) {
      const suite: any = await suivante(base);
      return NextResponse.json({
        ok: true,
        statut: statut,
        compteurs: compteursApresInvitation(avant),
        fiche: suite.fiche || null,
        restant: suite.restant,
        epuise: suite.epuise || false,
      });
    }

    const [suite, c] = await Promise.all([
      enFile ? suivante(base) : Promise.resolve({} as any),
      compteurs(),
    ]);

    return NextResponse.json({
      ok: true,
      statut: statut,
      compteurs: c,
      fiche: (suite as any).fiche || null,
      restant: (suite as any).restant,
      epuise: (suite as any).epuise || false,
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
