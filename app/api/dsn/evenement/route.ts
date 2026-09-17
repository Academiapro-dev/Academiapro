import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LES SIGNALEMENTS D EVENEMENT — 17/09/2026
//
// La DSN mensuelle raconte le mois ecoule. Les SIGNALEMENTS racontent ce
// qui arrive maintenant, et ils ont leurs propres delais :
//
//   · ARRET DE TRAVAIL — nature 02, a envoyer DANS LES CINQ JOURS. C est
//     lui qui declenche les indemnites journalieres. En retard, le salarie
//     n est pas paye.
//   · FIN DE CONTRAT (FCTU) — nature 07, cinq jours egalement. Il REMPLACE
//     L ATTESTATION EMPLOYEUR depuis 2022 : sans lui, l ancien salarie ne
//     peut pas ouvrir ses droits au chomage.
//
// ⚠️ UN SIGNALEMENT NE REMPLACE PAS LA DSN MENSUELLE. Un arret se signale
// ET se retrouve dans la DSN du mois. Les deux se completent.
//
// 🚨 MEME FORMAT QUE LA DSN MENSUELLE, MEMES PIEGES :
//   · une rubrique par ligne, forme Sxx.Gyy.zz.nnn,'valeur'
//   · ISO 8859-1, JAMAIS UTF-8 — un accent mal encode fait rejeter tout
//   · dates en JJMMAAAA, montants a deux decimales avec un point
//   · fins de ligne CR/LF
//
// ⛔ CE QUI CHANGE : la NATURE de la declaration (S20.G00.05.001) vaut 02
// pour un arret et 07 pour une fin de contrat, au lieu de 01. Et le bloc
// individu ne porte QUE le salarie concerne — pas tout l effectif.
// ═══════════════════════════════════════════════════════════════════════

const NOM_LOGICIEL = "Mr Comptable";
const NOM_EDITEUR = "AcadeMIA Pro LLC";
const VERSION_LOGICIEL = "1.0.0";
const CONTACT_DEFAUT = "Jacques LALOU";
const EMAIL_DEFAUT = "contact@academiapro.fr";
const TELEPHONE_DEFAUT = "0100000000";

// ⚠️ MEME RESERVE QUE SUR LA DSN MENSUELLE : dsn-val refuse P26V01 alors
// que le cahier l impose. Le desaccord n est pas tranche.
const NORME = "P26V01";

function q(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cleLuhnValide(numero: string): boolean {
  const n = numero.replace(/\D/g, "");
  if (n.length === 0) return false;
  let somme = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    somme += d;
    double = !double;
  }
  return somme % 10 === 0;
}

function dateDsn(v: any): string {
  const d = q(v);
  if (!d) return "";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + m[2] + m[1];
  return "";
}

function montantDsn(v: any): string {
  return Number(v || 0).toFixed(2);
}

function latin(v: any): string {
  return q(v)
    .replace(/'/g, " ")
    .replace(/\u2019|\u2018/g, " ")
    .replace(/\u201C|\u201D/g, " ")
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u00A0|\u202F/g, " ")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\xFF]/g, "");
}

