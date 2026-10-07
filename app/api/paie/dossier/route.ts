import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";
import {
  verifier, dossiersAutorises, carteBlanche, profilPaie, peutGererEquipe,
} from "../../../../lib/droits";
import type { Droit } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LA GESTION DE LA PAIE — 15/09/2026, corrigee le 16/09
//
// Une seule route pour tout ce qui n est pas le calcul : lister les
// contrats, ajouter un salarie, ouvrir un contrat, saisir les heures du
// mois, lister et emettre les bulletins.
//
// 🚨 LE CALCUL N EST PAS ICI. Il vit dans /api/paie/calculer, et nulle part
// ailleurs. Deux calculs a deux endroits finissent toujours par diverger —
// et sur un bulletin, diverger veut dire un redressement.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — L ARRET DE TRAVAIL SE VERROUILLE A LA SAISIE
//
// Les trois fichiers DSN passent l outil officiel. Mais l arret de travail
// n y est arrive qu avec trois donnees ajoutees A LA MAIN en base : cette
// route laissait enregistrer un arret que la CPAM aurait rejete.
//
// CE QUE dsn-val EXIGE, ET QUE LA ROUTE REFUSE DESORMAIS D IGNORER :
//   · la DATE DE FIN PREVISIONNELLE de l arret (S21.G00.60.003)
//   · EN SUBROGATION, quatre donnees qui vont ensemble — debut, FIN, IBAN et
//     BIC (controle CCH-11). L IBAN seul etait deja reclame.
//
// ⚠️ L ECRAN LE RECLAME AUSSI, MAIS UN ECRAN NE PROTEGE DE RIEN : il se
// contourne, et demain un autre ecran ou un import appellera cette route.
// C est ici que la regle tient.
//
// 🚨 ET L IBAN EST CONTROLE PAR SA CLE, comme le numero de securite
// sociale. Un IBAN faux ne fait pas rejeter le signalement : il envoie les
// indemnites journalieres SUR UN COMPTE QUI N EXISTE PAS, et l employeur qui
// a maintenu le salaire attend un virement qui ne viendra jamais.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function propre(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 20/09 — UN NOMBRE SAISI A LA FRANCAISE
//
// ⛔ `Number("6,6")` NE VAUT PAS 6,6 : il vaut NaN, et `NaN || 0` vaut
// zero. Un montant saisi avec une VIRGULE — ce que fait n importe quel
// utilisateur francais, et ce que propose le clavier de l iPad — etait donc
// SILENCIEUSEMENT REMPLACE PAR ZERO.
// 🚨 LE DEFAUT NE SE VOYAIT PAS : la ligne s enregistrait, sans message,
// avec un montant de 0,00 EUR. Trouve le 20/09 sur les titres-restaurant,
// mais il touchait TOUS les elements variables depuis le debut.
// ⚠️ ON ACCEPTE AUSSI LES ESPACES DES MILLIERS (« 1 234,56 ») et l espace
// insecable que colle iOS.
// ═══════════════════════════════════════════════════════════════════════
function nombreFr(v: any): number | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/\u00A0|\u202F|\s/g, "").replace(",", ".").trim();
  if (t.length === 0) return null;
  const n = Number(t);
  return isFinite(n) ? n : null;
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — LE CONTROLE DE LA CLE DU NUMERO DE SECURITE SOCIALE
//
// DEFAUT TROUVE A L ESSAI : le jeu d essai portait 1 92 04 99 999 999 42.
// La cle exacte de ce numero est 82. Rien ne l avait signale, et la
// DECLARATION AURAIT ETE REJETEE — apres la date limite de depot, donc avec
// une penalite de retard.
//
// LA REGLE : cle = 97 - (les treize premiers chiffres modulo 97).
// ⚠️ LA CORSE FAIT EXCEPTION : le departement s ecrit 2A ou 2B, et se
// remplace par 19 et 18 AVANT le calcul. Sans cela, tous les numeros corses
// seraient declares faux.
// ⚠️ ON UTILISE BigInt : treize chiffres depassent la precision exacte d un
// nombre JavaScript ordinaire, et le modulo rendrait un resultat faux sur
// certains numeros — donc un refus incomprehensible sur un numero valide.
//
// 🚨 ON REFUSE A LA SAISIE PLUTOT QUE DE SIGNALER APRES COUP. Meme regle
// que l entreprise utilisatrice sur un contrat de mission, et que
// l irrevocabilite des mandats immobiliers.
// ═══════════════════════════════════════════════════════════════════════
function controlerNir(brut: string): { ok: boolean; message?: string; propre?: string } {
  const n = String(brut).replace(/[^0-9AaBb]/g, "").toUpperCase();

  if (n.length !== 15) {
    return {
      ok: false,
      message: "le numéro de sécurité sociale doit comporter 15 chiffres "
        + "(13 pour le numéro, 2 pour la clé). Celui-ci en compte " + n.length + ".",
    };
  }

  const corps = n.slice(0, 13);
  const cleSaisie = Number(n.slice(13));

  // ⚠️ 2A ET 2B NE PEUVENT APPARAITRE QU EN POSITION 6-7 (le departement).
  const pourCalcul = corps.replace("2A", "19").replace("2B", "18");
  if (!/^\d{13}$/.test(pourCalcul)) {
    return { ok: false, message: "le numéro de sécurité sociale contient un caractère inattendu." };
  }

  const attendue = 97 - Number(BigInt(pourCalcul) % 97n);

  if (attendue !== cleSaisie) {
    return {
      ok: false,
      message: "la clé du numéro de sécurité sociale est fausse : "
        + "elle devrait être " + String(attendue).padStart(2, "0")
        + ", et non " + String(cleSaisie).padStart(2, "0") + ". "
        + "⛔ Un numéro dont la clé est fausse fait REJETER la DSN.",
    };
  }

  // Remis en forme lisible : 1 92 04 99 999 999 42
  const f = n.slice(0, 1) + " " + n.slice(1, 3) + " " + n.slice(3, 5) + " "
    + n.slice(5, 7) + " " + n.slice(7, 10) + " " + n.slice(10, 13) + " " + n.slice(13);

  return { ok: true, propre: f };
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — LE CONTROLE DE LA CLE DE L IBAN
//
// LA REGLE (norme ISO 13616) : on reporte les quatre premiers caracteres a
// la fin, on remplace chaque lettre par son rang (A = 10, B = 11… Z = 35),
// et le nombre obtenu, divise par 97, doit laisser un reste de 1.
//
// ⚠️ LE NOMBRE A PLUS DE TRENTE CHIFFRES : on ne le construit pas. On fait
// la division chiffre apres chiffre, en ne gardant que le reste — c est la
// division posee de l ecole, et elle ne deborde jamais.
//
// ⚠️ UN IBAN FRANCAIS COMPTE VINGT-SEPT CARACTERES. Un chiffre oublie se
// voit tout de suite a la longueur : on le dit avant meme de calculer la
// cle, parce que « la cle est fausse » n aide personne a trouver l oubli.
//
// 🚨 POURQUOI ICI : un IBAN faux ne fait PAS rejeter le signalement. La
// CPAM l accepte, et verse les indemnites journalieres sur un compte qui
// n existe pas. L erreur ne se decouvre qu au virement manquant.
// ═══════════════════════════════════════════════════════════════════════
function controlerIban(brut: string): { ok: boolean; message?: string; propre?: string } {
  const s = String(brut).replace(/\s/g, "").toUpperCase();

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) {
    return {
      ok: false,
      message: "l'IBAN n'a pas la forme attendue : deux lettres pour le pays, "
        + "deux chiffres de clé, puis le numéro de compte (FR76 …).",
    };
  }
  if (s.slice(0, 2) === "FR" && s.length !== 27) {
    return {
      ok: false,
      message: "un IBAN français compte 27 caractères. Celui-ci en compte "
        + s.length + " : un caractère a probablement été oublié ou doublé.",
    };
  }

  const retourne = s.slice(4) + s.slice(0, 4);
  let reste = 0;
  for (let i = 0; i < retourne.length; i++) {
    const rang = String(parseInt(retourne[i], 36));   // 0-9 tel quel, A = 10 … Z = 35
    for (let k = 0; k < rang.length; k++) {
      reste = (reste * 10 + Number(rang[k])) % 97;
    }
  }

  if (reste !== 1) {
    return {
      ok: false,
      message: "la clé de l'IBAN est fausse : un caractère a été mal recopié. "
        + "⛔ Les indemnités journalières partiraient sur un compte qui "
        + "n'existe pas. Vérifier l'IBAN sur le relevé d'identité bancaire.",
    };
  }

  return { ok: true, propre: s };
}

// LE BIC : huit ou onze caracteres — quatre lettres pour la banque, deux
// pour le pays, deux pour la place, et trois facultatifs pour l agence.
// ⚠️ IL N A PAS DE CLE : on ne peut controler que sa FORME. C est peu, mais
// cela arrete un BIC tronque ou colle a la place de l IBAN.
function controlerBic(brut: string): { ok: boolean; message?: string; propre?: string } {
  const s = String(brut).replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s)) {
    return {
      ok: false,
      message: "le BIC n'a pas la forme attendue : 8 ou 11 caractères, dont "
        + "les six premiers sont des lettres (BNPAFRPP, BDFEFRPPCCT…). "
        + "Celui-ci en compte " + s.length + ".",
    };
  }
  return { ok: true, propre: s };
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 05/10 — CE QUE LE MOTIF DE RUPTURE REND OBLIGATOIRE
//
// Les memes listes que dans le signalement (app/api/dsn/evenement), lues au
// cahier technique 2026.1, bloc S21.G00.62 et S21.G00.63. Le signalement de
// fin de contrat les controle a la generation ; ICI, ON REFUSE A LA SAISIE :
// c est le moment ou le cabinet a la lettre de rupture sous les yeux.
//   · notification de la rupture (62.003) : licenciements, demission, essai ;
//   · signature de la convention (62.004) : rupture conventionnelle ;
//   · engagement de la procedure (62.005) : licenciements ;
//   · preavis (63.001) : ses types, et ce que le motif en permet.
// ⛔ SI CES LISTES CHANGENT DANS LA NORME, ELLES CHANGENT AUX DEUX ENDROITS.
// ═══════════════════════════════════════════════════════════════════════
const RUPT_NOTIFICATION = ["011", "012", "014", "015", "020", "025", "034",
  "035", "036", "037", "058", "059", "082", "083", "087", "088", "089", "095",
  "096", "097", "111", "112", "113", "115", "117"];
const RUPT_CONVENTION = ["043", "110", "111"];
const RUPT_PROCEDURE = ["011", "012", "014", "015", "020", "026", "086",
  "087", "088", "089", "091", "092", "093", "111", "112", "113", "114", "115",
  "117"];
// Les motifs que le signalement declare « sans preavis » quand rien n est
// saisi : fin de CDD, fin de mission, fin d essai du salarie, ruptures
// conventionnelles.
// 🆕 07/10 — 081, fin de contrat d apprentissage : pas de preavis non plus.
const RUPT_SANS_PREAVIS = ["031", "032", "035", "043", "081", "110"];
const PREAVIS_TYPES = ["01", "02", "03", "10", "50", "51", "60", "61", "90"];
const PREAVIS_NON_FAITS = ["02", "03", "10", "50", "51", "61"];

// Les caracteristiques d un contrat dont le CHANGEMENT se declare dans la
// DSN du mois (bloc S21.G00.41), avec leur nom pour les messages.
const CONTRAT_SUIVIS: Record<string, string> = {
  duree_hebdo: "durée du travail",
  forfait_jours_annuel: "forfait en jours",
  categorie: "catégorie",
  idcc: "convention collective",
  pcs_ese: "profession",
  code_risque_at: "code risque accidents du travail",
};

