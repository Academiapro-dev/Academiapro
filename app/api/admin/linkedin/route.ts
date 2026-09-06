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
// 🚨 LES CABINETS COMPTABLES ONT ETE AJOUTES LE 01/09, ET LEUR ABSENCE
// AVAIT DES CONSEQUENCES. La table prospects_cabinets porte 353 profils
// LinkedIn, dont 118 DEJA INVITES — verifie en base. Mais elle ne figurait
// pas ici : aucun compteur ne les voyait, aucune liste ne les rendait,
// aucune acceptation ni aucun refus ne pouvait etre marque.
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
// 🚨 LA LENTEUR — DIAGNOSTIQUEE ET CORRIGEE LE 31/08 AU SOIR.
//
// CE QUI SE PASSAIT. compteurs() lancait TRENTE-SIX COMPTAGES LES UNS APRES
// LES AUTRES, et elle etait appelee DEUX FOIS sur une invitation : une pour
// verifier le plafond, une pour la reponse. Soit SOIXANTE-DOUZE comptages
// sequentiels pour enregistrer une date.
//
// LES DEUX CORRECTIONS, ET AUCUNE NE CHANGE UN SEUL CHIFFRE :
//   1. Les comptages partent TOUS EN MEME TEMPS (Promise.all).
//   2. Le calcul fait avant l ecriture est REUTILISE dans la reponse.
//
// ⚠️ NE PAS REVENIR A UNE BOUCLE `for` AVEC `await` A L INTERIEUR. C est la
// forme qui produit la lenteur, et elle se reintroduit sans y penser des
// qu on ajoute un compteur ou une table.
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

// 🚨 LE TAUX D ACCEPTATION SE RAPPORTE AUX INVITATIONS ENVOYEES — 02/09.
//
// CE QUI ETAIT CALCULE. acceptes / (acceptes + refuses) : le taux « parmi
// ceux qui ont repondu ». L ecran affichait 87 %.
//
// POURQUOI C ETAIT FAUX A L USAGE. Sur LinkedIn, LE SILENCE EST LA REPONSE
// LA PLUS FREQUENTE : 235 invitations sans reponse contre 8 refus
// explicites. Diviser par les seuls repondants ecarte donc l immense
// majorite du reel, et le chiffre gonfle toujours.
//
// LE CHIFFRE REEL, CONSTATE PAR JACQUES DEPUIS LE DEBUT : environ 20 %.
// 54 acceptations sur 289 invitations parties = 19 %. C est celui qui
// permet de piloter ; 87 % n apprend rien.
//
// L ENTONNOIR, DIT PAR JACQUES : les fiches vues donnent ~85 % d invitations
// (le reste est hors cible, ecarte) ; les invitations donnent ~20 %
// d acceptations. Ce sont DEUX mesures distinctes — celle-ci ne mesure que
// la seconde.
//
// ⚠️ MEME FORMULE POUR LES CINQ PRODUITS. Aucun n a de calcul particulier.
function taux(acceptes: number, invitations: number) {
  return invitations > 0 ? Math.round((acceptes / invitations) * 100) : null;
}

// ⚠️ LES NEUF FAMILLES DE COMPTAGE PARTENT ENSEMBLE, et chacune interroge
// ses cinq tables ensemble : quarante-cinq requetes lancees d un coup, au
// lieu de quarante-cinq attentes enchainees.
// 🆕 LES COMPTEURS PAR PRODUIT — 02/09.
//
// L ecran affichait un bloc par campagne, mais la route ne renvoyait
// jamais `campagnes` : le bloc ne s est donc JAMAIS affiche. Defaut
// silencieux, decouvert en ajoutant les trois nouveaux produits.
//
// LES CINQ PRODUITS. Les deux premiers ont des bases de prospection ; les
// trois autres n existent que dans la table crm, ou chaque fiche porte sa
// colonne campagne. On compte donc les deux origines, et on additionne.
const BASES_DE = {
  academiapro: ["organismes", "qualiopi", "interim"],
  mrcomptable: ["cabinets"],
  mysterllc: [],
  mrcrm: [],
  mrlms: [],
};

