import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════════════
// LES RETOURS DE LA DSN — 18/09/2026, version 1
//
// Deposer ne suffit pas. Ce sont les RETOURS qui disent si la declaration
// est passee, et ce sont eux qui rapportent des donnees qu on ne peut
// obtenir nulle part ailleurs — a commencer par le taux de prelevement a
// la source de chaque salarie.
//
//   ?action=essai                   verifie les colonnes, sans rien appeler
//   ?action=rafraichir              TOUTES les societes qui ont des acces
//   ?action=rafraichir&societe=…    une seule
//   ?action=flux&declaration=…      les retours d un depot precis
//   ?action=liste&societe=…         ce qui est deja en base
//
// SOURCE : « Guide d implementation de l API DSN », v6.9 du 04/09/2026,
// sections 3.4 (consultation des retours), 3.5 (telechargement), 5.1
// (ecrasement), 6 (natures de retour), 8.3.2 (etendue de la plage).
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨🚨 LA CONTRAINTE QUI COMMANDE TOUTE L ARCHITECTURE
//
// LA PLAGE DE RECHERCHE EST LIMITEE A SOIXANTE MINUTES (section 8.3.2).
// Chaque reponse porte l en-tete `Accept-Ranges: minutes=0-60` qui dit
// l etendue permise — et ce nombre « pourra etre ajuste a tout moment ».
//
// ⛔ ON NE PEUT DONC PAS DEMANDER « TOUS LES RETOURS DEPUIS LUNDI ».
// Trois jours de retard = 72 appels. C est pour cela que cette route
// n interroge pas une periode choisie par l utilisateur, mais AVANCE UN
// CURSEUR : compta_societes.dsn_retours_curseur retient ou on en est, et
// chaque passage traite un certain nombre de tranches d une heure.
//
// LE CALCUL, fait avant de fixer le reglage :
//   cron toutes les heures, 24 tranches par passage
//   → en regime normal, une seule tranche a traiter : on est a jour
//   → apres trois jours d arret (72 tranches), rattrapage en 3 passages,
//     donc 3 heures. Apres un mois d arret : 31 passages, soit 31 heures.
// ⚠️ SI LE RETARD SE COMPTE EN MOIS, il vaudra mieux relever TRANCHES_MAX
// une fois plutot que d attendre — mais jamais au point de depasser la
// duree d execution de la route.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 UN RETOUR PEUT ETRE ECRASE (section 5.1)
//
// « Les OPS ont la possibilite d ecraser un retour pour l enrichir au fur
// et a mesure du traitement metier. » Peuvent changer : la date de
// production, la date de publication, LE STATUT et l url.
//
// ⛔ DONC ON NE FAIT PAS QUE DES INSERTIONS. Un retour est identifie par
// (identifiant de flux, nature, organisme) : c est la cle unique posee en
// base, et une deuxieme visite MET A JOUR la ligne au lieu d en creer une
// seconde. Sans cela, un CRM enrichi trois fois donnerait trois lignes
// contradictoires, et on ne saurait pas laquelle fait foi.
//
// ⚠️ « Une version ecrasee n est plus disponible au telechargement » : on
// garde donc le contenu qu on a rapatrie, meme quand il disparait de chez
// eux.
// ⚠️ « Il n est pas possible de determiner quand il n y aura plus aucun
// retour pour un flux » : on ne cherche donc jamais a declarer un dossier
// « complet ».
//
// ═══════════════════════════════════════════════════════════════════════
// LES NATURES DE RETOUR QUI NOUS CONCERNENT (section 6)
//
//   10  Accuse d Enregistrement Electronique — ou AVIS DE REJET
//   11  Certificat de conformite — ou BILAN D ANOMALIES
//   20  Bilan d Identification des Salaries
//   21  Controles inter-declarations
//   22  Controle des arrets de plus de 6 mois
//   23  Controles temps partiel therapeutique
//   31  Compte-rendu metier AT/RT (CNAM)
//   44  AER ou compte-rendu metier FCTU (France Travail)
//   61  Compte-rendu metier URSSAF, donnees agregees
//   71  Compte-rendu metier AGIRC-ARRCO
//   92  Accuse de reception DGFiP
//   93  Compte-rendu metier DGFiP, donnees agregees
//   94  🚨 COMPTE-RENDU METIER DGFiP, DONNEES NOMINATIVES : LES TAUX DU
//       PRELEVEMENT A LA SOURCE, salarie par salarie. C est ce retour qui
//       remplira paie_salaries.taux_pas tout seul.
//   95  Compte-rendu metier DGFiP, taux sur taux
//
// ⚠️ LE STATUT SE LIT AINSI (section 5) :
//   OK        rien a corriger
//   ANO       anomalies non bloquantes : le traitement s est termine
//   KO        anomalie bloquante : le traitement s est arrete
//   EN COURS  la declaration est en cours de distribution
//
// ⛔ CETTE VERSION RAPATRIE ET RANGE LES RETOURS. Elle ne les DEPOUILLE
// pas : lire le contenu du 94 pour en tirer les taux et les ecrire dans
// paie_salaries est la piece suivante, et elle ne s ecrira bien qu avec un
// vrai retour sous les yeux — sa forme exacte depend du cahier technique,
// pas de ce guide.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";