// La date du jour A PARIS : a 0 h 30, l heure du serveur est encore la veille.
function aujourdhuiParis(): string {
  try {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }).slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function jmaRoute(d: string): string {
  const t = String(d || "");
  return t.length < 10 ? t : t.slice(8, 10) + "/" + t.slice(5, 7) + "/" + t.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕 28/09 — CE QUI ETAIT LE POST EST DEVENU `traiter`. La porte (session,
// organisme, droits, journal) est dans le POST, en fin de fichier : quand
// on arrive ici, tout a deja ete verifie.
// ═══════════════════════════════════════════════════════════════════════
async function traiter(req: NextRequest, c: any, action: string, ctx: Ctx): Promise<NextResponse> {
  try {
    // 🆕 28/09 — relais, validation, pieces, recapitulatif, mesure.
    const nouvelle = await actionsDuControle(req, c, action, ctx);
    if (nouvelle) return nouvelle;

    // ---- LISTER LES CONTRATS ----
    // 🆕🚨 28/09 — BORNEE A L ORGANISME ET AUX DOSSIERS CONFIES. Jusqu ici
    // elle rendait les contrats et les societes de TOUTE LA BASE : avec la
    // cle, c etait Jacques seul ; avec la connexion, un cabinet aurait vu les
    // salaries de tous les autres. Elle rend aussi le PROFIL de la session
    // (ce qu elle peut faire, dossier par dossier) pour que l ecran ne
    // montre que les boutons utilisables — la route reverifie chaque geste.
    if (action === "contrats") {
      const ids = ctx.cleServeur ? null : await dossiersAutorises();
      if (ids && ids.length === 0) {
        return NextResponse.json({
          success: true, contrats: [], societes: [],
          profil: await profilPaie([]),
          avertissement: "Aucun dossier de paie n'est rattaché à votre compte.",
        });
      }

      let qContrats = supabase
        .from("paie_contrats")
        .select("*, paie_salaries(nom, prenom, taux_pas, taux_pas_date_effet, taux_pas_identifiant_crm)")
        .eq("statut", "actif")
        .order("date_debut", { ascending: false })
        .limit(500);
      if (ids) qContrats = qContrats.in("societe_id", ids);
      const { data, error } = await qContrats;

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // 🆕 05/10 — LE LIEU DE NAISSANCE, pour pouvoir le corriger dans
      // « modifier le contrat » (la DSN le declare). ⚠️ LECTURE A PART ET
      // TOLERANTE : si elle echoue, la liste des contrats s affiche quand
      // meme, sans lui.
      {
        const idsSal: string[] = [];
        for (const k of (data || [])) {
          const s = String((k as any).salarie_id || "");
          if (s && idsSal.indexOf(s) < 0) idsSal.push(s);
        }
        if (idsSal.length > 0) {
          const { data: lieux, error: eLieux } = await supabase
            .from("paie_salaries").select("id, lieu_naissance").in("id", idsSal);
          if (!eLieux && lieux) {
            const parId: Record<string, string> = {};
            for (const l of lieux) parId[String((l as any).id)] = String((l as any).lieu_naissance || "");
            for (const k of (data || [])) {
              const kk: any = k;
              if (kk.paie_salaries && typeof kk.paie_salaries === "object") {
                kk.paie_salaries.lieu_naissance = parId[String(kk.salarie_id)] || "";
              }
            }
          }
        }
      }

      // Les societes, pour le choix a la creation.
      let qSocietes = supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale, effectif, siret, contact_email, email_contact")
        .order("raison_sociale");
      if (ids) qSocietes = qSocietes.in("id", ids);
      const { data: societes } = await qSocietes;

      const profil = ctx.cleServeur
        ? { email: "cle-serveur", role: "administrateur", admin: true, gerer_equipe: false, dossiers: {} }
        : await profilPaie((societes || []).map(function (s: any) { return String(s.id); }));

      return NextResponse.json({ success: true, contrats: data || [], societes: societes || [], profil: profil });
    }

    // ---- CREER UN SALARIE ET SON CONTRAT ----
    //
    // ⚠️ LES DEUX SE CREENT ENSEMBLE : un salarie sans contrat n a aucun
    // usage, et laisser deux ecrans separes obligerait a revenir en arriere.
    if (action === "nouveau") {
      const societeId = propre(c.societe_id);
      if (!societeId) return NextResponse.json({ erreur: "choisir une societe" }, { status: 400 });

      const { data: soc } = await supabase
        .from("compta_societes").select("tenant_id").eq("id", societeId).maybeSingle();
      if (!soc) return NextResponse.json({ erreur: "societe introuvable" }, { status: 404 });

      const nom = propre(c.nom);
      const prenom = propre(c.prenom);
      if (!nom || !prenom) {
        return NextResponse.json({
          erreur: "le nom et le prenom du salarie sont obligatoires",
        }, { status: 400 });
      }

      // 🚨 LE NUMERO DE SECURITE SOCIALE EST CONTROLE AVANT D ETRE ECRIT.
      // ⚠️ IL EST LAISSE FACULTATIF A LA SAISIE — on peut embaucher avant
      // de l avoir — mais des qu il est donne, il doit etre juste.
      let nirPropre: string | null = null;
      const nirSaisi = propre(c.numero_secu);
      if (nirSaisi) {
        const v = controlerNir(nirSaisi);
        if (!v.ok) return NextResponse.json({ erreur: v.message }, { status: 400 });
        nirPropre = v.propre || nirSaisi;
      }

      const { data: sal, error: eSal } = await supabase
        .from("paie_salaries")
        .insert({
          tenant_id: soc.tenant_id, societe_id: societeId,
          nom: nom.toUpperCase(), prenom: prenom,
          sexe: propre(c.sexe), date_naissance: propre(c.date_naissance),
          numero_secu: nirPropre,
          adresse: propre(c.adresse), code_postal: propre(c.code_postal),
          ville: propre(c.ville), email: propre(c.email),
          // 🆕🚨 05/10 — LE LIEU DE NAISSANCE ETAIT DEMANDE A L ECRAN ET JAMAIS
          // ENREGISTRE : le formulaire le portait, cette ligne manquait. La
          // DSN le declare (S21.G00.30.014) ; pour Hugo et Ines il a fallu
          // une requete SQL. Ecrit seulement s il est saisi.
          ...(propre(c.lieu_naissance) ? { lieu_naissance: propre(c.lieu_naissance) } : {}),
        })
        .select().maybeSingle();

      if (eSal) return NextResponse.json({ erreur: eSal.message }, { status: 500 });

      const type = propre(c.type_contrat) || "mission";

      // 🆕 28/09 — LES TYPES ADMIS, contrôlés : la colonne n'a aucune
      // contrainte en base, une faute de frappe créerait un contrat que le
      // moteur ne reconnaîtrait pas.
      if (["mission", "cdd", "cdi", "apprentissage", "mandat_social", "stage", "professionnalisation"].indexOf(type) < 0) {
        return NextResponse.json({
          erreur: "type de contrat inconnu : « " + type + " ». Types admis : mission, cdd, "
            + "cdi, apprentissage, mandat_social, stage, professionnalisation.",
        }, { status: 400 });
      }

      // 🆕🚨 22/09 — UN APPRENTI SANS NIVEAU DE DIPLOME PREPARE VOIT SA DSN
      // REJETEE (controle CCH-11). On refuse a la saisie plutot que de le
      // decouvrir au depot, meme regle que pour le contrat de mission
      // ci-dessous : un defaut qui bloque une declaration se signale au
      // moment ou il est reparable sans effort.
      // 🆕🚨 22/09 — UN FORFAIT AU-DELA DE 218 JOURS EST ILLEGAL SANS
      // ACCORD DE RENONCIATION (L3121-64). On le refuse a la saisie : le
      // decouvrir sur un bulletin, c est le decouvrir trop tard.
      if (c.forfait_jours_annuel) {
        const fj = Math.round(nombreFr(c.forfait_jours_annuel) || 0);
        if (fj > 0 && fj > 235) {
          return NextResponse.json({
            erreur: "un forfait de " + fj + " jours par an est hors de tout "
              + "cadre légal : le plafond est de 218 jours, porté au plus à "
              + "235 par accord de renonciation à des jours de repos, avec "
              + "majoration de salaire d'au moins 10 %.",
          }, { status: 400 });
        }
      }

      // 🆕 28/09 — UNE CONVENTION DE STAGE A TOUJOURS UNE FIN : c est elle qui
      // dit si le stage depasse deux mois, donc si la gratification est due.
      if (type === "stage" && !propre(c.date_fin)) {
        return NextResponse.json({
          erreur: "la date de fin est obligatoire pour un stage : elle figure sur la convention de "
            + "stage, et c'est elle qui dit si la gratification est obligatoire (plus de deux mois).",
        }, { status: 400 });
      }

      if (type === "apprentissage" && !propre(c.niveau_diplome_prepare)) {
        return NextResponse.json({
          erreur: "le niveau de diplôme préparé est obligatoire sur un contrat "
            + "d'apprentissage : sans lui, la DSN est rejetée. Il figure sur le "
            + "contrat signé avec le CFA. Valeurs : 03 CAP-BEP, 04 bac, "
            + "05 bac+2 (BTS, DUT), 06 bac+3 et bac+4, 07 bac+5, 08 doctorat.",
        }, { status: 400 });
      }

      // 🚨 UN CONTRAT DE MISSION SANS ENTREPRISE UTILISATRICE NI MOTIF DE
      // RECOURS EST REQUALIFIABLE EN CDI par le conseil de prud hommes. On
      // refuse a la saisie plutot que de le signaler apres coup — meme
      // regle que l irrevocabilite des mandats immobiliers.
      if (type === "mission") {
        if (!propre(c.eu_raison_sociale)) {
          return NextResponse.json({
            erreur: "l entreprise utilisatrice est obligatoire sur un contrat de mission : "
              + "sans elle, le contrat est requalifiable en CDI.",
          }, { status: 400 });
        }
        if (!propre(c.motif_recours)) {
          return NextResponse.json({
            erreur: "le motif de recours est obligatoire. Les six motifs legaux : "
              + "remplacement d un salarie absent, accroissement temporaire d activite, "
              + "emploi saisonnier, usage constant, remplacement d un chef d entreprise, "
              + "complement de formation.",
          }, { status: 400 });
        }
      }

      // 🆕🚨 06/10 — LE MOTIF D UN CDD. Il ne se saisissait nulle part (seul
      // l interim le demandait), alors que la DSN le declare (S21.G00.40.021)
      // et qu un CDD sans motif est requalifiable. Il se choisit en code,
      // dans la liste du cahier technique. Un contrat d usage (05) ou
      // saisonnier (03) n ouvre pas de prime de precarite.
      const MOTIFS_CDD = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
      if (type === "cdd" && MOTIFS_CDD.indexOf(String(propre(c.motif_recours) || "")) < 0) {
        return NextResponse.json({
          erreur: "le motif du contrat à durée déterminée est obligatoire : remplacement d'un salarié, "
            + "accroissement temporaire d'activité, emploi saisonnier, contrat d'usage… Sans motif, le contrat "
            + "est requalifiable en contrat à durée indéterminée, et la DSN le réclame.",
        }, { status: 400 });
      }
      const motifCdd = type === "cdd" ? String(propre(c.motif_recours)) : "";
      const sansPrecarite = motifCdd === "05" ? "Contrat d'usage (extra)"
        : (motifCdd === "03" || motifCdd === "04") ? "Emploi à caractère saisonnier" : "";

      const { data: ctr, error: eCtr } = await supabase
        .from("paie_contrats")
        .insert({
          tenant_id: soc.tenant_id, societe_id: societeId, salarie_id: sal.id,
          type_contrat: type,
          date_debut: propre(c.date_debut), date_fin: propre(c.date_fin),
          intitule_poste: propre(c.intitule_poste) || "A preciser",
          // 🆕 28/09 — un mandat social est en principe « cadre » pour la
          // retraite complementaire.
          categorie: propre(c.categorie) || (type === "mandat_social" ? "cadre" : "non_cadre"),
          idcc: c.idcc ? Number(c.idcc) : null,
          // 🆕 28/09 — LA VIRGULE ET LES ESPACES FRANCAIS : « 19,78 » ou
          // « 2 400 » donnaient NaN avec Number(). `nombreFr` les accepte.
          salaire_horaire: c.salaire_horaire ? (nombreFr(c.salaire_horaire) || null) : null,
          salaire_mensuel: c.salaire_mensuel ? (nombreFr(c.salaire_mensuel) || null) : null,
          // 🆕 28/09 — UN MANDATAIRE N A PAS DE DUREE DU TRAVAIL, mais la
          // colonne est NOT NULL en base (refus a l essai du 28/09) : on garde
          // 35, que le moteur ignore pour un mandat social (jamais de temps
          // partiel, ni d heures, ni de retenue d absence automatique).
          duree_hebdo: type === "mandat_social" ? 35
            : (c.duree_hebdo ? (nombreFr(c.duree_hebdo) || 35) : 35),
          eu_raison_sociale: propre(c.eu_raison_sociale),
          eu_siret: propre(c.eu_siret),
          eu_adresse: propre(c.eu_adresse),
          motif_recours: propre(c.motif_recours),
          // 🚨 RUBRIQUE OBLIGATOIRE EN DSN (S21.G00.40.004), et SENSIBLE A
          // LA CASSE : on ne met pas en majuscules comme on le fait pour le
          // nom de famille. « 653a » et « 653A » ne sont pas le meme code.
          pcs_ese: propre(c.pcs_ese),
          motif_detail: propre(c.motif_detail),
          // 🆕 22/09 — Le niveau de diplome prepare par l apprenti, ecrit en
          // DSN dans la rubrique S21.G00.30.025. ⛔ Rien a voir avec la
          // colonne `niveau`, qui porte le niveau de la grille
          // conventionnelle et va avec le coefficient.
          niveau_diplome_prepare: propre(c.niveau_diplome_prepare),
          // 🆕 28/09 — l apprenti d un employeur public (Ircantec,
          // exonerations propres). Ecrit SEULEMENT s il est coche : la
          // colonne n existe qu apres le SQL du 28/09.
          ...(type === "apprentissage" && c.apprenti_public === true ? { apprenti_public: true } : {}),
          // 🆕 22/09 — Le forfait en jours : nul quand le contrat n en a
          // pas. ⚠️ `nombreFr` accepte la virgule, mais un forfait est un
          // nombre entier de jours : on arrondit plutot que de refuser.
          forfait_jours_annuel: c.forfait_jours_annuel
            ? Math.round(nombreFr(c.forfait_jours_annuel) || 0) || null : null,
          poste_chez_eu: propre(c.poste_chez_eu),
          ifm_due: (type === "mandat_social" || type === "stage" || type === "professionnalisation"
            || c.ifm_due === false || sansPrecarite) ? false : true,
          ...(sansPrecarite ? { ifm_motif_non_due: sansPrecarite } : {}),
          // 🆕 28/09 — titulaire d un bac professionnel ou plus (minimum legal
          // du contrat de professionnalisation). Ecrit SEULEMENT pour ce
          // type : la colonne n existe qu apres le SQL du 28/09.
          ...(type === "professionnalisation" ? { qualification_niveau4: c.qualification_niveau4 === true } : {}),
        })
        .select().maybeSingle();

      // 🆕 28/09 — UN CONTRAT REFUSE NE LAISSE PLUS DE SALARIE ORPHELIN.
      // Le salarie etait deja ecrit : a l essai du 28/09, le refus du contrat
      // a laisse « Paul DUPRE » sans contrat, et un second essai en aurait
      // cree un deuxieme.
      if (eCtr) {
        await supabase.from("paie_salaries").delete().eq("id", sal.id);
        return NextResponse.json({ erreur: eCtr.message + " — rien n'a été enregistré." }, { status: 500 });
      }

      return NextResponse.json({
        success: true, contrat_id: ctr.id,
        // 🆕 01/10 — L ACCORD. « Inès MOREAU est enregistré » s est affiche
        // pendant le tournage de la video de la paie : la route ne connait
        // pas le genre du salarie. La tournure ne depend plus de lui.
        message: prenom + " " + nom.toUpperCase() + " et son contrat sont enregistrés.",
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 28/09 — LES MOTIFS DE RUPTURE, POUR L ECRAN
    // Lus dans `dsn_codes` (rubrique 62.002 de la DSN, codes en vigueur et
    // verifies) : aucune valeur de referentiel n est ecrite en dur ici.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "motifs_rupture") {
      const { data, error } = await supabase
        .from("dsn_codes")
        .select("code, libelle")
        .ilike("rubrique", "%62.002%")
        .is("date_fin", null)
        .eq("verifie", true)
        .order("code", { ascending: true });
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      const vus: any = {};
      const motifs = (data || [])
        .filter(function (m: any) { if (vus[String(m.code)]) return false; vus[String(m.code)] = true; return true; })
        .map(function (m: any) { return { code: String(m.code), libelle: String(m.libelle || "") }; });
      return NextResponse.json({ success: true, motifs: motifs });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 28/09 — MODIFIER UN CONTRAT EXISTANT
    //
    // Jusqu au 28/09, aucun ecran ne changeait un contrat : une augmentation,
    // un passage a temps partiel, un coefficient, un lieu de travail, une
    // date de fin — et surtout une RUPTURE (date et motif, lus par le moteur
    // et par la DSN) — ne passaient que par SQL. Trouve en preparant l essai
    // du mandat social sur une fiche neuve.
    // CE QUI SE CONTROLE : montants (virgule francaise), heures (48 au plus),
    // forfait (235 jours au plus), code INSEE (5 caracteres, pas un code
    // postal), dates dans le contrat, motif de rupture existant et ouvert
    // dans la DSN, un salaire (mensuel ou horaire) sauf apprenti au bareme.
    // ⛔ LE TYPE DE CONTRAT NE CHANGE PAS : changer de type, c est un nouveau
    // contrat. ⚠️ Un bulletin deja emis ne change pas : seuls les calculs a
    // venir lisent les nouvelles valeurs.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "modifier_contrat") {
      const contratId = propre(c.contrat_id);
      if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
      const { data: ct, error: eCt } = await supabase
        .from("paie_contrats").select("*").eq("id", contratId).maybeSingle();
      if (eCt) return NextResponse.json({ erreur: eCt.message }, { status: 500 });
      if (!ct) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });

      const typeCt = String((ct as any).type_contrat || "");
      const maj: any = {};
      const refus: string[] = [];
      const donne = function (k: string): boolean { return Object.prototype.hasOwnProperty.call(c, k); };
      const dateOk = function (x: string | null): boolean { return x === null || /^\d{4}-\d{2}-\d{2}$/.test(x); };
      const debut = String((ct as any).date_debut || "").slice(0, 10);

      if (donne("intitule_poste")) maj.intitule_poste = propre(c.intitule_poste) || "A preciser";
      if (donne("pcs_ese")) maj.pcs_ese = propre(c.pcs_ese);
      if (donne("position_conv")) maj.position_conv = propre(c.position_conv);
      if (donne("coefficient")) maj.coefficient = propre(c.coefficient);
      if (donne("categorie")) {
        const cat = propre(c.categorie) || "non_cadre";
        if (cat !== String((ct as any).categorie || "") && ["cadre", "non_cadre"].indexOf(cat) < 0) {
          refus.push("catégorie inconnue : « " + cat + " » (cadre ou non cadre).");
        } else maj.categorie = cat;
      }
      if (donne("idcc")) {
        const t = propre(c.idcc);
        if (t === null) maj.idcc = null;
        else if (!/^\d{1,4}$/.test(t)) refus.push("l'IDCC est un nombre de 1 à 4 chiffres (1486 pour Syntec, 2378 pour le travail temporaire).");
        else maj.idcc = Number(t);
      }
      // 🆕 28/09 — CAS RARE : le code risque accidents du travail (notifie par
      // la CARSAT, 5 caracteres : 3 chiffres et 2 lettres, ex. 745BD).
      if (donne("code_risque_at")) {
        const t = propre(c.code_risque_at);
        if (t === null) maj.code_risque_at = null;
        else if (!/^[0-9]{3}[A-Z0-9]{2}$/i.test(t)) refus.push("code risque AT : 5 caractères, 3 chiffres puis 2 lettres (ex. 745BD), lu sur la notification CARSAT.");
        else maj.code_risque_at = t.toUpperCase();
      }
      // 🆕 28/09 — CAS RARE : le plafond de securite sociale reduit au forfait
      // en jours, avec le consentement du salarie (BOSS, §830).
      if (donne("plafond_reduit_forfait")) maj.plafond_reduit_forfait = c.plafond_reduit_forfait === true;
      if (donne("apprenti_public") && typeCt === "apprentissage") {
        maj.apprenti_public = c.apprenti_public === true;
      }
      // 🆕 06/10 — LA PRIME DE PRECARITE D UN CDD : due (le cas general), ou
      // non due — contrat d usage (les « extras » des hotels, cafes,
      // restaurants), emploi saisonnier, autre cas de la loi (article
      // L1243-10). Elle ne se reglait qu a la creation, par la base.
      // 🆕 06/10 — le motif d un CDD (code a deux chiffres).
      if (donne("motif_recours") && typeCt === "cdd") {
        const mr = propre(c.motif_recours);
        const actuel = String((ct as any).motif_recours || "");
        if (mr !== null && mr !== actuel) {
          if (["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"].indexOf(mr) < 0) {
            refus.push("motif du contrat à durée déterminée inconnu : « " + mr + " ».");
          } else maj.motif_recours = mr;
        }
      }
      if (donne("precarite") && typeCt === "cdd") {
        const pr = propre(c.precarite) || "due";
        const motifs: any = {
          usage: "Contrat d'usage (extra)",
          saisonnier: "Emploi à caractère saisonnier",
          autre: "Non due (article L1243-10 du code du travail)",
        };
        if (pr === "due") { maj.ifm_due = true; maj.ifm_motif_non_due = null; }
        else if (motifs[pr]) { maj.ifm_due = false; maj.ifm_motif_non_due = motifs[pr]; }
        else refus.push("prime de précarité : choix inconnu « " + pr + " ».");
      }
      if (donne("qualification_niveau4") && typeCt === "professionnalisation") {
        maj.qualification_niveau4 = c.qualification_niveau4 === true;
      }
      if (donne("lieu_travail_insee")) {
        const t = propre(c.lieu_travail_insee);
        if (t === null) maj.lieu_travail_insee = null;
        else if (!/^[0-9][0-9AB][0-9]{3}$/i.test(t)) refus.push("le lieu de travail est le code INSEE de la commune, 5 caractères (69382 pour Lyon 2e) — pas le code postal.");
        else maj.lieu_travail_insee = t.toUpperCase();
      }
      const montant = function (k: string, libelle: string): void {
        if (!donne(k)) return;
        const t = propre(c[k]);
        if (t === null) { maj[k] = null; return; }
        const v = nombreFr(t);
        if (v === null || v < 0) { refus.push(libelle + " : « " + t + " » n'est pas un montant."); return; }
        maj[k] = v;
      };
      montant("salaire_mensuel", "Salaire mensuel");
      montant("salaire_horaire", "Taux horaire");
      if (donne("duree_hebdo") && typeCt !== "mandat_social") {
        const t = propre(c.duree_hebdo);
        const v = t === null ? 35 : nombreFr(t);
        if (v === null || v <= 0 || v > 48) refus.push("heures par semaine : plus de 0 et 48 au plus (durée maximale légale).");
        else maj.duree_hebdo = v;
      }
      if (donne("forfait_jours_annuel")) {
        const t = propre(c.forfait_jours_annuel);
        if (t === null) maj.forfait_jours_annuel = null;
        else {
          const v = Math.round(nombreFr(t) || 0);
          if (!(v > 0) || v > 235) refus.push("forfait en jours : de 1 à 235 jours par an (218 sans accord de renonciation à des jours de repos).");
          else maj.forfait_jours_annuel = v;
        }
      }
      if (donne("date_fin")) {
        const t = propre(c.date_fin);
        if (!dateOk(t)) refus.push("date de fin : format AAAA-MM-JJ.");
        else if (t && debut && t < debut) refus.push("la date de fin précède le début du contrat.");
        else if (!t && (typeCt === "cdd" || typeCt === "mission" || typeCt === "stage")) refus.push("un "
          + (typeCt === "cdd" ? "CDD" : typeCt === "stage" ? "stage" : "contrat de mission") + " doit garder une date de fin.");
        else maj.date_fin = t;
      }

      // ---- 🆕 28/09 — LE VEHICULE DE FONCTION (avantage en nature) ----
      // Un objet, ou vide pour le retirer. Le moteur en tire l avantage du
      // mois ; ici on controle ce qu il lui faut.
      if (donne("vehicule")) {
        const v = c.vehicule;
        if (v === null || v === "" || v === false) maj.vehicule = null;
        else if (typeof v !== "object") refus.push("véhicule : données illisibles.");
        else {
          const mode = String(v.mode || "achat");
          const valeur = nombreFr(v.valeur);
          const dAchat = propre(v.achat_le);
          const dDispo = propre(v.mis_a_disposition_le);
          const dRendu = propre(v.fin);
          const pSaisie = propre(v.participation);
          const part = pSaisie === null ? 0 : nombreFr(pSaisie);
          if (["achat", "location"].indexOf(mode) < 0) refus.push("véhicule : acheté ou loué.");
          if (valeur === null || !(valeur > 0)) {
            refus.push("véhicule : " + (mode === "location" ? "le coût global annuel de location (loyers, entretien, assurance)"
              : "le prix d'achat TTC") + " est obligatoire.");
          }
          if (!dDispo || !dateOk(dDispo)) refus.push("véhicule : la date de mise à disposition est obligatoire.");
          if (mode === "achat" && (!dAchat || !dateOk(dAchat))) refus.push("véhicule acheté : la date d'achat est obligatoire (elle dit s'il a plus de 5 ans).");
          if (dRendu && !dateOk(dRendu)) refus.push("véhicule : date de restitution au format AAAA-MM-JJ.");
          if (part === null || part < 0) refus.push("véhicule : la participation mensuelle du salarié n'est pas un montant.");
          maj.vehicule = {
            mode: mode, valeur: valeur, achat_le: mode === "achat" ? dAchat : null,
            mis_a_disposition_le: dDispo, fin: dRendu,
            carburant: v.carburant === true, electrique: v.electrique === true,
            eco_score: v.electrique === true && v.eco_score === true,
            participation: part || 0,
          };
        }
      }

      // ---- LA RUPTURE : date et motif, ou les deux vides pour l annuler ----
      if (donne("rompu_le") || donne("motif_rupture_dsn")) {
        const r = donne("rompu_le") ? propre(c.rompu_le)
          : ((ct as any).rompu_le ? String((ct as any).rompu_le).slice(0, 10) : null);
        const m = donne("motif_rupture_dsn") ? propre(c.motif_rupture_dsn)
          : ((ct as any).motif_rupture_dsn ? String((ct as any).motif_rupture_dsn) : null);
        if (!dateOk(r)) refus.push("date de rupture : format AAAA-MM-JJ.");
        else if (r === null) { maj.rompu_le = null; maj.motif_rupture_dsn = null; }
        else {
          if (debut && r < debut) refus.push("la date de rupture précède le début du contrat.");
          if (m) {
            const { data: mt } = await supabase
              .from("dsn_codes").select("code")
              .ilike("rubrique", "%62.002%").is("date_fin", null).eq("verifie", true)
              .eq("code", m).limit(1);
            if (!mt || mt.length === 0) refus.push("motif de rupture « " + m + " » inconnu ou fermé dans la DSN.");
          } else if (typeCt !== "mandat_social") {
            refus.push("une rupture exige son motif : il part dans la DSN (signalement de fin de contrat).");
          }
          maj.rompu_le = r;
          maj.motif_rupture_dsn = m;
        }
      }

      // ---- UN SALAIRE, TOUJOURS (sauf apprenti paye au bareme) ----
      const sm = donne("salaire_mensuel") ? maj.salaire_mensuel : (ct as any).salaire_mensuel;
      const sh = donne("salaire_horaire") ? maj.salaire_horaire : (ct as any).salaire_horaire;
      if (typeCt !== "apprentissage" && typeCt !== "professionnalisation" && !(Number(sm) > 0) && !(Number(sh) > 0)) {
        refus.push("il faut un salaire mensuel ou un taux horaire.");
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 05/10 — CE QUI CHANGE DANS LE CONTRAT SE DECLARE (bloc 41)
      //
      // Passage a temps partiel, passage cadre, nouvelle convention, nouvelle
      // profession, nouveau code risque : la DSN du mois doit le dire, avec
      // l ANCIENNE valeur et la DATE du changement. Le contrat ne garde que
      // sa valeur du jour ; on inscrit donc le changement au journal, et le
      // generateur de la DSN le relit (action « paie.changement_contrat »).
      // LES REGLES :
      //   · la date (« a compter du ») vaut aujourd hui si rien n est saisi ;
      //     ni avant le debut du contrat, ni dans l avenir (le contrat prend
      //     ses nouvelles valeurs tout de suite) ;
      //   · ⛔ UN CONTRAT SANS AUCUN BULLETIN EMIS N A RIEN DECLARE : le
      //     corriger n est pas un changement, on n inscrit rien ;
      //   · une SECONDE saisie a la meme date (une faute de frappe corrigee)
      //     REMPLACE la premiere au lieu de s y ajouter — sinon la DSN
      //     declarerait deux changements, dont un qui n a jamais existe. Et
      //     si l on revient a l ancienne valeur, il ne reste rien a declarer.
      // ═══════════════════════════════════════════════════════════════
      const memeValeur = function (k: string, a: any, b: any): boolean {
        if (k === "duree_hebdo" || k === "forfait_jours_annuel" || k === "idcc") {
          return Number(a || 0) === Number(b || 0);
        }
        if (k === "categorie") {
          return (String(a || "").trim() || "non_cadre") === (String(b || "").trim() || "non_cadre");
        }
        return String(a === null || a === undefined ? "" : a).trim()
          === String(b === null || b === undefined ? "" : b).trim();
      };
      const chgAvant: any = {};
      const chgApres: any = {};
      for (const k of Object.keys(CONTRAT_SUIVIS)) {
        if (!Object.prototype.hasOwnProperty.call(maj, k)) continue;
        if (memeValeur(k, (ct as any)[k], maj[k])) continue;
        chgAvant[k] = (ct as any)[k] === undefined ? null : (ct as any)[k];
        chgApres[k] = maj[k];
      }
      const auj = aujourdhuiParis();
      let aCompterDu = "";
      if (Object.keys(chgAvant).length > 0) {
        aCompterDu = propre(c.a_compter_du) || auj;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(aCompterDu)) {
          refus.push("date du changement (« à compter du ») : format AAAA-MM-JJ.");
        } else if (debut && aCompterDu < debut) {
          refus.push("le changement ne peut pas précéder le début du contrat (" + jmaRoute(debut) + ").");
        } else if (aCompterDu > auj) {
          refus.push("le changement est daté du " + jmaRoute(aCompterDu) + ", dans l'avenir : le contrat "
            + "prend ses nouvelles valeurs dès l'enregistrement, et la paie en cours serait calculée "
            + "avec elles. L'enregistrer ce jour-là, ou après.");
        }
      }

      // 🆕 05/10 — LE LIEU DE NAISSANCE DU SALARIE, corrigeable ici (il est
      // declare dans la DSN). Il vit sur la fiche du salarie, pas sur le
      // contrat : mise a jour a part, apres les controles.
      let lieuAChanger: string | null | undefined = undefined;
      if (donne("lieu_naissance")) {
        const t = propre(c.lieu_naissance);
        if (t !== null && t.length > 30) {
          refus.push("le lieu de naissance compte 30 caractères au plus (la commune seule, sans le département).");
        } else lieuAChanger = t;
      }

      if (refus.length > 0) {
        return NextResponse.json({ erreur: refus.join(" ") + " Rien n'a été enregistré." }, { status: 400 });
      }

      let lieuChange = false;
      if (lieuAChanger !== undefined && (ct as any).salarie_id) {
        const { data: sal0, error: eSal0 } = await supabase
          .from("paie_salaries").select("id, lieu_naissance").eq("id", (ct as any).salarie_id).maybeSingle();
        if (eSal0) {
          return NextResponse.json({ erreur: "lieu de naissance : " + eSal0.message + " — rien n'a été enregistré." }, { status: 500 });
        }
        if (sal0 && String((sal0 as any).lieu_naissance || "") !== String(lieuAChanger || "")) {
          const { error: eLieu } = await supabase
            .from("paie_salaries").update({ lieu_naissance: lieuAChanger }).eq("id", (ct as any).salarie_id);
          if (eLieu) {
            return NextResponse.json({ erreur: "lieu de naissance : " + eLieu.message + " — rien n'a été enregistré." }, { status: 500 });
          }
          lieuChange = true;
        }
      }

      if (Object.keys(maj).length === 0 && !lieuChange) {
        return NextResponse.json({ success: true, contrat: ct, message: "Rien à changer." });
      }
      maj.maj_le = new Date().toISOString();

      const { data: nv, error: eMaj } = await supabase
        .from("paie_contrats")
        .update(maj)
        .eq("id", contratId)
        .select("*, paie_salaries(nom, prenom, taux_pas, taux_pas_date_effet, taux_pas_identifiant_crm)")
        .maybeSingle();
      if (eMaj) return NextResponse.json({ erreur: eMaj.message + " — rien n'a été enregistré." }, { status: 500 });
      if (nv && (nv as any).paie_salaries && typeof (nv as any).paie_salaries === "object"
          && lieuAChanger !== undefined) {
        (nv as any).paie_salaries.lieu_naissance = lieuAChanger || "";
      }

      // ---- 🆕 05/10 — LE CHANGEMENT AU JOURNAL, pour la DSN du mois ----
      let noteChangement = "";
      if (aCompterDu && Object.keys(chgAvant).length > 0) {
        const { data: dejaEmis } = await supabase
          .from("paie_bulletins").select("id")
          .eq("contrat_id", contratId).eq("statut", "emis").limit(1);
        if (dejaEmis && dejaEmis.length > 0) {
          const societeCt = String((ct as any).societe_id || "") || null;
          // Les changements deja inscrits A LA MEME DATE pour ce contrat.
          const { data: anciens, error: eAnc } = await supabase
            .from("compta_audit").select("id, avant, apres, created_at")
            .eq("action", "paie.changement_contrat").eq("reference", contratId)
            .order("created_at", { ascending: true });
          const memeJour: any[] = [];
          if (!eAnc) {
            for (const a of (anciens || [])) {
              const ap: any = (a as any).apres || {};
              if (String(ap.a_compter_du || "").slice(0, 10) === aCompterDu) memeJour.push(a);
            }
          }
          let avantFinal: any = chgAvant;
          let apresFinal: any = chgApres;
          let fusion = false;
          if (memeJour.length > 0) {
            // L ANCIENNE valeur est celle d AVANT la premiere saisie du jour ;
            // la NOUVELLE est celle de la derniere.
            const av: any = {};
            const ap: any = {};
            const suite = memeJour.concat([{ avant: chgAvant, apres: chgApres }]);
            for (const e of suite) {
              const ea: any = (e as any).avant || {};
              const ep: any = (e as any).apres || {};
              for (const k of Object.keys(ea)) {
                if (!Object.prototype.hasOwnProperty.call(av, k)) av[k] = ea[k];
              }
              for (const k of Object.keys(ep)) {
                if (k !== "a_compter_du") ap[k] = ep[k];
              }
            }
            for (const k of Object.keys(av)) {
              if (Object.prototype.hasOwnProperty.call(ap, k) && memeValeur(k, av[k], ap[k])) {
                delete av[k]; delete ap[k];
              }
            }
            // Les lignes remplacees restent au journal, sous un autre nom :
            // rien ne s efface, mais la DSN ne les relit plus.
            const ids = memeJour.map(function (a: any) { return a.id; });
            const { error: eRempl } = await supabase
              .from("compta_audit").update({ action: "paie.changement_contrat.remplace" }).in("id", ids);
            if (eRempl) {
              console.error("[paie/dossier] changement de contrat, fusion :", eRempl.message);
            } else {
              avantFinal = av; apresFinal = ap; fusion = true;
            }
          }
          const cles = Object.keys(avantFinal);
          if (cles.length > 0) {
            await journal(societeCt, ctx, "paie.changement_contrat", "contrat", contratId,
              Object.assign({}, apresFinal, { a_compter_du: aCompterDu }), avantFinal);
            const noms = cles.map(function (k: string) { return CONTRAT_SUIVIS[k] || k; });
            noteChangement = " Changement (" + noms.join(", ") + ") à compter du " + jmaRoute(aCompterDu)
              + " : la DSN " + (/^(04|08|10)$/.test(aCompterDu.slice(5, 7)) ? "d'" : "de ")
              + moisEnClair(aCompterDu.slice(0, 7) + "-01") + " le déclarera.";
            if (aCompterDu.slice(0, 7) < auj.slice(0, 7)) {
              noteChangement += " ⚠️ Ce mois est passé : si sa DSN est déjà sortie, la regénérer.";
            }
            if (aCompterDu.slice(8, 10) !== "01" && (chgApres.duree_hebdo !== undefined
                || chgApres.forfait_jours_annuel !== undefined)) {
              noteChangement += " ⚠️ Changement en cours de mois : le bulletin de ce mois est calculé avec "
                + "la nouvelle durée pour le mois entier.";
            }
          } else if (fusion) {
            noteChangement = " Retour à la valeur d'avant le " + jmaRoute(aCompterDu)
              + " : plus aucun changement à déclarer à cette date.";
          }
        }
      }

      // ⚠️ Une rupture posee APRES des bulletins deja emis : ils sont a annuler.
      let avertissement = "";
      if (maj.rompu_le) {
        const moisRupture = String(maj.rompu_le).slice(0, 7) + "-01";
        const { data: apres } = await supabase
          .from("paie_bulletins").select("numero")
          .eq("contrat_id", contratId).eq("statut", "emis").gt("periode", moisRupture);
        if (apres && apres.length > 0) {
          avertissement = " ⚠️ " + nbAcc(apres.length, "bulletin déjà émis", "bulletins déjà émis") + " pour un mois postérieur à la "
            + "rupture : à annuler par rectificatif.";
        }
      }
      return NextResponse.json({
        success: true, contrat: nv,
        message: "Contrat enregistré. Les bulletins déjà émis ne changent pas ; les calculs à venir "
          + "utilisent ces valeurs." + noteChangement + avertissement,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕 27/09 — LES JOURS TRAVAILLES DANS LA SEMAINE (repartition)
    //
    // Pour un temps partiel sur moins de cinq jours (ou un samedi
    // travaille) : la retenue d une absence se fait aux heures reelles, il
    // faut donc savoir quels jours le salarie travaille. Colonne
    // `paie_contrats.jours_travailles`, jours en chiffres separes par des
    // virgules (0 = dimanche, 1 = lundi … 6 = samedi), lue par le moteur.
    // ⛔ Au moins un jour. Un bulletin deja emis ne change pas : seuls les
    // calculs a venir en tiennent compte.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "repartition") {
      const contratId = propre(c.contrat_id);
      if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
      const liste: number[] = [];
      for (const v of (Array.isArray(c.jours) ? c.jours : [])) {
        const n = Number(v);
        if (Number.isInteger(n) && n >= 0 && n <= 6 && liste.indexOf(n) < 0) liste.push(n);
      }
      liste.sort(function (x, y) { return x - y; });
      if (liste.length === 0) {
        return NextResponse.json({ erreur: "cochez au moins un jour travaillé." }, { status: 400 });
      }
      const { data: ct, error: eL } = await supabase
        .from("paie_contrats")
        .select("id, duree_hebdo, forfait_jours_annuel")
        .eq("id", contratId)
        .maybeSingle();
      if (eL) return NextResponse.json({ erreur: eL.message }, { status: 500 });
      if (!ct) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });

      const { error: eU } = await supabase
        .from("paie_contrats")
        .update({ jours_travailles: liste.join(","), maj_le: new Date().toISOString() })
        .eq("id", contratId);
      if (eU) return NextResponse.json({ erreur: eU.message }, { status: 500 });

      const noms = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
      const hebdo = Number((ct as any).duree_hebdo) > 0 ? Number((ct as any).duree_hebdo) : 35;
      const parJour = Math.round(hebdo / liste.length * 100) / 100;
      return NextResponse.json({
        success: true,
        jours_travailles: liste.join(","),
        message: "Jours travaillés enregistrés : "
          + liste.map(function (j) { return noms[j]; }).join(", ")
          + ((ct as any).forfait_jours_annuel
            ? " (forfait en jours : sans effet sur le calcul, qui ne compte pas d'heures)."
            : ", soit " + parJour.toLocaleString("fr-FR") + " h par jour. Les retenues d'absence "
              + "des prochains calculs en tiennent compte ; un bulletin déjà émis ne change pas."),
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕 27/09 — LE TAUX PERSONNALISE DE PRELEVEMENT A LA SOURCE
    //
    // Communique par l administration (compte rendu de la DSN, ou tableau de
    // bord net-entreprises) ; tant qu il n est pas saisi, le moteur applique
    // la grille du taux non personnalise. Il se range sur le SALARIE
    // (`paie_salaries.taux_pas`, `taux_pas_date_effet`, `taux_pas_origine`,
    // `taux_pas_identifiant_crm`) : c est lui que lit aussi la DSN.
    // Un taux vide EFFACE le taux personnalise (retour a la grille).
    // ═══════════════════════════════════════════════════════════════════
    // ═════════════════════════════════════════════════
    // 🆕🚨 06/10 — LA REPRISE D UN DOSSIER EN COURS D ANNEE
    //
    // Un salarie qui arrive d un autre logiciel en cours d annee a deja des
    // mois de paie : le moteur en a besoin (reduction generale cumulee,
    // trois derniers salaires pour un arret, douze pour une rupture, regle
    // du dixieme, plafond des heures supplementaires). Ils se saisissent
    // ici, un mois par ligne, dans `paie_reprises` ; le moteur les lit comme
    // des bulletins emis (voir /api/paie/calculer, `lireMoisRepris`).
    //   reprise              ce qui est saisi pour un contrat
    //   reprise_enregistrer  un mois : brut, SMIC retenu, reduction generale
    //                        deja appliquee, heures sup. exonerees d impot
    //   reprise_supprimer    retirer un mois
    //   reprise_conges       le solde de conges a la date de la reprise
    // ⛔ UN MOIS QUI A UN BULLETIN EMIS CHEZ NOUS NE SE REPREND PAS : c est
    // le bulletin qui fait foi.
    // ═════════════════════════════════════════════════
    if (action === "reprise") {
      const contratId = propre(c.contrat_id);
      if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
      const { data: moisLus, error: eR } = await supabase
        .from("paie_reprises")
        .select("id, periode, brut, smic_reference, rgdu, hs_exonere_ir, saisi_par, cree_le")
        .eq("contrat_id", contratId)
        .order("periode", { ascending: true });
      if (eR) {
        return NextResponse.json({ success: true, mois: [], conges: [],
          indisponible: "La reprise d'un autre logiciel n'est pas encore installée en base (" + eR.message + ")." });
      }
      const { data: cg } = await supabase
        .from("paie_conges")
        .select("id, periode, periode_ref, jours, notes")
        .eq("contrat_id", contratId)
        .like("notes", "Reprise d un autre logiciel%");
      return NextResponse.json({ success: true, mois: moisLus || [], conges: cg || [] });
    }

    if (action === "reprise_enregistrer") {
      const contratId = propre(c.contrat_id);
      if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
      const mois = String(propre(c.periode) || "").slice(0, 7);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mois)) {
        return NextResponse.json({ erreur: "mois illisible : choisissez le mois repris." }, { status: 400 });
      }
      const periodeR = mois + "-01";
      if (periodeR >= new Date().toISOString().slice(0, 7) + "-01") {
        return NextResponse.json({ erreur: "un mois repris est un mois passé, payé dans l'autre logiciel : "
          + "le mois en cours et les suivants se calculent ici." }, { status: 400 });
      }
      const { data: ctR, error: eC } = await supabase
        .from("paie_contrats")
        .select("id, tenant_id, societe_id, date_debut")
        .eq("id", contratId)
        .maybeSingle();
      if (eC) return NextResponse.json({ erreur: eC.message }, { status: 500 });
      if (!ctR) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });
      const entree = String((ctR as any).date_debut || "").slice(0, 7);
      if (entree && mois < entree) {
        return NextResponse.json({ erreur: "ce mois est antérieur à l'entrée du salarié ("
          + String((ctR as any).date_debut).slice(0, 10).split("-").reverse().join("/") + ")." }, { status: 400 });
      }
      const { data: emisR } = await supabase
        .from("paie_bulletins")
        .select("numero")
        .eq("contrat_id", contratId)
        .eq("periode", periodeR)
        .eq("statut", "emis")
        .limit(1);
      if (emisR && emisR.length > 0) {
        return NextResponse.json({ erreur: "un bulletin émis ici existe déjà pour ce mois (n° "
          + String((emisR[0] as any).numero) + ") : c'est lui qui fait foi, le mois ne se reprend pas." }, { status: 409 });
      }

      const brutR = nombreFr(c.brut);
      if (brutR === null || brutR <= 0 || brutR > 1000000) {
        return NextResponse.json({ erreur: "salaire brut illisible : indiquez le brut soumis à cotisations du mois, "
          + "tel qu'il figure sur le bulletin de l'autre logiciel." }, { status: 400 });
      }
      const vide = function (v: any): boolean { return v === undefined || v === null || String(v).trim() === ""; };
      const smicR = vide(c.smic_reference) ? null : nombreFr(c.smic_reference);
      if (!vide(c.smic_reference) && (smicR === null || smicR < 0 || smicR > 20000)) {
        return NextResponse.json({ erreur: "SMIC retenu illisible : c'est le montant du SMIC qui a servi au calcul "
          + "de la réduction générale ce mois-là ; laissez vide s'il n'est pas connu." }, { status: 400 });
      }
      const rgduR = vide(c.rgdu) ? 0 : nombreFr(c.rgdu);
      if (rgduR === null || Math.abs(rgduR) > brutR) {
        return NextResponse.json({ erreur: "réduction générale illisible : indiquez le montant déduit des "
          + "cotisations patronales ce mois-là (0 s'il n'y en a pas eu)." }, { status: 400 });
      }
      const hsR = vide(c.hs_exonere_ir) ? 0 : nombreFr(c.hs_exonere_ir);
      if (hsR === null || hsR < 0 || hsR > brutR) {
        return NextResponse.json({ erreur: "montant des heures supplémentaires exonérées d'impôt illisible "
          + "(laissez vide s'il n'y en a pas eu)." }, { status: 400 });
      }

      const { error: eU } = await supabase
        .from("paie_reprises")
        .upsert({
          tenant_id: (ctR as any).tenant_id,
          societe_id: (ctR as any).societe_id,
          contrat_id: contratId,
          periode: periodeR,
          brut: Math.round(brutR * 100) / 100,
          smic_reference: smicR === null ? null : Math.round(smicR * 100) / 100,
          rgdu: Math.round(rgduR * 100) / 100,
          hs_exonere_ir: Math.round(hsR * 100) / 100,
          saisi_par: ctx.email,
          maj_le: new Date().toISOString(),
        }, { onConflict: "contrat_id,periode" });
      if (eU) return NextResponse.json({ erreur: "le mois repris n'a pas pu être enregistré : " + eU.message }, { status: 500 });
      return NextResponse.json({ success: true,
        message: "Mois repris enregistré : " + mois.slice(5, 7) + "/" + mois.slice(0, 4) + ", brut "
          + fr2(Math.round(brutR * 100) / 100) + " €. Il compte dans les prochains calculs ; un bulletin déjà émis ne change pas." });
    }

    if (action === "reprise_supprimer") {
      const contratId = propre(c.contrat_id);
      const id = propre(c.id);
      if (!contratId || !id) return NextResponse.json({ erreur: "mois repris manquant" }, { status: 400 });
      const { error: eD } = await supabase
        .from("paie_reprises").delete().eq("id", id).eq("contrat_id", contratId);
      if (eD) return NextResponse.json({ erreur: eD.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Mois repris retiré." });
    }

    if (action === "reprise_conges") {
      const contratId = propre(c.contrat_id);
      if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
      const mois = String(propre(c.periode) || "").slice(0, 7);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mois)) {
        return NextResponse.json({ erreur: "indiquez le dernier mois payé dans l'autre logiciel." }, { status: 400 });
      }
      const joursR = nombreFr(c.jours);
      if (joursR === null || joursR < 0 || joursR > 90) {
        return NextResponse.json({ erreur: "solde de congés illisible : indiquez le nombre de jours ouvrables "
          + "restant à prendre à la fin de ce mois (0 pour effacer)." }, { status: 400 });
      }
      const { data: ctG, error: eC } = await supabase
        .from("paie_contrats")
        .select("id, tenant_id, societe_id")
        .eq("id", contratId)
        .maybeSingle();
      if (eC) return NextResponse.json({ erreur: eC.message }, { status: 500 });
      if (!ctG) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });
      const periodeG = mois + "-01";
      const { data: emisG } = await supabase
        .from("paie_bulletins").select("numero")
        .eq("contrat_id", contratId).eq("periode", periodeG).eq("statut", "emis").limit(1);
      if (emisG && emisG.length > 0) {
        return NextResponse.json({ erreur: "un bulletin émis ici existe pour ce mois : indiquez le dernier mois "
          + "payé dans l'AUTRE logiciel." }, { status: 409 });
      }

      // On remplace le solde repris precedent : il n y en a qu un.
      const { error: eDel } = await supabase
        .from("paie_conges").delete()
        .eq("contrat_id", contratId)
        .like("notes", "Reprise d un autre logiciel%");
      if (eDel) return NextResponse.json({ erreur: eDel.message }, { status: 500 });
      if (joursR === 0) {
        return NextResponse.json({ success: true, message: "Solde de congés repris effacé." });
      }
      // 🚨 LA PERIODE DE REFERENCE EST CELLE DU MOIS QUI SUIT (le premier mois
      // paye ici) : le solde repris s ajoute aux droits de la periode ouverte.
      const suivant = new Date(periodeG + "T00:00:00Z");
      suivant.setUTCMonth(suivant.getUTCMonth() + 1);
      const anS = suivant.getUTCFullYear();
      const moS = suivant.getUTCMonth() + 1;
      const debutRefG = (moS >= 6 ? anS : anS - 1) + "-06-01";
      const { error: eIns } = await supabase.from("paie_conges").insert({
        tenant_id: (ctG as any).tenant_id,
        societe_id: (ctG as any).societe_id,
        contrat_id: contratId,
        periode_ref: debutRefG,
        unite: "ouvrables",
        periode: periodeG,
        type_mouvement: "acquisition",
        jours: Math.round(joursR * 100) / 100,
        notes: "Reprise d un autre logiciel : solde de conges a la fin de "
          + mois.slice(5, 7) + "/" + mois.slice(0, 4) + " (saisi par " + ctx.email + ")",
      });
      if (eIns) return NextResponse.json({ erreur: "le solde repris n'a pas pu être enregistré : " + eIns.message }, { status: 500 });
      return NextResponse.json({ success: true,
        message: "Solde de congés repris : " + fr2(Math.round(joursR * 100) / 100) + " jours ouvrables à la fin de "
          + mois.slice(5, 7) + "/" + mois.slice(0, 4) + "." });
    }

    if (action === "taux_pas") {
      const contratId = propre(c.contrat_id);
      if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
      const { data: ct, error: eL } = await supabase
        .from("paie_contrats")
        .select("id, salarie_id")
        .eq("id", contratId)
        .maybeSingle();
      if (eL) return NextResponse.json({ erreur: eL.message }, { status: 500 });
      if (!ct || !(ct as any).salarie_id) return NextResponse.json({ erreur: "contrat ou salarié introuvable" }, { status: 404 });

      const brut = String(c.taux === undefined || c.taux === null ? "" : c.taux).trim();
      if (brut === "") {
        const { error: eV } = await supabase
          .from("paie_salaries")
          .update({ taux_pas: null, taux_pas_date_effet: null, taux_pas_origine: null, taux_pas_identifiant_crm: null })
          .eq("id", (ct as any).salarie_id);
        if (eV) return NextResponse.json({ erreur: eV.message }, { status: 500 });
        return NextResponse.json({ success: true, message: "Taux personnalisé effacé : le taux non personnalisé (grille officielle) s'applique." });
      }

      const taux = nombreFr(brut);
      if (taux === null || !isFinite(taux) || taux < 0 || taux > 60) {
        return NextResponse.json({ erreur: "taux illisible : indiquez le taux communiqué par l'administration, en pourcentage (par exemple 7,5)." }, { status: 400 });
      }
      const effet = propre(c.date_effet);
      if (effet && !/^\d{4}-\d{2}-\d{2}$/.test(effet)) {
        return NextResponse.json({ erreur: "date d'effet illisible." }, { status: 400 });
      }
      const { error: eU } = await supabase
        .from("paie_salaries")
        .update({
          taux_pas: Math.round(taux * 100) / 100,
          taux_pas_date_effet: effet || null,
          taux_pas_origine: "saisie a l ecran",
          taux_pas_identifiant_crm: propre(c.identifiant_crm) || null,
        })
        .eq("id", (ct as any).salarie_id);
      if (eU) return NextResponse.json({ erreur: eU.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        message: "Taux personnalisé enregistré : " + (Math.round(taux * 100) / 100).toLocaleString("fr-FR")
          + " %" + (effet ? " à compter du " + effet.split("-").reverse().join("/") : "")
          + ". Il s'applique aux prochains calculs ; un bulletin déjà émis ne change pas.",
      });
    }

    // ---- LES ELEMENTS D UN MOIS ----
    if (action === "elements") {
      const { data, error } = await supabase
        .from("paie_elements")
        .select("*")
        .eq("contrat_id", propre(c.contrat_id))
        .eq("periode", propre(c.periode))
        .order("cree_le");

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, elements: data || [] });
    }

    // ---- AJOUTER UN ELEMENT ----
    if (action === "ajouter_element") {
      const contratId = propre(c.contrat_id);
      const periode = propre(c.periode);
      if (!contratId || !periode) {
        return NextResponse.json({ erreur: "contrat et periode obligatoires" }, { status: 400 });
      }

      const { data: ctr } = await supabase
        .from("paie_contrats").select("tenant_id, societe_id")
        .eq("id", contratId).maybeSingle();
      if (!ctr) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });

      // 🆕 16/09 — ON REFUSE D AJOUTER UN ELEMENT SUR UN MOIS DEJA EMIS.
      // ⚠️ SINON LE BULLETIN REMIS AU SALARIE ET LA BASE NE DISENT PLUS LA
      // MEME CHOSE : les heures changent, le document non. La correction
      // passe par un bulletin rectificatif, jamais par une retouche
      // silencieuse des heures.
      const { data: emis } = await supabase
        .from("paie_bulletins")
        .select("numero")
        .eq("contrat_id", contratId)
        .eq("periode", periode)
        .eq("statut", "emis")
        .maybeSingle();

      if (emis) {
        return NextResponse.json({
          erreur: "le bulletin " + emis.numero + " de ce mois est déjà émis : "
            + "ses éléments ne peuvent plus changer. Pour corriger, sortez un "
            + "bulletin rectificatif — il annulera celui-ci.",
        }, { status: 400 });
      }

      // ⚠️ LE MONTANT SE CALCULE quand quantite et taux sont donnes : on ne
      // fait pas taper ce que la machine sait faire.
      //
      // 🆕🚨 20/09 — SAUF POUR LES NATURES DONT LES TROIS CHAMPS NE SONT PAS
      // « quantite x taux = montant ».
      //
      // Pour un titre-restaurant : quantite = nombre de titres, taux =
      // valeur faciale, montant = PART PATRONALE PAR TITRE. La regle
      // generale calculait 10 x 11 = 110 et ECRASAIT la part patronale de
      // 6,60 EUR saisie. Le moteur lisait alors une part patronale de
      // 110 EUR pour une valeur faciale de 11 EUR, soit 1 000 %, et
      // reintegrait 1 100 EUR au brut.
      // ⛔ LE DEFAUT ETAIT SILENCIEUX : aucun message, un bulletin faux.
      // 🚨 UNE NATURE DONT LES CHAMPS CHANGENT DE SENS DOIT ETRE EXCLUE DU
      // CALCUL AUTOMATIQUE, sinon la regle generale detruit la saisie.
      const natureBrute = propre(c.type_element) || "prime";
      // 🆕 22/09 — l avantage logement rejoint la liste : quantite = nombre
      // de pieces, taux = loyer verse. Leur produit ne veut rien dire.
      // 🆕 06/10 — et trois elements des hotels, cafes, restaurants, que le
      // moteur valorise lui-meme (minimum garanti, journee de salaire).
      const SANS_CALCUL_AUTO = ["titres_restaurant", "avantage_repas",
        "avantage_logement", "indemnite_nourriture", "jour_ferie_garanti", "heures_nuit",
        "repos_nuit_pris"];

      let montant = nombreFr(c.montant) || 0;
      const q = nombreFr(c.quantite);
      const t = nombreFr(c.taux);
      if (!montant && q !== null && t !== null
          && SANS_CALCUL_AUTO.indexOf(natureBrute) < 0) {
        montant = Math.round(q * t * 100) / 100;
      }

      const { error } = await supabase.from("paie_elements").insert({
        tenant_id: ctr.tenant_id, societe_id: ctr.societe_id,
        contrat_id: contratId, periode: periode,
        type_element: natureBrute,
        libelle: propre(c.libelle) || "Element",
        quantite: q, taux: t, montant: montant,
        soumis_cotisations: c.soumis_cotisations === false ? false : true,
        saisi_par: ctx.email,
      });

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Élément ajouté." });
    }

    // ---- SUPPRIMER UN ELEMENT ----
    //
    // ⚠️ UN ELEMENT SE SUPPRIME TANT QUE LE BULLETIN N EST PAS EMIS. Apres,
    // c est un bulletin rectificatif qu il faut.
    if (action === "supprimer_element") {
      const { data: el } = await supabase
        .from("paie_elements").select("contrat_id, periode")
        .eq("id", propre(c.id)).maybeSingle();

      if (el) {
        const { data: emis } = await supabase
          .from("paie_bulletins")
          .select("numero")
          .eq("contrat_id", el.contrat_id)
          .eq("periode", el.periode)
          .eq("statut", "emis")
          .maybeSingle();

        if (emis) {
          return NextResponse.json({
            erreur: "le bulletin " + emis.numero + " de ce mois est déjà émis : "
              + "ses éléments ne peuvent plus être retirés.",
          }, { status: 400 });
        }
      }

      const { error } = await supabase
        .from("paie_elements").delete().eq("id", propre(c.id));
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Élément retiré." });
    }

    // ---- LES BULLETINS D UN CONTRAT ----
    // 🆕 16/09 — ON REND AUSSI LE TYPE ET LE LIEN DE RECTIFICATION : l ecran
    // doit pouvoir dire « rectificatif, remplace le 2026-00003 ».
    if (action === "bulletins") {
      const { data, error } = await supabase
        .from("paie_bulletins")
        .select("id, numero, periode, brut, net_a_payer, cout_employeur, statut, "
          + "chemin_pdf, emis_le, type_bulletin, rectifie_id, annule_le, "
          + "validation, prepare_par, soumis_par, soumis_le, valide_par, renvoi_motif, "
          + "justification, levee_motif")
        .eq("contrat_id", propre(c.contrat_id))
        .order("periode", { ascending: false })
        .order("numero", { ascending: false });

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // ⚠️ ON REMPLACE L IDENTIFIANT PAR LE NUMERO LISIBLE : un uuid a
      // l ecran n apprend rien a personne.
      const parId: any = {};
      for (const b of (data || [])) parId[b.id] = b.numero;
      const enrichis = (data || []).map(function (b: any) {
        return { ...b, rectifie_numero: b.rectifie_id ? (parId[b.rectifie_id] || null) : null };
      });

      return NextResponse.json({ success: true, bulletins: enrichis });
    }

    // ---- OUVRIR UN BULLETIN ----
    if (action === "voir_bulletin") {
      const { data: b } = await supabase
        .from("paie_bulletins").select("chemin_pdf")
        .eq("id", propre(c.id)).maybeSingle();

      if (!b || !b.chemin_pdf) {
        return NextResponse.json({ erreur: "aucun PDF pour ce bulletin" }, { status: 404 });
      }

      const { data: signe } = await supabase.storage
        .from("documents-signes").createSignedUrl(b.chemin_pdf, 3600);

      if (!signe) return NextResponse.json({ erreur: "lien impossible" }, { status: 500 });
      return NextResponse.json({ success: true, url: signe.signedUrl });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ---- EMETTRE UN BULLETIN ----
    //
    // 🚨 C EST LE POINT DE NON-RETOUR. Un bulletin emis ne se modifie plus,
    // ne repasse jamais en brouillon, et ne se supprime pas. Il se corrige
    // par un rectificatif. Meme regle que les mandats immobiliers.
    //
    // 🆕🚨 16/09 — UN RECTIFICATIF ANNULE LE BULLETIN QU IL CORRIGE, ET
    // L ORDRE DES DEUX GESTES N EST PAS NEGOCIABLE : on annule l ancien
    // D ABORD, on emet le nouveau ENSUITE. L index unique en base
    // n autorise qu un seul bulletin emis par contrat et par mois — dans
    // l autre ordre, il refuserait l emission, et il aurait raison.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "emettre") {
      const { data: b } = await supabase
        .from("paie_bulletins")
        .select("id, numero, statut, type_bulletin, rectifie_id, periode, "
          + "tenant_id, societe_id, contrat_id")
        .eq("id", propre(c.id)).maybeSingle();

      if (!b) return NextResponse.json({ erreur: "bulletin introuvable" }, { status: 404 });

      if (b.statut === "emis") {
        return NextResponse.json({
          erreur: "le bulletin " + b.numero + " est déjà émis. Pour le corriger, "
            + "recalculez le mois : un bulletin rectificatif sera ouvert.",
        }, { status: 400 });
      }

      if (b.statut === "annule") {
        return NextResponse.json({
          erreur: "le bulletin " + b.numero + " a été annulé et remplacé. "
            + "Il ne peut plus être émis.",
        }, { status: 400 });
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 28/09 — LA CARTE BLANCHE. Le droit d emettre ne suffit pas :
      // sans la carte blanche sur ce dossier, le bulletin se SOUMET, et
      // c est un associe (ou une personne qui l a) qui l emet. Decision de
      // Jacques : on passe d abord par sa verification.
      // ═══════════════════════════════════════════════════════════════
      if (!ctx.cleServeur && !(await carteBlanche(String(b.societe_id)))) {
        return NextResponse.json({
          erreur: "vous n'avez pas la carte blanche sur ce dossier : soumettez le bulletin "
            + "à validation, il sera émis par un associé ou par une personne qui l'a. "
            + "⛔ Rien n'a été émis.",
        }, { status: 403 });
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 20/09 — ON RECALCULE AVANT D EMETTRE. TOUJOURS.
      //
      // DEFAUT MESURE CE MATIN, ET IL EST GRAVE : l ecran affichait un
      // cout employeur de 3 233,73 EUR — calcul frais, avec le versement
      // mobilite et l AGS corrigee — pendant que la base gardait 3 181,64,
      // calcule quatre jours plus tot. « Emettre » figeait la valeur
      // ANCIENNE, et archivait le PDF ancien avec.
      //
      // ⛔ LE BULLETIN REMIS AU SALARIE NE PEUT PAS ETRE DIFFERENT DE CELUI
      // QU ON VIENT DE LIRE A L ECRAN. Un taux corrige en base, une
      // cotisation ajoutee, un parametre mis a jour : rien de tout cela
      // n atteignait le bulletin tant qu on ne pensait pas a recalculer a
      // la main. Personne ne peut deviner qu il faut le faire.
      //
      // ⚠️ ON APPELLE LA ROUTE DU BULLETIN, PAS LE MOTEUR : c est elle qui
      // reecrit le brouillon ET regenere le PDF archive. Le calcul ne vit
      // qu a un seul endroit, le PDF ne se fabrique qu a un seul endroit.
      // ⚠️ ELLE CONSERVE type_bulletin ET rectifie_id sur un brouillon
      // existant : un rectificatif reste un rectificatif, et le lien vers
      // le bulletin qu il annule n est pas perdu.
      // 🚨 SI LE RECALCUL ECHOUE, ON N EMET PAS. Emettre sur un calcul dont
      // on ne sait rien serait pire que ne rien faire.
      // ═══════════════════════════════════════════════════════════════
      let avantCout: number | null = null;
      let apresCout: number | null = null;

      {
        const { data: avant } = await supabase
          .from("paie_bulletins")
          .select("cout_employeur")
          .eq("id", b.id)
          .maybeSingle();
        if (avant) avantCout = Number(avant.cout_employeur || 0);

        const hote = req.headers.get("host") || "";
        let recalcul: any = null;
        try {
          const rr = await fetch("https://" + hote + "/api/paie/bulletin?secret="
            + encodeURIComponent(process.env.CRON_SECRET || ""), {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contrat_id: b.contrat_id,
              periode: String(b.periode).slice(0, 10),
            }),
          });
          recalcul = await rr.json();
          if (!rr.ok || !recalcul || recalcul.erreur) {
            return NextResponse.json({
              erreur: "le bulletin n'a pas pu être recalculé avant émission : "
                + ((recalcul && recalcul.erreur) || "erreur inconnue")
                + ". ⛔ RIEN N'A ÉTÉ ÉMIS.",
            }, { status: 400 });
          }
        } catch (e: any) {
          return NextResponse.json({
            erreur: "le bulletin n'a pas pu être recalculé avant émission ("
              + String(e) + "). ⛔ RIEN N'A ÉTÉ ÉMIS.",
          }, { status: 500 });
        }

        apresCout = Number(recalcul.cout_employeur || 0);
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 28/09 — LE VERROU : controle de vraisemblance ET recapitulatif
      // confirme par le client, sur les montants QUI VIENNENT D ETRE
      // RECALCULES. Un point rouge non leve, un point orange sans
      // justification, un recapitulatif absent, conteste ou perime :
      // on n emet pas.
      // ═══════════════════════════════════════════════════════════════
      if (!ctx.cleServeur) {
        const verrou = await verrouEmission(b, propre(c.justification), ctx);
        if (verrou) return verrou;
      }

      // ---- 1. ANNULER LE BULLETIN RECTIFIE ----
      let annule: string | null = null;
      if (b.type_bulletin === "rectificatif" && b.rectifie_id) {
        const { data: anc, error: eAnn } = await supabase
          .from("paie_bulletins")
          .update({ statut: "annule", annule_le: new Date().toISOString() })
          .eq("id", b.rectifie_id)
          .eq("statut", "emis")
          .select("numero")
          .maybeSingle();

        // 🚨 SI L ANCIEN N A PAS PU ETRE ANNULE, ON N EMET PAS. Deux
        // bulletins emis sur le meme mois, c est une double declaration en
        // DSN — exactement le defaut du 16/09.
        if (eAnn) {
          return NextResponse.json({
            erreur: "impossible d'annuler le bulletin corrigé : " + eAnn.message
              + ". ⛔ Rien n'a été émis.",
          }, { status: 500 });
        }
        annule = anc ? String(anc.numero) : null;
      }

      // ---- 2. EMETTRE ----
      const { data: maj, error } = await supabase
        .from("paie_bulletins")
        .update({ statut: "emis", emis_le: new Date().toISOString() })
        .eq("id", b.id)
        .eq("statut", "brouillon")
        .select("id")
        .maybeSingle();

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      if (!maj) {
        return NextResponse.json({
          erreur: "l'émission n'a rien modifié : le bulletin n'était plus en brouillon.",
        }, { status: 409 });
      }

      // 🆕 28/09 — qui a emis, et quand : c est la validation.
      await supabase.from("paie_bulletins").update({
        validation: "valide", valide_par: ctx.email, valide_le: new Date().toISOString(),
      }).eq("id", b.id);

      // ═══════════════════════════════════════════════════════════════
      // 🚨 L ACQUISITION DES CONGES SE POSE ICI, A L EMISSION — PAS AU
      // CALCUL.
      //
      // POURQUOI : le calcul peut etre relance dix fois avant que le
      // bulletin soit juste. Si l acquisition etait posee a chaque calcul,
      // le salarie aurait dix fois ses droits. L emission, elle, n arrive
      // qu une fois : c est le seul moment sur.
      //
      // ⚠️ LE CDI ET L APPRENTISSAGE SONT CONCERNES : sur une mission ou un
      // CDD, les conges sont compenses par l ICCP versee chaque mois, pas
      // acquis.
      // 🆕🚨 22/09 — L APPRENTI ETAIT OUBLIE, ET SES CONGES DISPARAISSAIENT.
      // Il a droit a 2,5 jours par mois comme tout salarie, mais il ne
      // touche AUCUNE indemnite de precarite : le contrat d apprentissage en
      // est expressement exclu. N etant ni CDI ni CDD aux yeux de ce code,
      // il n avait donc ni compteur ni compensation — ses conges payes
      // n existaient nulle part. Son solde non pris se paie en indemnite
      // compensatrice A LA FIN du contrat, pas mois par mois.
      // ⚠️ ON VERIFIE QU IL N Y A PAS DEJA UNE ACQUISITION POUR CE MOIS :
      // un bulletin rectificatif ne doit pas redonner les jours.
      // ═══════════════════════════════════════════════════════════════
      let congesPoses = false;
      // 🆕 27/09 — le nombre de jours reellement acquis (2,5 ou moins).
      let congesAcquisJours = 2.5;
      let congesErreur: string | null = null;

      const { data: bull } = await supabase
        .from("paie_bulletins")
        .select("periode, tenant_id, societe_id, contrat_id, paie_contrats(type_contrat, date_debut, date_fin, rompu_le)")
        .eq("id", b.id)
        .maybeSingle();

      const typeBull = bull && bull.paie_contrats
        ? String((bull.paie_contrats as any).type_contrat) : "";

      if (typeBull === "cdi" || typeBull === "apprentissage" || typeBull === "professionnalisation") {

        const p = String(bull.periode);
        const annee = Number(p.slice(0, 4));
        const mois = Number(p.slice(5, 7));
        const debutRef = (mois >= 6 ? annee : annee - 1) + "-06-01";

        const { data: deja } = await supabase
          .from("paie_conges")
          .select("id")
          .eq("contrat_id", bull.contrat_id)
          .eq("periode", p)
          .eq("type_mouvement", "acquisition")
          .maybeSingle();

        if (!deja) {
          // 🚨 2,5 JOURS OUVRABLES PAR MOIS TRAVAILLE. Sur une annee
          // complete : 30 jours ouvrables, soit cinq semaines.
          // 🆕🚨 27/09 — UN MOIS INCOMPLET (entree ou sortie en cours de
          // mois) N EN DONNE QU UNE PARTIE : un mois de travail effectif
          // equivaut a 24 jours ouvrables (article L3141-4). On compte les
          // jours ouvrables (lundi a samedi) de la periode d emploi du mois,
          // et l acquisition vaut 2,5 × ce nombre / 24, sans depasser 2,5.
          // Jusqu au 27/09, un salarie entre le 28 acquerait 2,5 jours.
          let joursAcquis = 2.5;
          let noteAcquis = "";
          {
            const ctb: any = bull.paie_contrats || {};
            const premier = p.slice(0, 7) + "-01";
            const dFin = new Date(premier + "T00:00:00Z");
            dFin.setUTCMonth(dFin.getUTCMonth() + 1);
            dFin.setUTCDate(0);
            const dernier = dFin.toISOString().slice(0, 10);
            let deb = premier;
            let fin = dernier;
            const dd = String(ctb.date_debut || "").slice(0, 10);
            if (/^\d{4}-\d{2}-\d{2}$/.test(dd) && dd > deb) deb = dd;
            for (const x of [String(ctb.date_fin || "").slice(0, 10), String(ctb.rompu_le || "").slice(0, 10)]) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(x) && x < fin) fin = x;
            }
            if (deb > premier || fin < dernier) {
              let ouvrables = 0;
              const d = new Date(deb + "T00:00:00Z");
              const f = new Date(fin + "T00:00:00Z").getTime();
              while (d.getTime() <= f) {
                if (d.getUTCDay() !== 0) ouvrables += 1;
                d.setUTCDate(d.getUTCDate() + 1);
              }
              joursAcquis = Math.round(Math.min(2.5, 2.5 * ouvrables / 24) * 100) / 100;
              noteAcquis = " — mois incomplet (du " + deb.split("-").reverse().join("/")
                + " au " + fin.split("-").reverse().join("/") + ", " + ouvrables
                + " jours ouvrables sur 24 pour un mois, article L3141-4)";
            }
          }
          const { error: eConges } = await supabase.from("paie_conges").insert({
            tenant_id: bull.tenant_id,
            societe_id: bull.societe_id,
            contrat_id: bull.contrat_id,
            periode_ref: debutRef,
            unite: "ouvrables",
            periode: p,
            type_mouvement: "acquisition",
            jours: joursAcquis,
            bulletin_id: b.id,
            notes: "Acquisition automatique a l emission du bulletin " + b.numero + noteAcquis,
          });
          // 🆕 16/09 — L ERREUR EST REMONTEE A L ECRAN, plus seulement
          // ignoree : des droits a conges qui ne s inscrivent pas se
          // decouvrent des mois plus tard, quand le salarie les reclame.
          if (eConges) congesErreur = eConges.message;
          else { congesPoses = true; congesAcquisJours = joursAcquis; }
        }

        // ═══════════════════════════════════════════════════════════
        // 🆕🚨 27/09 — LES CONGES PAYES A LA FIN DU CONTRAT : le bulletin
        // de sortie les paie en indemnite compensatrice (detail.iccp_cdi) ;
        // l emission les SOLDE au compteur, pour qu ils ne soient pas payes
        // deux fois. Une fois par bulletin.
        // ═══════════════════════════════════════════════════════════
        {
          const { data: bd } = await supabase
            .from("paie_bulletins").select("detail").eq("id", b.id).maybeSingle();
          const ic: any = bd && (bd as any).detail ? (bd as any).detail.iccp_cdi : null;
          if (ic && Number(ic.jours) > 0) {
            const { data: dejaPaye } = await supabase
              .from("paie_conges")
              .select("id")
              .eq("bulletin_id", b.id)
              .eq("type_mouvement", "paiement")
              .maybeSingle();
            if (!dejaPaye) {
              const { error: ePay } = await supabase.from("paie_conges").insert({
                tenant_id: bull.tenant_id,
                societe_id: bull.societe_id,
                contrat_id: bull.contrat_id,
                periode_ref: debutRef,
                unite: "ouvrables",
                periode: p,
                type_mouvement: "paiement",
                jours: Number(ic.jours),
                valeur_retenue: Number(ic.montant || 0),
                bulletin_id: b.id,
                notes: "Indemnite compensatrice de fin de contrat, bulletin " + b.numero,
              });
              if (ePay) congesErreur = (congesErreur ? congesErreur + " ; " : "")
                + "solde des congés payés non enregistré (" + ePay.message + ")";
            }
          }
        }

        // ═══════════════════════════════════════════════════════════
        // 🆕🚨 22/09 — LES CONGES D ANCIENNETE (Syntec, article 5.1)
        //
        // Un jour ouvre de plus a 5 ans d anciennete, deux a 10, trois a
        // 15, quatre a 20. MEME BAREME POUR LES ETAM ET LES CADRES.
        // 🚨 « L employeur doit les accorder d office, sans que le salarie
        // ait a les reclamer. »
        //
        // 🚨🚨 LE PIEGE : CE SONT DES JOURS OUVRES, ET NOTRE COMPTEUR EST EN
        // JOURS OUVRABLES. 25 jours ouvres valent 30 jours ouvrables : un
        // jour ouvre vaut donc 1,2 jour ouvrable. Les ajouter tels quels
        // ferait perdre au salarie UN CINQUIEME de son droit a chaque
        // palier — et personne ne le verrait, le compteur resterait
        // coherent avec lui-meme.
        //
        // ⚠️ UNE FOIS PAR PERIODE, PAS UNE FOIS PAR MOIS. Ils s acquierent
        // en bloc a l ouverture de la periode de reference, contrairement
        // aux 2,5 jours mensuels. On les pose au premier bulletin emis de
        // la periode, et on verifie qu ils n y sont pas deja.
        // ⚠️ L ANCIENNETE S APPRECIE A L OUVERTURE DE LA PERIODE, pas au
        // mois courant : un salarie qui atteint 5 ans en mars ne gagne son
        // jour qu au 1er juin suivant.
        // ═══════════════════════════════════════════════════════════
        const { data: ctAnc } = await supabase
          .from("paie_contrats")
          .select("date_debut, idcc")
          .eq("id", bull.contrat_id)
          .maybeSingle();

        const dDebCt = String((ctAnc as any)?.date_debut || "").slice(0, 10);

        if (dDebCt && Number((ctAnc as any)?.idcc) === 1486) {
          // L anciennete EN ANNEES ENTIERES a l ouverture de la periode.
          let ansAnc = Number(debutRef.slice(0, 4)) - Number(dDebCt.slice(0, 4));
          const mmjjRef = debutRef.slice(5);
          const mmjjCt = dDebCt.slice(5);
          if (mmjjRef < mmjjCt) ansAnc -= 1;
          if (ansAnc < 0) ansAnc = 0;

          let palier = 0;
          if (ansAnc >= 20) palier = 20;
          else if (ansAnc >= 15) palier = 15;
          else if (ansAnc >= 10) palier = 10;
          else if (ansAnc >= 5) palier = 5;

          if (palier > 0) {
            const { data: regleAnc } = await supabase
              .from("paie_conventions_regles")
              .select("valeur_num")
              .eq("idcc", 1486)
              .eq("regle", "conges_anciennete_" + palier + "ans")
              .lte("date_effet", p)
              .or("date_fin.is.null,date_fin.gte." + p)
              .maybeSingle();

            const joursOuvres = Number((regleAnc as any)?.valeur_num || 0);

            if (joursOuvres > 0) {
              // ⛔ DEJA POSES POUR CETTE PERIODE DE REFERENCE ? On cherche
              // sur la periode_ref, pas sur le mois : ils ne se donnent
              // qu une fois par an.
              const { data: dejaAnc } = await supabase
                .from("paie_conges")
                .select("id")
                .eq("contrat_id", bull.contrat_id)
                .eq("periode_ref", debutRef)
                .eq("type_mouvement", "acquisition")
                .like("notes", "%anciennete%")
                .maybeSingle();

              if (!dejaAnc) {
                // 🚨 LA CONVERSION : 1 jour ouvre = 1,2 jour ouvrable.
                const joursOuvrables = Math.round(joursOuvres * 1.2 * 100) / 100;

                const { error: eAnc } = await supabase.from("paie_conges").insert({
                  tenant_id: bull.tenant_id,
                  societe_id: bull.societe_id,
                  contrat_id: bull.contrat_id,
                  periode_ref: debutRef,
                  unite: "ouvrables",
                  periode: p,
                  type_mouvement: "acquisition",
                  jours: joursOuvrables,
                  bulletin_id: b.id,
                  notes: "Conges d anciennete Syntec (article 5.1) : "
                    + ansAnc + " ans revolus au " + debutRef + ", palier "
                    + palier + " ans = " + joursOuvres + " jour(s) OUVRE(S), "
                    + "soit " + joursOuvrables + " jour(s) ouvrable(s). "
                    + "Poses une seule fois pour la periode.",
                });

                if (eAnc) {
                  congesErreur = (congesErreur ? congesErreur + " · " : "")
                    + "congés d'ancienneté : " + eAnc.message;
                }
              }
            }
          }
        }
      }

      let message = "Bulletin " + b.numero + " émis. Il ne peut plus être modifié.";
      // 🆕 20/09 — SI LE RECALCUL A CHANGE LE MONTANT, ON LE DIT.
      // ⚠️ UN ECART N EST PAS UNE ERREUR : il veut dire qu un taux ou un
      // paramètre a été corrigé en base depuis le dernier calcul, et que le
      // bulletin émis en tient compte. Mais il doit se voir, sinon le coût
      // employeur change sans que personne ne sache pourquoi.
      if (avantCout !== null && apresCout !== null
        && Math.abs(apresCout - avantCout) >= 0.01) {
        message += " ⚠️ Recalculé avant émission : le coût employeur passe de "
          + fr2(avantCout) + " € à " + fr2(apresCout)
          + " € (un taux ou un paramètre a changé depuis le dernier calcul).";
      }
      if (annule) message += " Le bulletin " + annule + " est annulé et remplacé.";
      if (congesPoses) message += " " + congesAcquisJours.toLocaleString("fr-FR")
        + (congesAcquisJours > 1 ? " jours" : " jour") + " de congés acquis" + (congesAcquisJours < 2.5 ? " (mois incomplet)." : ".");
      if (congesErreur) {
        message += " ⛔ ATTENTION : l'acquisition des congés a échoué (" + congesErreur + ").";
      }

      return NextResponse.json({
        success: true,
        conges_acquis: congesPoses ? congesAcquisJours : 0,
        annule: annule,
        message: message,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ══ LES CONGES PRIS ══
    //
    // 🚨 JUSQU ICI LE COMPTEUR NE SAVAIT QU ACQUERIR. Un cabinet dont le
    // salarie pose une semaine n avait aucun endroit ou le saisir : le
    // solde montait indefiniment, et le bulletin affichait des droits que
    // le salarie avait deja consommes.
    //
    // ⚠️ LA VUE paie_conges_solde CONNAISSAIT DEJA les trois mouvements —
    // acquisition, prise, paiement. C est la saisie qui manquait, pas le
    // socle : verifier avant de construire evite de refaire ce qui existe.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "conges") {
      const contratId = String(c.contrat_id || "");
      if (!contratId) {
        return NextResponse.json({ erreur: "contrat manquant." }, { status: 400 });
      }

      const { data: mouvements, error } = await supabase
        .from("paie_conges")
        .select("*")
        .eq("contrat_id", contratId)
        .order("periode", { ascending: false });
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      const { data: solde } = await supabase
        .from("paie_conges_solde")
        .select("*")
        .eq("contrat_id", contratId);

      return NextResponse.json({
        success: true,
        mouvements: mouvements || [],
        solde: (solde && solde[0]) || null,
      });
    }

    if (action === "poser_conges") {
      const contratId = String(c.contrat_id || "");
      const periode = String(c.periode || "");
      const jours = nombreFr(c.jours) || 0;

      if (!contratId || !periode) {
        return NextResponse.json({ erreur: "contrat ou période manquant." },
          { status: 400 });
      }
      // ⚠️ UN NOMBRE DE JOURS NUL OU NEGATIF N A PAS DE SENS : une reprise de
      // jours se fait par un mouvement distinct, pas par une prise negative.
      if (!(jours > 0)) {
        return NextResponse.json({
          erreur: "le nombre de jours doit être supérieur à zéro.",
        }, { status: 400 });
      }

      const { data: ct } = await supabase
        .from("paie_contrats")
        .select("*, paie_salaries(nom, prenom)")
        .eq("id", contratId)
        .maybeSingle();
      if (!ct) {
        return NextResponse.json({ erreur: "contrat introuvable." },
          { status: 404 });
      }

      // 🚨 QUI ACQUIERT DES CONGES EN PREND. Le CDI et l apprentissage les
      // cumulent ; sur une mission ou un CDD ils sont compenses par l ICCP
      // versee chaque mois, et y poser une prise creerait un solde negatif.
      // 🆕 22/09 — L APPRENTI AJOUTE ICI EN MEME TEMPS QUE DANS
      // L ACQUISITION : laisser les deux se contredire aurait donne un
      // compteur qui se remplit sans jamais pouvoir se vider.
      if (String(ct.type_contrat) !== "cdi"
          && String(ct.type_contrat) !== "apprentissage"
          && String(ct.type_contrat) !== "professionnalisation") {
        return NextResponse.json({
          erreur: "ce contrat ne cumule pas de congés : ils sont compensés "
            + "par l'indemnité compensatrice versée chaque mois. La prise de "
            + "congés concerne les CDI et les contrats d'apprentissage.",
        }, { status: 400 });
      }

      const annee = Number(periode.slice(0, 4));
      const mois = Number(periode.slice(5, 7));
      const debutRef = (mois >= 6 ? annee : annee - 1) + "-06-01";

      // ⛔ ON NE POSE PAS PLUS DE JOURS QUE LE SOLDE. Un solde negatif est
      // toujours une erreur de saisie, et il se decouvre des mois plus tard,
      // au solde de tout compte.
      const { data: soldeAvant } = await supabase
        .from("paie_conges_solde")
        .select("solde")
        .eq("contrat_id", contratId)
        .eq("periode_ref", debutRef)
        .maybeSingle();

      const disponible = Number((soldeAvant as any)?.solde || 0);
      if (jours > disponible) {
        return NextResponse.json({
          erreur: "Solde insuffisant : " + joursFr(jours) + " demandés pour "
            + fr2(disponible) + " disponibles "
            + "sur la période ouverte au " + debutRef + ".",
        }, { status: 400 });
      }

      // ═══════════════════════════════════════════════════════════════
      // 🚨🚨 LA VALORISATION COMPARE DEUX METHODES ET RETIENT LA PLUS
      // FAVORABLE AU SALARIE (art. L3141-24).
      //
      // ⛔ N EN APPLIQUER QU UNE SEULE EST UN MOTIF DE REDRESSEMENT ET DE
      // RAPPEL DE SALAIRE. Les deux se calculent, les deux se gardent en
      // base, et c est la plus elevee qui est retenue — la loi ne laisse
      // pas le choix a l employeur.
      //
      //   · MAINTIEN DE SALAIRE : ce que le salarie aurait gagne en
      //     travaillant, soit son salaire mensuel rapporte aux jours pris.
      //   · REGLE DU DIXIEME : un dixieme de la remuneration brute de la
      //     periode de reference, pour la totalite des droits (30 jours
      //     ouvrables), rapporte aux jours pris.
      //
      // ⚠️ LE DIXIEME EST SOUVENT PLUS FAVORABLE quand le salarie a touche
      // des primes ou des heures supplementaires dans l annee : c est
      // precisement ce que la regle protege.
      // ═══════════════════════════════════════════════════════════════
      const JOURS_OUVRABLES_MOIS = 26;   // 6 jours par semaine, moyenne mensuelle
      const DROITS_ANNUELS = 30;         // 2,5 j x 12, en jours ouvrables

      let salaireMensuel = Number(ct.salaire_mensuel || 0);
      // 🆕🚨 25/09 — L APPRENTI PAYE AU BAREME n a pas de salaire mensuel sur
      // son contrat : le maintien valait ZERO, et ses conges etaient payes au
      // seul dixieme, sans rien retenir. Son salaire de reference est le
      // minimum du bareme, lu sur son dernier bulletin emis.
      let noteBareme = "";
      if (!(salaireMensuel > 0) && (String(ct.type_contrat) === "apprentissage"
          || String(ct.type_contrat) === "professionnalisation")) {
        const { data: dernier } = await supabase
          .from("paie_bulletins")
          .select("periode, detail")
          .eq("contrat_id", contratId)
          .eq("statut", "emis")
          .lte("periode", periode)
          .order("periode", { ascending: false })
          .limit(1);
        const d0: any = (dernier || [])[0];
        const mini = d0 && d0.detail && d0.detail.apprentissage
          ? Number(d0.detail.apprentissage.minimum_legal || 0)
          : (d0 && d0.detail && d0.detail.professionnalisation
            ? Number(d0.detail.professionnalisation.minimum_legal || 0) : 0);
        if (mini > 0) {
          salaireMensuel = mini;
        } else {
          return NextResponse.json({
            erreur: "salaire de référence introuvable pour cet apprenti : émettez "
              + "d'abord un bulletin, ou renseignez son salaire mensuel sur le "
              + "contrat, avant de poser ses congés.",
          }, { status: 400 });
        }
        noteBareme = " Salaire de référence de l'apprenti : " + fr2(mini)
          + " € (barème légal, dernier bulletin émis).";
      }
      const maintien = salaireMensuel > 0
        ? (salaireMensuel / JOURS_OUVRABLES_MOIS) * jours
        : 0;

      // ⚠️ LA REMUNERATION DE REFERENCE NE COMPTE QUE LES BULLETINS EMIS :
      // un brouillon n a pas ete remis, il ne peut pas fonder un droit.
      const { data: bulletinsRef } = await supabase
        .from("paie_bulletins")
        .select("brut, periode")
        .eq("contrat_id", contratId)
        .eq("statut", "emis")
        .gte("periode", debutRef);

      let brutRef = 0;
      for (const b of (bulletinsRef || [])) brutRef += Number((b as any).brut || 0);
      // 🆕 06/10 — ET LES MOIS REPRIS D UN AUTRE LOGICIEL de la periode de
      // reference, sauf ceux qui ont un bulletin emis ici (il prime).
      {
        const { data: reprisRef, error: eRep } = await supabase
          .from("paie_reprises")
          .select("periode, brut")
          .eq("contrat_id", contratId)
          .gte("periode", debutRef);
        if (!eRep) {
          const moisEmis: Record<string, boolean> = {};
          for (const b of (bulletinsRef || [])) moisEmis[String((b as any).periode).slice(0, 7)] = true;
          for (const r0 of (reprisRef || [])) {
            if (!moisEmis[String((r0 as any).periode).slice(0, 7)]) brutRef += Number((r0 as any).brut || 0);
          }
        }
      }
      const dixieme = (brutRef / 10) * (jours / DROITS_ANNUELS);

      // ═══════════════════════════════════════════════════════════════
      // 🆕 25/09 — L AVANTAGE EN NATURE DANS L INDEMNITE (art. L3141-25)
      //
      // « Pour la fixation de l indemnite de conge, il est tenu compte des
      // avantages accessoires et des prestations en nature dont le salarie
      // ne continuerait pas a jouir pendant la duree de son conge. »
      //   · LES REPAS : le salarie ne les prend pas pendant ses conges. Leur
      //     valeur s ajoute au MAINTIEN, au meme prorata que le salaire
      //     (valeur mensuelle / 26 jours ouvrables x jours pris).
      //   · LE LOGEMENT : il le garde pendant ses conges. Rien a ajouter.
      //   · LA REGLE DU DIXIEME en tient deja compte : l avantage est dans le
      //     brut des bulletins de la periode de reference.
      // La valeur mensuelle vient du dernier element « avantage_repas » du
      // contrat, au mois des conges ou avant, valorise comme au bulletin :
      // forfait URSSAF moins la participation du salarie, et rien si
      // l avantage est neglige (participation d au moins la moitie du
      // forfait).
      // ⚠️ `valeur_maintien` RESTE LE SALAIRE SEUL : c est ce que la ligne
      // « Absence conges payes » retient. L avantage n entre que dans
      // `valeur_retenue`, l indemnite versee — sinon il serait retenu et
      // verse a la fois, et le salarie ne toucherait rien pour ses repas.
      // ═══════════════════════════════════════════════════════════════
      let avantageConges = 0;
      let noteAvantage = "";
      {
        const { data: elRepas } = await supabase
          .from("paie_elements")
          .select("periode, quantite, taux")
          .eq("contrat_id", contratId)
          .eq("type_element", "avantage_repas")
          .lte("periode", periode)
          .order("periode", { ascending: false })
          .limit(1);
        const el: any = (elRepas || [])[0];
        if (el && Number(el.quantite) > 0) {
          const dateP = String(periode).slice(0, 7) + "-01";
          const { data: params } = await supabase
            .from("paie_parametres")
            .select("code, valeur, date_effet, date_fin")
            .in("code", ["AVANTAGE_REPAS", "AVANTAGE_REPAS_NEGLIGEABLE", "MINIMUM_GARANTI"])
            .lte("date_effet", dateP)
            .order("date_effet", { ascending: false });
          const lire = function (code: string): number | null {
            for (const pr of (params || [])) {
              if ((pr as any).code !== code) continue;
              const fin = (pr as any).date_fin ? String((pr as any).date_fin).slice(0, 10) : "";
              if (fin && fin < dateP) continue;
              return Number((pr as any).valeur);
            }
            return null;
          };
          // 🆕 06/10 — DANS LES HOTELS, CAFES, RESTAURANTS le repas se compte
          // au minimum garanti (regle `avantage_repas_minimum_garanti` de la
          // convention), comme au bulletin.
          let repasAuMg = false;
          {
            const { data: ctIdcc } = await supabase.from("paie_contrats").select("idcc").eq("id", contratId).maybeSingle();
            const idccCt = Number(ctIdcc && (ctIdcc as any).idcc) || 0;
            if (idccCt > 0) {
              const { data: rg } = await supabase.from("paie_conventions_regles")
                .select("valeur_num, date_effet, date_fin").eq("idcc", idccCt)
                .eq("regle", "avantage_repas_minimum_garanti").lte("date_effet", dateP);
              repasAuMg = ((rg || []) as any[]).some(function (x) {
                const fin = x.date_fin ? String(x.date_fin).slice(0, 10) : "";
                return Number(x.valeur_num) === 1 && !(fin && fin < dateP);
              });
            }
          }
          const forfait = repasAuMg ? lire("MINIMUM_GARANTI") : lire("AVANTAGE_REPAS");
          const pctNeglige = lire("AVANTAGE_REPAS_NEGLIGEABLE") || 0;
          const part = Number(el.taux || 0);
          if (forfait === null || !(forfait > 0)) {
            noteAvantage = " ⚠️ Le barème AVANTAGE_REPAS manque en base : l'avantage "
              + "nourriture n'a pas pu être ajouté à l'indemnité.";
          } else if (part > 0 && part >= forfait * pctNeglige / 100) {
            noteAvantage = " Avantage nourriture négligé (participation d'au moins "
              + "la moitié du forfait) : rien à ajouter.";
          } else {
            const parRepas = Math.max(0, forfait - part);
            const mensuel = parRepas * Number(el.quantite);
            avantageConges = (mensuel / JOURS_OUVRABLES_MOIS) * jours;
            noteAvantage = " Avantage nourriture ajouté au maintien : "
              + fr2(Math.round(avantageConges * 100) / 100) + " € ("
              + Number(el.quantite) + " repas par mois à " + fr2(parRepas)
              + " €, art. L3141-25).";
          }
        }
      }
      const maintienTotal = maintien + avantageConges;

      const retenue = Math.max(maintienTotal, dixieme);

      const { error: ePose } = await supabase.from("paie_conges").insert({
        tenant_id: ct.tenant_id,
        societe_id: ct.societe_id,
        contrat_id: contratId,
        periode_ref: debutRef,
        unite: "ouvrables",
        periode: periode,
        type_mouvement: "prise",
        jours: jours,
        valeur_maintien: Math.round(maintien * 100) / 100,
        valeur_dixieme: Math.round(dixieme * 100) / 100,
        valeur_retenue: Math.round(retenue * 100) / 100,
        notes: "Prise saisie le " + new Date().toISOString().slice(0, 10)
          + " — méthode retenue : "
          + (maintienTotal >= dixieme ? "maintien de salaire" : "règle du dixième")
          + noteAvantage + noteBareme,
      });
      if (ePose) {
        return NextResponse.json({ erreur: ePose.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        jours: jours,
        maintien: Math.round(maintien * 100) / 100,
        dixieme: Math.round(dixieme * 100) / 100,
        retenue: Math.round(retenue * 100) / 100,
        avantage_nature: Math.round(avantageConges * 100) / 100,
        methode: maintienTotal >= dixieme ? "maintien de salaire" : "règle du dixième",
        solde_restant: Math.round((disponible - jours) * 100) / 100,
        message: joursFr(jours) + (jours > 1 ? " posés" : " posé") + ". Indemnité retenue : "
          + fr2(retenue) + " € ("
          + (maintienTotal >= dixieme ? "maintien de salaire" : "règle du dixième")
          + ", la plus favorable)." + noteAvantage + " Solde restant : "
          + joursFr(disponible - jours) + ".",
      });
    }

    if (action === "supprimer_conges") {
      const id = String(c.id || "");
      if (!id) return NextResponse.json({ erreur: "identifiant manquant." },
        { status: 400 });

      // ⛔ UNE ACQUISITION NE SE SUPPRIME PAS A LA MAIN : elle est liee a un
      // bulletin emis, et l effacer ferait disparaitre un droit sans trace.
      // Seule une prise saisie par erreur se retire.
      const { data: mvt } = await supabase
        .from("paie_conges")
        .select("type_mouvement")
        .eq("id", id)
        .maybeSingle();

      if (!mvt) return NextResponse.json({ erreur: "mouvement introuvable." },
        { status: 404 });
      if (String((mvt as any).type_mouvement) !== "prise") {
        return NextResponse.json({
          erreur: "seule une prise de congés peut être retirée. Une "
            + "acquisition découle d'un bulletin émis : elle ne se supprime "
            + "pas à la main.",
        }, { status: 400 });
      }

      const { error: eDel } = await supabase
        .from("paie_conges").delete().eq("id", id);
      if (eDel) return NextResponse.json({ erreur: eDel.message }, { status: 500 });

      return NextResponse.json({ success: true, message: "Prise retirée." });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ══ LES SIGNALEMENTS D EVENEMENT ══
    //
    // 🚨 DEUX EVENEMENTS, DEUX DELAIS DE CINQ JOURS :
    //   · l ARRET DE TRAVAIL declenche les indemnites journalieres
    //   · la FIN DE CONTRAT remplace l attestation employeur depuis 2022
    //
    // ⚠️ CE NE SONT PAS DES DOCUMENTS DE CONFORT. Un arret signale en
    // retard, c est un salarie qui n est pas paye ; une fin de contrat en
    // retard, c est un chomage qui ne s ouvre pas.
    // ═══════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 20/09 — LA PRIME DE VACANCES SYNTEC (article 31)
    //
    // ⛔ CE N EST PAS UNE LIGNE DE BULLETIN. L article 31 fait peser sur
    // l ENTREPRISE une obligation GLOBALE : verser au moins 10 % de la masse
    // globale des indemnites de conges payes de TOUS les salaries, constatee
    // au 31 mai. La repartition entre les salaries est libre — « au choix de
    // l entreprise, en general egalitaire ».
    // ⛔ ON NE PEUT DONC PAS LA CALCULER SALARIE PAR SALARIE dans le moteur
    // de paie : ce serait poser une repartition que l employeur seul decide.
    // CE QUI S AUTOMATISE : la masse, l obligation, ce qui a deja ete verse,
    // et l alerte quand la date limite approche.
    //
    // 🚨 L EXERCICE VA DU 1er JUIN AU 31 MAI, comme la periode de reference
    // des conges payes. « Constatee au 31 mai. »
    // 🚨 UNE PARTIE AU MOINS DOIT ETRE VERSEE ENTRE LE 1er MAI ET LE
    // 31 OCTOBRE. Une prime versee en decembre ne remplit pas l obligation.
    // 🚨 TOUTE PRIME OU GRATIFICATION DE L ANNEE PEUT S Y SUBSTITUER, SAUF
    // le 13e mois contractualise (Cass. soc. 27/05/1998, n°97-40.764), les
    // titres-restaurant (14/02/1995), la prime d objectifs contractuelle
    // (18/06/2008) et l indemnite de precarite des enqueteurs vacataires
    // (avenant n°46 du 16/07/2021).
    //
    // ⚠️ DEUX ASSIETTES, UNE DIVERGENCE NON TRANCHEE — on rend LES DEUX :
    //   · Cass. soc. 2023 : l assiette comprend TOUTES les indemnites de
    //     conges payes versees dans l exercice, Y COMPRIS a ceux qui sont
    //     partis en cours d annee ;
    //   · une lecture d avocat en exclut les indemnites COMPENSATRICES.
    // ⛔ NE PAS CHOISIR A LA PLACE DE JACQUES : l ecart est affiche.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "prime_vacances") {
      const societeId = String(c.societe_id || "");
      if (!societeId) {
        return NextResponse.json({ erreur: "société manquante." },
          { status: 400 });
      }

      // L exercice : 1er juin → 31 mai. Sans annee donnee, celui qui court.
      const auj = new Date();
      let anFin = Number(c.exercice) || 0;
      if (!anFin) {
        anFin = auj.getUTCFullYear() + (auj.getUTCMonth() >= 5 ? 1 : 0);
      }
      const debutEx = (anFin - 1) + "-06-01";
      const finEx = anFin + "-05-31";

      const { data: soc } = await supabase
        .from("compta_societes")
        .select("id, nom, idcc")
        .eq("id", societeId)
        .maybeSingle();

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 20/09 — L IDCC EST PORTE PAR LE CONTRAT, PAS PAR LA SOCIETE
      //
      // La meme distinction qu en DSN pour la rubrique 11.022 : une societe
      // peut n avoir aucun IDCC renseigne alors que TOUS ses contrats sont
      // en Syntec. Chercher la convention sur la societe faisait dire au
      // calcul « cette societe n est pas en convention Syntec » sur une
      // societe qui l est.
      // 🚨 ET L ARTICLE 31 VISE « L ENSEMBLE DES SALARIES » DE L ENTREPRISE
      // SOUMISE A LA CONVENTION : des lors que l entreprise en releve, la
      // masse porte sur TOUS ses salaries, y compris ceux dont le contrat
      // releve d une autre convention. On regarde donc si AU MOINS UN
      // contrat est en 1486, et on somme tout le monde.
      // ═══════════════════════════════════════════════════════════════
      const { data: ctsSoc } = await supabase
        .from("paie_contrats")
        .select("idcc")
        .eq("societe_id", societeId);

      let contratsSyntec = 0;
      let contratsTotal = 0;
      for (const ct of (ctsSoc || [])) {
        contratsTotal += 1;
        if (Number((ct as any).idcc) === 1486) contratsSyntec += 1;
      }
      const relevantSyntec = contratsSyntec > 0
        || Number((soc as any)?.idcc) === 1486;

      // ---- LA MASSE DES INDEMNITES DE CONGES PAYES ----
      // 1. les conges PRIS : la valeur reellement retenue sur le bulletin.
      const { data: prises } = await supabase
        .from("paie_conges")
        .select("periode, jours, valeur_maintien, valeur_dixieme, valeur_retenue")
        .eq("societe_id", societeId)
        .eq("type_mouvement", "prise")
        .gte("periode", debutEx)
        .lte("periode", finEx);

      let masseConges = 0;
      let joursPris = 0;
      for (const p of (prises || [])) {
        // ⚠️ `valeur_retenue` EST CELLE QUI A ETE PAYEE : le moteur y a deja
        // tranche entre maintien de salaire et dixieme. Les deux autres
        // colonnes ne sont que les termes de la comparaison.
        const v = Number((p as any).valeur_retenue || 0)
          || Math.max(Number((p as any).valeur_maintien || 0),
                      Number((p as any).valeur_dixieme || 0));
        masseConges += v;
        joursPris += Number((p as any).jours || 0);
      }
      masseConges = Math.round(masseConges * 100) / 100;

      // 2. les indemnites COMPENSATRICES des contrats termines.
      const { data: bulEx } = await supabase
        .from("paie_bulletins")
        .select("numero, periode, detail")
        .eq("societe_id", societeId)
        .eq("statut", "emis")
        .gte("periode", debutEx)
        .lte("periode", finEx);

      let masseCompensatrices = 0;
      let primesVersees = 0;
      let primesDansLaFenetre = 0;
      const detailPrimes: any[] = [];

      for (const b of (bulEx || [])) {
        const d: any = (b as any).detail || {};
        masseCompensatrices += Number(d.iccp || 0);

        // ---- CE QUI A DEJA ETE VERSE ----
        // 🚨 ON NE COMPTE QUE CE QUI EST EXPLICITEMENT UNE PRIME DE VACANCES.
        // ⛔ Imputer d office une autre prime reviendrait a decider d une
        // substitution que l employeur seul peut invoquer.
        for (const l of (Array.isArray(d.lignes_brut) ? d.lignes_brut : [])) {
          const lib = String((l && l.libelle) || "").toLowerCase();
          if (lib.indexOf("prime de vacances") < 0) continue;
          const m = Number((l && l.montant) || 0);
          if (m <= 0) continue;
          primesVersees += m;
          const mois = String((b as any).periode || "").slice(5, 7);
          if (mois >= "05" && mois <= "10") primesDansLaFenetre += m;
          detailPrimes.push({ bulletin: (b as any).numero,
            periode: (b as any).periode, montant: m });
        }
      }
      masseCompensatrices = Math.round(masseCompensatrices * 100) / 100;
      primesVersees = Math.round(primesVersees * 100) / 100;
      primesDansLaFenetre = Math.round(primesDansLaFenetre * 100) / 100;

      const masseLarge = Math.round((masseConges + masseCompensatrices) * 100) / 100;
      const obligation = Math.round(masseLarge * 10) / 100;
      const obligationEtroite = Math.round(masseConges * 10) / 100;

      const reserves: string[] = [];
      if (!relevantSyntec) {
        reserves.push("⛔ AUCUN CONTRAT DE CETTE SOCIÉTÉ N'EST EN CONVENTION "
          + "SYNTEC (IDCC 1486) : l'article 31 ne s'y applique pas. Le calcul "
          + "est donné à titre indicatif.");
      } else if (contratsSyntec < contratsTotal) {
        reserves.push("⚠️ " + nbAcc(contratsSyntec, "contrat", "contrats") + " sur "
          + contratsTotal + " relèvent de la Syntec. L'article 31 vise "
          + "« l'ensemble des salariés » de l'entreprise : la masse ci-dessus "
          + "porte sur TOUS les salariés, pas seulement sur ceux dont le "
          + "contrat est en 1486. ⚠️ À VÉRIFIER si l'entreprise applique "
          + "réellement plusieurs conventions.");
      }
      reserves.push("Deux assiettes coexistent et la jurisprudence n'est pas "
        + "unanime : la Cour de cassation (2023) inclut les indemnités versées "
        + "aux salariés partis en cours d'exercice, une lecture d'avocat en "
        + "exclut les indemnités compensatrices. L'écart est de "
        + (Math.round((obligation - obligationEtroite) * 100) / 100)
          .toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €.");
      reserves.push("⛔ LA RÉPARTITION ENTRE LES SALARIÉS NE SE CALCULE PAS : "
        + "l'article 31 la laisse au choix de l'entreprise, le plus souvent "
        + "égalitaire. Cette route dit COMBIEN doit être versé, pas à qui.");
      reserves.push("Une prime ou gratification déjà versée peut s'y "
        + "substituer, SAUF un 13e mois contractualisé, les titres-restaurant, "
        + "une prime d'objectifs contractuelle et l'indemnité de précarité des "
        + "enquêteurs vacataires. ⚠️ Seules les lignes nommées « prime de "
        + "vacances » sont comptées ici : une substitution se décide, elle ne "
        + "se devine pas.");
      if (joursPris === 0) {
        reserves.push("⚠️ AUCUN CONGÉ PRIS n'est enregistré sur l'exercice : "
          + "la masse est donc nulle ou incomplète. Les congés se saisissent "
          + "dans la fiche de chaque contrat.");
      }

      const reste = Math.round((obligation - primesDansLaFenetre) * 100) / 100;
      let verdict = "";
      if (obligation <= 0) {
        verdict = "Aucune indemnité de congés payés sur l'exercice : "
          + "l'obligation est nulle pour l'instant.";
      } else if (reste <= 0) {
        verdict = "✅ Obligation remplie : "
          + primesDansLaFenetre.toLocaleString("fr-FR",
            { minimumFractionDigits: 2 }) + " € versés entre le 1er mai et le "
          + "31 octobre, pour une obligation de "
          + obligation.toLocaleString("fr-FR", { minimumFractionDigits: 2 })
          + " €.";
      } else {
        verdict = "⛔ IL RESTE " + reste.toLocaleString("fr-FR",
          { minimumFractionDigits: 2 }) + " € À VERSER avant le 31 octobre "
          + anFin + ". Une prime versée après cette date ne remplit PAS "
          + "l'obligation de l'article 31.";
      }

      return NextResponse.json({
        success: true,
        societe: (soc as any)?.nom || "",
        idcc: (soc as any)?.idcc || null,
        contrats_syntec: contratsSyntec,
        contrats_total: contratsTotal,
        releve_de_syntec: relevantSyntec,
        exercice: { debut: debutEx, fin: finEx, libelle: "juin " + (anFin - 1)
          + " → mai " + anFin },
        masse_conges_pris: masseConges,
        jours_pris: Math.round(joursPris * 100) / 100,
        masse_indemnites_compensatrices: masseCompensatrices,
        masse_globale: masseLarge,
        obligation_10_pct: obligation,
        obligation_hors_compensatrices: obligationEtroite,
        deja_verse: primesVersees,
        verse_entre_mai_et_octobre: primesDansLaFenetre,
        reste_a_verser: reste > 0 ? reste : 0,
        detail_primes: detailPrimes,
        verdict: verdict,
        reserves: reserves,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕 28/09 — CAS RARE : MARQUER UN ARRET « ALD » (affection de longue
    // duree) : ses indemnites journalieres ne sont pas imposables.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "arret_ald") {
      const evId = propre(c.evenement_id);
      if (!evId) return NextResponse.json({ erreur: "arrêt manquant" }, { status: 400 });
      const { data: ev0 } = await supabase
        .from("paie_evenements").select("id, type_evenement").eq("id", evId).maybeSingle();
      if (!ev0 || String((ev0 as any).type_evenement) !== "arret") {
        return NextResponse.json({ erreur: "arrêt introuvable" }, { status: 404 });
      }
      const { error: eAld } = await supabase
        .from("paie_evenements").update({ ald: c.ald === true }).eq("id", evId);
      if (eAld) return NextResponse.json({ erreur: eAld.message + " — rien n'a été enregistré." }, { status: 500 });
      return NextResponse.json({ success: true,
        message: c.ald === true ? "Arrêt marqué ALD : ses indemnités ne sont pas imposables."
          : "Marque ALD retirée." });
    }

    if (action === "evenements") {
      const contratId = String(c.contrat_id || "");
      if (!contratId) {
        return NextResponse.json({ erreur: "contrat manquant." }, { status: 400 });
      }

      // ⚠️ `fichier` EST RENDU AVEC LE RESTE, et c est voulu : l ecran s en
      // sert pour telecharger et partager le signalement genere. Le retirer
      // de cette lecture ferait disparaitre les deux liens sans un message.
      const { data, error } = await supabase
        .from("paie_evenements")
        .select("*")
        .eq("contrat_id", contratId)
        .order("date_debut", { ascending: false });
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // ⚠️ LES MOTIFS VIENNENT DE LA BASE, avec leur code de la norme. Les
      // ecrire en dur dans l ecran ferait diverger les deux le jour ou un
      // code change — et un motif faux ouvre les mauvais droits.
      const { data: motifs } = await supabase
        .from("dsn_codes")
        .select("rubrique, code, libelle, correspondance")
        .in("rubrique", ["S21.G00.60.001", "S21.G00.62.002"])
        .is("date_fin", null)
        .not("correspondance", "is", null)
        .order("code", { ascending: true });

      return NextResponse.json({
        success: true,
        evenements: data || [],
        motifs_arret: (motifs || []).filter(function (m: any) {
          return m.rubrique === "S21.G00.60.001";
        }),
        motifs_fin: (motifs || []).filter(function (m: any) {
          return m.rubrique === "S21.G00.62.002";
        }),
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 20/09 — MARQUER UN SIGNALEMENT DEPOSE
    //
    // 🚨 C EST CE GESTE QUI INCREMENTE LE NUMERO D ORDRE. Tant qu un
    // signalement n est pas depose, le regenerer produit le meme numero —
    // c est voulu : trois essais avant l envoi ne sont qu un seul
    // signalement.
    // ⚠️ DES LE PREMIER DEPOT, le fichier suivant sera un « annule et
    // remplace » (type 03), et c est exactement ce qu attend l organisme
    // quand une date d arret change.
    // ⛔ ON NE PEUT PAS DEPOSER CE QUI N A PAS ETE GENERE : sans fichier, il
    // n y a rien a transmettre.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "deposer_evenement") {
      const idEv = String(c.id || "");
      const estReprise = c.reprise === true;
      if (!idEv) {
        return NextResponse.json({ erreur: "signalement manquant." },
          { status: 400 });
      }

      const { data: ev, error: eLec } = await supabase
        .from("paie_evenements")
        .select("id, type_evenement, fichier, numero_ordre, numero_ordre_reprise")
        .eq("id", idEv)
        .maybeSingle();

      if (eLec) {
        return NextResponse.json({ erreur: "lecture impossible : " + eLec.message },
          { status: 500 });
      }
      if (!ev) {
        return NextResponse.json({ erreur: "signalement introuvable." },
          { status: 404 });
      }
      if (!String((ev as any).fichier || "").trim()) {
        return NextResponse.json({
          erreur: "ce signalement n'a pas encore été généré : il n'y a rien à "
            + "déposer.",
        }, { status: 400 });
      }

      // ═══════════════════════════════════════════════════════════════
      // 🚨 ON NE MARQUE PAS DEPOSE UN SIGNALEMENT QU ON SAIT FAUX
      //
      // Une fin de contrat declare LA DERNIERE PAIE : France Travail calcule
      // les droits dessus. Sans bulletin emis pour le mois de la rupture, le
      // generateur prend le plus recent et le DIT — mais le fichier reste
      // faux.
      // ⛔ FAIRE AVANCER LE COMPTEUR LA-DESSUS OBLIGE A DEPOSER ENSUITE UN
      // « ANNULE ET REMPLACE » QUI N ANNULE RIEN : le premier envoi n a
      // jamais eu lieu. On refuse donc ici, et on dit quoi faire.
      // ═══════════════════════════════════════════════════════════════
      if (String((ev as any).type_evenement) === "fin_contrat") {
        const { data: evc } = await supabase
          .from("paie_evenements")
          .select("contrat_id, date_fin, date_debut")
          .eq("id", idEv)
          .maybeSingle();

        const dRup = String((evc as any)?.date_fin
          || (evc as any)?.date_debut || "").slice(0, 10);
        const moisRup = dRup ? dRup.slice(0, 7) + "-01" : "";

        if (moisRup) {
          const { data: bul } = await supabase
            .from("paie_bulletins")
            .select("numero")
            .eq("contrat_id", (evc as any).contrat_id)
            .eq("periode", moisRup)
            .eq("statut", "emis")
            .limit(1);

          if (!bul || bul.length === 0) {
            return NextResponse.json({
              erreur: "aucun bulletin émis pour le mois de la fin du contrat ("
                + dRup.slice(0, 7) + ") : le signalement déclare une paie qui "
                + "n'est pas la dernière. ⛔ NON MARQUÉ DÉPOSÉ — émettre le "
                + "dernier bulletin, regénérer, puis déposer. France Travail "
                + "calcule les droits sur cette paie.",
            }, { status: 400 });
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 06/10 — LE DEPOT PAR LE LOGICIEL (`par_reseau`)
      // Le fichier part sur net-entreprises avec les acces de la societe, par
      // la meme route que la DSN du mois. S il est refuse, rien n est note.
      // S il s agit d un ESSAI, il est controle mais ne declare rien : le
      // signalement n est PAS note depose et son numero n avance pas.
      // ⛔ AUCUN DEPOT N A ENCORE EU LIEU DEPUIS LE LOGICIEL : a eprouver
      // avec les acces d un vrai client.
      // ═══════════════════════════════════════════════════════════════
      let messageReseau = "";
      if (c.par_reseau === true) {
        const rr = await relais(ctx, "/api/dsn/deposer?action=deposer&v=" + Date.now()
          + "&evenement=" + encodeURIComponent(idEv)
          + "&nature=" + (estReprise ? "05" : String((ev as any).type_evenement) === "fin_contrat" ? "07" : "04")
          + (c.confirmer_reel === true ? "&confirmer=reel" : "") + "&secret=" + cleEncodee(), { method: "GET" });
        if (rr.status >= 400 || !rr.json || rr.json.success !== true) return reponseDuRelais(rr);
        if (rr.json.reel !== true) {
          return NextResponse.json({ success: true, essai: true,
            message: String(rr.json.message || "Fichier d'essai déposé.")
              + " Le signalement n'est pas noté déposé : un essai ne déclare rien." });
        }
        messageReseau = String(rr.json.message || "Signalement déposé.") + " ";
      }

      const champ = estReprise ? "numero_ordre_reprise" : "numero_ordre";
      const avant = Number((ev as any)[champ]) || 0;
      const maj: any = { statut: "depose" };
      maj[champ] = avant + 1;

      const { data: fait, error: eMaj } = await supabase
        .from("paie_evenements")
        .update(maj)
        .eq("id", idEv)
        .select("id")
        .maybeSingle();

      if (eMaj) {
        return NextResponse.json({ erreur: "enregistrement impossible : "
          + eMaj.message }, { status: 500 });
      }
      if (!fait) {
        return NextResponse.json({ erreur: "rien n'a été modifié." },
          { status: 409 });
      }

      return NextResponse.json({
        success: true,
        message: messageReseau + (estReprise ? "Reprise" : "Signalement")
          + (messageReseau ? " noté déposé" : " marqué déposé") + " (envoi n° " + (avant + 1) + "). "
          + "⚠️ Le prochain fichier de ce type sera un « annule et remplace » "
          + "portant le n° " + (avant + 2) + ".",
      });
    }

    if (action === "ajouter_evenement") {
      const contratId = String(c.contrat_id || "");
      const type = String(c.type_evenement || "");
      const motif = String(c.motif || "");
      const dateDebut = String(c.date_debut || "");

      if (!contratId || !type || !motif || !dateDebut) {
        return NextResponse.json({
          erreur: "contrat, type, motif et date de début sont obligatoires.",
        }, { status: 400 });
      }
      if (type !== "arret" && type !== "fin_contrat") {
        return NextResponse.json({
          erreur: "type inconnu : « arret » ou « fin_contrat » attendu.",
        }, { status: 400 });
      }

      const { data: ct } = await supabase
        .from("paie_contrats")
        .select("*")
        .eq("id", contratId)
        .maybeSingle();
      if (!ct) {
        return NextResponse.json({ erreur: "contrat introuvable." },
          { status: 404 });
      }

      // ⛔ UNE FIN DE CONTRAT NE PEUT PAS PRECEDER SON DEBUT. Le cas se
      // produit sur une faute de frappe d annee, et il passe inapercu
      // jusqu au rejet par France Travail.
      if (type === "fin_contrat" && String(c.date_fin || dateDebut)
          < String((ct as any).date_debut)) {
        return NextResponse.json({
          erreur: "la date de fin est antérieure au début du contrat ("
            + String((ct as any).date_debut).slice(0, 10) + ").",
        }, { status: 400 });
      }

      const subro = type === "arret" && c.subrogation === true;
      const dateFin = String(c.date_fin || "").trim();
      const dernierJour = String(c.dernier_jour_travaille || "").trim();
      const subroDebut = String(c.subro_debut || "").trim();
      const subroFin = String(c.subro_fin || "").trim();
      // 🆕 20/09 — la reprise n existe que sur un arret.
      const repriseDate = type === "arret"
        ? String(c.reprise_date || "").trim() : "";
      const repriseMotif = repriseDate
        ? (String(c.reprise_motif || "").trim() || "01") : "";
      let ibanPropre: string | null = null;
      let bicPropre: string | null = null;

      if (type === "arret") {
        // ⛔ UN ARRET NE PEUT PAS COMMENCER AVANT LE CONTRAT QU IL SUSPEND.
        if (dateDebut < String((ct as any).date_debut).slice(0, 10)) {
          return NextResponse.json({
            erreur: "l'arrêt commence avant le début du contrat ("
              + String((ct as any).date_debut).slice(0, 10) + ").",
          }, { status: 400 });
        }

        // ═══════════════════════════════════════════════════════════════
        // 🆕🚨 LA DATE DE FIN PREVISIONNELLE EST OBLIGATOIRE — dsn-val,
        // 17/09 : « CST-03 / Absence de la rubrique S21.G00.60.003 ».
        //
        // C est la date que porte l avis d arret du medecin. Sans elle, la
        // CPAM ne sait pas jusqu a quand indemniser, et rejette.
        // ⛔ ELLE NE SE DEVINE PAS ET NE SE REMPLIT PAS PAR DEFAUT : on ne
        // prolonge ni ne raccourcit un arret de travail a la place d un
        // medecin.
        // ═══════════════════════════════════════════════════════════════
        if (!dateFin) {
          return NextResponse.json({
            erreur: "la date de fin prévisionnelle de l'arrêt est obligatoire : "
              + "c'est celle que porte l'avis d'arrêt du médecin. ⛔ Sans elle, "
              + "la CPAM rejette le signalement et les indemnités "
              + "journalières ne partent pas.",
          }, { status: 400 });
        }
        // ⚠️ UNE FIN AVANT LE DEBUT EST TOUJOURS UNE FAUTE DE FRAPPE — le
        // mois ou l annee. Elle passerait dsn-val, qui ne compare pas les
        // deux dates, et c est la CPAM qui la renverrait.
        if (dateFin < dateDebut) {
          return NextResponse.json({
            erreur: "la fin prévisionnelle de l'arrêt (" + dateFin
              + ") précède son début (" + dateDebut + ").",
          }, { status: 400 });
        }
        if (dernierJour && dernierJour > dateDebut) {
          return NextResponse.json({
            erreur: "le dernier jour travaillé (" + dernierJour
              + ") est postérieur au début de l'arrêt (" + dateDebut + ").",
          }, { status: 400 });
        }

        // ═══════════════════════════════════════════════════════════════
        // 🆕🚨 20/09 — LA REPRISE ANTICIPEE, PORTEE PAR L ARRET
        //
        // Le signalement de reprise (nature 05) a ete valide par dsn-val le
        // 20/09 : c est l arret, SANS la subrogation, plus la date et le
        // motif de reprise.
        // 🚨 ELLE NE SE DECLARE QUE SI ELLE EST ANTICIPEE — controle SIG-13 :
        // une reprise posterieure a la fin prevue est refusee. Le refuser ICI,
        // a la saisie, evite de decouvrir le rejet au moment de generer.
        // ⛔ LES MOTIFS SONT TROIS, lus dans l enumeration de dsn-val. On n en
        // accepte aucun autre.
        // ═══════════════════════════════════════════════════════════════
        if (repriseDate) {
          if (repriseDate < dateDebut) {
            return NextResponse.json({
              erreur: "la reprise (" + repriseDate + ") précède le début de "
                + "l'arrêt (" + dateDebut + ").",
            }, { status: 400 });
          }
          if (repriseDate > dateFin) {
            return NextResponse.json({
              erreur: "la reprise (" + repriseDate + ") est postérieure à la fin "
                + "prévue de l'arrêt (" + dateFin + "). ⛔ Il n'y a rien à "
                + "signaler : une reprise ne se déclare que lorsqu'elle est "
                + "ANTICIPÉE.",
            }, { status: 400 });
          }
          if (repriseMotif !== "01" && repriseMotif !== "02"
              && repriseMotif !== "03") {
            return NextResponse.json({
              erreur: "motif de reprise inconnu : 01 (normale), 02 (temps "
                + "partiel thérapeutique) ou 03 (temps partiel pour raison "
                + "personnelle).",
            }, { status: 400 });
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 🆕🚨 05/10 — CE QUE LA SAISIE GARDE EN PLUS, SELON LA NATURE
      //
      // ⚠️ CES COLONNES NE S ECRIVENT QUE LORSQU ELLES ONT UNE VALEUR : un
      // arret ordinaire ou une fin de CDD s enregistrent donc comme avant,
      // meme si les colonnes du 05/10 n etaient pas encore en base.
      // ═══════════════════════════════════════════════════════════════
      const enPlus: any = {};
      const estDate = function (x: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(x); };

      // ---- L ARRET : LE TEMPS PARTIEL THERAPEUTIQUE ----
      // La DSN du mois declare la PERTE DE SALAIRE (bloc S21.G00.66) : c est
      // sur elle que la caisse calcule l indemnite. Elle ne se calcule pas,
      // elle se saisit, et se met a jour chaque mois tant que le temps
      // partiel court. Concerne : un arret de motif « temps partiel
      // therapeutique », ou une reprise a temps partiel therapeutique.
      if (type === "arret") {
        const { data: kArret } = await supabase
          .from("dsn_codes").select("code, correspondance")
          .eq("rubrique", "S21.G00.60.001").is("date_fin", null);
        let codeArret = /^\d{2}$/.test(motif.trim()) ? motif.trim() : "";
        for (const k of (kArret || [])) {
          if (String((k as any).correspondance || "").trim() === motif.trim()) codeArret = String((k as any).code);
        }
        const estTpt = ["15", "16", "17", "18"].indexOf(codeArret) >= 0 || repriseMotif === "02";
        const perteSaisie = propre(c.tpt_perte_salaire);
        let tptDebut = String(c.tpt_debut || "").trim().slice(0, 10);
        const tptFin = String(c.tpt_fin || "").trim().slice(0, 10);
        if (estTpt) {
          const refusTpt: string[] = [];
          let perte: number | null = null;
          if (perteSaisie !== null) {
            perte = nombreFr(perteSaisie);
            if (perte === null || !(perte > 0)) {
              refusTpt.push("la perte de salaire du temps partiel thérapeutique (« " + perteSaisie
                + " ») n'est pas un montant.");
            }
          }
          if (tptDebut && !estDate(tptDebut)) refusTpt.push("début du temps partiel thérapeutique : format AAAA-MM-JJ.");
          if (tptFin && !estDate(tptFin)) refusTpt.push("fin du temps partiel thérapeutique : format AAAA-MM-JJ.");
          if (repriseMotif === "02" && !tptDebut) tptDebut = repriseDate;
          if (tptDebut && tptDebut < dateDebut) {
            refusTpt.push("le temps partiel thérapeutique ne peut pas commencer avant l'arrêt (" + jmaRoute(dateDebut) + ").");
          }
          if (tptDebut && tptFin && tptFin < tptDebut) {
            refusTpt.push("la fin du temps partiel thérapeutique précède son début.");
          }
          if (repriseMotif === "02" && perte !== null && !tptFin) {
            refusTpt.push("pour une reprise à temps partiel thérapeutique, la date de fin du temps partiel "
              + "(celle de la prescription) est obligatoire avec la perte de salaire.");
          }
          if (refusTpt.length > 0) {
            return NextResponse.json({ erreur: refusTpt.join(" ") + " Rien n'a été enregistré." }, { status: 400 });
          }
          if (perte !== null) enPlus.tpt_perte_salaire = Math.round(perte * 100) / 100;
          if (tptDebut) enPlus.tpt_debut = tptDebut;
          if (tptFin) enPlus.tpt_fin = tptFin;
        }
      }

      // ---- LA FIN DE CONTRAT : LES DATES DU MOTIF ET LE PREAVIS ----
      // 🚨 Le signalement de fin de contrat remplace l attestation employeur.
      // Selon le motif, France Travail exige une ou plusieurs dates et un
      // preavis coherent ; sans eux LE FICHIER EST REJETE. On le dit ici.
      if (type === "fin_contrat") {
        const finContrat = (dateFin || dateDebut).slice(0, 10);
        const debutContrat = String((ct as any).date_debut || "").slice(0, 10);
        const { data: kMotif } = await supabase
          .from("dsn_codes").select("code, correspondance")
          .eq("rubrique", "S21.G00.62.002").is("date_fin", null);
        let codeMotif = "";
        for (const k of (kMotif || [])) {
          if (String((k as any).correspondance || "").trim() === motif.trim()) codeMotif = String((k as any).code);
        }

        const notification = String(c.date_notification || "").trim().slice(0, 10);
        const convention = String(c.date_signature_convention || "").trim().slice(0, 10);
        const procedure = String(c.date_engagement_procedure || "").trim().slice(0, 10);
        const preavisType = String(c.preavis_type || "").trim();
        const preavisDebut = String(c.preavis_debut || "").trim().slice(0, 10);
        const preavisFin = String(c.preavis_fin || "").trim().slice(0, 10);
        const dernierPaye = String(c.dernier_jour_paye || "").trim().slice(0, 10);
        const refusFin: string[] = [];

        for (const paire of [["date de notification", notification], ["date de signature de la convention", convention],
          ["date d'engagement de la procédure", procedure], ["début du préavis", preavisDebut],
          ["fin du préavis", preavisFin], ["dernier jour travaillé et payé", dernierPaye]]) {
          if (paire[1] && !estDate(paire[1])) refusFin.push(paire[0] + " : format AAAA-MM-JJ.");
        }

        if (refusFin.length === 0) {
          // La notification (62.003).
          if (!notification && RUPT_NOTIFICATION.indexOf(codeMotif) >= 0) {
            refusFin.push("la date de notification de la rupture est obligatoire pour ce motif (lettre de "
              + "licenciement, de démission ou de fin d'essai).");
          }
          if (notification && ((debutContrat && notification < debutContrat) || notification > finContrat)) {
            refusFin.push("la date de notification (" + jmaRoute(notification) + ") doit se situer entre le début "
              + "du contrat et sa fin (" + jmaRoute(finContrat) + ").");
          }
          // La signature de la convention (62.004).
          if (!convention && RUPT_CONVENTION.indexOf(codeMotif) >= 0) {
            refusFin.push("la date de signature de la convention de rupture est obligatoire pour une rupture "
              + "conventionnelle.");
          }
          if (convention && convention > finContrat) {
            refusFin.push("la convention de rupture ne peut pas être signée après la fin du contrat.");
          }
          // L engagement de la procedure de licenciement (62.005).
          if (!procedure && RUPT_PROCEDURE.indexOf(codeMotif) >= 0) {
            refusFin.push("la date d'engagement de la procédure de licenciement (celle de l'entretien préalable) "
              + "est obligatoire pour ce motif.");
          }
          if (procedure && procedure > finContrat) {
            refusFin.push("l'engagement de la procédure de licenciement ne peut pas suivre la fin du contrat.");
          }
          // Le dernier jour travaille et paye (62.006).
          if (dernierPaye && ((debutContrat && dernierPaye < debutContrat) || dernierPaye > finContrat)) {
            refusFin.push("le dernier jour travaillé et payé (" + jmaRoute(dernierPaye) + ") doit se situer dans "
              + "le contrat.");
          }

          // Le preavis (63.001 a 63.003).
          if (preavisType && PREAVIS_TYPES.indexOf(preavisType) < 0) {
            refusFin.push("type de préavis inconnu : « " + preavisType + " ».");
          } else if (!preavisType) {
            if (codeMotif && RUPT_SANS_PREAVIS.indexOf(codeMotif) < 0) {
              refusFin.push("préciser le préavis : effectué ou non, payé ou non — ou « pas de préavis ». "
                + "France Travail s'en sert pour fixer le début de l'indemnisation.");
            }
            if (preavisDebut || preavisFin) {
              refusFin.push("des dates de préavis sont saisies sans le type de préavis.");
            }
          } else {
            if ((codeMotif === "034" || codeMotif === "035") && preavisType !== "60" && preavisType !== "90") {
              refusFin.push("fin de période d'essai : seuls un délai de prévenance ou « pas de préavis » se déclarent.");
            }
            if ((codeMotif === "043" || codeMotif === "110") && preavisType !== "90") {
              refusFin.push("une rupture conventionnelle n'a pas de préavis : choisir « pas de préavis ».");
            }
            if (codeMotif === "026" && preavisType !== "10" && preavisType !== "90") {
              refusFin.push("contrat de sécurisation professionnelle : le préavis est « non effectué, non payé "
                + "(CSP) » ou « pas de préavis ».");
            }
            if (preavisType === "61" && codeMotif !== "114") {
              refusFin.push("le préavis « parcours d'accompagnement personnalisé » ne se déclare qu'avec le motif "
                + "de rupture correspondant.");
            }
            if (preavisType === "90") {
              if (preavisDebut || preavisFin) {
                refusFin.push("« pas de préavis » ne porte pas de dates : les vider.");
              }
            } else {
              if (!preavisDebut || !preavisFin) {
                refusFin.push("un préavis se déclare avec ses deux dates, début et fin.");
              } else {
                if (preavisFin < preavisDebut) refusFin.push("la fin du préavis précède son début.");
                if (debutContrat && preavisDebut < debutContrat) refusFin.push("le préavis commence avant le contrat.");
                if (notification && preavisDebut < notification) {
                  refusFin.push("le préavis ne peut pas commencer avant la notification de la rupture ("
                    + jmaRoute(notification) + ").");
                }
                if (procedure && RUPT_PROCEDURE.indexOf(codeMotif) >= 0 && preavisDebut <= procedure) {
                  refusFin.push("le préavis doit commencer après l'engagement de la procédure de licenciement ("
                    + jmaRoute(procedure) + ").");
                }
                if (PREAVIS_NON_FAITS.indexOf(preavisType) >= 0) {
                  if (!dernierPaye) {
                    refusFin.push("préavis non effectué : saisir le dernier jour travaillé et payé, qui précède "
                      + "le début du préavis.");
                  } else if (dernierPaye >= preavisDebut) {
                    refusFin.push("préavis non effectué : le dernier jour travaillé et payé ("
                      + jmaRoute(dernierPaye) + ") doit précéder le début du préavis (" + jmaRoute(preavisDebut) + ").");
                  }
                }
              }
            }
          }
        }

        if (refusFin.length > 0) {
          const t0 = refusFin.join(" ");
          return NextResponse.json({
            erreur: t0.charAt(0).toUpperCase() + t0.slice(1) + " ⛔ Sans cela, France Travail rejette le "
              + "signalement. Rien n'a été enregistré.",
          }, { status: 400 });
        }
        if (convention) enPlus.date_signature_convention = convention;
        if (procedure) enPlus.date_engagement_procedure = procedure;
        if (preavisType) enPlus.preavis_type = preavisType;
        if (preavisType && preavisType !== "90") {
          enPlus.preavis_debut = preavisDebut;
          enPlus.preavis_fin = preavisFin;
        }
      }

      // ---- 🆕🚨 05/10 — « MODIFIER » NE PERD PLUS L AVIS D ARRET ----
      // Modifier un signalement, c est en enregistrer un nouveau puis retirer
      // l ancien. La piece jointe (l avis d arret) et la marque « affection
      // de longue duree » restaient sur l ancien : apres une modification, le
      // mois repassait au rouge « avis d arret manquant » et les indemnites
      // redevenaient imposables. On les reprend sur le signalement remplace.
      const remplace = propre(c.remplace);
      if (remplace) {
        const { data: vieux } = await supabase
          .from("paie_evenements").select("*").eq("id", remplace).maybeSingle();
        if (vieux && String((vieux as any).contrat_id) === contratId
            && String((vieux as any).type_evenement) === type) {
          const v: any = vieux;
          if (v.preuve_chemin) {
            enPlus.preuve_chemin = v.preuve_chemin;
            enPlus.preuve_nom = v.preuve_nom || null;
            enPlus.preuve_par = v.preuve_par || null;
            enPlus.preuve_le = v.preuve_le || null;
          }
          if (type === "arret" && v.ald === true) enPlus.ald = true;
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 🚨 LA SUBROGATION SE SAISIT EN ENTIER OU PAS DU TOUT.
      //
      // Elle etait deja refusee sans IBAN, a la saisie plutot qu a la
      // generation : c est le moment ou le cabinet a le document sous les
      // yeux. Plus tard, il faudra le rechercher.
      //
      // 🆕 17/09 — dsn-val, controle CCH-11 : l IBAN NE SUFFIT PAS. Il va
      // avec le BIC et avec la DATE DE FIN DE SUBROGATION. Les trois se
      // reclament ensemble, et l IBAN comme le BIC sont controles.
      //
      // ⚠️ LA FIN DE SUBROGATION N EST PAS LA FIN DE L ARRET : elle borne la
      // periode pendant laquelle l employeur MAINTIENT LE SALAIRE, que fixe
      // la convention collective. ⛔ ON NE LA REMPLIT DONC PAS PAR DEFAUT
      // AVEC LA FIN DE L ARRET — declarer une subrogation trop longue, c est
      // percevoir des indemnites qui reviennent au salarie.
      // ═══════════════════════════════════════════════════════════════
      if (subro) {
        if (!String(c.iban || "").trim()) {
          return NextResponse.json({
            erreur: "subrogation demandée sans IBAN. ⛔ Sans lui, les "
              + "indemnités journalières seraient versées au salarié alors "
              + "que l'employeur maintient son salaire.",
          }, { status: 400 });
        }
        const vIban = controlerIban(String(c.iban));
        if (!vIban.ok) {
          return NextResponse.json({ erreur: vIban.message }, { status: 400 });
        }
        ibanPropre = vIban.propre || null;

        if (!String(c.bic || "").trim()) {
          return NextResponse.json({
            erreur: "subrogation demandée sans BIC. Il est obligatoire avec "
              + "l'IBAN, et figure sur le même relevé d'identité bancaire.",
          }, { status: 400 });
        }
        const vBic = controlerBic(String(c.bic));
        if (!vBic.ok) {
          return NextResponse.json({ erreur: vBic.message }, { status: 400 });
        }
        bicPropre = vBic.propre || null;

        if (!subroFin) {
          return NextResponse.json({
            erreur: "subrogation demandée sans date de fin. Elle est "
              + "obligatoire : c'est la fin du maintien de salaire prévu par la "
              + "convention collective, pas forcément celle de l'arrêt.",
          }, { status: 400 });
        }
        if (subroFin < (subroDebut || dateDebut)) {
          return NextResponse.json({
            erreur: "la fin de subrogation (" + subroFin + ") précède son début ("
              + (subroDebut || dateDebut) + ").",
          }, { status: 400 });
        }
      }

      // ⚠️ SANS SUBROGATION, RIEN DE LA SUBROGATION NE S ENREGISTRE. Une case
      // cochee puis decochee laisse un IBAN dans le formulaire : l ecrire en
      // base ferait croire, a la relecture, a une subrogation oubliee.
      const { data: cree, error: eIns } = await supabase
        .from("paie_evenements")
        .insert({
          tenant_id: (ct as any).tenant_id,
          societe_id: (ct as any).societe_id,
          contrat_id: contratId,
          type_evenement: type,
          motif: motif,
          date_debut: dateDebut,
          date_fin: dateFin || null,
          dernier_jour_travaille: dernierJour || null,
          // 🆕 SANS DATE, PAS DE MOTIF : un motif orphelin ferait croire, a
          // la relecture, a une reprise oubliee.
          reprise_date: repriseDate || null,
          reprise_motif: repriseDate ? repriseMotif : null,
          subrogation: subro,
          subro_debut: subro ? (subroDebut || null) : null,
          subro_fin: subro ? subroFin : null,
          iban: subro ? ibanPropre : null,
          bic: subro ? bicPropre : null,
          date_notification: String(c.date_notification || "") || null,
          dernier_jour_paye: String(c.dernier_jour_paye || "") || null,
          statut: "brouillon",
          ...enPlus,
        })
        .select()
        .maybeSingle();
      if (eIns) {
        // 🆕 05/10 — une colonne du 05/10 absente de la base se dit en clair.
        if (/column|schema cache/i.test(String(eIns.message || ""))
            && /preavis|convention|procedure|tpt_/i.test(String(eIns.message || ""))) {
          return NextResponse.json({
            erreur: "la base n'a pas encore les colonnes du préavis et des dates de rupture (requête SQL "
              + "du 05/10 à passer). Rien n'a été enregistré.",
          }, { status: 500 });
        }
        return NextResponse.json({ erreur: eIns.message }, { status: 500 });
      }

      // ⚠️ LE DELAI SE COMPTE DES LA SAISIE, pas depuis la generation.
      const debut = new Date(dateDebut);
      const limite = new Date(debut.getTime() + 5 * 86400000);
      const jours = Math.ceil(
        (limite.getTime() - Date.now()) / 86400000);

      return NextResponse.json({
        success: true,
        evenement: cree,
        message: (type === "arret" ? "Arrêt enregistré. " : "Fin de contrat enregistrée. ")
          + (jours < 0
            ? "⚠️ DÉLAI DÉPASSÉ de " + nbAcc(Math.abs(jours), "jour", "jours") + " : "
              + "le signalement aurait dû partir le "
              + limite.toISOString().slice(8, 10) + "/"
              + limite.toISOString().slice(5, 7) + "."
            : "À déposer avant le "
              + limite.toISOString().slice(8, 10) + "/"
              + limite.toISOString().slice(5, 7) + " ("
              + nbAcc(jours, "jour", "jours") + ")."),
      });
    }

    if (action === "supprimer_evenement") {
      const id = String(c.id || "");
      if (!id) return NextResponse.json({ erreur: "identifiant manquant." },
        { status: 400 });

      // ⛔ UN SIGNALEMENT DEPOSE NE SE SUPPRIME PAS : il a ete transmis, et
      // l effacer ici ne l efface pas chez l organisme. Une correction
      // passe par un signalement d annulation.
      const { data: ev } = await supabase
        .from("paie_evenements")
        .select("statut")
        .eq("id", id)
        .maybeSingle();

      if (!ev) return NextResponse.json({ erreur: "événement introuvable." },
        { status: 404 });
      if (String((ev as any).statut) === "depose") {
        return NextResponse.json({
          erreur: "ce signalement a été déposé : il ne peut plus être "
            + "supprimé. Une correction passe par un signalement "
            + "d'annulation auprès de l'organisme.",
        }, { status: 400 });
      }

      const { error: eDel } = await supabase
        .from("paie_evenements").delete().eq("id", id);
      if (eDel) return NextResponse.json({ erreur: eDel.message }, { status: 500 });

      return NextResponse.json({ success: true, message: "Signalement retiré." });
    }

    return NextResponse.json({ erreur: "action inconnue : " + action }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LA PORTE UNIQUE : CONNEXION, ORGANISME, DROITS, JOURNAL
//
// Jusqu au 28/09, cette route ne connaissait qu une chose : la cle
// d administration, tapee dans l ecran et gardee dans l onglet. Celui qui
// la tenait voyait TOUTE LA BASE — tous les salaries de tous les cabinets.
// C etait supportable tant que Jacques etait seul a s en servir ; c est
// impossible des qu un cabinet, un collaborateur ou un sous-traitant
// prepare la paie.
//
// DESORMAIS, TOUT PASSE PAR ICI, DANS CET ORDRE :
//   1. QUI : la session signee (lib/session). La cle reste acceptee pour
//      les appels de serveur a serveur et les scripts — elle ne s affiche
//      plus jamais dans un ecran.
//   2. QUEL DOSSIER : chaque action designe un contrat, un element, un
//      bulletin, un evenement ou une societe ; on remonte a la societe, et
//      lib/droits verifie qu elle appartient a l organisme de la session et
//      qu elle est confiee a ce collaborateur. Un identifiant d un autre
//      cabinet colle a la main rend « introuvable ».
//   3. QUEL GESTE : chaque action exige son droit (REGLES ci-dessous).
//   4. LE JOURNAL : toute ecriture reussie est inscrite dans compta_audit,
//      avec qui, quand, sur quoi et les parametres donnes.
//
// 🚨 LE RELAIS : l ecran ne parle plus qu a cette route. Le calcul, le
// bulletin PDF, la fin de contrat et le signalement DSN restent dans leurs
// routes, protegees par la cle ; celle-ci les appelle de serveur a serveur
// APRES avoir verifie les droits. Une seule porte, donc un seul endroit ou
// un controle peut manquer.
// ═══════════════════════════════════════════════════════════════════════

type Ctx = {
  cleServeur: boolean;
  email: string;
  ip: string | null;
  hote: string;
};

type Regle = { droit: Droit | null; cible: string; ecrit: boolean };

// cible : « type » ou « type:champ ». Types : contrat (contrat_id par
// defaut), element, bulletin, evenement, conges (id par defaut), societe
// (societe_id), aucune.
const REGLES: Record<string, Regle> = {
  contrats: { droit: null, cible: "aucune", ecrit: false },
  motifs_rupture: { droit: null, cible: "aucune", ecrit: false },
  nouveau: { droit: "paie_contrats", cible: "societe", ecrit: true },
  modifier_contrat: { droit: "paie_contrats", cible: "contrat", ecrit: true },
  repartition: { droit: "paie_contrats", cible: "contrat", ecrit: true },
  taux_pas: { droit: "paie_contrats", cible: "contrat", ecrit: true },
  // ---- 06/10 : la reprise d un autre logiciel ----
  reprise: { droit: null, cible: "contrat", ecrit: false },
  reprise_enregistrer: { droit: "paie_contrats", cible: "contrat", ecrit: true },
  reprise_supprimer: { droit: "paie_contrats", cible: "contrat", ecrit: true },
  reprise_conges: { droit: "paie_contrats", cible: "contrat", ecrit: true },
  elements: { droit: null, cible: "contrat", ecrit: false },
  ajouter_element: { droit: "paie_preparer", cible: "contrat", ecrit: true },
  supprimer_element: { droit: "paie_preparer", cible: "element", ecrit: true },
  bulletins: { droit: null, cible: "contrat", ecrit: false },
  voir_bulletin: { droit: null, cible: "bulletin", ecrit: false },
  emettre: { droit: "paie_emettre", cible: "bulletin", ecrit: true },
  conges: { droit: null, cible: "contrat", ecrit: false },
  poser_conges: { droit: "paie_preparer", cible: "contrat", ecrit: true },
  supprimer_conges: { droit: "paie_preparer", cible: "conges", ecrit: true },
  prime_vacances: { droit: null, cible: "societe", ecrit: false },
  arret_ald: { droit: "paie_preparer", cible: "evenement:evenement_id", ecrit: true },
  evenements: { droit: null, cible: "contrat", ecrit: false },
  deposer_evenement: { droit: "dsn_deposer", cible: "evenement", ecrit: true },
  ajouter_evenement: { droit: "paie_preparer", cible: "contrat", ecrit: true },
  supprimer_evenement: { droit: "paie_preparer", cible: "evenement", ecrit: true },
  // ---- 28/09 : le relais ----
  calculer: { droit: null, cible: "contrat", ecrit: false },
  sortir_bulletin: { droit: "paie_preparer", cible: "contrat", ecrit: true },
  signalement: { droit: "paie_preparer", cible: "evenement:evenement_id", ecrit: true },
  // ---- 06/10 : la declaration prealable a l embauche ----
  embauche_etat: { droit: null, cible: "contrat", ecrit: false },
  embauche: { droit: "paie_contrats", cible: "contrat", ecrit: true },
  embauche_deposee: { droit: "dsn_deposer", cible: "contrat", ecrit: true },
  embauche_deposer: { droit: "dsn_deposer", cible: "contrat", ecrit: true },
  fin_contrat: { droit: "paie_emettre", cible: "contrat", ecrit: true },
  // ---- 28/09 : la validation ----
  tableau_mois: { droit: null, cible: "societe", ecrit: false },
  controler: { droit: null, cible: "contrat", ecrit: false },
  soumettre: { droit: "paie_preparer", cible: "contrat", ecrit: false },
  justifier: { droit: "paie_preparer", cible: "bulletin", ecrit: true },
  renvoyer: { droit: "paie_emettre", cible: "bulletin", ecrit: false },
  lever: { droit: "paie_emettre", cible: "bulletin", ecrit: false },
  joindre_preuve: { droit: "paie_preparer", cible: "element", ecrit: true },
  voir_preuve: { droit: null, cible: "element", ecrit: false },
  joindre_avis: { droit: "paie_preparer", cible: "evenement", ecrit: true },
  voir_avis: { droit: null, cible: "evenement", ecrit: false },
  envoyer_recap: { droit: "paie_preparer", cible: "societe", ecrit: true },
  lever_recap: { droit: "paie_emettre", cible: "societe", ecrit: true },
  mesure: { droit: null, cible: "aucune", ecrit: false },
  seuils: { droit: null, cible: "societe", ecrit: false },
  regler_seuils: { droit: null, cible: "societe", ecrit: true },
};

// 🆕 28/09 — les gestes qui changent les montants d un mois deja sorti.
const PERIMANTS = [
  "ajouter_element", "supprimer_element", "poser_conges", "supprimer_conges",
  "ajouter_evenement", "supprimer_evenement", "arret_ald",
  "repartition", "taux_pas", "modifier_contrat",
  "reprise_enregistrer", "reprise_supprimer", "reprise_conges",
];

async function contratDe(spec: string, c: any): Promise<string | null> {
  const morceaux = spec.split(":");
  const type = morceaux[0];
  const champ = morceaux[1] || (type === "contrat" ? "contrat_id" : "id");
  const id = propre(c[champ]);
  if (!id) return null;
  if (type === "contrat") return id;
  const table = type === "element" ? "paie_elements" : type === "evenement" ? "paie_evenements"
    : type === "conges" ? "paie_conges" : null;
  if (!table) return null;
  const { data } = await supabase.from(table).select("contrat_id").eq("id", id).maybeSingle();
  return data ? String((data as any).contrat_id) : null;
}

async function cibleDe(spec: string, c: any): Promise<{ societeId: string | null; reference: string | null }> {
  const morceaux = spec.split(":");
  const type = morceaux[0];
  if (type === "aucune") return { societeId: null, reference: null };

  const champ = morceaux[1]
    || (type === "contrat" ? "contrat_id" : type === "societe" ? "societe_id" : "id");
  const id = propre(c[champ]);
  if (!id) return { societeId: null, reference: null };

  if (type === "societe") {
    const { data } = await supabase.from("compta_societes").select("id").eq("id", id).maybeSingle();
    return { societeId: data ? String((data as any).id) : null, reference: id };
  }
  if (type === "contrat") {
    const { data } = await supabase.from("paie_contrats").select("societe_id").eq("id", id).maybeSingle();
    return { societeId: data ? String((data as any).societe_id) : null, reference: id };
  }
  if (type === "element") {
    const { data } = await supabase.from("paie_elements").select("societe_id").eq("id", id).maybeSingle();
    return { societeId: data ? String((data as any).societe_id) : null, reference: id };
  }
  if (type === "bulletin") {
    const { data } = await supabase.from("paie_bulletins").select("societe_id").eq("id", id).maybeSingle();
    return { societeId: data ? String((data as any).societe_id) : null, reference: id };
  }
  if (type === "evenement") {
    const { data } = await supabase.from("paie_evenements").select("societe_id").eq("id", id).maybeSingle();
    return { societeId: data ? String((data as any).societe_id) : null, reference: id };
  }
  if (type === "conges") {
    const { data } = await supabase.from("paie_conges").select("contrat_id").eq("id", id).maybeSingle();
    if (!data) return { societeId: null, reference: id };
    const { data: ct } = await supabase.from("paie_contrats").select("societe_id")
      .eq("id", (data as any).contrat_id).maybeSingle();
    return { societeId: ct ? String((ct as any).societe_id) : null, reference: id };
  }
  return { societeId: null, reference: id };
}

// Le journal. Il ne bloque jamais le geste : un journal en panne se lit
// dans les journaux Vercel, mais la paie du client ne s arrete pas pour lui.
async function journal(
  societeId: string | null, ctx: Ctx, action: string, cible: string,
  reference: string | null, apres: any, avant?: any
): Promise<void> {
  const { error } = await supabase.from("compta_audit").insert({
    societe_id: societeId,
    email: ctx.email,
    action: action,
    cible: cible,
    reference: reference,
    avant: avant === undefined ? null : avant,
    apres: apres === undefined ? null : apres,
    adresse_ip: ctx.ip,
  });
  if (error) console.error("[paie/dossier] journal :", error.message);
}

// Les parametres d une demande, sans ce qui n a rien a faire au journal :
// le contenu d une piece jointe (plusieurs megaoctets) et toute cle.
function pourJournal(c: any): any {
  const copie: any = {};
  for (const k of Object.keys(c || {})) {
    if (k === "contenu" || k === "cle" || k === "secret") continue;
    copie[k] = c[k];
  }
  return copie;
}

// L appel d une route voisine, de serveur a serveur, avec la cle.
async function relais(ctx: Ctx, chemin: string, init: any): Promise<{ status: number; texte: string; json: any }> {
  try {
    const r = await fetch("https://" + ctx.hote + chemin, { ...init, cache: "no-store" });
    const texte = await r.text();
    let json: any = null;
    try { json = JSON.parse(texte); } catch (e) { json = null; }
    return { status: r.status, texte: texte, json: json };
  } catch (e: any) {
    const texte = JSON.stringify({ erreur: "appel interne impossible : " + String(e && e.message ? e.message : e) });
    return { status: 502, texte: texte, json: JSON.parse(texte) };
  }
}

function reponseDuRelais(r: { status: number; texte: string }): NextResponse {
  return new NextResponse(r.texte || "{}", {
    status: r.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function cleEncodee(): string {
  return encodeURIComponent(process.env.CRON_SECRET || "");
}

function moisDe(p: any): string | null {
  const s = String(p || "").slice(0, 10);
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(s)) return null;
  return s.slice(0, 7) + "-01";
}

function moisDecale(periode: string, n: number): string {
  const d = new Date(periode.slice(0, 7) + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7) + "-01";
}

function dernierJour(periode: string): string {
  const d = new Date(periode.slice(0, 7) + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

function euros(n: any): string {
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function r2(n: any): number {
  return Math.round(Number(n || 0) * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LE CONTROLE DE VRAISEMBLANCE
//
// Chaque bulletin est compare au mois precedent et au contrat, avec les
// seuils de `paie_seuils` (reglables en base, jamais ecrits ici).
//   ROUGE  bloque l emission tant que ce n est pas corrige, ou leve avec un
//          motif par quelqu un qui a la carte blanche ;
//   ORANGE demande une justification ecrite avant l emission ;
//   INFO   se lit, ne bloque rien.
// ⚠️ CE QU AUCUN CONTROLE N ATTRAPE : une erreur plausible (une prime de
// 200 € saisie 250 €). C est le role du recapitulatif confirme par le
// client — lui seul sait la verite.
// ⚠️ LES NATURES DONT LE MONTANT N EST PAS DE L ARGENT VERSE (avantages au
// bareme, titres-restaurant) et les retenues d absence ne passent pas les
// controles de montant.
// ═══════════════════════════════════════════════════════════════════════
const HORS_CONTROLE_MONTANT = [
  "avantage_repas", "avantage_logement", "titres_restaurant",
  "absence_maladie", "absence_injustifiee",
];

// 🆕 28/09 — LES SEUILS SE REGLENT PAR CABINET. Les valeurs de
// `paie_seuils` valent pour tous ; un cabinet peut en regler certains pour
// lui seul (`paie_seuils_cabinet`), par exemple accepter de plus fortes
// variations de net pour des salaries a commissions. Sans reglage, c est la
// valeur commune qui s applique.
const SEUILS_DEFAUT: any = {
  ECART_NET_ORANGE: 25, ECART_NET_ROUGE: 80, ELEMENT_HABITUDE_FOIS: 3,
  ELEMENT_SALAIRE_ORANGE: 50, ELEMENT_SALAIRE_ROUGE: 300,
  HEURES_SUP_ORANGE: 20, HEURES_SUP_ROUGE: 60, PREUVE_MONTANT: 300,
};

// Les bornes de saisie : un seuil hors de ces bornes n aurait plus de sens
// (un ecart de 0 % mettrait tout le monde en orange, un de 10 000 % n en
// mettrait jamais personne).
const SEUILS_BORNES: any = {
  ECART_NET_ORANGE: [1, 500], ECART_NET_ROUGE: [1, 1000], ELEMENT_HABITUDE_FOIS: [1, 100],
  ELEMENT_SALAIRE_ORANGE: [1, 1000], ELEMENT_SALAIRE_ROUGE: [1, 10000],
  HEURES_SUP_ORANGE: [1, 200], HEURES_SUP_ROUGE: [1, 300], PREUVE_MONTANT: [1, 100000],
};

async function seuils(tenantId?: string | null): Promise<any> {
  const s: any = { ...SEUILS_DEFAUT };
  const { data } = await supabase.from("paie_seuils").select("code, valeur");
  for (const l of (data || [])) s[String((l as any).code)] = Number((l as any).valeur);
  if (tenantId) {
    const { data: propres } = await supabase.from("paie_seuils_cabinet")
      .select("code, valeur").eq("tenant_id", tenantId);
    for (const l of (propres || [])) s[String((l as any).code)] = Number((l as any).valeur);
  }
  return s;
}

function controler(
  b: any, contrat: any, elements: any[], precedent: any | null, historique: any[], s: any,
  arrets?: any[]
): { couleur: string; alertes: any[] } {
  const alertes: any[] = [];
  const net = Number(b.net_a_payer || 0);
  const d: any = b.detail || {};

  // ═════════════════════════════════════════════════════════════════════
  // 🆕🚨 28/09 — LES ALERTES DU MOTEUR ALLUMENT LE FEU.
  // Le moteur ecrit deja, dans ses reserves, ce qui rend un bulletin faux
  // ou illegal : salaire sous le minimum conventionnel ou legal, stagiaire
  // ou contrat de professionnalisation sous le minimum, indemnite de
  // rupture insuffisante, heures complementaires au-dela du tiers, taux
  // AT absent, effectif inconnu, arrets illisibles… Elles commencent par
  // ⛔ ou 🚨. Jusqu ici le feu ne les lisait pas : un bulletin illegal
  // pouvait sortir au vert. Elles passent desormais en ROUGE.
  // La mutuelle absente (obligatoire dans toute entreprise) passe en
  // ORANGE : elle se regle sur l ecran DSN, pas sur le bulletin.
  // ═════════════════════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════════════════
  // 🆕🚨 28/09 — LE BROUILLON PERIME. Un element ajoute ou retire, des
  // conges, un arret ou un contrat modifies APRES la sortie du brouillon :
  // ses montants ne sont plus les bons. Sans ce controle, le client
  // confirmerait un recapitulatif faux (essai du 28/09 : la prime retiree
  // restait dans le net du brouillon). La route marque le brouillon a
  // chaque saisie ; le ressortir efface la marque.
  // ═════════════════════════════════════════════════════════════════════
  if (b.statut === "brouillon" && b.controle && b.controle.perime) {
    alertes.push({ code: "PERIME", niveau: "rouge",
      texte: "Le brouillon ne tient pas compte des dernières saisies (élément, congés, arrêt ou contrat "
        + "modifiés après lui) : ressortez-le avant de le soumettre ou d'envoyer le récapitulatif." });
  }

  const reserves: any[] = Array.isArray(d.reserves) ? d.reserves : [];
  for (const t of reserves) {
    const texte = String(t || "").trim();
    if (texte.indexOf("⛔") === 0 || texte.indexOf("🚨") === 0) {
      alertes.push({ code: "MOTEUR", niveau: "rouge",
        texte: "Le calcul signale : " + (texte.length > 400 ? texte.slice(0, 400) + "…" : texte) });
    } else if (texte.indexOf("⚠️") === 0 && /aucune mutuelle/i.test(texte)) {
      alertes.push({ code: "MUTUELLE", niveau: "orange",
        texte: "Aucune mutuelle ni prévoyance n'est renseignée pour la société : la complémentaire "
          + "santé est obligatoire. Elle se saisit sur l'écran DSN, bloc « Recouvrement URSSAF »." });
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // 🆕🚨 28/09 — L AVIS D ARRET DE TRAVAIL EST UNE PIECE EXIGEE.
  // Un arret fait retenir du salaire et verser un maintien ; un arret
  // saisi sans avis, c est de l argent paye sur une simple declaration.
  // ═════════════════════════════════════════════════════════════════════
  for (const a of (arrets || [])) {
    if (a.preuve_chemin) continue;
    const du = String(a.date_debut || "").slice(0, 10);
    const au = String(a.date_fin || "").slice(0, 10);
    alertes.push({ code: "AVIS_ARRET_MANQUANT", niveau: "rouge", evenement_id: a.id,
      texte: "Arrêt de travail du " + du.split("-").reverse().join("/")
        + (au ? " au " + au.split("-").reverse().join("/") : "")
        + " : l'avis d'arrêt n'est pas joint. Joignez-le depuis la liste des signalements." });
  }

  // La reference : le salaire du contrat, a defaut le brut du mois.
  const hebdo = Number(contrat && contrat.duree_hebdo) > 0 ? Number(contrat.duree_hebdo) : 35;
  let ref = Number(contrat && contrat.salaire_mensuel) || 0;
  if (!ref && Number(contrat && contrat.salaire_horaire) > 0) {
    ref = Number(contrat.salaire_horaire) * hebdo * 52 / 12;
  }
  if (!ref) ref = Number(b.brut || 0);

  if (net < 0) {
    alertes.push({ code: "NET_NEGATIF", niveau: "rouge",
      texte: "Le net à payer est négatif (" + euros(net) + ")." });
  }

  const explique = elements.length > 0
    || (Array.isArray(d.absences) && d.absences.length > 0)
    || Number(d.retenue_absences || 0) !== 0;

  if (!precedent) {
    alertes.push({ code: "PREMIER_BULLETIN", niveau: "info",
      texte: "Premier bulletin de ce contrat : aucune comparaison possible avec un mois précédent." });
  } else {
    const netAvant = Number(precedent.net_a_payer || 0);
    if (netAvant > 0) {
      const ecart = Math.abs(net - netAvant) / netAvant * 100;
      const texte = "Le net à payer passe de " + euros(netAvant) + " à " + euros(net)
        + " (" + (net >= netAvant ? "+" : "−") + Math.round(ecart) + " %) par rapport au bulletin "
        + String(precedent.numero || "précédent") + ".";
      if (ecart >= s.ECART_NET_ROUGE && !explique) {
        alertes.push({ code: "ECART_NET", niveau: "rouge",
          texte: texte + " Aucun élément du mois ni aucune absence ne l'explique." });
      } else if (ecart >= s.ECART_NET_ORANGE) {
        alertes.push({ code: "ECART_NET", niveau: "orange",
          texte: texte + (explique ? " Les éléments ou absences du mois l'expliquent peut-être : à vérifier." : "") });
      }
    }

    const tauxAvant = precedent.detail && precedent.detail.prelevement
      ? Number(precedent.detail.prelevement.taux) : NaN;
    const tauxMaintenant = d.prelevement ? Number(d.prelevement.taux) : NaN;
    if (isFinite(tauxAvant) && isFinite(tauxMaintenant) && Math.abs(tauxAvant - tauxMaintenant) > 0.001) {
      alertes.push({ code: "TAUX_PAS", niveau: "orange",
        texte: "Le taux de prélèvement à la source change : " + tauxAvant.toLocaleString("fr-FR")
          + " % le mois précédent, " + tauxMaintenant.toLocaleString("fr-FR") + " % ce mois-ci." });
    }
  }

  // ---- Heures supplementaires et complementaires ----
  let heures = 0;
  for (const e of elements) {
    if (String(e.type_element || "").indexOf("heures_") === 0 && String(e.type_element) !== "heures_nuit") heures += Number(e.quantite || 0);
  }
  if (heures >= s.HEURES_SUP_ROUGE) {
    alertes.push({ code: "HEURES", niveau: "rouge",
      texte: heures.toLocaleString("fr-FR") + " heures supplémentaires ou complémentaires dans le mois : "
        + "au-delà de " + s.HEURES_SUP_ROUGE + " h, une erreur de saisie est probable." });
  } else if (heures >= s.HEURES_SUP_ORANGE) {
    alertes.push({ code: "HEURES", niveau: "orange",
      texte: heures.toLocaleString("fr-FR") + " heures supplémentaires ou complémentaires dans le mois." });
  }

  // ---- Les elements, un par un ----
  const vus: any = {};
  for (const e of elements) {
    const type = String(e.type_element || "");
    const libelle = String(e.libelle || type);
    const m = Math.abs(Number(e.montant || 0));

    const cle = type + "|" + libelle.toLowerCase().trim() + "|" + r2(e.montant) + "|" + r2(e.quantite);
    if (vus[cle]) {
      if (vus[cle] === 1) {
        alertes.push({ code: "DOUBLON", niveau: "orange",
          texte: "« " + libelle + " » est saisi plusieurs fois avec le même montant : doublon ?" });
      }
      vus[cle]++;
    } else vus[cle] = 1;

    if (HORS_CONTROLE_MONTANT.indexOf(type) >= 0 || m === 0) continue;

    if (ref > 0 && m >= ref * s.ELEMENT_SALAIRE_ROUGE / 100) {
      alertes.push({ code: "MONTANT_ANORMAL", niveau: "rouge", element_id: e.id,
        texte: "« " + libelle + " » vaut " + euros(m) + ", soit plus de " + s.ELEMENT_SALAIRE_ROUGE
          + " % du salaire de référence (" + euros(ref) + ") : virgule oubliée ?" });
    } else if (ref > 0 && m >= ref * s.ELEMENT_SALAIRE_ORANGE / 100) {
      alertes.push({ code: "MONTANT_ELEVE", niveau: "orange", element_id: e.id,
        texte: "« " + libelle + " » vaut " + euros(m) + ", soit plus de " + s.ELEMENT_SALAIRE_ORANGE
          + " % du salaire de référence (" + euros(ref) + ")." });
    }

    // L habitude : la moyenne des mois precedents ou cette nature existe.
    const parMois: any = {};
    for (const h of historique) {
      if (String(h.type_element) !== type) continue;
      const k = String(h.periode).slice(0, 7);
      parMois[k] = (parMois[k] || 0) + Math.abs(Number(h.montant || 0));
    }
    const moisVus = Object.keys(parMois);
    if (moisVus.length > 0) {
      let somme = 0;
      for (const k of moisVus) somme += parMois[k];
      const moyenne = somme / moisVus.length;
      if (moyenne > 0 && m > moyenne * s.ELEMENT_HABITUDE_FOIS) {
        alertes.push({ code: "HORS_HABITUDE", niveau: "orange", element_id: e.id,
          texte: "« " + libelle + " » (" + euros(m) + ") dépasse " + s.ELEMENT_HABITUDE_FOIS
            + " fois sa moyenne des mois précédents (" + euros(moyenne) + ")." });
      }
    }

    if (m >= s.PREUVE_MONTANT && !e.preuve_chemin) {
      alertes.push({ code: "PREUVE_MANQUANTE", niveau: "rouge", element_id: e.id,
        texte: "« " + libelle + " » (" + euros(m) + ") exige une pièce justificative à partir de "
          + euros(s.PREUVE_MONTANT) + " : joignez-la depuis la liste des éléments." });
    }
  }

  const rouge = alertes.some(function (a) { return a.niveau === "rouge"; });
  const orange = alertes.some(function (a) { return a.niveau === "orange"; });
  return { couleur: rouge ? "rouge" : orange ? "orange" : "vert", alertes: alertes };
}

// Tout ce qu il faut pour controler le bulletin d un contrat sur un mois.
async function controleDuMois(contratId: string, periode: string, s?: any): Promise<any> {
  const bornes = { debut: periode, fin: dernierJour(periode) };
  const [bRes, ctRes, elRes, precRes, histRes, arRes] = await Promise.all([
    supabase.from("paie_bulletins")
      .select("id, numero, statut, brut, net_a_payer, cout_employeur, detail, validation, prepare_par, "
        + "soumis_par, soumis_le, valide_par, valide_le, renvoi_motif, justification, levee_motif, levee_par, "
        + "levee_le, type_bulletin, rectifie_id, controle")
      .eq("contrat_id", contratId).gte("periode", bornes.debut).lte("periode", bornes.fin)
      .in("statut", ["brouillon", "emis"]),
    supabase.from("paie_contrats").select("id, tenant_id, salaire_mensuel, salaire_horaire, duree_hebdo, type_contrat")
      .eq("id", contratId).maybeSingle(),
    supabase.from("paie_elements").select("*")
      .eq("contrat_id", contratId).gte("periode", bornes.debut).lte("periode", bornes.fin),
    supabase.from("paie_bulletins").select("numero, net_a_payer, detail, periode")
      .eq("contrat_id", contratId).eq("statut", "emis").lt("periode", bornes.debut)
      .order("periode", { ascending: false }).limit(1),
    supabase.from("paie_elements").select("type_element, montant, periode")
      .eq("contrat_id", contratId).gte("periode", moisDecale(periode, -3)).lt("periode", bornes.debut),
    // 🆕 28/09 — les arrets qui touchent le mois (pour exiger l avis).
    supabase.from("paie_evenements").select("id, date_debut, date_fin, annule_le, preuve_chemin")
      .eq("contrat_id", contratId).eq("type_evenement", "arret").lte("date_debut", bornes.fin),
  ]);

  const liste = (bRes.data || []) as any[];
  const bulletin = liste.filter(function (x) { return x.statut === "brouillon"; })[0]
    || liste.filter(function (x) { return x.statut === "emis"; })[0] || null;
  if (!bulletin) return { bulletin: null, controle: null };

  const precedent = ((precRes.data || []) as any[])[0] || null;
  const arrets = ((arRes.data || []) as any[]).filter(function (a) {
    if (a.annule_le) return false;
    const fin = String(a.date_fin || "").slice(0, 10);
    return !fin || fin >= bornes.debut;
  });
  const controle = controler(bulletin, ctRes.data || {}, (elRes.data || []) as any[],
    precedent, (histRes.data || []) as any[],
    s || await seuils(ctRes.data ? String((ctRes.data as any).tenant_id || "") || null : null), arrets);
  return { bulletin: bulletin, controle: controle, elements: elRes.data || [] };
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LE RECAPITULATIF CONFIRME PAR LE CLIENT
//
// Avant d emettre, l employeur recoit la liste de ses salaries, de leurs
// elements du mois et de leurs nets, et confirme par un lien. Sans
// confirmation, pas d emission — sauf levee motivee par quelqu un qui a la
// carte blanche, inscrite au journal.
// 🚨 L EMPREINTE : ce que le client a confirme est photographie. Si un
// montant change ensuite (element ajoute, recalcul), l empreinte ne
// correspond plus et il faut renvoyer le recapitulatif. Sans cela, le
// client confirmerait une paie et on en emettrait une autre.
// ═══════════════════════════════════════════════════════════════════════
async function contenuRecap(societeId: string, periode: string): Promise<any> {
  const fin = dernierJour(periode);
  const [socRes, bRes, elRes, ctRes, arRes, cgRes] = await Promise.all([
    supabase.from("compta_societes").select("id, tenant_id, raison_sociale, contact_email, email_contact")
      .eq("id", societeId).maybeSingle(),
    supabase.from("paie_bulletins")
      .select("id, numero, statut, brut, net_a_payer, contrat_id, controle, stage:detail->stage, "
        + "paie_contrats(intitule_poste, paie_salaries(nom, prenom))")
      .eq("societe_id", societeId).gte("periode", periode).lte("periode", fin)
      .in("statut", ["brouillon", "emis"]),
    supabase.from("paie_elements").select("contrat_id, libelle, type_element, quantite, montant")
      .eq("societe_id", societeId).gte("periode", periode).lte("periode", fin),
    supabase.from("paie_contrats")
      .select("id, date_debut, date_fin, rompu_le, intitule_poste, paie_salaries(nom, prenom)")
      .eq("societe_id", societeId).eq("statut", "actif"),
    // 🆕 28/09 (essai B) — les arrets et les conges du mois : le client doit
    // les voir. La colonne annoncait « absences » et n en montrait aucune.
    supabase.from("paie_evenements").select("contrat_id, date_debut, date_fin, motif, annule_le")
      .eq("societe_id", societeId).eq("type_evenement", "arret").lte("date_debut", fin),
    supabase.from("paie_conges").select("contrat_id, jours")
      .eq("societe_id", societeId).eq("type_mouvement", "prise").gte("periode", periode).lte("periode", fin),
  ]);

  const NATURES: any = { "01": "Arrêt maladie", "02": "Congé maternité", "03": "Congé paternité",
    "04": "Accident de trajet", "05": "Maladie professionnelle", "06": "Accident du travail",
    "15": "Temps partiel thérapeutique", "16": "Temps partiel thérapeutique",
    "17": "Temps partiel thérapeutique", "18": "Temps partiel thérapeutique" };
  const jm = function (d: string): string { return d ? d.slice(8, 10) + "/" + d.slice(5, 7) : ""; };
  const absencesDe = function (contratId: string): string[] {
    const l: string[] = [];
    for (const a of ((arRes.data || []) as any[])) {
      if (a.contrat_id !== contratId || a.annule_le) continue;
      const du = String(a.date_debut || "").slice(0, 10);
      const au = String(a.date_fin || "").slice(0, 10);
      if (au && au < periode) continue;
      const code = String(a.motif || "").slice(0, 2);
      const nature = NATURES[code] || (a.motif && !/^\d+$/.test(String(a.motif)) ? String(a.motif) : "Arrêt de travail");
      l.push(nature + " du " + jm(du) + (au ? " au " + jm(au) : ", fin non connue"));
    }
    let jours = 0;
    for (const cg of ((cgRes.data || []) as any[])) {
      if (cg.contrat_id === contratId) jours += Math.abs(Number(cg.jours || 0));
    }
    if (jours > 0) l.push("Congés payés : " + jours.toLocaleString("fr-FR") + (jours > 1 ? " jours" : " jour"));
    return l;
  };

  const soc: any = socRes.data || {};
  const parContrat: any = {};
  for (const b of ((bRes.data || []) as any[])) {
    const deja = parContrat[b.contrat_id];
    if (!deja || (deja.statut === "emis" && b.statut === "brouillon")) parContrat[b.contrat_id] = b;
  }

  const nomDe = function (ct: any): string {
    const s = ct && ct.paie_salaries ? ct.paie_salaries : {};
    return (String(s.prenom || "") + " " + String(s.nom || "").toUpperCase()).trim() || "Salarié";
  };

  const lignes: any[] = [];
  for (const id of Object.keys(parContrat)) {
    const b = parContrat[id];
    const ct: any = b.paie_contrats || {};
    lignes.push({
      contrat_id: id,
      salarie: nomDe(ct),
      poste: String(ct.intitule_poste || ""),
      bulletin: String(b.numero || ""),
      brut: r2(b.brut),
      net: r2(b.net_a_payer),
      // 🆕 28/09 (essai B) — une stagiaire affichait « Brut 207 € » (la seule
      // part soumise) pour une gratification de 900 € : le client aurait cru
      // a une erreur. On montre la gratification.
      gratification: b.stage && Number(b.stage.gratification) > 0 ? r2(b.stage.gratification) : null,
      absences: absencesDe(id),
      elements: ((elRes.data || []) as any[])
        .filter(function (e) { return e.contrat_id === id; })
        .map(function (e) {
          return { libelle: String(e.libelle || e.type_element), quantite: e.quantite === null ? null : Number(e.quantite), montant: r2(e.montant) };
        }),
    });
  }
  lignes.sort(function (a, b) { return a.salarie.localeCompare(b.salarie, "fr"); });

  // Les salaries en poste ce mois-ci qui n ont pas encore de bulletin.
  const manquants: string[] = [];
  for (const ct of ((ctRes.data || []) as any[])) {
    if (parContrat[ct.id]) continue;
    const debut = String(ct.date_debut || "").slice(0, 10);
    const finCt = String(ct.rompu_le || ct.date_fin || "").slice(0, 10);
    if (debut && debut > fin) continue;
    if (finCt && finCt < periode) continue;
    manquants.push(nomDe(ct));
  }

  // 🆕 28/09 — les brouillons perimes : leurs montants sont faux.
  const perimes: string[] = [];
  for (const id of Object.keys(parContrat)) {
    const b = parContrat[id];
    if (b.statut === "brouillon" && b.controle && b.controle.perime) perimes.push(nomDe(b.paie_contrats || {}));
  }

  const totaux = {
    brut: r2(lignes.reduce(function (a, l) { return a + l.brut; }, 0)),
    net: r2(lignes.reduce(function (a, l) { return a + l.net; }, 0)),
  };

  const empreinte = crypto.createHash("sha256").update(JSON.stringify(lignes.map(function (l) {
    return [l.contrat_id, l.brut, l.net, l.gratification, l.absences,
      l.elements.map(function (e: any) { return [e.libelle, e.quantite, e.montant]; })];
  }))).digest("hex");

  return {
    societe: { id: societeId, tenant_id: soc.tenant_id || null, nom: String(soc.raison_sociale || ""),
      email: soc.contact_email || soc.email_contact || null },
    contenu: { societe: String(soc.raison_sociale || ""), periode: periode, lignes: lignes, totaux: totaux },
    empreinte: empreinte,
    manquants: manquants,
    perimes: perimes,
  };
}

async function etatRecap(societeId: string, periode: string, empreinteActuelle: string | null): Promise<any> {
  const { data } = await supabase.from("paie_recaps")
    .select("id, statut, destinataire, envoye_par, remarque, repondu_le, cree_le, empreinte")
    .eq("societe_id", societeId).eq("periode", periode)
    .order("cree_le", { ascending: false }).limit(1);
  const r: any = ((data || []) as any[])[0];
  if (!r) return null;
  return {
    statut: r.statut, destinataire: r.destinataire, envoye_par: r.envoye_par,
    remarque: r.remarque, repondu_le: r.repondu_le, envoye_le: r.cree_le,
    a_jour: empreinteActuelle ? r.empreinte === empreinteActuelle : null,
  };
}

const MARQUES_COURRIEL: Record<string, { site: string; nom: string; expediteur: string }> = {
  "mrcomptable.fr": { site: "https://mrcomptable.fr", nom: "Mr. Comptable", expediteur: "Mr. Comptable <contact@mrcomptable.fr>" },
  "www.mrcomptable.fr": { site: "https://mrcomptable.fr", nom: "Mr. Comptable", expediteur: "Mr. Comptable <contact@mrcomptable.fr>" },
  "academiapro.fr": { site: "https://academiapro.fr", nom: "AcadéMIA Pro", expediteur: "AcadéMIA Pro <contact@academiapro.fr>" },
};

function marqueDuCourriel(hote: string) {
  const h = String(hote || "").split(":")[0].toLowerCase();
  return MARQUES_COURRIEL[h] || MARQUES_COURRIEL["academiapro.fr"];
}

function html(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// 🆕 02/10 — LES ACCORDS ET LA VIRGULE DANS LES MESSAGES. « 1 bulletin
// émis », « 2 bulletins émis » ; « 2,50 jours », pas « 2.50 jour(s) ».
function nbAcc(n: number, singulier: string, pluriel: string): string {
  return String(n).replace(".", ",") + " " + (Math.abs(n) > 1 ? pluriel : singulier);
}
function fr2(v: number): string {
  return Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function joursFr(v: number): string {
  return fr2(v) + " " + (Math.abs(v) > 1 ? "jours" : "jour");
}

function moisEnClair(periode: string): string {
  const noms = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
    "septembre", "octobre", "novembre", "décembre"];
  return noms[Number(periode.slice(5, 7)) - 1] + " " + periode.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — PREVENIR. Un bulletin qui attend une validation, personne ne
// le sait tant qu il n ouvre pas l ecran ; un bulletin renvoye non plus.
// Un courriel part donc a chaque soumission (aux personnes qui peuvent
// valider) et a chaque renvoi (a celui qui l a prepare). Un courriel qui ne
// part pas ne bloque jamais le geste : il est signale dans la reponse.
// ═══════════════════════════════════════════════════════════════════════
async function courriel(ctx: Ctx, a: string[], sujet: string, corps: string): Promise<string | null> {
  const cle = process.env.RESEND_API_KEY || "";
  const dest = a.filter(function (x) { return String(x || "").indexOf("@") > 0; });
  if (!cle || dest.length === 0) return null;
  try {
    const marque = marqueDuCourriel(ctx.hote);
    const resend = new Resend(cle);
    const envoi: any = await resend.emails.send({
      from: marque.expediteur, to: dest, subject: sujet,
      html: '<div style="font-family:Georgia,serif;color:#222;max-width:620px;margin:0 auto;padding:20px">'
        + corps
        + '<p style="text-align:center;margin:26px 0"><a href="' + marque.site + '/admin/compliance/bulletins-paie" '
        + 'style="background:#c8a96e;color:#050508;padding:12px 24px;border-radius:8px;text-decoration:none;'
        + 'font-weight:bold">Ouvrir la paie</a></p></div>',
    } as any);
    if (envoi && envoi.error) return String(envoi.error.message || envoi.error);
    return null;
  } catch (e: any) {
    return String(e && e.message ? e.message : e);
  }
}

// Ceux qui peuvent valider un bulletin de cette societe : les associes
// actifs, et les collaborateurs qui ont le droit d emettre ET la carte
// blanche sur ce dossier. Celui qui soumet n est pas prevenu de son geste.
async function validateurs(societeId: string, sauf: string): Promise<string[]> {
  const { data: soc } = await supabase.from("compta_societes").select("tenant_id").eq("id", societeId).maybeSingle();
  if (!soc) return [];
  const { data } = await supabase.from("compta_collaborateurs")
    .select("email, role, actif, dossiers, peut_paie_emettre, paie_carte_blanche")
    .eq("tenant_id", (soc as any).tenant_id).eq("actif", true).limit(200);
  const l: string[] = [];
  for (const c of ((data || []) as any[])) {
    const email = String(c.email || "").toLowerCase();
    if (!email || email === String(sauf || "").toLowerCase()) continue;
    const confies: string[] = c.dossiers || [];
    if (confies.length > 0 && confies.indexOf(societeId) < 0) continue;
    const ok = c.role === "associe"
      || (c.peut_paie_emettre === true && (c.paie_carte_blanche || []).indexOf(societeId) >= 0);
    if (ok && l.indexOf(email) < 0) l.push(email);
  }
  return l;
}

// 🆕 28/09 — la piece d un element ou l avis d un arret, au coffre.
async function deposerPiece(
  c: any, dossier: string
): Promise<{ erreur: string | null; chemin: string | null; status: number }> {
  const type = String(c.type || "").toLowerCase();
  const TYPES: any = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
  if (!TYPES[type]) return { erreur: "format non accepté : un PDF, une photo JPEG ou PNG.", chemin: null, status: 400 };
  const brut = String(c.contenu || "").replace(/^data:[^,]*,/, "");
  const octets = Buffer.from(brut, "base64");
  if (octets.length === 0) return { erreur: "fichier vide.", chemin: null, status: 400 };
  if (octets.length > 3 * 1024 * 1024) {
    return { erreur: "fichier trop lourd (" + (Math.round(octets.length / 104857.6) / 10)
      + " Mo) : 3 Mo au plus. Photographiez la pièce plutôt que de la scanner en haute définition.", chemin: null, status: 400 };
  }
  const nom = String(c.nom || "piece").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80) || "piece";
  const chemin = "paie-preuves/" + dossier + "/"
    + Date.now() + "-" + nom + (nom.toLowerCase().endsWith("." + TYPES[type]) ? "" : "." + TYPES[type]);
  const { error } = await supabase.storage.from("documents-signes")
    .upload(chemin, octets, { contentType: type, upsert: false });
  if (error) return { erreur: "dépôt impossible : " + error.message, chemin: null, status: 500 };
  return { erreur: null, chemin: chemin, status: 200 };
}

// Le verrou de l emission, pose APRES le recalcul (les montants sont frais).
async function verrouEmission(b: any, justification: string | null, ctx: Ctx): Promise<NextResponse | null> {
  const periode = moisDe(b.periode) || String(b.periode).slice(0, 10);
  // Le bulletin vient d etre recalcule : ses montants sont a jour, la
  // marque de peremption tombe (28/09).
  await supabase.from("paie_bulletins").update(justification
    ? { justification: justification, controle: null } : { controle: null }).eq("id", b.id);
  const r = await controleDuMois(String(b.contrat_id), periode);
  if (!r.bulletin || !r.controle) {
    return NextResponse.json({ erreur: "bulletin introuvable après recalcul. ⛔ Rien n'a été émis." }, { status: 404 });
  }
  const ctl = r.controle;
  await supabase.from("paie_bulletins").update({ controle: ctl }).eq("id", b.id);

  const rouges = ctl.alertes.filter(function (a: any) { return a.niveau === "rouge"; });
  if (rouges.length > 0 && !r.bulletin.levee_motif) {
    return NextResponse.json({
      erreur: "⛔ Émission bloquée — point rouge : "
        + rouges.map(function (a: any) { return a.texte; }).join(" · ")
        + " Corrigez, ou levez le point avec un motif (réservé à qui a la carte blanche). Rien n'a été émis.",
      controle: ctl,
    }, { status: 409 });
  }
  const oranges = ctl.alertes.filter(function (a: any) { return a.niveau === "orange"; });
  if (oranges.length > 0 && !(r.bulletin.justification || justification)) {
    return NextResponse.json({
      erreur: "Une justification est demandée avant d'émettre : "
        + oranges.map(function (a: any) { return a.texte; }).join(" · ")
        + " Écrivez-la dans le champ prévu. Rien n'a été émis.",
      controle: ctl,
    }, { status: 409 });
  }

  const rec = await contenuRecap(String(b.societe_id), periode);
  const etat = await etatRecap(String(b.societe_id), periode, rec.empreinte);
  if (!etat) {
    return NextResponse.json({ erreur: "Le récapitulatif de " + moisEnClair(periode)
      + " n'a pas été envoyé au client. Envoyez-le depuis « Validation du mois » : sans sa "
      + "confirmation, pas d'émission. Rien n'a été émis." }, { status: 409 });
  }
  if (etat.statut === "leve") return null;
  if (etat.statut === "envoye") {
    return NextResponse.json({ erreur: "Le client n'a pas encore confirmé le récapitulatif envoyé à "
      + String(etat.destinataire || "") + ". Rien n'a été émis." }, { status: 409 });
  }
  if (etat.statut === "conteste") {
    return NextResponse.json({ erreur: "Le client a signalé une erreur dans le récapitulatif : « "
      + String(etat.remarque || "sans précision") + " ». Corrigez, puis renvoyez-le. Rien n'a été émis." }, { status: 409 });
  }
  if (etat.statut === "confirme" && !etat.a_jour) {
    return NextResponse.json({ erreur: "La paie a changé depuis la confirmation du client (un montant ou un "
      + "élément a bougé) : renvoyez-lui le récapitulatif. Rien n'a été émis." }, { status: 409 });
  }
  if (etat.statut !== "confirme") {
    return NextResponse.json({ erreur: "Le récapitulatif du mois n'est pas confirmé. Rien n'a été émis." }, { status: 409 });
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// LES ACTIONS DU 28/09 : relais, validation, pieces, recapitulatif, mesure.
// Elles rendent null quand l action n est pas la leur.
// ═══════════════════════════════════════════════════════════════════════
async function actionsDuControle(req: NextRequest, c: any, action: string, ctx: Ctx): Promise<NextResponse | null> {

  // ---- LE CALCUL (relais) ----
  if (action === "calculer") {
    const r = await relais(ctx, "/api/paie/calculer?contrat=" + encodeURIComponent(String(c.contrat_id || ""))
      + "&periode=" + encodeURIComponent(String(c.periode || "")) + "&secret=" + cleEncodee(), { method: "GET" });
    return reponseDuRelais(r);
  }

  // ---- LE BULLETIN EN BROUILLON (relais) ----
  // 🚨 UN BROUILLON RESSORTI REPART DE ZERO : s il avait ete soumis, justifie
  // ou leve, tout cela portait sur les anciens montants. Il faudra le
  // resoumettre — c est voulu.
  if (action === "sortir_bulletin") {
    const contratId = String(c.contrat_id || "");
    const periode = moisDe(c.periode);
    if (!periode) return NextResponse.json({ erreur: "période illisible" }, { status: 400 });
    const r = await relais(ctx, "/api/paie/bulletin?secret=" + cleEncodee(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrat_id: contratId, periode: String(c.periode || "").slice(0, 10) }),
    });
    if (r.status < 400 && r.json && r.json.success) {
      await supabase.from("paie_bulletins").update({
        prepare_par: ctx.email, validation: null, soumis_par: null, soumis_le: null,
        valide_par: null, valide_le: null, renvoi_motif: null, controle: null,
        justification: null, levee_motif: null, levee_par: null, levee_le: null,
      }).eq("contrat_id", contratId).gte("periode", periode).lte("periode", dernierJour(periode))
        .eq("statut", "brouillon");
    }
    return reponseDuRelais(r);
  }

  // ---- LE SIGNALEMENT DSN (relais) ----
  if (action === "signalement") {
    const r = await relais(ctx, "/api/dsn/evenement", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cle: process.env.CRON_SECRET || "", evenement_id: c.evenement_id, reprise: c.reprise === true }),
    });
    return reponseDuRelais(r);
  }

  // ---- 🆕 06/10 : LA DECLARATION PREALABLE A L EMBAUCHE ----
  // `embauche_etat` relit ce qui a deja ete genere pour ce contrat ;
  // `embauche` genere le fichier (relais vers /api/dsn/embauche) ;
  // `embauche_deposee` note que le fichier a ete depose a la main.
  if (action === "embauche_etat") {
    const contratId = String(c.contrat_id || "").trim();
    if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
    const { data: e, error: eE } = await supabase
      .from("paie_embauches")
      .select("id, date_embauche, heure, essai_jours, numero_ordre, nom_fichier, nb_lignes, anomalies, statut, genere_par, deposee_le, maj_le, fichier")
      .eq("contrat_id", contratId)
      .maybeSingle();
    if (eE) {
      return NextResponse.json({ success: true, embauche: null,
        indisponible: "La déclaration d'embauche n'est pas encore installée en base (" + eE.message + ")." });
    }
    return NextResponse.json({ success: true, embauche: e || null });
  }
  if (action === "embauche") {
    const r = await relais(ctx, "/api/dsn/embauche", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cle: process.env.CRON_SECRET || "", contrat_id: c.contrat_id,
        heure: c.heure, essai_jours: c.essai_jours, par: ctx.email,
      }),
    });
    return reponseDuRelais(r);
  }
  // 🆕 06/10 — LE DEPOT PAR LE LOGICIEL, avec les acces net-entreprises de
  // la societe (les memes que pour la DSN du mois). Un fichier reel exige
  // une confirmation expresse.
  if (action === "embauche_deposer") {
    const contratId = String(c.contrat_id || "").trim();
    if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
    const r = await relais(ctx, "/api/dsn/deposer?action=deposer&v=" + Date.now()
      + "&embauche=" + encodeURIComponent(contratId)
      + (c.confirmer_reel === true ? "&confirmer=reel" : "") + "&secret=" + cleEncodee(), { method: "GET" });
    return reponseDuRelais(r);
  }
  if (action === "embauche_deposee") {
    const contratId = String(c.contrat_id || "").trim();
    if (!contratId) return NextResponse.json({ erreur: "contrat manquant" }, { status: 400 });
    const { data: e } = await supabase.from("paie_embauches")
      .select("id, anomalies, statut").eq("contrat_id", contratId).maybeSingle();
    if (!e) return NextResponse.json({ erreur: "aucune déclaration d'embauche générée pour ce contrat." }, { status: 400 });
    const nbAno = Array.isArray((e as any).anomalies) ? (e as any).anomalies.length : 0;
    if (nbAno > 0) {
      return NextResponse.json({ erreur: "le fichier porte " + nbAno + " anomalie(s) : corrigez-les et "
        + "régénérez la déclaration avant de la noter déposée." }, { status: 409 });
    }
    const annuler = c.annuler === true;
    const { error: eU } = await supabase.from("paie_embauches").update({
      statut: annuler ? "genere" : "deposee",
      deposee_le: annuler ? null : new Date().toISOString(),
      maj_le: new Date().toISOString(),
    }).eq("id", (e as any).id);
    if (eU) return NextResponse.json({ erreur: eU.message }, { status: 500 });
    return NextResponse.json({ success: true,
      message: annuler ? "La déclaration n'est plus notée déposée." : "Déclaration d'embauche notée déposée." });
  }

  // ---- LES DOCUMENTS DE FIN DE CONTRAT (relais) ----
  if (action === "fin_contrat") {
    const r = await relais(ctx, "/api/paie/fin-contrat?secret=" + cleEncodee(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrat_id: c.contrat_id }),
    });
    return reponseDuRelais(r);
  }

  // ---- LE CONTROLE D UN CONTRAT ----
  if (action === "controler") {
    const periode = moisDe(c.periode);
    if (!periode) return NextResponse.json({ erreur: "période illisible" }, { status: 400 });
    const r = await controleDuMois(String(c.contrat_id), periode);
    return NextResponse.json({ success: true, bulletin: r.bulletin ? {
      id: r.bulletin.id, numero: r.bulletin.numero, statut: r.bulletin.statut,
      validation: r.bulletin.validation, justification: r.bulletin.justification,
      levee_motif: r.bulletin.levee_motif, renvoi_motif: r.bulletin.renvoi_motif,
    } : null, controle: r.controle });
  }

  // ═════════════════════════════════════════════════════════════════════
  // ---- LA VALIDATION DU MOIS : tous les salaries d une societe ----
  // ═════════════════════════════════════════════════════════════════════
  if (action === "tableau_mois") {
    const societeId = String(c.societe_id || "");
    const periode = moisDe(c.periode);
    if (!periode) return NextResponse.json({ erreur: "période illisible" }, { status: 400 });
    const fin = dernierJour(periode);

    const { data: contrats } = await supabase.from("paie_contrats")
      .select("id, statut, date_debut, date_fin, rompu_le, intitule_poste, paie_salaries(nom, prenom)")
      .eq("societe_id", societeId);

    const enPoste = ((contrats || []) as any[]).filter(function (ct) {
      const debut = String(ct.date_debut || "").slice(0, 10);
      const finCt = String(ct.rompu_le || ct.date_fin || "").slice(0, 10);
      if (debut && debut > fin) return false;
      if (finCt && finCt < periode) return false;
      return true;
    });

    const { data: socT } = await supabase.from("compta_societes").select("tenant_id").eq("id", societeId).maybeSingle();
    const s = await seuils(socT ? String((socT as any).tenant_id || "") || null : null);
    const lignes = await Promise.all(enPoste.map(async function (ct: any) {
      const r = await controleDuMois(String(ct.id), periode, s);
      const sal = ct.paie_salaries || {};
      return {
        contrat_id: ct.id,
        salarie: (String(sal.prenom || "") + " " + String(sal.nom || "").toUpperCase()).trim(),
        poste: String(ct.intitule_poste || ""),
        bulletin: r.bulletin ? {
          id: r.bulletin.id, numero: r.bulletin.numero, statut: r.bulletin.statut,
          brut: r.bulletin.brut, net_a_payer: r.bulletin.net_a_payer,
          validation: r.bulletin.validation, prepare_par: r.bulletin.prepare_par,
          soumis_par: r.bulletin.soumis_par, soumis_le: r.bulletin.soumis_le,
          valide_par: r.bulletin.valide_par, renvoi_motif: r.bulletin.renvoi_motif,
          justification: r.bulletin.justification, levee_motif: r.bulletin.levee_motif,
          levee_par: r.bulletin.levee_par, type_bulletin: r.bulletin.type_bulletin,
        } : null,
        controle: r.controle,
      };
    }));
    lignes.sort(function (a: any, b: any) { return a.salarie.localeCompare(b.salarie, "fr"); });

    const rec = await contenuRecap(societeId, periode);
    const recap = await etatRecap(societeId, periode, rec.empreinte);
    // 🆕 29/09 — L ADRESSE PROPOSEE EST LA DERNIERE REELLEMENT UTILISEE POUR UN
    // ENVOI. « Lever l attente » enregistre une ligne de recapitulatif SANS
    // adresse ; devenue la plus recente, elle faisait retomber le champ sur
    // l adresse de la fiche. On saute les lignes sans destinataire.
    const { data: envoisAvecAdresse } = await supabase.from("paie_recaps")
      .select("destinataire")
      .eq("societe_id", societeId).eq("periode", periode)
      .not("destinataire", "is", null)
      .order("cree_le", { ascending: false }).limit(1);
    const derniereAdresse = ((envoisAvecAdresse || []) as any[]).length > 0
      ? String((envoisAvecAdresse as any[])[0].destinataire || "") : "";
    const profil = ctx.cleServeur ? null : await profilPaie([societeId]);

    return NextResponse.json({
      success: true, periode: periode, lignes: lignes,
      recap: recap, recap_manquants: rec.manquants, recap_perimes: rec.perimes,
      // 🆕 28/09 (essai B) — la derniere adresse utilisee d abord : le champ
      // revenait a l adresse de la societe, et un renvoi pouvait partir
      // ailleurs sans qu on le voie.
      destinataire_propose: derniereAdresse || rec.societe.email,
      droits: profil ? profil.dossiers[societeId] : { voir: true, contrats: true, preparer: true, emettre: true, deposer: true, carte_blanche: true },
    });
  }

  // ---- SOUMETTRE A VALIDATION ----
  // Le bulletin est recalcule (brouillon et PDF a jour), controle, puis mis
  // en attente de validation. La personne qui a la carte blanche l emettra
  // ou le renverra avec un motif.
  if (action === "soumettre") {
    const contratId = String(c.contrat_id || "");
    const periode = moisDe(c.periode);
    if (!periode) return NextResponse.json({ erreur: "période illisible" }, { status: 400 });

    const r0 = await relais(ctx, "/api/paie/bulletin?secret=" + cleEncodee(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrat_id: contratId, periode: String(c.periode || "").slice(0, 10) }),
    });
    if (r0.status >= 400 || !r0.json || !r0.json.success) {
      return NextResponse.json({ erreur: "le bulletin n'a pas pu être recalculé : "
        + ((r0.json && r0.json.erreur) || "erreur inconnue") + ". Rien n'a été soumis." }, { status: 400 });
    }
    // Recalcule a l instant : la marque de peremption tombe (28/09).
    await supabase.from("paie_bulletins").update({ controle: null })
      .eq("contrat_id", contratId).gte("periode", periode).lte("periode", dernierJour(periode))
      .eq("statut", "brouillon");

    const r = await controleDuMois(contratId, periode);
    if (!r.bulletin || r.bulletin.statut !== "brouillon") {
      return NextResponse.json({ erreur: "aucun brouillon à soumettre pour ce mois." }, { status: 404 });
    }
    const just = propre(c.justification);
    const oranges = r.controle.alertes.filter(function (a: any) { return a.niveau === "orange"; });
    if (oranges.length > 0 && !just && !r.bulletin.justification) {
      return NextResponse.json({ erreur: "Une justification est demandée pour les points orange : "
        + oranges.map(function (a: any) { return a.texte; }).join(" · ") + " Rien n'a été soumis.",
        controle: r.controle }, { status: 409 });
    }

    const { error } = await supabase.from("paie_bulletins").update({
      validation: "a_valider", soumis_par: ctx.email, soumis_le: new Date().toISOString(),
      prepare_par: r.bulletin.prepare_par || ctx.email, renvoi_motif: null,
      controle: r.controle, justification: just || r.bulletin.justification || null,
    }).eq("id", r.bulletin.id).eq("statut", "brouillon");
    if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

    const { data: ct } = await supabase.from("paie_contrats")
      .select("societe_id, paie_salaries(nom, prenom)")
      .eq("id", contratId).maybeSingle();
    const societeId = ct ? String((ct as any).societe_id) : null;
    const { data: socN } = societeId
      ? await supabase.from("compta_societes").select("raison_sociale").eq("id", societeId).maybeSingle()
      : { data: null } as any;
    await journal(societeId, ctx, "paie.soumettre", "bulletin",
      String(r.bulletin.id), { numero: r.bulletin.numero, couleur: r.controle.couleur, justification: just });

    // 🆕 28/09 — les personnes qui peuvent valider sont prevenues.
    let avis = "";
    if (societeId) {
      const qui = await validateurs(societeId, ctx.email);
      if (qui.length === 0) {
        avis = " Personne d'autre ne peut valider ce dossier : aucun courriel n'est parti.";
      } else {
        const sal: any = (ct as any).paie_salaries || {};
        const nomSal = (String(sal.prenom || "") + " " + String(sal.nom || "").toUpperCase()).trim();
        const nomSoc = String((socN as any) ? (socN as any).raison_sociale || "" : "");
        const alertes = r.controle.alertes.filter(function (a: any) { return a.niveau !== "info"; });
        const echec = await courriel(ctx, qui,
          "Bulletin à valider — " + nomSal + " — " + moisEnClair(periode) + " — " + nomSoc,
          "<h2>Un bulletin attend votre validation</h2>"
          + "<p>" + html(ctx.email) + " a soumis le bulletin " + html(r.bulletin.numero) + " de <b>" + html(nomSal)
          + "</b> (" + html(nomSoc) + ", " + html(moisEnClair(periode)) + ").</p>"
          // 🆕 07/10 — un rouge deja leve se dit « leve », pas « rouge » tout court.
          + "<p>Feu : <b>" + html(r.controle.couleur) + "</b>"
          + (r.controle.couleur === "rouge" && r.bulletin.levee_motif ? " (point levé avec un motif)" : "") + (just ? " · justification : « " + html(just) + " »" : "") + "</p>"
          + (alertes.length > 0 ? "<ul>" + alertes.map(function (a: any) { return "<li>" + html(a.texte) + "</li>"; }).join("") + "</ul>" : ""));
        avis = echec ? " ⚠️ Le courriel aux validateurs n'est pas parti : " + echec
          : " " + nbAcc(qui.length, "personne prévenue", "personnes prévenues") + " par courriel.";
      }
    }

    return NextResponse.json({ success: true, controle: r.controle,
      message: "Bulletin " + r.bulletin.numero + " soumis à validation"
        + (r.controle.couleur === "rouge"
          ? (r.bulletin.levee_motif ? " — son point rouge est levé avec un motif."
            : " — avec un point rouge : il ne pourra être émis qu'une fois corrigé ou levé.")
          : ".")
        + avis });
  }

  // ---- JUSTIFIER LES POINTS ORANGE ----
  if (action === "justifier") {
    const texte = propre(c.texte);
    if (!texte || texte.length < 5) {
      return NextResponse.json({ erreur: "écrivez une justification d'au moins quelques mots." }, { status: 400 });
    }
    const { data: b } = await supabase.from("paie_bulletins").select("statut").eq("id", String(c.id)).maybeSingle();
    if (!b || (b as any).statut !== "brouillon") {
      return NextResponse.json({ erreur: "seul un bulletin en brouillon se justifie." }, { status: 400 });
    }
    const { error } = await supabase.from("paie_bulletins").update({ justification: texte.slice(0, 1000) }).eq("id", String(c.id));
    if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Justification enregistrée." });
  }

  // ---- RENVOYER UN BULLETIN A CELUI QUI L A PREPARE ----
  if (action === "renvoyer" || action === "lever") {
    const motif = propre(c.motif);
    if (!motif || motif.length < 10) {
      return NextResponse.json({ erreur: action === "renvoyer"
        ? "dites en une phrase ce qui doit être corrigé (au moins 10 caractères)."
        : "une levée se motive : au moins 10 caractères, ils sont inscrits au journal." }, { status: 400 });
    }
    const { data: b } = await supabase.from("paie_bulletins")
      .select("id, numero, statut, societe_id, prepare_par, soumis_par, controle, justification").eq("id", String(c.id)).maybeSingle();
    if (!b || (b as any).statut !== "brouillon") {
      return NextResponse.json({ erreur: "seul un bulletin en brouillon peut être " + (action === "renvoyer" ? "renvoyé." : "levé.") }, { status: 400 });
    }
    const bb: any = b;
    if (!ctx.cleServeur && !(await carteBlanche(String(bb.societe_id)))) {
      return NextResponse.json({ erreur: "réservé à qui a la carte blanche sur ce dossier." }, { status: 403 });
    }
    const maj: any = action === "renvoyer"
      ? { validation: "renvoye", renvoi_motif: motif.slice(0, 1000) }
      : { levee_motif: motif.slice(0, 1000), levee_par: ctx.email, levee_le: new Date().toISOString() };
    const { error } = await supabase.from("paie_bulletins").update(maj).eq("id", bb.id).eq("statut", "brouillon");
    if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

    await journal(String(bb.societe_id), ctx, action === "renvoyer" ? "paie.renvoi" : "paie.levee", "bulletin",
      String(bb.id), { numero: bb.numero, motif: motif, prepare_par: bb.prepare_par || bb.soumis_par || null,
        controle: bb.controle || null });

    // 🆕 28/09 — celui qui a prepare le bulletin sait qu il lui revient.
    let avis = "";
    const preparateur = String(bb.prepare_par || bb.soumis_par || "");
    if (action === "renvoyer" && preparateur.indexOf("@") > 0 && preparateur !== ctx.email) {
      const echec = await courriel(ctx, [preparateur],
        "Bulletin " + bb.numero + " renvoyé pour correction",
        "<h2>Un bulletin vous est renvoyé</h2>"
        + "<p>" + html(ctx.email) + " vous renvoie le bulletin " + html(bb.numero) + " pour correction :</p>"
        + "<p><b>« " + html(motif) + " »</b></p><p>Corrigez, puis soumettez-le de nouveau.</p>");
      avis = echec ? " ⚠️ Le courriel à " + preparateur + " n'est pas parti : " + echec
        : " " + preparateur + " est prévenu par courriel.";
    }

    // 🆕 07/10 — lever un rouge ne suffit pas toujours : s il reste un point
    // orange sans justification, on le dit tout de suite (on ne l apprenait
    // qu au moment d emettre).
    let resteOrange = "";
    if (action === "lever") {
      const alertesB: any[] = (bb.controle && Array.isArray(bb.controle.alertes)) ? bb.controle.alertes : [];
      const nbOr = alertesB.filter(function (a: any) { return a && a.niveau === "orange"; }).length;
      if (nbOr > 0 && !String(bb.justification || "").trim()) {
        resteOrange = " ⚠️ Il reste " + (nbOr > 1 ? nbOr + " points orange" : "un point orange")
          + " à justifier avant l'émission : écrivez la justification dans le même champ, puis « justifier ».";
      }
    }

    return NextResponse.json({ success: true, message: (action === "renvoyer"
      ? "Bulletin " + bb.numero + " renvoyé avec votre motif."
      : "Points rouges du bulletin " + bb.numero + " levés. Le motif est inscrit au journal." + resteOrange) + avis });
  }

  // ═════════════════════════════════════════════════════════════════════
  // ---- LA PIECE JUSTIFICATIVE D UN ELEMENT ----
  // Au coffre (documents-signes, prive), sous paie-preuves/. ⚠️ 3 Mo au
  // plus : la requete entiere est limitee a 4,5 Mo chez Vercel, et le
  // base 64 grossit d un tiers. L ecran reduit les photos avant l envoi.
  // ═════════════════════════════════════════════════════════════════════
  if (action === "joindre_preuve") {
    const { data: el } = await supabase.from("paie_elements")
      .select("id, tenant_id, societe_id, contrat_id, periode").eq("id", String(c.id)).maybeSingle();
    if (!el) return NextResponse.json({ erreur: "élément introuvable" }, { status: 404 });
    const e: any = el;

    const { data: emis } = await supabase.from("paie_bulletins").select("numero")
      .eq("contrat_id", e.contrat_id).eq("periode", e.periode).eq("statut", "emis").maybeSingle();
    if (emis) {
      return NextResponse.json({ erreur: "le bulletin " + (emis as any).numero + " de ce mois est émis : "
        + "la pièce se joint au bulletin rectificatif." }, { status: 400 });
    }

    const dep = await deposerPiece(c, e.tenant_id + "/" + e.societe_id + "/" + e.id);
    if (dep.erreur || !dep.chemin) return NextResponse.json({ erreur: dep.erreur }, { status: dep.status });
    const chemin = dep.chemin;

    const { error } = await supabase.from("paie_elements").update({
      preuve_chemin: chemin, preuve_nom: String(c.nom || "piece").slice(0, 120),
      preuve_par: ctx.email, preuve_le: new Date().toISOString(),
    }).eq("id", e.id);
    if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Pièce jointe à l'élément." });
  }

  // ---- L AVIS D ARRET DE TRAVAIL (28/09) ----
  if (action === "joindre_avis") {
    const { data: ev } = await supabase.from("paie_evenements")
      .select("id, tenant_id, societe_id, type_evenement").eq("id", String(c.id)).maybeSingle();
    if (!ev || (ev as any).type_evenement !== "arret") {
      return NextResponse.json({ erreur: "arrêt introuvable" }, { status: 404 });
    }
    const x: any = ev;
    const dep = await deposerPiece(c, x.tenant_id + "/" + x.societe_id + "/arret-" + x.id);
    if (dep.erreur || !dep.chemin) return NextResponse.json({ erreur: dep.erreur }, { status: dep.status });
    const { error } = await supabase.from("paie_evenements").update({
      preuve_chemin: dep.chemin, preuve_nom: String(c.nom || "avis").slice(0, 120),
      preuve_par: ctx.email, preuve_le: new Date().toISOString(),
    }).eq("id", x.id);
    if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Avis d'arrêt joint." });
  }

  if (action === "voir_avis") {
    const { data: ev } = await supabase.from("paie_evenements").select("preuve_chemin").eq("id", String(c.id)).maybeSingle();
    const ch = ev ? (ev as any).preuve_chemin : null;
    if (!ch) return NextResponse.json({ erreur: "aucun avis joint à cet arrêt" }, { status: 404 });
    const { data: signe } = await supabase.storage.from("documents-signes").createSignedUrl(ch, 3600);
    if (!signe) return NextResponse.json({ erreur: "lien impossible" }, { status: 500 });
    return NextResponse.json({ success: true, url: signe.signedUrl });
  }

  if (action === "voir_preuve") {
    const { data: el } = await supabase.from("paie_elements").select("preuve_chemin").eq("id", String(c.id)).maybeSingle();
    const ch = el ? (el as any).preuve_chemin : null;
    if (!ch) return NextResponse.json({ erreur: "aucune pièce pour cet élément" }, { status: 404 });
    const { data: signe } = await supabase.storage.from("documents-signes").createSignedUrl(ch, 3600);
    if (!signe) return NextResponse.json({ erreur: "lien impossible" }, { status: 500 });
    return NextResponse.json({ success: true, url: signe.signedUrl });
  }

  // ═════════════════════════════════════════════════════════════════════
  // ---- ENVOYER LE RECAPITULATIF AU CLIENT ----
  // ═════════════════════════════════════════════════════════════════════
  if (action === "envoyer_recap") {
    const societeId = String(c.societe_id || "");
    const periode = moisDe(c.periode);
    if (!periode) return NextResponse.json({ erreur: "période illisible" }, { status: 400 });

    const rec = await contenuRecap(societeId, periode);
    if (rec.manquants.length > 0) {
      return NextResponse.json({ erreur: (rec.manquants.length > 1 ? rec.manquants.length + " salariés n'ont" : "1 salarié n'a") + " pas encore de bulletin ce mois-ci : "
        + rec.manquants.join(", ") + ". Sortez leur bulletin avant d'envoyer le récapitulatif." }, { status: 409 });
    }
    if (rec.contenu.lignes.length === 0) {
      return NextResponse.json({ erreur: "aucun bulletin ce mois-ci : rien à récapituler." }, { status: 409 });
    }
    if (rec.perimes.length > 0) {
      return NextResponse.json({ erreur: "le brouillon de " + rec.perimes.join(", ") + " ne tient pas compte des "
        + "dernières saisies : ressortez-le avant d'envoyer le récapitulatif, sinon le client confirmerait "
        + "des montants faux." }, { status: 409 });
    }

    const dest = String(propre(c.destinataire) || rec.societe.email || "").toLowerCase().trim();
    if (!dest || dest.indexOf("@") < 1 || dest.indexOf(".") < 0) {
      return NextResponse.json({ erreur: "indiquez l'adresse du client qui doit confirmer la paie." }, { status: 400 });
    }
    const cleResend = process.env.RESEND_API_KEY || "";
    if (!cleResend) return NextResponse.json({ erreur: "envoi de courriel indisponible pour le moment." }, { status: 500 });

    const jeton = crypto.randomBytes(24).toString("base64url");
    const { data: cree, error: eIns } = await supabase.from("paie_recaps").insert({
      tenant_id: rec.societe.tenant_id, societe_id: societeId, periode: periode, jeton: jeton,
      contenu: rec.contenu, empreinte: rec.empreinte, destinataire: dest, envoye_par: ctx.email,
      statut: "envoye", site: marqueDuCourriel(ctx.hote).site,
    }).select("id").maybeSingle();
    if (eIns || !cree) return NextResponse.json({ erreur: "enregistrement impossible : " + (eIns ? eIns.message : "") }, { status: 500 });

    const marque = marqueDuCourriel(ctx.hote);
    const lien = marque.site + "/compliance/recap-paie/" + jeton;
    const lignesHtml = rec.contenu.lignes.map(function (l: any) {
      const morceaux: string[] = [];
      for (const e of l.elements) {
        morceaux.push(html(e.libelle) + (e.quantite !== null && e.quantite !== undefined ? " (" + html(e.quantite) + ")" : "")
          + (e.montant ? " : " + html(euros(e.montant)) : ""));
      }
      for (const a of (l.absences || [])) morceaux.push(html(a));
      const el = morceaux.length === 0 ? "—" : morceaux.join("<br>");
      const brut = l.gratification
        ? "Gratification " + html(euros(l.gratification)) + '<br><span style="font-size:11px;color:#777">dont '
          + html(euros(l.brut)) + " soumis</span>"
        : html(euros(l.brut));
      return '<tr><td style="padding:8px;border-bottom:1px solid #ddd">' + html(l.salarie) + "</td>"
        + '<td style="padding:8px;border-bottom:1px solid #ddd;font-size:13px">' + el + "</td>"
        + '<td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">' + brut + "</td>"
        + '<td style="padding:8px;border-bottom:1px solid #ddd;text-align:right"><b>' + html(euros(l.net)) + "</b></td></tr>";
    }).join("");

    const resend = new Resend(cleResend);
    const envoi: any = await resend.emails.send({
      from: marque.expediteur,
      to: dest,
      reply_to: ctx.cleServeur ? undefined : ctx.email,
      subject: "Paie de " + moisEnClair(periode) + " — " + rec.contenu.societe + " : à vérifier et confirmer",
      html: '<div style="font-family:Georgia,serif;color:#222;max-width:640px;margin:0 auto;padding:20px">'
        + "<h2>Paie de " + html(moisEnClair(periode)) + " — " + html(rec.contenu.societe) + "</h2>"
        + "<p>Voici la paie préparée pour vos salariés. Vérifiez chaque ligne : les éléments du mois "
        + "(heures, primes, absences) et le net à payer. Si tout est juste, confirmez ; sinon, signalez "
        + "ce qui ne va pas. Aucun bulletin n'est émis avant votre confirmation.</p>"
        + '<table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="background:#f3efe6">'
        + '<th style="padding:8px;text-align:left">Salarié</th><th style="padding:8px;text-align:left">Éléments du mois</th>'
        + '<th style="padding:8px;text-align:right">Brut</th><th style="padding:8px;text-align:right">Net à payer</th></tr>'
        + lignesHtml + "</table>"
        + '<p style="text-align:center;margin:28px 0"><a href="' + lien + '" style="background:#c8a96e;color:#050508;'
        + 'padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Vérifier et confirmer</a></p>'
        + '<p style="font-size:12px;color:#777">Ce lien vous est personnel. Vous pouvez répondre à ce courriel '
        + "pour toute question.</p></div>",
    } as any);

    if (envoi && envoi.error) {
      await supabase.from("paie_recaps").delete().eq("id", (cree as any).id);
      return NextResponse.json({ erreur: "le courriel n'est pas parti : "
        + String(envoi.error.message || envoi.error) + ". Rien n'a été enregistré." }, { status: 500 });
    }

    await supabase.from("paie_recaps").update({ statut: "remplace" })
      .eq("societe_id", societeId).eq("periode", periode)
      .in("statut", ["envoye", "confirme", "conteste"]).neq("id", (cree as any).id);

    return NextResponse.json({ success: true, message: "Récapitulatif de " + moisEnClair(periode)
      // 🆕 02/10 — « pour 2 salariés » : les parenthèses doublées
      // (« (2 salarié(s)) ») se lisaient à l'écran.
      + " envoyé à " + dest + " pour " + (rec.contenu.lignes.length > 1
        ? rec.contenu.lignes.length + " salariés" : "1 salarié")
      + ". L'émission attend sa confirmation." });
  }

  // ---- LEVER L ATTENTE DU CLIENT (motif obligatoire) ----
  if (action === "lever_recap") {
    const societeId = String(c.societe_id || "");
    const periode = moisDe(c.periode);
    const motif = propre(c.motif);
    if (!periode) return NextResponse.json({ erreur: "période illisible" }, { status: 400 });
    if (!motif || motif.length < 10) {
      return NextResponse.json({ erreur: "une levée se motive : au moins 10 caractères, ils sont inscrits au journal." }, { status: 400 });
    }
    if (!ctx.cleServeur && !(await carteBlanche(societeId))) {
      return NextResponse.json({ erreur: "réservé à qui a la carte blanche sur ce dossier." }, { status: 403 });
    }
    const rec = await contenuRecap(societeId, periode);
    const { error } = await supabase.from("paie_recaps").insert({
      tenant_id: rec.societe.tenant_id, societe_id: societeId, periode: periode,
      jeton: crypto.randomBytes(24).toString("base64url"), contenu: rec.contenu, empreinte: rec.empreinte,
      destinataire: null, envoye_par: ctx.email, statut: "leve", remarque: motif.slice(0, 1000),
      repondu_le: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
    await supabase.from("paie_recaps").update({ statut: "remplace" })
      .eq("societe_id", societeId).eq("periode", periode).in("statut", ["envoye", "confirme", "conteste"]);
    return NextResponse.json({ success: true, message: "Attente du client levée pour " + moisEnClair(periode)
      + ". Le motif est inscrit au journal." });
  }

  // ═════════════════════════════════════════════════════════════════════
  // ---- LA MESURE DES CORRECTIONS (six derniers mois) ----
  // C est le chiffre qui dit quand donner la carte blanche : combien de
  // bulletins chacun a soumis, combien lui ont ete renvoyes, combien ont du
  // etre leves.
  // ═════════════════════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════════════════
  // ---- LES SEUILS DU CABINET (28/09) ----
  // Lire : tout le monde voit les seuils qui s appliquent a son dossier.
  // Regler : l administrateur et les associes seulement, pour leur cabinet.
  // Une valeur vide rend la valeur commune.
  // ═════════════════════════════════════════════════════════════════════
  if (action === "seuils" || action === "regler_seuils") {
    const { data: socT } = await supabase.from("compta_societes").select("tenant_id")
      .eq("id", String(c.societe_id || "")).maybeSingle();
    const tenantId = socT ? String((socT as any).tenant_id || "") : "";
    if (!tenantId) return NextResponse.json({ erreur: "dossier sans organisme" }, { status: 400 });

    if (action === "regler_seuils") {
      if (!ctx.cleServeur && !(await peutGererEquipe())) {
        return NextResponse.json({ erreur: "réservé à l'administrateur et aux associés." }, { status: 403 });
      }
      const valeurs: any = c.valeurs || {};
      const erreurs: string[] = [];
      for (const code of Object.keys(valeurs)) {
        if (SEUILS_DEFAUT[code] === undefined) continue;
        const brut = valeurs[code];
        if (brut === null || brut === undefined || String(brut).trim() === "") {
          await supabase.from("paie_seuils_cabinet").delete().eq("tenant_id", tenantId).eq("code", code);
          continue;
        }
        const v = Number(String(brut).replace(",", ".").replace(/\s/g, ""));
        const b = SEUILS_BORNES[code];
        if (!isFinite(v) || v < b[0] || v > b[1]) {
          erreurs.push(code + " : entre " + b[0] + " et " + b[1]);
          continue;
        }
        const { error } = await supabase.from("paie_seuils_cabinet").upsert({
          tenant_id: tenantId, code: code, valeur: v, maj_par: ctx.email, maj_le: new Date().toISOString(),
        }, { onConflict: "tenant_id,code" });
        if (error) erreurs.push(code + " : " + error.message);
      }
      if (erreurs.length > 0) {
        return NextResponse.json({ erreur: "certains seuils n'ont pas été enregistrés — " + erreurs.join(" · ") }, { status: 400 });
      }
    }

    const { data: communs } = await supabase.from("paie_seuils").select("code, libelle, valeur, unite, niveau");
    const { data: propres } = await supabase.from("paie_seuils_cabinet").select("code, valeur").eq("tenant_id", tenantId);
    const liste = ((communs || []) as any[]).map(function (l) {
      const p = ((propres || []) as any[]).filter(function (x) { return x.code === l.code; })[0];
      return { code: l.code, libelle: l.libelle, unite: l.unite, niveau: l.niveau,
        commun: Number(l.valeur), cabinet: p ? Number(p.valeur) : null,
        applique: p ? Number(p.valeur) : Number(l.valeur), bornes: SEUILS_BORNES[l.code] || null };
    });
    return NextResponse.json({ success: true, seuils: liste,
      message: action === "regler_seuils" ? "Seuils du cabinet enregistrés." : undefined });
  }

  if (action === "mesure") {
    if (!ctx.cleServeur && !(await peutGererEquipe())) {
      return NextResponse.json({ erreur: "réservé à l'administrateur et aux associés." }, { status: 403 });
    }
    const ids = ctx.cleServeur ? null : await dossiersAutorises();
    const depuis = new Date(Date.now() - 183 * 24 * 3600 * 1000).toISOString();
    let q = supabase.from("compta_audit").select("email, action, apres, created_at")
      .in("action", ["paie.soumettre", "paie.renvoi", "paie.levee", "paie.emettre"])
      .gte("created_at", depuis).limit(5000);
    if (ids) {
      if (ids.length === 0) return NextResponse.json({ success: true, personnes: [] });
      q = q.in("societe_id", ids);
    }
    const { data, error } = await q;
    if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

    const p: any = {};
    const de = function (email: string) {
      const k = String(email || "inconnu").toLowerCase();
      if (!p[k]) p[k] = { email: k, soumis: 0, renvoyes: 0, leves: 0, emis: 0 };
      return p[k];
    };
    for (const l of ((data || []) as any[])) {
      if (l.action === "paie.soumettre") de(l.email).soumis++;
      if (l.action === "paie.emettre") de(l.email).emis++;
      if (l.action === "paie.renvoi" && l.apres && l.apres.prepare_par) de(l.apres.prepare_par).renvoyes++;
      if (l.action === "paie.levee" && l.apres && l.apres.prepare_par) de(l.apres.prepare_par).leves++;
    }
    const personnes = Object.keys(p).map(function (k) {
      const x = p[k];
      x.taux_corrections = x.soumis > 0 ? Math.round((x.renvoyes + x.leves) / x.soumis * 1000) / 10 : null;
      return x;
    }).sort(function (a: any, b: any) { return b.soumis - a.soumis; });
    return NextResponse.json({ success: true, depuis: depuis.slice(0, 10), personnes: personnes });
  }

  return null;
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  const cleServeur = !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
  const session = cleServeur ? null : sessionCourante();

  if (!cleServeur && !session) {
    return NextResponse.json({
      erreur: "Connectez-vous pour ouvrir la paie : votre session est absente ou a expiré.",
      connexion: true,
    }, { status: 401 });
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }
  const action = String(c.action || "").trim();

  const ctx: Ctx = {
    cleServeur: cleServeur,
    email: cleServeur ? "cle-serveur" : String(session ? session.email : ""),
    ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
    hote: req.headers.get("host") || "",
  };

  const regle = REGLES[action];
  if (!regle) return NextResponse.json({ erreur: "action inconnue : " + action }, { status: 400 });

  let cible: { societeId: string | null; reference: string | null } = { societeId: null, reference: null };
  try {
    cible = await cibleDe(regle.cible, c);
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }

  if (regle.cible !== "aucune" && !cible.societeId) {
    return NextResponse.json({ erreur: "introuvable : l'élément demandé n'existe pas ou n'est pas accessible." }, { status: 404 });
  }

  if (!cleServeur && regle.cible !== "aucune") {
    const v = await verifier(regle.droit, cible.societeId);
    if (!v.autorise) {
      return NextResponse.json({ erreur: v.motif || "Accès refusé." }, { status: v.email ? 403 : 401 });
    }
  }

  // 🆕🚨 28/09 — LES SAISIES QUI CHANGENT LA PAIE PERIMENT LE BROUILLON.
  // Le contrat se lit AVANT le geste : apres une suppression, l element ou
  // l evenement n existe plus.
  let contratPerime: string | null = null;
  if (PERIMANTS.indexOf(action) >= 0) {
    try { contratPerime = await contratDe(regle.cible, c); } catch (e) { contratPerime = null; }
  }

  const res = await traiter(req, c, action, ctx);

  if (contratPerime && res.status < 400) {
    const { error: eP } = await supabase.from("paie_bulletins")
      .update({ controle: { perime: true, depuis: new Date().toISOString(), par: action } })
      .eq("contrat_id", contratPerime).eq("statut", "brouillon");
    if (eP) console.error("[paie/dossier] peremption :", eP.message);
  }

  if (regle.ecrit && res.status < 400) {
    await journal(cible.societeId, ctx, "paie." + action, regle.cible.split(":")[0], cible.reference, pourJournal(c));
  }
  return res;
}