async function compterCampagnes() {
  const cles = Object.keys(BASES_DE);

  // ⚠️ TOUS LES COMPTAGES PARTENT ENSEMBLE. Une boucle `for` avec `await`
  // a l interieur est exactement la forme qui a produit la lenteur du
  // 31/08 — ne pas la reintroduire ici.
  const resultats = await Promise.all(
    cles.map(async function (cle) {
      const bases = (BASES_DE as any)[cle] as string[];

      // 🚨 UNE INVITATION SE COMPTE A SON STATUT, PAS A SA DATE — 02/09.
      //
      // Le premier jet exigeait linkedin_le non nul. Or les fiches invitees
      // avant que la date ne soit consignee n en portent pas : les blocs
      // affichaient « 0 invitation(s) » a cote de « 28 acceptee(s) ».
      // Une fiche invitee porte un statut d invitation — c est lui qui fait foi.
      const STATUTS_INVITES = EN_ATTENTE.concat(ACCEPTES).concat(RELANCES).concat(["refuse"]);

      const [depuisBases, depuisCrm] = await Promise.all([
        Promise.all(
          bases.map(async function (b) {
            const { count } = await supabase
              .from(TABLES[b])
              .select("id", { count: "exact", head: true })
              .in("linkedin_statut", STATUTS_INVITES);
            return count || 0;
          })
        ),
        (async function () {
          const { count } = await supabase
            .from("crm")
            .select("id", { count: "exact", head: true })
            .eq("campagne", cle)
            .in("linkedin_statut", STATUTS_INVITES);
          return count || 0;
        })(),
      ]);

      const [acceptes, refuses] = await Promise.all([
        (async function () {
          const parTable = await Promise.all(
            bases.map(async function (b) {
              const { count } = await supabase
                .from(TABLES[b])
                .select("id", { count: "exact", head: true })
                .in("linkedin_statut", ACCEPTES.concat(RELANCES));
              return count || 0;
            }).concat([
              (async function () {
                const { count } = await supabase
                  .from("crm")
                  .select("id", { count: "exact", head: true })
                  .eq("campagne", cle)
                  .in("linkedin_statut", ACCEPTES.concat(RELANCES));
                return count || 0;
              })(),
            ])
          );
          return parTable.reduce(function (s: number, n: number) { return s + n; }, 0);
        })(),
        (async function () {
          const parTable = await Promise.all(
            bases.map(async function (b) {
              const { count } = await supabase
                .from(TABLES[b])
                .select("id", { count: "exact", head: true })
                .eq("linkedin_statut", "refuse");
              return count || 0;
            }).concat([
              (async function () {
                const { count } = await supabase
                  .from("crm")
                  .select("id", { count: "exact", head: true })
                  .eq("campagne", cle)
                  .eq("linkedin_statut", "refuse");
                return count || 0;
              })(),
            ])
          );
          return parTable.reduce(function (s: number, n: number) { return s + n; }, 0);
        })(),
      ]);

      const invites = depuisBases.reduce(function (s: number, n: number) { return s + n; }, 0) + depuisCrm;

      return {
        cle: cle,
        valeur: {
          invites: invites,
          acceptes: acceptes,
          refuses: refuses,
          sans_reponse: Math.max(invites - acceptes - refuses, 0),
          taux: taux(acceptes, invites),
        },
      };
    })
  );

  const par: any = {};
  for (const r of resultats) par[r.cle] = r.valeur;
  return par;
}

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
    campagnes,
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
    compterCampagnes(),
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
    campagnes,
    // Les deux taux se rapportent desormais aux invitations envoyees.
    taux_note: taux(accepte_note, attente_note + accepte_note),
    taux_global: taux(acceptees, attente_note + attente_nu + acceptees + refuses),
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
// 🆕 `campagne` FIGURE DESORMAIS SUR LES QUATRE BASES — 02/09.
//
// Une fiche de prospection tire normalement son produit de sa table. Mais
// une fiche mal classee doit pouvoir etre rattachee au bon produit, comme
// une fiche manuelle. La colonne est donc lue ici, et elle PRIME sur la
// base quand elle est renseignee (voir campagneDe() cote ecran).
//
// ⚠️ EXIGE LE SQL SUIVANT, A PASSER AVANT DE DEPLOYER CE FICHIER :
//   alter table public.prospects_organismes add column if not exists campagne text;
//   alter table public.prospects_qualiopi   add column if not exists campagne text;
//   alter table public.prospects_interim    add column if not exists campagne text;
//   alter table public.prospects_cabinets   add column if not exists campagne text;
// Sans elles, toute lecture de ces tables echouerait.
// 🆕 `produits` AJOUTE AUX QUATRE BASES LE 06/09, ET SON ABSENCE ETAIT
// INVISIBLE.
//
// CE QUI SE PASSAIT. La colonne n existait que sur `crm`. Quand l ecran
// enregistrait un produit secondaire sur une fiche venue d une base de
// prospection, Postgres refusait la colonne inconnue — et la parade de
// l action « modifier » (plus bas) retirait le champ fautif, refaisait
// l ecriture sans lui, et repondait OK.
//
// 🚨 AUCUNE ERREUR NE REMONTAIT. Le produit paraissait coche a l ecran
// jusqu au rechargement, puis disparaissait. Jacques l a constate le 06/09 :
// « ni mr lms ». La parade, ecrite pour eviter qu une colonne manquante ne
// fasse tout echouer, transformait ici une erreur en perte silencieuse.
//
// ⚠️ ECRIRE NE SUFFIT PAS : IL FAUT AUSSI LIRE. La colonne est desormais
// sur les cinq tables (migration du 06/09), mais tant qu elle ne figure pas
// dans cette liste, la route ne la renvoie pas et l ecran ne voit jamais ce
// qui a ete enregistre.
const COLONNES_PROSPECTS =
  "id, raison_sociale, ville, code_postal, siren, dirigeant_prenom, dirigeant_nom, " +
  "linkedin, email, telephone, site_web, linkedin_le, linkedin_relance_le, linkedin_statut, notes, campagne, produits";

// 🆕 `produits` AJOUTE LE 06/09. La colonne porte les produits SECONDAIRES
// d une fiche et la date du message envoye sous chacun :
//   {"mrcrm": null, "mysterllc": "2026-09-12T08:00:00Z"}
// La colonne `campagne` reste celle du produit PRINCIPAL, qui decide du
// premier message. ⚠️ ELLE N EXISTE QUE SUR `crm` : les quatre bases de
// prospection ne l ont pas, et n en ont pas besoin — une fiche de base
// froide porte un seul produit, celui de sa base.
const COLONNES_CRM =
  "id, nom, organisme, ville, dirigeant_prenom, dirigeant_nom, campagne, produits, " +
  "linkedin, email, telephone, linkedin_le, linkedin_relance_le, linkedin_statut, notes";

function colonnesDe(cle: string): string {
  return cle === "manuel" ? COLONNES_CRM : COLONNES_PROSPECTS;
}