function sexeDsn(sexe: any, nir: string): string {
  const s = q(sexe).toUpperCase();
  if (s === "F" || s === "2") return "02";
  if (s === "M" || s === "1") return "01";
  const n = nir.replace(/\D/g, "");
  if (n.length > 0) return n[0] === "2" ? "02" : "01";
  return "";
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !cle) {
    return NextResponse.json({ erreur: "Supabase non configuré." },
      { status: 500 });
  }
  const supabase = createClient(url, cle);

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }

  if (q(c.cle) !== q(process.env.CRON_SECRET)) {
    return NextResponse.json({ erreur: "clé invalide." }, { status: 401 });
  }

  const evenementId = q(c.evenement_id);
  if (!evenementId) {
    return NextResponse.json({ erreur: "événement manquant." },
      { status: 400 });
  }

  try {
    const { data: ev } = await supabase
      .from("paie_evenements")
      .select("*")
      .eq("id", evenementId)
      .maybeSingle();
    if (!ev) {
      return NextResponse.json({ erreur: "événement introuvable." },
        { status: 404 });
    }

    const { data: ct } = await supabase
      .from("paie_contrats")
      .select("*, paie_salaries(*)")
      .eq("id", (ev as any).contrat_id)
      .maybeSingle();
    if (!ct) {
      return NextResponse.json({ erreur: "contrat introuvable." },
        { status: 404 });
    }

    const { data: societe } = await supabase
      .from("compta_societes")
      .select("*")
      .eq("id", (ev as any).societe_id)
      .maybeSingle();
    if (!societe) {
      return NextResponse.json({ erreur: "société introuvable." },
        { status: 404 });
    }

    const siret = q((societe as any).siret).replace(/\D/g, "");
    if (siret.length !== 14 || !cleLuhnValide(siret)) {
      return NextResponse.json({
        erreur: "le SIRET de la société est absent ou sa clé est fausse. "
          + "⛔ AUCUN SIGNALEMENT N'EST POSSIBLE SANS LUI.",
      }, { status: 400 });
    }

    const anomalies: string[] = [];
    const L: string[] = [];
    const dernierePar: Record<string, number> = {};

    // 🚨 LE MEME GARDE-FOU QUE SUR LA DSN MENSUELLE : dsn-val cesse de lire
    // un bloc des qu une rubrique revient en arriere, et ignore tout ce qui
    // suit. Le controle vit dans le code, pas dans ma relecture.
    const ecrire = function (ref: string, valeur: any) {
      const v = latin(valeur);
      if (v === "") return;
      const mr = ref.match(/^(S\d\d\.G\d\d\.\d\d)\.(\d{3})$/);
      if (mr) {
        const bloc = mr[1];
        const num = Number(mr[2]);
        const avant = dernierePar[bloc];
        if (avant !== undefined && num < avant) {
          anomalies.push("⛔ ORDRE DES RUBRIQUES : " + ref + " après "
            + bloc + "." + String(avant).padStart(3, "0") + ".");
        }
        dernierePar[bloc] = num;
      }
      L.push(ref + ",'" + v + "'");
    };

    const type = q((ev as any).type_evenement);
    const estArret = type === "arret";

    // ⚠️ LA NATURE DIT DE QUEL SIGNALEMENT IL S AGIT : 02 arret de travail,
    // 07 fin de contrat. C est elle qui aiguille le fichier vers le bon
    // organisme — la CPAM pour l un, France Travail pour l autre.
    const nature = estArret ? "02" : "07";

    // ── S10 — L ENVOI ET L EMETTEUR ──
    ecrire("S10.G00.00.001", NOM_LOGICIEL);
    ecrire("S10.G00.00.002", NOM_EDITEUR);
    ecrire("S10.G00.00.003", VERSION_LOGICIEL);
    ecrire("S10.G00.00.005", "01");            // essai
    ecrire("S10.G00.00.006", NORME);
    ecrire("S10.G00.00.007", "01");            // net-entreprises
    ecrire("S10.G00.00.008", "01");            // envoi normal

    ecrire("S10.G00.01.001", siret.slice(0, 9));
    ecrire("S10.G00.01.002", siret.slice(9));
    ecrire("S10.G00.01.003", (societe as any).raison_sociale);
    ecrire("S10.G00.01.004", (societe as any).adresse);
    ecrire("S10.G00.01.005", q((societe as any).code_postal));
    ecrire("S10.G00.01.006", (societe as any).ville);

    ecrire("S10.G00.02.002", q((societe as any).contact_nom) || CONTACT_DEFAUT);
    ecrire("S10.G00.02.004", q((societe as any).contact_email) || EMAIL_DEFAUT);
    ecrire("S10.G00.02.005", q((societe as any).contact_tel) || TELEPHONE_DEFAUT);

    // ── S20 — LA DECLARATION ──
    const aujourdhui = new Date();
    const dateConstitution = String(aujourdhui.getDate()).padStart(2, "0")
      + String(aujourdhui.getMonth() + 1).padStart(2, "0")
      + String(aujourdhui.getFullYear());

    // ⚠️ LE MOIS PRINCIPAL D UN SIGNALEMENT est celui de l evenement, pas
    // le mois courant : un arret du 28 aout signale le 2 septembre porte
    // sur aout.
    const dateEv = q((ev as any).date_debut);
    const moisPrincipal = "01" + dateEv.slice(5, 7) + dateEv.slice(0, 4);

    ecrire("S20.G00.05.001", nature);
    ecrire("S20.G00.05.002", "01");            // declaration normale
    ecrire("S20.G00.05.003", "11");            // fraction 1 sur 1
    ecrire("S20.G00.05.004", "1");
    ecrire("S20.G00.05.005", moisPrincipal);
    ecrire("S20.G00.05.007", dateConstitution);
    ecrire("S20.G00.05.008", "01");
    ecrire("S20.G00.05.010", "01");            // euro

    // ── S21.G00.06 / 11 — ENTREPRISE ET ETABLISSEMENT ──
    ecrire("S21.G00.06.001", siret.slice(0, 9));
    ecrire("S21.G00.06.002", siret.slice(9));
    ecrire("S21.G00.06.004", (societe as any).adresse);
    ecrire("S21.G00.06.005", q((societe as any).code_postal));
    ecrire("S21.G00.06.006", (societe as any).ville);

    ecrire("S21.G00.11.001", siret.slice(9));
    ecrire("S21.G00.11.003", (societe as any).adresse);
    ecrire("S21.G00.11.004", q((societe as any).code_postal));
    ecrire("S21.G00.11.005", (societe as any).ville);

    const idcc = q((societe as any).idcc) || q((ct as any).idcc);
    if (idcc) ecrire("S21.G00.11.022", String(idcc).padStart(4, "0"));

    // ── S21.G00.30 — L INDIVIDU ──
    //
    // 🚨 UN SIGNALEMENT NE PORTE QU UN SEUL SALARIE, celui que l evenement
    // concerne. Y mettre tout l effectif ferait declarer un arret de
    // travail pour chacun.
    const sal: any = (ct as any).paie_salaries;
    const nirComplet = q(sal.numero_secu).replace(/[^0-9AaBb]/g, "").toUpperCase();
    const nir = nirComplet.slice(0, 13);

    ecrire("S21.G00.30.001", nir);
    ecrire("S21.G00.30.002", sal.nom);
    ecrire("S21.G00.30.004", sal.prenom);
    ecrire("S21.G00.30.005", sexeDsn(sal.sexe, nirComplet));
    ecrire("S21.G00.30.006", dateDsn(sal.date_naissance));

    const deptNaissance = nirComplet.length >= 7 ? nirComplet.slice(5, 7) : "";
    if (deptNaissance && deptNaissance !== "99") {
      ecrire("S21.G00.30.007", sal.lieu_naissance);
    }
    ecrire("S21.G00.30.008", sal.adresse);
    ecrire("S21.G00.30.009", q(sal.code_postal));
    ecrire("S21.G00.30.010", sal.ville);
    ecrire("S21.G00.30.013", q(sal.codification_ue) || "01");
    if (deptNaissance) ecrire("S21.G00.30.014", deptNaissance);
    const paysNaiss = q(sal.pays_naissance).toUpperCase();
    ecrire("S21.G00.30.015", paysNaiss.length === 2 ? paysNaiss : "FR");

    // ── S21.G00.40 — LE CONTRAT ──
    const numeroContrat = String((ct as any).id).replace(/-/g, "").slice(0, 20);
    ecrire("S21.G00.40.001", dateDsn((ct as any).date_debut));
    ecrire("S21.G00.40.009", numeroContrat);

    // ⚠️ LE MOTIF EST UN CODE DE LA NORME, lu en base. Le deviner ferait
    // declarer une fin de CDD comme un licenciement economique — les deux
    // n ouvrent pas les memes droits.
    const { data: codes } = await supabase
      .from("dsn_codes")
      .select("*")
      .eq("rubrique", estArret ? "S21.G00.60.001" : "S21.G00.62.002")
      .is("date_fin", null);

    let codeMotif = "";
    for (const k of (codes || [])) {
      if (q((k as any).correspondance) === q((ev as any).motif)) {
        codeMotif = q((k as any).code);
      }
    }

    if (!codeMotif) {
      anomalies.push("⛔ MOTIF « " + q((ev as any).motif) + " » SANS CODE DSN "
        + "actif pour la rubrique "
        + (estArret ? "S21.G00.60.001" : "S21.G00.62.002")
        + ". Le signalement ne peut pas être déposé.");
    }

    if (estArret) {
      // ═══════════════════════════════════════════════════════════════
      // ── S21.G00.60 — L ARRET DE TRAVAIL ──
      //
      // 🚨 LA SUBROGATION DECIDE QUI TOUCHE LES INDEMNITES. Quand
      // l employeur maintient le salaire, il percoit les IJSS a la place
      // du salarie — et doit donner son IBAN. L oublier fait verser les
      // indemnites au salarie qui a deja ete paye, et il faut les lui
      // reclamer ensuite.
      //
      // ⚠️ LE DERNIER JOUR TRAVAILLE N EST PAS LA VEILLE DE L ARRET quand
      // le salarie a travaille le matin puis consulte l apres-midi. C est
      // lui qui fixe le point de depart du delai de carence.
      // ═══════════════════════════════════════════════════════════════
      ecrire("S21.G00.60.001", codeMotif);
      ecrire("S21.G00.60.002", dateDsn((ev as any).dernier_jour_travaille
        || (ev as any).date_debut));
      if (q((ev as any).date_fin)) {
        ecrire("S21.G00.60.003", dateDsn((ev as any).date_fin));
      }
      ecrire("S21.G00.60.004", (ev as any).subrogation ? "01" : "02");

      if ((ev as any).subrogation) {
        ecrire("S21.G00.60.005", dateDsn((ev as any).subro_debut
          || (ev as any).date_debut));
        if (q((ev as any).subro_fin)) {
          ecrire("S21.G00.60.006", dateDsn((ev as any).subro_fin));
        }
        // ⛔ SANS IBAN, LES INDEMNITES NE PEUVENT PAS ETRE VERSEES a
        // l employeur : la subrogation est declaree mais inopérante.
        if (q((ev as any).iban)) {
          ecrire("S21.G00.60.007", q((ev as any).iban).replace(/\s/g, ""));
          if (q((ev as any).bic)) ecrire("S21.G00.60.008", (ev as any).bic);
        } else {
          anomalies.push("⛔ SUBROGATION DÉCLARÉE SANS IBAN : les indemnités "
            + "journalières ne pourront pas être versées à l'employeur. "
            + "Renseigner l'IBAN sur l'événement.");
        }
      }
    } else {
      // ═══════════════════════════════════════════════════════════════
      // ── S21.G00.62 — LA FIN DU CONTRAT ──
      //
      // 🚨 CE SIGNALEMENT REMPLACE L ATTESTATION EMPLOYEUR. France Travail
      // s en sert pour ouvrir les droits : un motif faux, et le salarie
      // est prive d allocation ou en recoit une a tort.
      //
      // ⚠️ LE DERNIER JOUR PAYE AU SALAIRE HABITUEL n est pas toujours la
      // date de fin : un preavis non effectue mais paye les separe.
      // ═══════════════════════════════════════════════════════════════
      ecrire("S21.G00.62.001", dateDsn((ev as any).date_fin
        || (ev as any).date_debut));
      ecrire("S21.G00.62.002", codeMotif);
      if (q((ev as any).date_notification)) {
        ecrire("S21.G00.62.003", dateDsn((ev as any).date_notification));
      }
      ecrire("S21.G00.62.006", dateDsn((ev as any).dernier_jour_paye
        || (ev as any).date_fin || (ev as any).date_debut));
    }

    // ── S90 — LE TOTAL ──
    const nbRubriques = L.length + 2;
    L.push("S90.G00.90.001,'" + nbRubriques + "'");
    L.push("S90.G00.90.002,'1'");

    const contenu = L.join("\r\n") + "\r\n";
    const nomFichier = "DSN-" + siret + "-"
      + (estArret ? "ARRET" : "FCTU") + "-"
      + dateEv.replace(/-/g, "") + ".dsn";

    const { error: eMaj } = await supabase
      .from("paie_evenements")
      .update({ fichier: contenu, statut: "genere" })
      .eq("id", evenementId);
    if (eMaj) {
      return NextResponse.json({ erreur: eMaj.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      nom_fichier: nomFichier,
      nature: nature,
      type: estArret ? "arrêt de travail" : "fin de contrat",
      salarie: q(sal.prenom) + " " + q(sal.nom),
      lignes: L.length,
      contenu: contenu,
      anomalies: anomalies,
      reserves: [
        "⛔ PASSER LE FICHIER DANS dsn-val avant tout dépôt réel.",
        "L'envoi est en MODE ESSAI (S10.G00.00.005 = 01). Passer à 02 pour "
          + "un dépôt réel.",
        "⚠️ DÉLAI LÉGAL DE CINQ JOURS : au-delà, "
          + (estArret
            ? "les indemnités journalières du salarié sont retardées."
            : "l'ancien salarié ne peut pas ouvrir ses droits au chômage."),
        "Le canal de transmission n'est pas branché : le fichier se dépose "
          + "à la main sur net-entreprises.",
      ],
      message: anomalies.length > 0
        ? "⚠️ " + anomalies.length + " anomalie(s) à corriger avant dépôt."
        : "Signalement généré. Aucune anomalie détectée à la génération.",
    });

  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