const LOGICIEL = "Mr Comptable";
const EDITEUR = "AcadeMIA Pro LLC";
const VERSION_LOGICIEL = "1.0.0";
const USER_AGENT = "Client-DSN (" + LOGICIEL + "/" + VERSION_LOGICIEL + "; " + EDITEUR + ")";

const DELAI_MS = 25000;

// Le reglage explique en tete de fichier.
const TRANCHES_MAX = 24;
const MINUTES_PAR_TRANCHE_DEFAUT = 60;

// ⚠️ ON NE REMONTE PAS PLUS LOIN QUE TRENTE JOURS a la premiere visite :
// les retours sont conserves trois mois, mais une societe qu on vient de
// brancher n a rien depose avant, et 90 jours feraient 2 160 tranches.
const PREMIERE_VISITE_JOURS = 30;

// ⚠️ ON NE S APPROCHE PAS DE L INSTANT PRESENT : un retour publie a la
// seconde ou on interroge pourrait etre manque. On laisse deux minutes.
const RETRAIT_MINUTES = 2;

const ADRESSES = {
  general: {
    authentification: "https://services.net-entreprises.fr/authentifier/1.0/",
    retours_declarant: "https://consultation.dsnrg.net-entreprises.fr/lister-retours-declarant/2.0/",
    retours_flux: "https://consultation.dsnrg.net-entreprises.fr/lister-retours-flux/2.0/",
    service: "25",
  },
  agricole: {
    authentification: "https://services.net-entreprises.fr/authentifier/1.0/",
    retours_declarant: "https://consultation.dsnra.net-entreprises.fr/lister-retours-declarant/2.0/",
    retours_flux: "https://consultation.dsnra.net-entreprises.fr/lister-retours-flux/2.0/",
    service: "26",
  },
};

// 🚨 LES SEULS HOTES DONT ON ACCEPTE DE TELECHARGER UN FICHIER.
// L url de telechargement est fournie par le service (API hypermedia) :
// on la suit, mais on ne suit JAMAIS une adresse quelconque au seul motif
// qu une reponse nous l a donnee.
const HOTES_TELECHARGEMENT = [
  "telechargement.dsnrg.net-entreprises.fr",
  "telechargement-edit.dsnrg.net-entreprises.fr",
  "telechargement.dsnra.net-entreprises.fr",
  "telechargement-formation.dsnra.net-entreprises.fr",
];

const NATURES: Record<string, string> = {
  "10": "Accusé d'enregistrement ou avis de rejet",
  "11": "Certificat de conformité ou bilan d'anomalies",
  "20": "Bilan d'identification des salariés",
  "21": "Contrôles inter-déclarations",
  "22": "Contrôle des arrêts de plus de 6 mois",
  "23": "Contrôles temps partiel thérapeutique",
  "30": "Accusé de réception CNAM",
  "31": "Compte-rendu métier AT/RT",
  "34": "Compte-rendu métier AT",
  "40": "Accusé de réception France Travail",
  "42": "Compte-rendu métier CDDU-D",
  "44": "AER ou compte-rendu métier fin de contrat",
  "50": "Accusé de distribution à l'organisme complémentaire",
  "51": "Compte-rendu métier de l'organisme complémentaire",
  "60": "Accusé de réception URSSAF",
  "61": "Compte-rendu métier URSSAF, données agrégées",
  "70": "Accusé de réception AGIRC-ARRCO",
  "71": "Compte-rendu métier AGIRC-ARRCO",
  "90": "Compte-rendu mandat à acquitter",
  "92": "Accusé de réception DGFiP",
  "93": "Compte-rendu métier DGFiP, données agrégées",
  "94": "Compte-rendu métier DGFiP, taux du prélèvement à la source",
  "95": "Compte-rendu métier DGFiP, taux sur taux",
  "135": "Compte-rendu métier fin de contrat, format NEOReS",
};

function nomDeLaNature(n: string): string {
  return NATURES[String(n)] || ("Retour de nature " + n);
}

// ---------------------------------------------------------------------
// OUTILS
// ---------------------------------------------------------------------