// CE QUI EST MODIFIABLE DEPUIS LA FICHE COMPLETE.
//
// 🚨 L ADMINISTRATEUR MODIFIE TOUT — decision de Jacques, 01/09.
//
// CE QUI SE PASSAIT. Ces listes etaient des LISTES BLANCHES : un champ
// absent etait silencieusement ignore. Le statut, les dates, le score
// n en faisaient pas partie — donc aucune correction n etait possible
// dessus, et l ecran ne le disait meme pas.
//
// Ses mots : « je fais ce que je veux, je suis quand meme
// l administrateur ». Il a raison : cette route est protegee par ADMINS,
// personne d autre n y accede. Une liste blanche n y protege de rien, elle
// entrave celui qui l administre.
//
// ⚠️ LES LISTES SERVENT DESORMAIS DE LISTE DE CHAMPS CONNUS, non de
// barriere : elles disent quels champs l ecran envoie couramment. Tout
// autre champ passe aussi — voir la branche « modifier » plus bas.
//
// ⚠️ CE QUI RESTE INTERDIT, ET UNIQUEMENT CELA : la colonne id. La
// changer briserait les liens de la fiche avec son historique de
// relances.
const MODIFIABLES_PROSPECTS = [
  "raison_sociale", "ville", "code_postal", "siren",
  "dirigeant_prenom", "dirigeant_nom",
  "linkedin", "email", "telephone", "site_web", "notes",
  // Ajoutes le 01/09 : l administrateur corrige aussi l avancement.
  "linkedin_statut", "linkedin_le", "linkedin_relance_le", "score",
  "statut", "envoye_le", "desabonne",
  // 🆕 06/09 : les produits secondaires, desormais sur les quatre bases.
  "produits",
];

