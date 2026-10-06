import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// 🆕 06/10/2026 — LA DECLARATION PREALABLE A L EMBAUCHE, EN SIGNALEMENT DSN
//
// POURQUOI : jusqu ici, la declaration d embauche se faisait hors du
// logiciel. Trouve le 06/10 en dressant la liste des taches d un service de
// paie : c est le premier geste de toute embauche.
//
// CE QUE DIT LE CAHIER TECHNIQUE 2026.1 (§ 5.7), lu le 06/10 :
//   · nature de declaration « 10 - Signalement Declaration prealable a
//     l embauche », possible depuis la norme P26V01 ;
//   · FACULTATIF : « les canaux et les modalites de transmission classiques
//     sont maintenus » — l employeur peut aussi declarer comme avant ;
//   · a transmettre « dans les 8 jours precedant la date previsible de
//     l embauche » ;
//   · destine a l URSSAF, pour le regime general, HORS TRAVAIL TEMPORAIRE.
//
// CE QUE CE FICHIER ECRIT — le strict necessaire, chaque rubrique verifiee
// dans le tableau des rubriques par nature de declaration (colonne « 10 ») :
//   S10.G00.00 / 01 / 02   l envoi, l emetteur, le contact
//   S20.G00.05             001 « 10 » · 002 · 003 « 11 » · 004 · 007
//                          ⛔ ni mois principal (005) ni devise (010) :
//                          interdits pour cette nature
//   S20.G00.07             le contact chez le declare
//   S21.G00.06             001 SIREN · 002 NIC du siege · 005 · 006
//                          ⛔ ni code APEN (003) ni voie (004) : interdits
//   S21.G00.11             001 · 002 APET · 003 · 004 · 005
//                          ⛔ pas de convention collective (022) : interdite
//   S21.G00.30             001 NIR · 002 · 004 · 005 sexe · 006 · 007 lieu
//                          de naissance · 008 a 010 · 014 · 015 ·
//                          025 niveau de diplome (apprenti) ·
//                          030 SERVICE DE SANTE AU TRAVAIL — OBLIGATOIRE ici,
//                          sur l individu (dans la DSN du mois il est sur
//                          l etablissement, en 11.025)
//   S21.G00.40             001 date previsible d embauche · 006 emploi ·
//                          007 nature · 008 dispositif (apprenti, contrat
//                          pro) · 009 numero · 010 fin prevue ·
//                          082 jours de periode d essai ·
//                          083 HEURE PREVISIBLE D EMBAUCHE (HHMM)
//   S90.G00.90             le total
//
// LES CONTROLES DU CAHIER REPRIS ICI :
//   · 40.007 CCH-11 : seuls le CDI (01) et le CDD (02) de droit prive se
//     declarent ainsi — ni mission, ni stage, ni mandat ;
//   · 40.082 CCH-11 : la periode d essai est obligatoire pour un CDI ;
//     CCH-12 : et pour un CDD de plus de six mois ;
//   · 40.083 : quatre chiffres, heure puis minutes ;
//   · 30.025 CCH-11 : le niveau de diplome prepare est obligatoire des que
//     le dispositif est 64, 65 ou 81 (apprenti) ;
//   · 05.002 : un « annule et remplace » serait lu par l URSSAF comme une
//     NOUVELLE declaration d embauche — on n ecrit donc jamais « 03 ».
//
// ⛔ CE FICHIER N A JAMAIS ETE VU PAR dsn-val. Il est ecrit d apres le
// cahier technique seul : a passer dans dsn-val avant tout depot.
// ⚠️ L ENVOI EST EN MODE ESSAI (S10.G00.00.005 = 01), comme les autres.
// ⚠️ LA ROUTE N EST APPELEE QUE PAR LE RELAIS de /api/paie/dossier, qui a
// deja verifie la session et les droits : elle exige la cle du serveur.
// ═══════════════════════════════════════════════════════════════════════