function reponse(corps: any, statut: number) {
  return NextResponse.json(corps, {
    status: statut,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function autorise(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

function xml(v: string): string {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function plat(v: string | null): string {
  return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function uuid(v: string | null): string | null {
  const t = String(v || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t) ? t : null;
}

// AAAAMMJJHHMMSS, en heure locale du serveur — le format des plages.
function horodatage(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return String(d.getFullYear()) + p(d.getMonth() + 1) + p(d.getDate())
    + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

// L en-tete « Accept-Ranges: minutes=0-60 » dit l etendue permise.
// ⚠️ ON LA LIT PLUTOT QUE DE LA SUPPOSER : le guide dit que ce nombre peut
// changer a tout moment. S il passe a 120, on avance deux fois plus vite
// sans toucher au code.
function minutesPermises(entete: string | null): number {
  const m = String(entete || "").match(/minutes\s*=\s*\d+\s*-\s*(\d+)/i);
  const n = m ? Number(m[1]) : 0;
  return n > 0 ? n : MINUTES_PAR_TRANCHE_DEFAUT;
}

// ---------------------------------------------------------------------
// LE CHIFFREMENT — identique a app/api/dsn/deposer/route.ts
// ---------------------------------------------------------------------

function cleDeChiffrement(): Buffer | null {
  const brut = process.env.DSN_CLE_CHIFFREMENT || "";
  if (!brut) return null;
  let cle: Buffer;
  try {
    cle = Buffer.from(brut, "base64");
  } catch {
    return null;
  }
  return cle.length === 32 ? cle : null;
}

function dechiffrer(enveloppe: string, cle: Buffer): string | null {
  const parts = String(enveloppe || "").split(":");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  try {
    const iv = Buffer.from(parts[1], "base64");
    const marque = Buffer.from(parts[2], "base64");
    const chiffre = Buffer.from(parts[3], "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", cle, iv);
    d.setAuthTag(marque);
    return Buffer.concat([d.update(chiffre), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// L AUTHENTIFICATION
// ---------------------------------------------------------------------

type Acces = {
  id: string;
  societe_id: string;
  tenant_id: string | null;
  regime: string;
  siret_declarant: string | null;
  nom_declarant: string | null;
  prenom_declarant: string | null;
  identifiant_msa: string | null;
  secret_chiffre: string;
};

function lireRefus(code: number, www: string | null): string {
  const w = plat(www);
  if (code === 401 && w.includes("expiration du mot de passe")) {
    return "Le mot de passe net-entreprises de ce déclarant est périmé.";
  }
  if (code === 401 && w.includes("non-inscrit")) {
    return "Ce déclarant n'est pas inscrit au service DSN (l'inscription prend effet le lendemain).";
  }
  if (code === 401 && w.includes("jeton")) return "Le jeton est absent ou périmé.";
  if (code === 401) return "Compte inconnu, ou SIRET, nom, prénom ou mot de passe incorrect.";
  if (code === 403) {
    return "Accès refusé (403) : compte bloqué après plusieurs tentatives, ou tentative de "
      + "consulter les retours d'une déclaration déposée par quelqu'un d'autre.";
  }
  if (code === 406) return "Format refusé (406).";
  if (code === 422) return "net-entreprises refuse les paramètres envoyés (422).";
  if (code === 429) return "Trop d'appels rapprochés (429) : la plage demandée est trop large.";
  if (code === 404 || code === 503) return "Le service est indisponible (" + code + ").";
  return "Réponse inattendue du service (" + code + ").";
}

async function authentifier(acces: Acces, motDePasse: string): Promise<
  { ok: true; jeton: string } | { ok: false; lecture: string; code: number | null }
> {
  const conf = acces.regime === "agricole" ? ADRESSES.agricole : ADRESSES.general;

  const corps = acces.regime === "agricole" && acces.identifiant_msa
    ? "<identifiants>\n  <identifiant>" + xml(acces.identifiant_msa) + "</identifiant>\n"
      + "  <motdepasse>" + xml(motDePasse) + "</motdepasse>\n</identifiants>"
    : "<identifiants>\n  <siret>" + xml(acces.siret_declarant || "") + "</siret>\n"
      + "  <nom>" + xml(acces.nom_declarant || "") + "</nom>\n"
      + "  <prenom>" + xml(acces.prenom_declarant || "") + "</prenom>\n"
      + "  <motdepasse>" + xml(motDePasse) + "</motdepasse>\n"
      + "  <service>" + conf.service + "</service>\n</identifiants>";

  const garde = new AbortController();
  const minuterie = setTimeout(() => garde.abort(), DELAI_MS);
  try {
    const rep = await fetch(conf.authentification, {
      method: "POST",
      headers: { "Content-Type": "application/xml", "User-Agent": USER_AGENT },
      body: corps,
      redirect: "manual",
      cache: "no-store",
      signal: garde.signal,
    });
    if (rep.status !== 200) {
      return { ok: false, code: rep.status, lecture: lireRefus(rep.status, rep.headers.get("www-authenticate")) };
    }
    const jeton = (await rep.text()).trim();
    if (!jeton) return { ok: false, code: 200, lecture: "Le service a répondu 200 mais sans jeton." };
    return { ok: true, jeton: jeton };
  } catch (e: any) {
    const nom = String((e && e.name) || "");
    return {
      ok: false, code: null,
      lecture: nom === "AbortError" ? "Aucune réponse dans le délai."
        : "Liaison impossible : " + String((e && e.message) || e),
    };
  } finally {
    clearTimeout(minuterie);
  }
}

async function ouvrirAcces(societeId: string): Promise<
  { ok: true; acces: Acces; motDePasse: string } | { ok: false; statut: number; erreur: string }
> {
  const cle = cleDeChiffrement();
  if (!cle) {
    return { ok: false, statut: 500,
      erreur: "DSN_CLE_CHIFFREMENT absente de Vercel, ou pas 32 octets une fois décodée." };
  }

  const { data, error } = await supabase
    .from("dsn_acces")
    .select("id, societe_id, tenant_id, regime, siret_declarant, nom_declarant, "
      + "prenom_declarant, identifiant_msa, secret_chiffre, actif")
    .eq("societe_id", societeId).eq("portail", "net-entreprises").maybeSingle();

  if (error) return { ok: false, statut: 500, erreur: "lecture des accès impossible : " + error.message };
  if (!data) return { ok: false, statut: 404, erreur: "aucun accès net-entreprises pour cette société" };
  if (data.actif === false) return { ok: false, statut: 409, erreur: "accès désactivés" };

  const motDePasse = dechiffrer(data.secret_chiffre, cle);
  if (!motDePasse) {
    return { ok: false, statut: 500,
      erreur: "Mot de passe illisible avec la clé actuelle : il faut réenregistrer les accès." };
  }

  return {
    ok: true,
    acces: {
      id: data.id, societe_id: data.societe_id, tenant_id: data.tenant_id,
      regime: data.regime || "general", siret_declarant: data.siret_declarant,
      nom_declarant: data.nom_declarant, prenom_declarant: data.prenom_declarant,
      identifiant_msa: data.identifiant_msa, secret_chiffre: data.secret_chiffre,
    },
    motDePasse: motDePasse,
  };
}

// ---------------------------------------------------------------------
// LIRE LA REPONSE DU SERVICE
//
// ⚠️ LE JSON DU GUIDE N EST PAS REGULIER : « depot » est tantot un objet,
// tantot un tableau, et il en va de meme pour « flux » et « retour ». On
// normalise plutot que de supposer une forme.
// ---------------------------------------------------------------------
function enTableau(v: any): any[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

type RetourLu = {
  idflux: string;
  publication: string | null;
  production: string | null;
  nature: string;
  statut: string | null;
  ops: string | null;
  delegataire: string | null;
  url: string | null;
};

function lireRetours(corps: any): RetourLu[] {
  const sortie: RetourLu[] = [];
  const racine = corps && corps.retours ? corps.retours : corps;
  const fluxs = enTableau(racine && racine.flux ? racine.flux : null);

  for (const f of fluxs) {
    const idflux = String((f && f.id) || "").trim();
    if (!idflux) continue;
    for (const r of enTableau(f.retour)) {
      const nature = String((r && r.nature) || "").trim();
      if (!nature) continue;
      sortie.push({
        idflux: idflux,
        publication: r.publication ? String(r.publication) : null,
        production: r.production ? String(r.production) : null,
        nature: nature,
        statut: r.statut ? String(r.statut) : null,
        ops: r.ops ? String(r.ops) : null,
        delegataire: r.delegataire ? String(r.delegataire) : null,
        url: r.url ? String(r.url) : null,
      });
    }
  }
  return sortie;
}

// ---------------------------------------------------------------------
// TELECHARGER UN RETOUR
//
// 🚨 L URL VIENT DU SERVICE, MAIS ON VERIFIE SON HOTE. Suivre une adresse
// quelconque parce qu une reponse nous l a donnee, c est ouvrir la porte a
// n importe quoi.
// ---------------------------------------------------------------------
async function telecharger(url: string, jeton: string): Promise<
  { ok: true; octets: Buffer; type: string | null } | { ok: false; lecture: string }
> {
  let hote = "";
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return { ok: false, lecture: "adresse non sécurisée, ignorée" };
    hote = u.hostname;
  } catch {
    return { ok: false, lecture: "adresse de téléchargement illisible" };
  }
  if (HOTES_TELECHARGEMENT.indexOf(hote) < 0) {
    return { ok: false, lecture: "adresse hors des hôtes de téléchargement connus (" + hote + ")" };
  }

  const garde = new AbortController();
  const minuterie = setTimeout(() => garde.abort(), DELAI_MS);
  try {
    const rep = await fetch(url, {
      method: "GET",
      headers: { "Authorization": "DSNLogin jeton=" + jeton, "User-Agent": USER_AGENT },
      redirect: "manual",
      cache: "no-store",
      signal: garde.signal,
    });
    if (rep.status !== 200) {
      return { ok: false, lecture: "téléchargement refusé : " + lireRefus(rep.status, rep.headers.get("www-authenticate")) };
    }
    const octets = Buffer.from(await rep.arrayBuffer());
    return { ok: true, octets: octets, type: rep.headers.get("content-type") };
  } catch (e: any) {
    const nom = String((e && e.name) || "");
    return { ok: false, lecture: nom === "AbortError" ? "téléchargement sans réponse dans le délai"
      : "téléchargement impossible : " + String((e && e.message) || e) };
  } finally {
    clearTimeout(minuterie);
  }
}

// ---------------------------------------------------------------------
// RANGER UN RETOUR
//
// 🚨 INSERTION OU MISE A JOUR, JAMAIS UN DOUBLON : la cle unique en base
// est (idflux, nature, organisme). Un retour ecrase se retrouve ici avec
// le meme triplet et remplace le precedent.
// ---------------------------------------------------------------------
async function rangerRetour(
  r: RetourLu, acces: Acces, jeton: string,
  declarations: Record<string, { id: string; tenant_id: string | null }>
): Promise<{ range: boolean; telecharge: boolean; note: string | null }> {

  const decl = declarations[r.idflux] || null;

  let contenu: string | null = null;
  let chemin: string | null = null;
  let format: string | null = null;
  let note: string | null = null;
  let telecharge = false;

  // Le champ url n est renseigne que si un document existe : un accuse
  // « Aucun » de la table des natures n en a pas, et un KO peut ne pas en
  // avoir non plus. Son absence n est donc pas une anomalie.
  if (r.url) {
    const dl = await telecharger(r.url, jeton);
    if (dl.ok) {
      telecharge = true;
      format = dl.type;
      const binaire = String(dl.type || "").indexOf("pdf") >= 0
        || String(dl.type || "").indexOf("zip") >= 0
        || String(dl.type || "").indexOf("octet-stream") >= 0;

      if (binaire) {
        // ⚠️ UN PDF NE SE RANGE PAS DANS UNE COLONNE DE TEXTE : il part
        // dans le bucket, et la base garde son chemin.
        const ext = String(dl.type || "").indexOf("zip") >= 0 ? "zip" : "pdf";
        chemin = (acces.tenant_id || "sans-tenant") + "/" + acces.societe_id
          + "/dsn-retours/" + r.idflux + "-" + r.nature
          + (r.ops ? "-" + r.ops : "") + "." + ext;
        const { error: eUp } = await supabase.storage.from(BUCKET)
          .upload(chemin, dl.octets, { contentType: String(dl.type || "application/pdf"), upsert: true });
        if (eUp) { note = "archivage impossible : " + eUp.message; chemin = null; }
      } else {
        // 🚨 LES RETOURS AU FORMAT DSN SONT EN ISO 8859-1, comme les
        // fichiers deposes. Les lire en UTF-8 abimerait les accents.
        contenu = dl.octets.toString("latin1");
      }
    } else {
      note = dl.lecture;
    }
  }

  const ligne: any = {
    tenant_id: acces.tenant_id,
    societe_id: acces.societe_id,
    declaration_id: decl ? decl.id : null,
    depot_reference: decl ? decl.id : r.idflux,
    idflux: r.idflux,
    nature: r.nature,
    statut: r.statut,
    ops: r.ops,
    delegataire: r.delegataire,
    publication: r.publication,
    production: r.production,
    url: r.url,
    format: format,
    chemin_fichier: chemin,
    type_retour: nomDeLaNature(r.nature),
    contenu: contenu,
    notes: note,
    maj_le: new Date().toISOString(),
  };

  // ⚠️ `traite` N EST PAS TOUCHE A LA MISE A JOUR : si quelqu un a deja
  // depouille ce retour, un enrichissement par l organisme ne doit pas
  // effacer ce travail. On ne le pose qu a la creation.
  const { data: existante } = await supabase.from("dsn_retours")
    .select("id, traite").eq("idflux", r.idflux).eq("nature", r.nature)
    .eq("ops", r.ops || "").maybeSingle();

  if (existante) {
    // ⚠️ ON N ECRASE PAS UN CONTENU DEJA RAPATRIE PAR DU VIDE : une
    // version ecrasee « n est plus disponible au telechargement », et le
    // service peut donc ne plus rien rendre.
    if (contenu === null) delete ligne.contenu;
    if (chemin === null) delete ligne.chemin_fichier;
    const { error } = await supabase.from("dsn_retours").update(ligne).eq("id", existante.id);
    if (error) return { range: false, telecharge: telecharge, note: error.message };
    return { range: true, telecharge: telecharge, note: note };
  }

  ligne.traite = false;
  const { error } = await supabase.from("dsn_retours").insert(ligne);
  if (error) return { range: false, telecharge: telecharge, note: error.message };
  return { range: true, telecharge: telecharge, note: note };
}

// Les declarations de cette societe dont on connait l identifiant de flux,
// pour rattacher chaque retour au depot qui l a produit.
async function declarationsParFlux(societeId: string): Promise<Record<string, { id: string; tenant_id: string | null }>> {
  const { data } = await supabase.from("dsn_declarations")
    .select("id, tenant_id, idflux").eq("societe_id", societeId).not("idflux", "is", null);
  const carte: Record<string, { id: string; tenant_id: string | null }> = {};
  for (const d of (data || [])) {
    if (d.idflux) carte[String(d.idflux)] = { id: d.id, tenant_id: d.tenant_id };
  }
  return carte;
}

// ---------------------------------------------------------------------
// LE RAFRAICHISSEMENT D UNE SOCIETE — le coeur de la route
// ---------------------------------------------------------------------
async function rafraichirUne(societe: any): Promise<any> {
  const ouvert = await ouvrirAcces(societe.id);
  if (!ouvert.ok) {
    return { societe_id: societe.id, fait: false, erreur: ouvert.erreur };
  }

  const jetonRep = await authentifier(ouvert.acces, ouvert.motDePasse);
  if (!jetonRep.ok) {
    await supabase.from("dsn_acces")
      .update({ dernier_echec: jetonRep.lecture, maj_le: new Date().toISOString() })
      .eq("id", ouvert.acces.id);
    return { societe_id: societe.id, fait: false, erreur: jetonRep.lecture };
  }
  await supabase.from("dsn_acces")
    .update({ verifie_le: new Date().toISOString(), dernier_echec: null, maj_le: new Date().toISOString() })
    .eq("id", ouvert.acces.id);

  const conf = ouvert.acces.regime === "agricole" ? ADRESSES.agricole : ADRESSES.general;
  const declarations = await declarationsParFlux(societe.id);

  // LE CURSEUR. Premiere visite : trente jours en arriere.
  const maintenant = new Date(Date.now() - RETRAIT_MINUTES * 60000);
  let depuis = societe.dsn_retours_curseur
    ? new Date(societe.dsn_retours_curseur)
    : new Date(Date.now() - PREMIERE_VISITE_JOURS * 86400000);
  if (isNaN(depuis.getTime())) depuis = new Date(Date.now() - PREMIERE_VISITE_JOURS * 86400000);

  let minutes = MINUTES_PAR_TRANCHE_DEFAUT;
  let tranches = 0;
  let retoursVus = 0;
  let ranges = 0;
  let telecharges = 0;
  const soucis: string[] = [];
  let refus: string | null = null;

  while (tranches < TRANCHES_MAX && depuis < maintenant) {
    const fin = new Date(Math.min(depuis.getTime() + minutes * 60000, maintenant.getTime()));

    const adresse = conf.retours_declarant + horodatage(depuis) + "/" + horodatage(fin);
    const garde = new AbortController();
    const minuterie = setTimeout(() => garde.abort(), DELAI_MS);

    let rep: Response;
    try {
      rep = await fetch(adresse, {
        method: "GET",
        headers: { "Authorization": "DSNLogin jeton=" + jetonRep.jeton, "User-Agent": USER_AGENT },
        redirect: "manual",
        cache: "no-store",
        signal: garde.signal,
      });
    } catch (e: any) {
      clearTimeout(minuterie);
      const nom = String((e && e.name) || "");
      refus = nom === "AbortError" ? "Aucune réponse dans le délai."
        : "Liaison impossible : " + String((e && e.message) || e);
      break;
    }
    clearTimeout(minuterie);

    if (rep.status !== 200) {
      refus = lireRefus(rep.status, rep.headers.get("www-authenticate"));
      break;
    }

    // ⚠️ ON LIT L ETENDUE PERMISE A CHAQUE REPONSE : le guide dit qu elle
    // peut etre ajustee a tout moment.
    minutes = minutesPermises(rep.headers.get("accept-ranges"));

    let corps: any = null;
    try {
      corps = await rep.json();
    } catch {
      soucis.push("réponse illisible sur la tranche du " + horodatage(depuis));
      corps = null;
    }

    const lus = corps ? lireRetours(corps) : [];
    retoursVus += lus.length;

    for (const r of lus) {
      const res = await rangerRetour(r, ouvert.acces, jetonRep.jeton, declarations);
      if (res.range) ranges++;
      if (res.telecharge) telecharges++;
      if (res.note) soucis.push(nomDeLaNature(r.nature) + " : " + res.note);
    }

    depuis = fin;
    tranches++;
  }

  // 🚨 LE CURSEUR N AVANCE QUE SUR CE QUI A ETE REELLEMENT LU. Un refus au
  // milieu du rattrapage laisse le curseur a la derniere tranche reussie :
  // le passage suivant reprendra la ou celui-ci s est arrete, sans trou.
  await supabase.from("compta_societes")
    .update({ dsn_retours_curseur: depuis.toISOString() })
    .eq("id", societe.id);

  return {
    societe_id: societe.id,
    fait: !refus,
    tranches_traitees: tranches,
    minutes_par_tranche: minutes,
    curseur: depuis.toISOString(),
    retard_restant_heures: Math.max(0,
      Math.round((maintenant.getTime() - depuis.getTime()) / 3600000 * 10) / 10),
    retours_vus: retoursVus,
    retours_ranges: ranges,
    documents_telecharges: telecharges,
    erreur: refus,
    soucis: soucis.slice(0, 20),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// GET
// ═══════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  if (!autorise(req)) return reponse({ erreur: "non autorise" }, 401);

  const p = req.nextUrl.searchParams;
  const action = String(p.get("action") || "");

  // ---- ESSAI : rien n est appele chez net-entreprises ----
  if (action === "essai") {
    const { error: eR, count: nRetours } = await supabase
      .from("dsn_retours").select("id", { count: "exact", head: true });
    const { error: eC } = await supabase
      .from("dsn_retours").select("idflux, nature, statut, ops, publication, chemin_fichier").limit(1);
    const { error: eD } = await supabase
      .from("dsn_declarations").select("idflux").limit(1);
    const { error: eS } = await supabase
      .from("compta_societes").select("dsn_retours_curseur").limit(1);

    const manques: string[] = [];
    if (eC) manques.push("colonnes de dsn_retours : " + eC.message);
    if (eD) manques.push("dsn_declarations.idflux : " + eD.message);
    if (eS) manques.push("compta_societes.dsn_retours_curseur : " + eS.message);

    return reponse({
      route: "dsn/retours",
      version: 1,
      cle_de_chiffrement: cleDeChiffrement() ? "utilisable" : "ABSENTE OU MAUVAISE",
      table_dsn_retours: eR ? "INTROUVABLE : " + eR.message : "présente",
      retours_en_base: eR ? null : (nRetours || 0),
      colonnes_manquantes: manques,
      reglage: {
        tranches_par_passage: TRANCHES_MAX,
        minutes_par_tranche: MINUTES_PAR_TRANCHE_DEFAUT,
        rattrapage_par_passage_heures: TRANCHES_MAX,
        premiere_visite_jours: PREMIERE_VISITE_JOURS,
      },
      verdict: manques.length === 0 && !eR
        ? "Tout est en place. Les retours peuvent être rapatriés dès qu'une déclaration aura été déposée."
        : "Il manque des colonnes : voir ci-dessus.",
    }, 200);
  }

  // ---- LISTE : ce qui est deja en base ----
  if (action === "liste") {
    const societeId = uuid(p.get("societe"));
    if (!societeId) return reponse({ erreur: "societe manquante ou mal formée" }, 400);

    const { data, error } = await supabase.from("dsn_retours")
      .select("id, idflux, nature, type_retour, statut, ops, publication, production, "
        + "declaration_id, chemin_fichier, traite, recu_le, notes")
      .eq("societe_id", societeId).order("recu_le", { ascending: false }).limit(200);

    if (error) return reponse({ erreur: "lecture impossible : " + error.message }, 500);

    return reponse({
      societe_id: societeId,
      nombre: (data || []).length,
      retours: (data || []).map(function (r: any) {
        return {
          id: r.id, idflux: r.idflux, nature: r.nature, libelle: r.type_retour,
          statut: r.statut, organisme: r.ops, publication: r.publication,
          declaration_id: r.declaration_id, document: !!r.chemin_fichier,
          traite: r.traite, recu_le: r.recu_le, notes: r.notes,
        };
      }),
    }, 200);
  }

  // ---- FLUX : les retours d un depot precis ----
  // Le guide conseille cette recherche « a la demande de l utilisateur »,
  // et la recherche par declarant « en arriere-plan ». C est donc celle du
  // bouton, quand on veut savoir tout de suite ou en est une declaration.
  if (action === "flux") {
    const declarationId = uuid(p.get("declaration"));
    if (!declarationId) return reponse({ erreur: "declaration manquante ou mal formée" }, 400);

    const { data: decl } = await supabase.from("dsn_declarations")
      .select("id, societe_id, tenant_id, idflux, periode").eq("id", declarationId).maybeSingle();

    if (!decl) return reponse({ erreur: "déclaration inconnue" }, 404);
    if (!decl.idflux) {
      return reponse({
        erreur: "Cette déclaration n'a pas d'identifiant de flux : il est délivré par "
          + "net-entreprises au moment du dépôt. Tant qu'elle n'a pas été déposée par l'API, "
          + "ses retours ne peuvent pas être recherchés par flux.",
      }, 409);
    }

    const ouvert = await ouvrirAcces(decl.societe_id);
    if (!ouvert.ok) return reponse({ erreur: ouvert.erreur }, ouvert.statut);

    const jetonRep = await authentifier(ouvert.acces, ouvert.motDePasse);
    if (!jetonRep.ok) return reponse({ erreur: jetonRep.lecture, code_http: jetonRep.code }, 400);

    const conf = ouvert.acces.regime === "agricole" ? ADRESSES.agricole : ADRESSES.general;
    const garde = new AbortController();
    const minuterie = setTimeout(() => garde.abort(), DELAI_MS);

    let rep: Response;
    try {
      rep = await fetch(conf.retours_flux + encodeURIComponent(decl.idflux), {
        method: "GET",
        headers: { "Authorization": "DSNLogin jeton=" + jetonRep.jeton, "User-Agent": USER_AGENT },
        redirect: "manual", cache: "no-store", signal: garde.signal,
      });
    } catch (e: any) {
      clearTimeout(minuterie);
      return reponse({ erreur: "liaison impossible : " + String((e && e.message) || e) }, 504);
    }
    clearTimeout(minuterie);

    if (rep.status !== 200) {
      return reponse({
        erreur: lireRefus(rep.status, rep.headers.get("www-authenticate")),
        code_http: rep.status,
      }, 400);
    }

    let corps: any = null;
    try {
      corps = await rep.json();
    } catch {
      return reponse({ erreur: "réponse illisible du service" }, 502);
    }

    const lus = lireRetours(corps);
    const carte: Record<string, { id: string; tenant_id: string | null }> = {};
    carte[String(decl.idflux)] = { id: decl.id, tenant_id: decl.tenant_id };

    let ranges = 0;
    let telecharges = 0;
    const soucis: string[] = [];
    for (const r of lus) {
      const res = await rangerRetour(r, ouvert.acces, jetonRep.jeton, carte);
      if (res.range) ranges++;
      if (res.telecharge) telecharges++;
      if (res.note) soucis.push(nomDeLaNature(r.nature) + " : " + res.note);
    }

    return reponse({
      success: true,
      declaration_id: decl.id,
      idflux: decl.idflux,
      retours_vus: lus.length,
      retours_ranges: ranges,
      documents_telecharges: telecharges,
      details: lus.map(function (r) {
        return { nature: r.nature, libelle: nomDeLaNature(r.nature), statut: r.statut,
          organisme: r.ops, publication: r.publication, document: !!r.url };
      }),
      soucis: soucis,
      // ⚠️ ON NE DIT JAMAIS « C EST COMPLET » : le guide previent qu il est
      // impossible de savoir quand un flux ne recevra plus de retour.
      rappel: "D'autres retours peuvent arriver plus tard, et un retour déjà reçu peut être "
        + "enrichi par l'organisme.",
    }, 200);
  }

  // ---- RAFRAICHIR : le passage de fond, une societe ou toutes ----
  if (action === "rafraichir") {
    const une = uuid(p.get("societe"));

    let societes: any[] = [];
    if (une) {
      const { data } = await supabase.from("compta_societes")
        .select("id, dsn_retours_curseur").eq("id", une).maybeSingle();
      if (!data) return reponse({ erreur: "société inconnue" }, 404);
      societes = [data];
    } else {
      // ⚠️ AUCUN PARAMETRE POUR LE CRON : la route choisit elle-meme les
      // societes qui ont des acces actifs.
      const { data: acces } = await supabase.from("dsn_acces")
        .select("societe_id").eq("portail", "net-entreprises").eq("actif", true);
      const ids = (acces || []).map(function (a: any) { return a.societe_id; });
      if (ids.length === 0) {
        return reponse({
          success: true, societes: 0,
          message: "Aucune société n'a d'accès net-entreprises enregistrés : rien à rapatrier.",
        }, 200);
      }
      const { data } = await supabase.from("compta_societes")
        .select("id, dsn_retours_curseur").in("id", ids);
      societes = data || [];
    }

    const resultats: any[] = [];
    for (const s of societes) {
      resultats.push(await rafraichirUne(s));
    }

    const total = resultats.reduce(function (n, r) { return n + (r.retours_ranges || 0); }, 0);
    const enRetard = resultats.filter(function (r) { return (r.retard_restant_heures || 0) > 0; });

    return reponse({
      success: resultats.every(function (r) { return r.fait; }),
      societes: resultats.length,
      retours_ranges: total,
      // 🚨 LE RETARD EST DIT : sans lui, on croirait etre a jour alors que
      // le curseur a trois jours de retard et qu il rattrape une heure par
      // heure.
      societes_en_retard: enRetard.length,
      resultats: resultats,
    }, 200);
  }

  return reponse({
    route: "dsn/retours",
    version: 1,
    actions: {
      essai: "?action=essai",
      rafraichir: "?action=rafraichir (toutes) ou &societe=<uuid>",
      flux: "?action=flux&declaration=<uuid>",
      liste: "?action=liste&societe=<uuid>",
    },
    rappel: "Changer &v=… à chaque rappel : Safari garde les réponses.",
  }, 200);
}