const MODIFIABLES_CRM = [
  "nom", "organisme", "ville",
  "dirigeant_prenom", "dirigeant_nom",
  "linkedin", "email", "telephone", "notes",
  // Ajoutes le 01/09 : l administrateur corrige aussi l avancement.
  "linkedin_statut", "linkedin_le", "linkedin_relance_le", "score",
  "statut", "campagne", "source", "pays", "motif_perte", "relance_auto",
  // 🆕 06/09 : les produits secondaires, et la date d envoi de chacun.
  "produits",
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
// 🆕 LES PRODUITS SANS BASE DE PROSPECTION — 02/09.
//
// MysterLLC, Mr. CRM et Mr. LMS n ont aucune table d open data : leurs
// cibles ne sont dans aucun fichier NAF ni SIREN. Leurs prospects se
// reperent sur LinkedIn et se rangent a la main dans la table crm, ou
// chaque fiche porte sa colonne campagne.
//
// 🚨 POURQUOI CES CLES SONT ACCEPTEES ICI. Sans elles, l onglet Inviter
// n aurait jamais servi une seule fiche de ces trois produits — et leurs
// listes seraient restees vides pour toujours, faute d entree. Le tri
// doit exister LA OU LE FLUX COMMENCE, pas seulement en aval.
const PRODUITS_SANS_BASE = ["mysterllc", "mrcrm", "mrlms"];

async function suivante(base: string) {
  // Un produit sans base : on sert sa file d attente, prise dans la table
  // crm et filtree sur sa campagne.
  if (PRODUITS_SANS_BASE.indexOf(base) >= 0) {
    const [lecture, comptage] = await Promise.all([
      supabase
        .from("crm")
        .select(COLONNES_CRM)
        .eq("campagne", base)
        .not("linkedin", "is", null)
        .is("linkedin_le", null)
        .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte")
        .order("id", { ascending: true })
        .limit(1),
      supabase
        .from("crm")
        .select("id", { count: "exact", head: true })
        .eq("campagne", base)
        .not("linkedin", "is", null)
        .is("linkedin_le", null)
        .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte"),
    ]);

    if (lecture.error) return { erreur: lecture.error.message };
    if (!lecture.data || lecture.data.length === 0) return { fiche: null, epuise: true };

    // La fiche est uniformisee comme une fiche manuelle : c est bien la
    // table crm qu elle vient, et sa campagne doit la suivre.
    const f: any = uniformiser(lecture.data[0], "manuel");
    f.campagne = base;
    return { fiche: f, restant: comptage.count || 0 };
  }

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

// ---------------------------------------------------------------------------
// 🚨 LE SENS DU TRI — CORRIGE LE 01/09.
//
// LE DEFAUT SIGNALE PAR JACQUES : « les invitations sont du plus ancien au
// plus recent, ca m oblige a descendre jusqu en bas de la page pour avoir
// les plus recentes ».
//
// Il a raison, et le defaut venait d un tri unique pour deux besoins
// opposes :
//
//   « MES INVITATIONS » — on cherche CE QU ON VIENT D ENVOYER, pour
//   marquer les acceptations qui arrivent. Le plus recent doit etre EN
//   HAUT. C est l ecran qu on ouvre apres une notification LinkedIn.
//
//   « MESSAGES ENVOYES » — on cherche AU CONTRAIRE ce qui attend depuis
//   le plus longtemps, pour decider d une seconde relance. Le plus ancien
//   doit rester en haut. C est l ecran qu on ouvre pour relancer.
//
// ⚠️ NE PAS UNIFORMISER LES DEUX. Ce sont deux questions differentes, et
// chacune veut son ordre. Le parametre `recent` porte cette distinction.
//
// ⚠️ LE TRI EN MEMOIRE COMPTE AUTANT QUE CELUI DE LA BASE : les lignes
// viennent de cinq tables, chacune triee de son cote. C est le tri final,
// apres fusion, qui decide de ce que voit l ecran.
// ---------------------------------------------------------------------------
async function lister(statuts: string[], limite: number, colonneTri?: string, recent?: boolean) {
  const tri = colonneTri || "linkedin_le";
  // Par defaut, le plus ancien en tete — c est ce que veut « Messages
  // envoyes ». `recent` inverse pour « Mes invitations ».
  const croissant = recent !== true;

  // 🚨 LA TABLE crm MANQUAIT — CORRIGE LE 02/09.
  //
  // LE DEFAUT, TROUVE PAR JACQUES : « les fiches que j ai rentrees en
  // dehors de mon listing n apparaissent pas ». Cette boucle ne parcourait
  // que Object.keys(TABLES), c est-a-dire LES QUATRE BASES DE PROSPECTION.
  // La table crm, ou vivent TOUTES les fiches saisies a la main, n y etait
  // pas.
  //
  // CONSEQUENCE : des qu une fiche manuelle recevait un statut — invitee,
  // acceptee, relancee — elle DISPARAISSAIT de l ecran. Elle restait en
  // base, intacte, mais aucune liste ne la remontait. Trois fiches du
  // 02/09 (Cecile Doronzo, Naim Riffi, Joris Shehadeh) etaient ainsi
  // introuvables alors qu elles portaient le statut relance.
  //
  // ⚠️ listerEnFile() interrogeait deja crm : c est pour cela que les
  // fiches SANS statut s affichaient bien dans « En attente d invitation ».
  // Le trou ne touchait que celles qui avaient avance.
  const SOURCES = Object.keys(TABLES).concat(["manuel"]);

  const parTable = await Promise.all(
    SOURCES.map(async function (cle) {
      const table = cle === "manuel" ? "crm" : TABLES[cle];
      let q = supabase
        .from(table)
        .select(colonnesDe(cle))
        .in("linkedin_statut", statuts);

      // La table crm porte aussi des fiches d autres origines : on ne
      // remonte que celles nees de la prospection LinkedIn.
      if (cle === "manuel") q = q.eq("source", "linkedin");

      const { data } = await q
        .order(tri, { ascending: croissant })
        .limit(limite);
      return (data || []).map(function (l: any) { return uniformiser(l, cle); });
    })
  );

  const lignes: any[] = [];
  for (const lot of parTable) for (const l of lot) lignes.push(l);

  lignes.sort(function (a, b) {
    const ga = String(a[tri] || "");
    const gb = String(b[tri] || "");
    return croissant ? ga.localeCompare(gb) : gb.localeCompare(ga);
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

      // 🚨 TOUT CHAMP ENVOYE EST ECRIT — 01/09.
      //
      // La liste ne sert plus de barriere : elle dit seulement quels champs
      // l ecran envoie couramment. Un champ hors liste passe aussi.
      //
      // ⚠️ SEULS id ET action SONT REFUSES : changer l identifiant
      // briserait les liens de la fiche avec son historique de relances.
      //
      // ⚠️ LES BOOLEENS ET LES NOMBRES NE PASSENT PAS PAR propre(), qui
      // rend une chaine. Les convertir en texte ferait echouer l ecriture
      // sur une colonne boolean ou integer.
      const INTERDITS = ["id", "action", "base", "rang"];
      const champs: any = {};

      for (const cle of Object.keys(body)) {
        if (INTERDITS.indexOf(cle) >= 0) continue;
        const v = body[cle];
        if (v === undefined) continue;

        if (v === null || v === "") {
          champs[cle] = null;
        } else if (typeof v === "boolean" || typeof v === "number") {
          champs[cle] = v;
        } else if (typeof v === "object") {
          // 🆕 LES OBJETS PASSENT TELS QUELS — 06/09.
          //
          // 🚨 SANS CETTE BRANCHE, `produits` ETAIT DETRUIT SILENCIEUSEMENT.
          // propre() rend une CHAINE : un objet y devenait « [object
          // Object] », que Postgres refuse sur une colonne jsonb — ou pire,
          // accepte comme du texte. La colonne existe depuis le 06/09 et
          // porte la liste des produits secondaires : elle doit arriver
          // intacte.
          champs[cle] = v;
        } else {
          const valeur = propre(v, cle === "notes" ? 4000 : 300);
          champs[cle] = valeur || null;
        }
      }

      if (Object.keys(champs).length === 0) {
        return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
      }

      if (base === "manuel") champs.derniere_interaction = new Date().toISOString();

      // ⚠️ MEME PARADE QUE DANS corriger_etape : la branche accepte
      // desormais TOUT champ envoye, donc elle peut recevoir une colonne
      // qui n existe pas sur cette table. Plutot que de tout refuser, on
      // retire le champ fautif et on recommence — une seule fois, pour ne
      // pas boucler.
      let { data, error } = await supabase
        .from(table)
        .update(champs)
        .eq("id", id)
        .select(colonnesDe(base))
        .maybeSingle();

      if (error) {
        const msg = String(error.message || "");
        // Postgres nomme la colonne inconnue entre guillemets.
        const trouve = msg.match(/'([^']+)'|"([^"]+)"/);
        const fautive = trouve ? (trouve[1] || trouve[2]) : null;

        if (fautive && champs[fautive] !== undefined) {
          console.error("[modifier] colonne " + fautive + " absente sur "
            + table + " — nouvel essai sans elle");
          const reduit: any = { ...champs };
          delete reduit[fautive];
          const retour = await supabase
            .from(table)
            .update(reduit)
            .eq("id", id)
            .select(colonnesDe(base))
            .maybeSingle();
          data = retour.data;
          error = retour.error;
        }
      }

      if (error) {
        console.error("[modifier]", error.message);
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
    // ---------------------------------------------------------------------
    // 🆕 CORRIGER L ETAPE DU PARCOURS — 01/09.
    //
    // LE DEFAUT SIGNALE PAR JACQUES : « le profil vient d accepter mon
    // invitation et son etat est plus avance que la realite, aucun moyen de
    // modifier ma fiche ». Le parcours ne savait qu AVANCER : un clic de
    // trop etait definitif.
    //
    // 🚨 UN OUTIL QUI NE SAIT QUE PROGRESSER FINIT PAR MENTIR. On se trompe
    // de bouton, un contact revient en arriere, une acceptation est marquee
    // trop vite. Toute etape doit pouvoir se defaire.
    //
    // POURQUOI UNE ACTION A PART, ET NON « marquer ». Marquer une etape
    // AVANCE la fiche et touche aux dates : une invitation pose
    // linkedin_le, un message pose linkedin_relance_le, et le plafond du
    // jour se verifie. Reculer ne doit rien de tout cela — c est une
    // correction, pas un evenement.
    //
    // ⚠️ AUCUNE DATE REELLE N EST EFFACEE PAR PRINCIPE. Une invitation
    // partie le 30/08 est partie : reculer de « message envoye » a
    // « invitation acceptee » NE SUPPRIME PAS linkedin_le. Effacer une date
    // vraie serait reecrire l histoire et fausserait les compteurs de la
    // semaine.
    //
    // ⚠️ SAUF LA DATE DE MESSAGE, ET C EST LA SEULE EXCEPTION. Redescendre
    // sous le rang 3 signifie « le message n est pas parti » — la garder
    // laisserait la fiche dans « Messages envoyes » et compterait une
    // relance qui n a pas eu lieu.
    //
    // ⚠️ LE PLAFOND N EST PAS CONSULTE. Corriger une erreur de saisie ne
    // doit jamais consommer une unite d invitation, ni etre refuse parce
    // que le quota du jour est atteint.
    if (action === "corriger_etape") {
      const id = body.id;
      const table = TABLES[base];
      if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
      if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });

      const rang = Number(body.rang) || 0;
      if (rang < 1 || rang > 6) {
        return NextResponse.json({ ok: false, erreur: "Etape inconnue." }, { status: 400 });
      }

      const statut = String(body.statut || "").trim();
      if (STATUTS.indexOf(statut) < 0) {
        return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      }

      const champs: any = { linkedin_statut: statut };

      // La date de message ne survit qu au-dessus du rang 3.
      if (rang < 3) {
        champs.linkedin_relance_le = null;
      }

      // Le score porte les trois dernieres etapes, que LinkedIn ne connait
      // pas. Il ne s applique qu aux fiches du CRM : les tables de
      // prospection n ont pas de colonne score.
      // 🚨 LE SCORE EST POSE SUR TOUTES LES TABLES — corrige le 01/09.
      //
      // LE DEFAUT : le score n etait ecrit que pour la table crm. Or il
      // porte les etapes 4, 5 et 6 du parcours. Sur une fiche de
      // prospection, cliquer « A repondu » ne laissait aucune trace : la
      // fiche revenait a l ecran, le rang etait recalcule sans score, et
      // retombait a 3. LE CLIC MARCHAIT, LE STOCKAGE MANQUAIT.
      //
      // ⚠️ LA COLONNE score DOIT EXISTER SUR LES QUATRE TABLES DE
      // PROSPECTION. Le SQL est fourni avec cette livraison. Sans elle,
      // l ecriture echoue et l erreur remonte a l ecran.
      const score = Number(body.score) || 0;
      if (score > 0) champs.score = score;

      if (base === "manuel") {
        champs.derniere_interaction = new Date().toISOString();

        // Le statut commercial suit le rang. « client » au rang 6 : c est
        // lui qui fait foi pour l entonnoir, pas le score.
        if (rang === 6) champs.statut = "client";
        else if (rang >= 2) champs.statut = "interesse";
        else champs.statut = "contacte";
      }

      // 🚨 LA COLONNE score N EXISTE PAS SUR TOUTES LES TABLES — 01/09.
      //
      // CE QUI S EST PASSE. En posant le score sur toutes les tables pour
      // que les etapes 4, 5 et 6 fonctionnent partout, j ai fait ECHOUER LA
      // MISE A JOUR ENTIERE sur les bases de prospection : Postgres refuse
      // toute la requete si une seule colonne est inconnue. Avant, le score
      // etait ignore ; apres, plus rien ne passait — meme reculer.
      //
      // LA PARADE. On tente avec le score, et si la colonne manque, on
      // recommence sans. L etape est alors portee par le statut seul :
      // exact pour les rangs 1 a 3, approche pour les rangs 4 a 6, qui
      // retombent sur « message envoye ».
      //
      // ⚠️ CE REPLI PRODUIT UN RESULTAT MOINS PRECIS, PAS UN RESULTAT FAUX
      // — c est ce qui le rend acceptable. Un repli qui changerait le
      // PERIMETRE des donnees serait interdit ; celui-ci enregistre moins,
      // il n invente rien.
      //
      // ⚠️ LA COLONNE RESTE A CREER pour que les trois dernieres etapes
      // tiennent sur les bases de prospection :
      //   alter table public.prospects_organismes add column if not exists score integer;
      //   alter table public.prospects_qualiopi   add column if not exists score integer;
      //   alter table public.prospects_interim    add column if not exists score integer;
      //   alter table public.prospects_cabinets   add column if not exists score integer;
      // Une fois faite, ce repli ne se declenchera plus.
      let { error: eCorr } = await supabase.from(table).update(champs).eq("id", id);

      if (eCorr && String(eCorr.message || "").indexOf("score") >= 0) {
        console.error("[corriger_etape] colonne score absente sur " + table
          + " — nouvel essai sans le score");
        const sansScore: any = { ...champs };
        delete sansScore.score;
        const retour = await supabase.from(table).update(sansScore).eq("id", id);
        eCorr = retour.error;
      }

      if (eCorr) {
        console.error("[corriger_etape]", eCorr.message);
        return NextResponse.json({ ok: false, erreur: eCorr.message }, { status: 500 });
      }

      const NOMS: any = {
        1: "Invitation envoyée",
        2: "Invitation acceptée",
        3: "Message envoyé",
        4: "A répondu",
        5: "Rendez-vous pris",
        6: "Nouveau client",
      };

      const c = await compteurs();

      return NextResponse.json({
        ok: true,
        rang: rang,
        statut: statut,
        compteurs: c,
        message: "Fiche ramenée à l'étape « " + NOMS[rang] + " ».",
      });
    }

    // ---------------------------------------------------------------------
    // 🆕 REMETTRE UNE FICHE ECARTEE DANS LA FILE — 01/09.
    //
    // LE BESOIN, DIT PAR JACQUES : « ceux qui ont ete ecartes doivent
    // pouvoir changer de statut aussi ». L ecran refusait toute action sur
    // une fiche ecartee, ce qui la condamnait pour toujours — alors qu on
    // ecarte par erreur, ou qu une societe redevient pertinente plus tard.
    //
    // 🚨 UN ETAT DONT ON NE PEUT PAS SORTIR EST UN DEFAUT, PAS UNE
    // SECURITE. C est le meme motif que le parcours qui ne savait
    // qu avancer : l outil doit pouvoir defaire ce qu il a fait.
    //
    // ⚠️ AUCUNE INVITATION N EST ENVOYEE NI CONSOMMEE. La fiche repart a
    // l etat « jamais sollicitee ».
    //
    // ⚠️ C EST LE SEUL ENDROIT OU linkedin_le EST EFFACEE, et c est
    // justifie : sur une fiche ecartee, cette date ne marque AUCUN envoi.
    // Elle enregistre le geste d ecarter, pose par la branche « ecarte »
    // plus bas. La garder ferait compter la fiche comme sollicitee.
    if (action === "remettre_en_file") {
      const id = body.id;
      const table = TABLES[base];
      if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
      if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });

      // On verifie que la fiche est bien ecartee : remettre en file une
      // fiche invitee effacerait une vraie date d envoi.
      const { data: avantR, error: eLire } = await supabase
        .from(table)
        .select("id, linkedin_statut")
        .eq("id", id)
        .maybeSingle();

      if (eLire) {
        return NextResponse.json({ ok: false, erreur: eLire.message }, { status: 500 });
      }
      if (!avantR) {
        return NextResponse.json({ ok: false, erreur: "Fiche introuvable." }, { status: 404 });
      }
      if (String(avantR.linkedin_statut || "") !== "ecarte") {
        return NextResponse.json({
          ok: false,
          erreur: "Cette fiche n'est pas écartée — rien à remettre en file.",
        }, { status: 400 });
      }

      const champs: any = {
        linkedin_statut: null,
        linkedin_le: null,
        linkedin_relance_le: null,
      };

      if (base === "manuel") {
        champs.statut = "prospect";
        champs.score = 35;
        champs.derniere_interaction = new Date().toISOString();
      }

      const { error: eMaj } = await supabase.from(table).update(champs).eq("id", id);
      if (eMaj) {
        return NextResponse.json({ ok: false, erreur: eMaj.message }, { status: 500 });
      }

      const c = await compteurs();

      return NextResponse.json({
        ok: true,
        compteurs: c,
        message: "Fiche remise dans la file — elle ressortira à inviter.",
      });
    }

    // ---------------------------------------------------------------------
    // 🆕 SUPPRIMER UNE FICHE — 01/09.
    //
    // Demande de Jacques : « pourquoi ne pas etre capable de tout modifier
    // si j ai envie ou de supprimer, je suis quand meme l administrateur ».
    //
    // ⚠️ C EST LE SEUL GESTE IRREVERSIBLE DE TOUT L ECRAN. Ecarter se
    // defait, un statut se corrige, une etape se deplace. Une ligne
    // supprimee ne revient pas. L ecran demande donc confirmation avant
    // d appeler cette action.
    //
    // ⚠️ LES RELANCES LIEES NE SONT PAS SUPPRIMEES. Elles portent
    // deadline_id et non l id de la fiche : les toucher effacerait
    // l historique d envoi, qui vaut comme preuve.
    if (action === "supprimer") {
      const id = body.id;
      const table = TABLES[base];
      if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
      if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });

      const { error: eSup } = await supabase.from(table).delete().eq("id", id);
      if (eSup) {
        return NextResponse.json({ ok: false, erreur: eSup.message }, { status: 500 });
      }

      const c = await compteurs();

      return NextResponse.json({
        ok: true,
        compteurs: c,
        message: "Fiche supprimée définitivement.",
      });
    }

    if (action === "en_file") {
      const [lignes, c] = await Promise.all([listerEnFile(LIMITE_LISTE), compteurs()]);
      return NextResponse.json({ ok: true, lignes, compteurs: c });
    }

    // AJOUTER UN PROFIL TROUVE A LA MAIN.
    //
    // 🚨🚨 TROIS FACONS D ENREGISTRER, ET LA DISTINCTION EST ESSENTIELLE —
    // corrigee le 18/08 apres un defaut de conception. Les deux seuls
    // boutons disponibles etaient « Invitee avec une note » et « Invitee
    // sans note » : ENREGISTRER UNE FICHE ET DECLARER UNE INVITATION
    // ETAIENT DONC LA MEME ACTION.
    //
    // LES MODES :
    //   « file »       : la fiche est rangee, SANS invitation, SANS quota.
    //   « invite »     : l invitation est partie AVEC une note.
    //   « invite_nu »  : l invitation est partie SANS note.
    //   « accepte_nu » : relation deja etablie, aucun quota consomme.
    //   « repondu »    : la personne a deja repondu.
    //   « rendez_vous »: un rendez-vous est pris.
    //
    // ⚠️ SEULS invite ET invite_nu CONSOMMENT LE QUOTA. Les trois derniers
    // consignent une relation qui existe deja : aucune invitation n est
    // envoyee, le plafond ne les concerne pas.
    if (action === "ajouter") {
      const nom = propre(body.nom, 120);
      const lien = propre(body.linkedin, 300);

      let mode = String(body.mode || "").trim();
      if (!mode) mode = body.avec_note === true ? "invite" : "invite_nu";

      const MODES_CONNUS = ["file", "invite", "invite_nu", "accepte_nu", "repondu", "rendez_vous"];
      if (MODES_CONNUS.indexOf(mode) < 0) {
        return NextResponse.json({ ok: false, erreur: "Mode d enregistrement inconnu." }, { status: 400 });
      }

      const consommeQuota = (mode === "invite" || mode === "invite_nu");

      if (nom.length < 2) {
        return NextResponse.json({ ok: false, erreur: "Indiquez le nom du contact." }, { status: 400 });
      }
      if (lien.indexOf("linkedin.com") < 0) {
        return NextResponse.json(
          { ok: false, erreur: "Collez l adresse complete du profil LinkedIn." },
          { status: 400 }
        );
      }

      // ══════════════════════════════════════════════════════════════════
      // 🚨 LA CAMPAGNE EST OBLIGATOIRE — CORRIGE LE 06/09.
      //
      // LE DEFAUT. L ecran affichait « Pour quelle campagne ? * » —
      // l etoile annoncant un champ obligatoire — MAIS RIEN NE LE
      // VERIFIAIT. La valeur demarrait sur « academiapro » et la route
      // recopiait `body.campagne || "academiapro"`. Une fiche validee sans
      // y toucher partait donc en AcadeMIA en silence.
      //
      // CE QUE CELA COUTAIT, dit par Jacques : « je me suis fait avoir
      // plusieurs fois ». La campagne decide du MESSAGE envoye apres
      // acceptation : un expert-comptable classe en AcadeMIA recoit le
      // message des organismes de formation. La faute se voit a la
      // reception, et ne se rattrape pas.
      //
      // ⚠️ LE CONTROLE EST ICI, PAS SEULEMENT DANS L ECRAN. Un ecran peut
      // etre contourne, et un autre appelant — un import, un futur cron —
      // n aurait aucune raison de le reproduire. La regle appartient a la
      // route.
      // ══════════════════════════════════════════════════════════════════
      const PRODUITS_CONNUS = ["academiapro", "mrcomptable", "mysterllc", "mrcrm", "mrlms"];
      const campagneChoisie = String(body.campagne || "").trim().toLowerCase();

      if (!campagneChoisie) {
        return NextResponse.json(
          { ok: false, erreur: "Choisissez la campagne avant d enregistrer : c est elle qui decide du message envoye." },
          { status: 400 }
        );
      }
      if (PRODUITS_CONNUS.indexOf(campagneChoisie) < 0) {
        return NextResponse.json(
          { ok: false, erreur: "Campagne inconnue : " + campagneChoisie },
          { status: 400 }
        );
      }

      // 🆕 LES PRODUITS SECONDAIRES — 06/09.
      //
      // Un cabinet comptable achete Mr. Comptable, mais peut aussi vouloir
      // Mr. CRM pour suivre ses clients, et MysterLLC s il en a qui ont une
      // societe americaine. Ces produits attendent leur tour : SEPT JOURS
      // entre deux messages a la meme personne, envoyes par le cron du
      // lundi 8 h.
      //
      // ⚠️ CHAQUE PRODUIT PORTE SA DATE, pas seulement sa presence. C est
      // elle qui dit ce qui est deja parti et ce qui reste a envoyer. `null`
      // signifie « pertinent, jamais envoye ».
      // ⚠️ LA CAMPAGNE PRINCIPALE EST EXCLUE de cette liste : elle a deja sa
      // colonne. L y laisser ferait envoyer deux fois le meme message.
      const produitsSecondaires: any = {};
      if (Array.isArray(body.produits)) {
        for (const x of body.produits) {
          const c = String(x || "").trim().toLowerCase();
          if (PRODUITS_CONNUS.indexOf(c) < 0) continue;
          if (c === campagneChoisie) continue;
          produitsSecondaires[c] = null;
        }
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

      // 🚨 LE PLAFOND AVERTIT, IL NE BLOQUE PLUS — regle posee le 27/08.
      // Une invitation partie depuis LinkedIn EXISTE, que cet ecran
      // l accepte ou non. La refuser ne l annule pas : elle laisse la
      // fiche vide et le compteur ment dans l autre sens.
      let avertissement: string | null = null;
      if (consommeQuota && avant.reste_jour <= 0) {
        avertissement = "Plafond du jour depasse (" + PLAFOND_JOUR
          + "). La fiche est enregistree, mais n envoyez plus d invitation aujourd hui.";
      }

      const morceaux = nom.split(/\s+/);
      const prenom = morceaux.length > 1 ? morceaux[0] : "";
      const patronyme = morceaux.length > 1 ? morceaux.slice(1).join(" ") : nom;

      // Le statut LinkedIn depose selon le mode. « repondu » et
      // « rendez_vous » n existent pas cote LinkedIn : ils se traduisent
      // en relance, et le score commercial les distingue.
      const statutIn: any = {
        file: null,
        invite: "invite",
        invite_nu: "invite_nu",
        accepte_nu: "accepte_nu",
        repondu: "relance",
        rendez_vous: "relance",
      };

      const scoreDe: any = {
        file: 35, invite: 45, invite_nu: 45,
        accepte_nu: 60, repondu: 70, rendez_vous: 85,
      };

      const statutCrm: any = {
        file: "prospect", invite: "contacte", invite_nu: "contacte",
        accepte_nu: "interesse", repondu: "interesse", rendez_vous: "interesse",
      };

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
        linkedin_statut: statutIn[mode],
        linkedin_le: mode === "file" ? null : new Date().toISOString(),
        source: "linkedin",
        statut: statutCrm[mode],
        score: scoreDe[mode],
        // 🚨 PLUS DE CAMPAGNE PAR DEFAUT — CORRIGE LE 06/09.
        //
        // LE DEFAUT, DECRIT PAR JACQUES : « des fois j oublie de
        // selectionner si c est Monsieur comptable ou si c est AcadeMIA et
        // je me suis fait avoir plusieurs fois ». La valeur retombait ici
        // sur « academiapro » : une fiche validee sans choix partait en
        // AcadeMIA SANS UN MOT, et l expert-comptable recevait le message
        // des organismes de formation.
        //
        // ⚠️ LE CONTROLE EST PLUS HAUT, avant l insertion : la route refuse
        // desormais une campagne absente ou inconnue. Ce champ ne fait plus
        // que recopier une valeur deja verifiee.
        campagne: campagneChoisie,
        // 🆕 LES PRODUITS SECONDAIRES — 06/09. Chacun a null : aucun message
        // n a encore ete envoye sous ce produit. Le cron du lundi 8 h y
        // posera la date.
        produits: produitsSecondaires,
        notes: propre(body.notes, 4000) ||
          "Profil trouve sur LinkedIn et ajoute a la main. Aucune adresse connue : " +
          "le joindre par la messagerie LinkedIn.",
        derniere_interaction: new Date().toISOString(),
      };

      // Un rendez-vous ou une reponse portent une date de message : sans
      // elle, la fiche n apparaitrait pas dans « Messages envoyes ».
      if (mode === "repondu" || mode === "rendez_vous") {
        fiche.linkedin_relance_le = new Date().toISOString();
      }

      const { data: cree, error } = await supabase
        .from("crm")
        .insert(fiche)
        .select("id, nom, organisme, ville, linkedin, linkedin_statut, campagne")
        .maybeSingle();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      const mots: any = {
        file: " est enregistre, en attente d invitation. Aucune unite de quota consommee.",
        invite: " est marque invite, avec une note.",
        invite_nu: " est marque invite, sans note.",
        accepte_nu: " est enregistre comme relation etablie. Aucun quota consomme.",
        repondu: " est enregistre : il a deja repondu. Aucun quota consomme.",
        rendez_vous: " est enregistre : rendez-vous pris. Aucun quota consomme.",
      };

      return NextResponse.json({
        ok: true,
        ajoute: cree ? uniformiser(cree, "manuel") : null,
        mode: mode,
        message: nom + (mots[mode] || " est enregistre."),
        avertissement: avertissement,
        compteurs: consommeQuota ? compteursApresInvitation(avant) : avant,
      });
    }

    if (action === "suivante") {
      const [r, c] = await Promise.all([suivante(base), compteurs()]);
      if ((r as any).erreur) {
        return NextResponse.json({ ok: false, erreur: (r as any).erreur }, { status: 400 });
      }
      return NextResponse.json({ ok: true, ...r, compteurs: c });
    }

    // 🚨 « MES INVITATIONS » : LE PLUS RECENT EN TETE — corrige le 01/09.
    // C est l ecran qu on ouvre apres une notification LinkedIn, pour
    // marquer une acceptation. Ce qu on vient d envoyer doit etre en haut.
    if (action === "en_attente") {
      const [lignes, c] = await Promise.all([
        lister(EN_ATTENTE, LIMITE_LISTE, "linkedin_le", true),
        compteurs(),
      ]);
      return NextResponse.json({ ok: true, lignes, compteurs: c });
    }

    // « A ECRIRE » : le plus recent en tete aussi. Une acceptation fraiche
    // se traite tant qu elle est encore presente a l esprit du destinataire.
    if (action === "a_relancer") {
      const [lignes, c] = await Promise.all([
        lister(ACCEPTES, LIMITE_LISTE, "linkedin_le", true),
        compteurs(),
      ]);
      return NextResponse.json({ ok: true, lignes, compteurs: c });
    }

    // 🚨 « MESSAGES ENVOYES » : LE PLUS ANCIEN EN TETE, ET C EST VOULU.
    // Ici on cherche ce qui attend depuis le plus longtemps sans reponse,
    // pour decider d une seconde relance. L ordre inverse des deux onglets
    // precedents repond a une question inverse.
    if (action === "envoyes") {
      const [lignes, c] = await Promise.all([
        lister(RELANCES, LIMITE_LISTE, "linkedin_relance_le", false),
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

    // 🆕 LA DATE D INVITATION PEUT ETRE FOURNIE — 28/08.
    //
    // Une invitation partie AVANT aujourd hui mais jamais consignee doit
    // etre datee de son vrai jour : sinon elle consomme le plafond du jour
    // a tort, et le compteur ment.
    const dateFournie = propre(body.date_invitation, 10);
    const dateValide = /^\d{4}-\d{2}-\d{2}$/.test(dateFournie) ? dateFournie : null;
    const regularisation = estInvitation && dateValide !== null;

    // LE PLAFOND SE VERIFIE COTE SERVEUR. Il n est calcule que pour une
    // invitation datee d aujourd hui : une regularisation ne le touche pas.
    let avant: any = null;
    let avertissement: string | null = null;

    if (estInvitation) {
      avant = await compteurs();

      // 🚨 LE PLAFOND AVERTIT, IL NE BLOQUE PLUS — regle du 27/08.
      if (!regularisation && avant.reste_jour <= 0) {
        avertissement = "Plafond du jour depasse (" + PLAFOND_JOUR
          + "). La fiche est enregistree — n envoyez plus d invitation aujourd hui.";
      } else if (!regularisation && avant.reste_semaine <= 0) {
        avertissement = "Plafond de la semaine depasse (" + PLAFOND_SEMAINE
          + "). La fiche est enregistree — laissez passer quelques jours.";
      }
    }

    // La date d envoi initial est CONSERVEE quand on marque une reponse.
    const champs: any = { linkedin_statut: statut };
    if (statut === "invite" || statut === "invite_nu" || statut === "ecarte") {
      champs.linkedin_le = dateValide
        ? new Date(dateValide + "T12:00:00Z").toISOString()
        : new Date().toISOString();
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

    // ⚠️ sans_suite : la recherche globale agit sur une fiche precise et
    // n enchaine sur rien. Charger la fiche suivante serait inutile.
    const enFile = (estInvitation || statut === "ecarte") && body.sans_suite !== true;

    // ⚠️ SUR UNE INVITATION DU JOUR, LES COMPTEURS NE SONT PAS RECALCULES :
    // celui d avant est corrige de l unite consommee. Une REGULARISATION,
    // elle, ne touche pas au compteur du jour — on rend le calcul tel quel.
    if (estInvitation) {
      const suite: any = enFile ? await suivante(base) : {};
      return NextResponse.json({
        ok: true,
        statut: statut,
        avertissement: avertissement,
        compteurs: regularisation ? avant : compteursApresInvitation(avant),
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