const NOM_LOGICIEL = "Mr Comptable";
const NOM_EDITEUR = "AcadeMIA Pro LLC";
const VERSION_LOGICIEL = "1.0.0";
const CONTACT_DEFAUT = "Jacques LALOU";
const EMAIL_DEFAUT = "contact@academiapro.fr";
const TELEPHONE_DEFAUT = "0100000000";
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
  const m = q(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[3] + m[2] + m[1] : "";
}

function apeDsn(v: any): string {
  const a = q(v).replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  return /^\d{4}[A-Z]$/.test(a) ? a : "";
}

// Le nettoyage latin-1 : memes regles que les autres fichiers DSN.
function latin(v: any): string {
  return q(v)
    .replace(/'/g, " ")
    .replace(/’|‘/g, " ")
    .replace(/“|”/g, " ")
    .replace(/—|–/g, "-")
    .replace(/ | /g, " ")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\xFF]/g, "");
}

function sexeDsn(sexe: any, nir: string): string {
  const s = q(sexe).toUpperCase();
  if (s === "F" || s === "2" || s === "02") return "02";
  if (s === "M" || s === "1" || s === "01") return "01";
  if (nir.length >= 1) {
    if (nir[0] === "1") return "01";
    if (nir[0] === "2") return "02";
  }
  return "";
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !cle) {
    return NextResponse.json({ erreur: "Supabase non configuré." }, { status: 500 });
  }
  const supabase = createClient(url, cle, {
    global: { fetch: (input: any, init?: any) => fetch(input, { ...(init || {}), cache: "no-store" }) },
  });

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }

  if (!process.env.CRON_SECRET || q(c.cle) !== q(process.env.CRON_SECRET)) {
    return NextResponse.json({ erreur: "clé invalide." }, { status: 401 });
  }

  const contratId = q(c.contrat_id);
  if (!contratId) {
    return NextResponse.json({ erreur: "contrat manquant." }, { status: 400 });
  }

  try {
    const { data: ctLu } = await supabase
      .from("paie_contrats")
      .select("*, paie_salaries(*)")
      .eq("id", contratId)
      .maybeSingle();
    if (!ctLu) return NextResponse.json({ erreur: "contrat introuvable." }, { status: 404 });
    const ct: any = ctLu;
    const sal: any = ct.paie_salaries || {};

    const { data: socLue } = await supabase
      .from("compta_societes")
      .select("*")
      .eq("id", ct.societe_id)
      .maybeSingle();
    if (!socLue) return NextResponse.json({ erreur: "société introuvable." }, { status: 404 });
    const societe: any = socLue;

    const siret = q(societe.siret).replace(/\D/g, "");
    if (siret.length !== 14 || !cleLuhnValide(siret)) {
      return NextResponse.json({
        erreur: "le SIRET de la société est absent ou sa clé est fausse. "
          + "⛔ Aucune déclaration d'embauche n'est possible sans lui.",
      }, { status: 400 });
    }

    // ---- CE QUI SE DECLARE AINSI, ET CE QUI NE S Y DECLARE PAS ----
    const typeCt = q(ct.type_contrat).toLowerCase();
    if (typeCt === "mission") {
      return NextResponse.json({
        erreur: "la déclaration d'embauche d'un intérimaire ne passe pas par ce signalement : "
          + "la norme le réserve aux contrats hors travail temporaire.",
      }, { status: 400 });
    }
    if (typeCt === "stage" || typeCt === "mandat_social") {
      return NextResponse.json({
        erreur: typeCt === "stage"
          ? "une convention de stage ne donne pas lieu à une déclaration d'embauche : le stagiaire n'est pas salarié."
          : "un mandat social sans contrat de travail ne donne pas lieu à une déclaration d'embauche.",
      }, { status: 400 });
    }
    const estApprenti = typeCt === "apprentissage";
    const estContratPro = typeCt === "professionnalisation";
    if (typeCt !== "cdi" && typeCt !== "cdd" && !estApprenti && !estContratPro) {
      return NextResponse.json({
        erreur: "type de contrat « " + q(ct.type_contrat) + " » : la déclaration d'embauche par "
          + "signalement n'admet que le CDI et le CDD de droit privé.",
      }, { status: 400 });
    }
    // 01 = CDI, 02 = CDD (cahier technique, rubrique 40.007, controle CCH-11).
    // L apprenti et le contrat de professionnalisation sont l un ou l autre
    // selon qu ils portent une date de fin, comme dans la DSN du mois.
    const aDureeDeterminee = typeCt === "cdd"
      || ((estApprenti || estContratPro) && !!q(ct.date_fin));
    const natureContrat = aDureeDeterminee ? "02" : "01";

    const dateEmbauche = q(ct.date_debut).slice(0, 10);
    if (!dateDsn(dateEmbauche)) {
      return NextResponse.json({
        erreur: "le contrat n'a pas de date de début : c'est la date prévisible d'embauche.",
      }, { status: 400 });
    }

    // ---- L HEURE PREVISIBLE D EMBAUCHE : quatre chiffres, HHMM ----
    const heureBrute = q(c.heure).replace(/[^0-9]/g, "");
    const heure = heureBrute.length === 3 ? "0" + heureBrute : heureBrute;
    if (!/^(?:[01][0-9]|2[0-3])[0-5][0-9]$/.test(heure)) {
      return NextResponse.json({
        erreur: "heure d'embauche illisible : indiquez l'heure à laquelle le salarié commence, "
          + "par exemple 09:00.",
      }, { status: 400 });
    }

    // ---- LA PERIODE D ESSAI, en jours ----
    const essaiSaisi = q(c.essai_jours);
    const essaiContrat = ct.essai_duree_jours === null || ct.essai_duree_jours === undefined
      ? "" : q(ct.essai_duree_jours);
    const essaiTexte = essaiSaisi !== "" ? essaiSaisi : essaiContrat;
    let essai: number | null = null;
    if (essaiTexte !== "") {
      const n = Number(essaiTexte.replace(",", "."));
      if (!isFinite(n) || n < 0 || n > 999 || Math.round(n) !== n) {
        return NextResponse.json({
          erreur: "période d'essai illisible : indiquez un nombre entier de jours (0 s'il n'y en a pas).",
        }, { status: 400 });
      }
      essai = n;
    }
    let essaiObligatoire = natureContrat === "01";
    if (natureContrat === "02" && q(ct.date_fin)) {
      // Plus de six mois entre l embauche et la fin prevue (controle CCH-12).
      const d0 = new Date(dateEmbauche + "T00:00:00Z");
      const limite = new Date(d0.getTime());
      limite.setUTCMonth(limite.getUTCMonth() + 6);
      const d1 = new Date(q(ct.date_fin).slice(0, 10) + "T00:00:00Z");
      if (d1.getTime() > limite.getTime()) essaiObligatoire = true;
    }
    if (essaiObligatoire && essai === null) {
      return NextResponse.json({
        erreur: "période d'essai manquante : elle est obligatoire pour "
          + (natureContrat === "01" ? "un contrat à durée indéterminée" : "un contrat de plus de six mois")
          + ". Indiquez son nombre de jours (0 s'il n'y en a pas).",
      }, { status: 400 });
    }

    // ---- LE FICHIER ----
    const anomalies: string[] = [];
    const rappels: string[] = [];
    const L: string[] = [];
    const dernierePar: Record<string, number> = {};
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

    const codeApe = apeDsn(societe.code_ape);
    if (!codeApe) {
      anomalies.push("Code APE de la société absent ou mal formé (S21.G00.11.002). ⛔ RUBRIQUE "
        + "OBLIGATOIRE : le compléter dans la fiche du dossier.");
    }
    if (!q(societe.code_postal) || !q(societe.ville) || !q(societe.adresse)) {
      anomalies.push("Adresse de la société incomplète (voie, code postal ou ville). ⛔ RUBRIQUES "
        + "OBLIGATOIRES : les compléter dans la fiche du dossier.");
    }

    const qui = (q(sal.prenom) + " " + q(sal.nom)).trim() || "Le salarié";
    const nirComplet = q(sal.numero_secu).replace(/[^0-9AaBb]/g, "").toUpperCase();
    const nir = nirComplet.slice(0, 13);
    if (nirComplet.length > 0 && nirComplet.length < 13) {
      anomalies.push(qui + " : numéro de sécurité sociale incomplet (S21.G00.30.001).");
    }
    if (nirComplet.length === 0) {
      rappels.push(qui + " : aucun numéro de sécurité sociale. La norme l'admet pour une embauche "
        + "(rubrique conditionnelle), mais l'identification du salarié repose alors sur son nom, "
        + "sa date et son lieu de naissance.");
    }
    if (!q(sal.nom) || !q(sal.prenom)) {
      anomalies.push("Nom ou prénom du salarié absent (S21.G00.30.002 et 004). ⛔ RUBRIQUES OBLIGATOIRES.");
    }
    if (!dateDsn(sal.date_naissance)) {
      anomalies.push(qui + " : date de naissance absente (S21.G00.30.006). ⛔ RUBRIQUE OBLIGATOIRE.");
    }
    const sexe = sexeDsn(sal.sexe, nirComplet);
    if (!sexe) {
      anomalies.push(qui + " : sexe indéterminé (S21.G00.30.005) — ni saisi, ni déductible du numéro "
        + "de sécurité sociale. ⛔ RUBRIQUE OBLIGATOIRE.");
    }
    if (!q(sal.lieu_naissance)) {
      anomalies.push(qui + " : lieu de naissance absent (S21.G00.30.007). ⛔ RUBRIQUE OBLIGATOIRE "
        + "dans une déclaration d'embauche : le compléter par « modifier le contrat ».");
    }
    if (!q(societe.spst_identifiant)) {
      anomalies.push("Identifiant du service de santé au travail absent (S21.G00.30.030). ⛔ RUBRIQUE "
        + "OBLIGATOIRE dans une déclaration d'embauche : le compléter dans la fiche du dossier "
        + "(« Service de santé au travail »).");
    }

    // Le dispositif ne s ecrit que pour l apprenti et le contrat de
    // professionnalisation ; il entraine le niveau de diplome prepare.
    let dispositif = "";
    if (estContratPro) dispositif = "61";
    if (estApprenti) {
      dispositif = ct.apprenti_public === true ? "81"
        : (Number(societe.effectif || 0) >= 11 ? "65" : "64");
      if (!q(ct.niveau_diplome_prepare)) {
        anomalies.push(qui + " : niveau de diplôme préparé absent (S21.G00.30.025). ⛔ OBLIGATOIRE "
          + "pour un apprenti : le compléter sur le contrat.");
      }
      if (dispositif === "81" && natureContrat !== "02") {
        anomalies.push(qui + " : un apprenti du secteur public se déclare en contrat à durée "
          + "déterminée (rubrique 40.008, contrôle CCH-11) : son contrat n'a pas de date de fin.");
      }
    }

    // ══ S10 — L ENVOI ══
    ecrire("S10.G00.00.001", NOM_LOGICIEL);
    ecrire("S10.G00.00.002", NOM_EDITEUR);
    ecrire("S10.G00.00.003", VERSION_LOGICIEL);
    ecrire("S10.G00.00.005", "01");            // essai
    ecrire("S10.G00.00.006", NORME);
    ecrire("S10.G00.00.007", "01");            // net-entreprises (MSA interdit ici)
    ecrire("S10.G00.00.008", "01");            // envoi normal

    ecrire("S10.G00.01.001", siret.slice(0, 9));
    ecrire("S10.G00.01.002", siret.slice(9));
    ecrire("S10.G00.01.003", societe.raison_sociale);
    ecrire("S10.G00.01.004", societe.adresse);
    ecrire("S10.G00.01.005", q(societe.code_postal));
    ecrire("S10.G00.01.006", societe.ville);

    ecrire("S10.G00.02.002", q(societe.contact_nom) || CONTACT_DEFAUT);
    ecrire("S10.G00.02.004", q(societe.contact_email) || EMAIL_DEFAUT);
    ecrire("S10.G00.02.005", q(societe.contact_tel) || TELEPHONE_DEFAUT);

    // ══ S20 — LA DECLARATION ══
    // Le numero d ordre avance a chaque generation : chaque fichier est une
    // declaration « normale » (01), jamais un « annule et remplace ».
    let ordre = 1;
    let tableAbsente = "";
    {
      const { data: deja, error: eDeja } = await supabase
        .from("paie_embauches")
        .select("numero_ordre")
        .eq("contrat_id", contratId)
        .maybeSingle();
      if (eDeja) tableAbsente = eDeja.message;
      else if (deja) ordre = (Number((deja as any).numero_ordre) || 0) + 1;
    }

    const maintenant = new Date();
    const dateConstitution = String(maintenant.getDate()).padStart(2, "0")
      + String(maintenant.getMonth() + 1).padStart(2, "0")
      + String(maintenant.getFullYear());

    ecrire("S20.G00.05.001", "10");
    ecrire("S20.G00.05.002", "01");
    ecrire("S20.G00.05.003", "11");            // fraction 1 sur 1, obligatoire
    ecrire("S20.G00.05.004", String(ordre));
    ecrire("S20.G00.05.007", dateConstitution);

    ecrire("S20.G00.07.001", q(societe.contact_nom) || CONTACT_DEFAUT);
    ecrire("S20.G00.07.002", q(societe.contact_tel) || TELEPHONE_DEFAUT);
    ecrire("S20.G00.07.003", q(societe.contact_email) || EMAIL_DEFAUT);
    ecrire("S20.G00.07.004", "01");

    // ══ S21.G00.06 — L ENTREPRISE (ni APEN ni voie : interdits ici) ══
    ecrire("S21.G00.06.001", siret.slice(0, 9));
    ecrire("S21.G00.06.002", siret.slice(9));
    ecrire("S21.G00.06.005", q(societe.code_postal));
    ecrire("S21.G00.06.006", societe.ville);

    // ══ S21.G00.11 — L ETABLISSEMENT ══
    ecrire("S21.G00.11.001", siret.slice(9));
    ecrire("S21.G00.11.002", codeApe);
    ecrire("S21.G00.11.003", societe.adresse);
    ecrire("S21.G00.11.004", q(societe.code_postal));
    ecrire("S21.G00.11.005", societe.ville);

    // ══ S21.G00.30 — LE SALARIE ══
    if (nir.length === 13) ecrire("S21.G00.30.001", nir);
    ecrire("S21.G00.30.002", sal.nom);
    ecrire("S21.G00.30.004", sal.prenom);
    ecrire("S21.G00.30.005", sexe);
    ecrire("S21.G00.30.006", dateDsn(sal.date_naissance));
    ecrire("S21.G00.30.007", sal.lieu_naissance);
    ecrire("S21.G00.30.008", sal.adresse);
    ecrire("S21.G00.30.009", q(sal.code_postal));
    ecrire("S21.G00.30.010", sal.ville);
    {
      const deptNaissance = nirComplet.length >= 7 ? nirComplet.slice(5, 7) : "";
      if (deptNaissance) ecrire("S21.G00.30.014", deptNaissance);
      const paysNaiss = q(sal.pays_naissance).toUpperCase();
      ecrire("S21.G00.30.015", paysNaiss.length === 2 ? paysNaiss : "FR");
    }
    if (estApprenti && q(ct.niveau_diplome_prepare)) {
      ecrire("S21.G00.30.025", q(ct.niveau_diplome_prepare));
    }
    ecrire("S21.G00.30.030", societe.spst_identifiant);

    // ══ S21.G00.40 — LE CONTRAT ══
    const numeroContrat = String(ct.id).replace(/-/g, "").slice(0, 20);
    ecrire("S21.G00.40.001", dateDsn(dateEmbauche));   // date previsible d embauche
    ecrire("S21.G00.40.006", ct.intitule_poste);
    ecrire("S21.G00.40.007", natureContrat);
    if (dispositif) ecrire("S21.G00.40.008", dispositif);
    ecrire("S21.G00.40.009", numeroContrat);
    if (natureContrat === "02" && q(ct.date_fin)) ecrire("S21.G00.40.010", dateDsn(ct.date_fin));
    if (essai !== null) ecrire("S21.G00.40.082", String(essai));
    ecrire("S21.G00.40.083", heure);

    if (natureContrat === "02" && !q(ct.date_fin)) {
      anomalies.push(qui + " : contrat à durée déterminée sans date de fin prévue "
        + "(S21.G00.40.010). La renseigner par « modifier le contrat ».");
    }

    // ══ S90 — LE TOTAL ══
    const nbRubriques = L.length + 2;
    L.push("S90.G00.90.001,'" + nbRubriques + "'");
    L.push("S90.G00.90.002,'1'");

    const contenu = L.join("\r\n") + "\r\n";
    const nomFichier = "DSN-" + siret + "-EMBAUCHE-" + dateEmbauche.replace(/-/g, "") + ".txt";

    // ---- LE DELAI : dans les 8 jours qui precedent l embauche ----
    {
      const aujourdhui = new Date().toISOString().slice(0, 10);
      const jEmbauche = new Date(dateEmbauche + "T00:00:00Z").getTime();
      const jAujourdhui = new Date(aujourdhui + "T00:00:00Z").getTime();
      const ecart = Math.round((jEmbauche - jAujourdhui) / 86400000);
      if (ecart < 0) {
        rappels.push("🚨 La date d'embauche (" + dateEmbauche.split("-").reverse().join("/")
          + ") est passée : la déclaration préalable devait partir AVANT l'embauche. La déposer "
          + "sans attendre.");
      } else if (ecart > 8) {
        rappels.push("La déclaration se dépose dans les 8 jours qui précèdent l'embauche : il reste "
          + ecart + " jours avant le " + dateEmbauche.split("-").reverse().join("/") + ".");
      }
    }

    // ---- ON GARDE LE FICHIER ----
    if (!tableAbsente) {
      const { error: eUp } = await supabase
        .from("paie_embauches")
        .upsert({
          tenant_id: ct.tenant_id,
          societe_id: ct.societe_id,
          contrat_id: contratId,
          date_embauche: dateEmbauche,
          heure: heure,
          essai_jours: essai,
          numero_ordre: ordre,
          fichier: contenu,
          nom_fichier: nomFichier,
          nb_lignes: L.length,
          anomalies: anomalies,
          statut: "genere",
          genere_par: q(c.par) || null,
          maj_le: new Date().toISOString(),
        }, { onConflict: "contrat_id" });
      if (eUp) tableAbsente = eUp.message;
    }
    if (tableAbsente) {
      rappels.push("⚠️ Le fichier n'a pas pu être gardé en base (" + tableAbsente
        + ") : le télécharger maintenant.");
    }

    return NextResponse.json({
      success: true,
      nom_fichier: nomFichier,
      nature: "10",
      type: "déclaration préalable à l'embauche",
      salarie: qui,
      lignes: L.length,
      contenu: contenu,
      anomalies: anomalies,
      reserves: rappels.concat([
        "⛔ PASSER LE FICHIER DANS dsn-val avant tout dépôt réel : cette déclaration n'y est "
          + "encore jamais passée.",
        "L'envoi est en MODE ESSAI (S10.G00.00.005 = 01).",
        "Cette voie est facultative : la déclaration d'embauche peut toujours se faire par la "
          + "voie habituelle de l'URSSAF.",
        "Le canal de transmission n'est pas branché : le fichier se dépose à la main sur "
          + "net-entreprises.",
      ]),
      message: anomalies.length > 0
        ? "⚠️ " + anomalies.length + " anomalie(s) à corriger avant dépôt."
        : "Déclaration d'embauche générée. Aucune anomalie détectée à la génération.",
    });
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
