import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import zlib from "zlib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 120;

// ═══════════════════════════════════════════════════════════════════════
// LE DEPOT DE LA DSN — 18/09/2026, version 2
//
// 🆕 VERSION 2 : le depot retrouve et enregistre L IDENTIFIANT DE FLUX, par
// le service « lister-depots ». La version 1 ne le gardait pas, et la
// route des retours n aurait donc rien pu rattacher. Voir `releverIdflux`.
//
// Cette route fait quatre choses, et rien d autre :
//   ?action=essai                    eprouve la cle de chiffrement, sans
//                                    aucun identifiant reel
//   POST action=enregistrer          garde les identifiants d un client,
//                                    CHIFFRES
//   ?action=tester&societe=…         s authentifie vraiment et s arrete la
//   ?action=deposer&declaration=…    depose le fichier et lit l accuse
//
// SOURCE : « Guide d implementation de l API DSN », v6.9 du 04/09/2026
// (GIP-MDS). Sections 2.3, 3.1, 3.2, 7, 9 et 10. La route de liaison
// (app/api/dsn/connexion/route.ts) a prouve le 18/09 que Vercel atteint
// les trois services : six verifications sur six.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 CE QUE LE GUIDE IMPOSE, MOT POUR MOT
//
// AUTHENTIFICATION (3.1)
//   POST application/xml, cinq balises, SANS compression.
//   La reponse a 200 : LE CORPS EST LE JETON, tel quel, encode en base 64
//   par le service. L en-tete « Expires » porte sa peremption.
//
// DEPOT (3.2)
//   POST du flux DSN, Content-Type: text/plain, Content-Encoding: gzip,
//   fichier en ISO 8859-1.
//   200 → ACCUSE D ENREGISTREMENT (AEE). 422 → AVIS DE REJET.
//   ⚠️ LES DEUX SE GARDENT : l avis de rejet dit POURQUOI.
//   ⚠️ DEPOT UNITAIRE : un seul flux, un seul bloc S20. Le service rend
//   quand meme un accuse si on ne respecte pas cette regle, et c est le
//   bilan d anomalies qui portera l erreur — donc on la controle NOUS.
//
// JETON (2.3.1)
//   Authorization: DSNLogin jeton=<le jeton>
//   Sur un 401 au service metier, le logiciel PEUT se reauthentifier une
//   fois et reemettre l appel. C est ce qu on fait, UNE SEULE FOIS.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 LE MOT DE PASSE DU CLIENT
//
// Le guide (3.1.2) : le mot de passe « est transmis en clair a chaque
// authentification. Par contre celui-ci doit etre chiffre s il est stocke
// dans le logiciel de paie ».
//
// Ici : AES-256-GCM, cle dans la variable Vercel DSN_CLE_CHIFFREMENT.
// ⛔ LE MOT DE PASSE N EST JAMAIS RENDU, JAMAIS JOURNALISE, JAMAIS
// REAFFICHE — meme a celui qui l a saisi. On ne peut que le remplacer.
// ⛔ IL NE PASSE JAMAIS PAR L ADRESSE (les adresses sont journalisees par
// Vercel) : l enregistrement est un POST, jamais un GET.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 LES DEUX GARDE-FOUS QUI COMPTENT
//
// 1. ESSAI OU REEL — ON LIT LE FICHIER, PAS LA BASE.
//    Le type d envoi est DANS le fichier, rubrique S10.G00.00.005 :
//    '01' = essai (rien n est declare), '02' = reel. Un fichier est une
//    photographie : changer dsn_mode en base APRES la generation ne le
//    change pas. Donc on lit la rubrique dans le fichier lui-meme, et un
//    depot REEL exige `&confirmer=reel` dans l adresse.
//    ⛔ SANS CE MOT, UN FICHIER REEL N EST PAS DEPOSE.
//
// 2. LE FICHIER DEPOSE EST CELUI QUI A ETE CONTROLE.
//    On recalcule son SHA-256 et on le compare a celui garde a la
//    generation. S ils different, le fichier a bouge depuis dsn-val :
//    on refuse.
//
// ⛔ RAPPEL : LES DONNEES FICTIVES S ARRETENT A dsn-val. Au-dela, SIRET et
// NIR sont verifies contre les referentiels REELS. TEST DSN SAS ne
// passera jamais. Le premier vrai depot se fera avec une entreprise
// reelle, en mode essai d abord.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";

// ⚠️ IDENTIQUES AU GENERATEUR (bloc S10.G00.00) : l en-tete HTTP et le
// fichier doivent nommer le meme logiciel.
const LOGICIEL = "Mr Comptable";
const EDITEUR = "AcadeMIA Pro LLC";
const VERSION_LOGICIEL = "1.0.0";

// Section 8.1 du guide.
const USER_AGENT = "Client-DSN (" + LOGICIEL + "/" + VERSION_LOGICIEL + "; " + EDITEUR + ")";

const DELAI_AUTH_MS = 20000;
const DELAI_DEPOT_MS = 90000;

// LA TABLE D ADRESSAGE — section 10.2. Les memes que la route de liaison.
// ⚠️ On depose TOUJOURS sur la production : c est le fichier qui dit s il
// est un essai. L environnement de test des editeurs demande un SIRET reel
// et la charte des editeurs ; il n est pas utilise ici.
const ADRESSES = {
  general: {
    authentification: "https://services.net-entreprises.fr/authentifier/1.0/",
    depot: "https://depot.dsnrg.net-entreprises.fr/deposer-dsn/2.0/",
    depots: "https://consultation.dsnrg.net-entreprises.fr/lister-depots/2.0/",
    service: "25",
  },
  agricole: {
    authentification: "https://services.net-entreprises.fr/authentifier/1.0/",
    depot: "https://depot.dsnra.net-entreprises.fr/deposer-dsn/2.0/",
    depots: "https://consultation.dsnra.net-entreprises.fr/lister-depots/2.0/",
    service: "26",
  },
};

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

// Une valeur placee dans du XML.
function xml(v: string): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function plat(v: string | null): string {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Un identifiant venu de l adresse : on ne laisse passer qu un UUID.
function uuid(v: string | null): string | null {
  const t = String(v || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t) ? t : null;
}

function extrait(texte: string, n: number): string {
  const t = String(texte || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

// ---------------------------------------------------------------------
// LE CHIFFREMENT — AES-256-GCM
//
// La forme gardee en base : « v1:<iv>:<marque>:<chiffre> », chaque partie
// en base 64. La marque (tag GCM) garantit que le texte n a pas ete
// modifie : un octet change, et le dechiffrement echoue au lieu de rendre
// n importe quoi.
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
  // 32 octets = 256 bits. Une cle plus courte ferait echouer le
  // chiffrement a la premiere utilisation, donc on le dit tout de suite.
  return cle.length === 32 ? cle : null;
}

function chiffrer(texte: string, cle: Buffer): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", cle, iv);
  const chiffre = Buffer.concat([c.update(texte, "utf8"), c.final()]);
  const marque = c.getAuthTag();
  return "v1:" + iv.toString("base64") + ":" + marque.toString("base64")
    + ":" + chiffre.toString("base64");
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
    // Cle changee, ou enveloppe abimee. Dans les deux cas : illisible.
    return null;
  }
}

// ---------------------------------------------------------------------
// L AUTHENTIFICATION
// ---------------------------------------------------------------------

type Acces = {
  id: string;
  regime: string;
  siret_declarant: string | null;
  nom_declarant: string | null;
  prenom_declarant: string | null;
  identifiant_msa: string | null;
  secret_chiffre: string;
};

type Jeton = {
  ok: boolean;
  jeton: string | null;
  peremption: string | null;
  code: number | null;
  lecture: string;
};

// CE QU UN REFUS VEUT DIRE — sections 9.1.1 et 9.1.6.
function lireRefus(code: number, www: string | null): string {
  const w = plat(www);
  if (code === 401 && w.includes("expiration du mot de passe")) {
    return "Le mot de passe net-entreprises de ce déclarant est périmé. "
      + "Il doit être renouvelé sur net-entreprises.fr, puis réenregistré ici.";
  }
  if (code === 401 && w.includes("non-inscrit")) {
    return "Ce déclarant n'est pas inscrit au service DSN sur net-entreprises. "
      + "L'inscription est prise en compte le lendemain.";
  }
  if (code === 401 && w.includes("jeton")) {
    return "Le jeton est absent ou périmé.";
  }
  if (code === 401) {
    return "Compte inconnu, ou SIRET, nom, prénom ou mot de passe incorrect.";
  }
  if (code === 403) {
    return "Accès refusé (403) : le compte est peut-être bloqué après plusieurs "
      + "tentatives. Il se débloque sur net-entreprises.fr.";
  }
  if (code === 407) return "Le portail a jugé la requête dangereuse (407).";
  if (code === 422) return "net-entreprises refuse les paramètres envoyés (422).";
  if (code === 429) return "Trop d'appels rapprochés (429).";
  if (code === 404 || code === 503) return "Le service est indisponible (" + code + ").";
  return "Réponse inattendue du service (" + code + ").";
}

async function authentifier(acces: Acces, motDePasse: string): Promise<Jeton> {
  const conf = acces.regime === "agricole" ? ADRESSES.agricole : ADRESSES.general;

  // ⚠️ DEUX FORMES DE CORPS, selon le portail (3.1.1 et 3.1.2) :
  // net-entreprises attend siret/nom/prenom/motdepasse/service ; la MSA
  // attend identifiant/motdepasse.
  const corps = acces.regime === "agricole" && acces.identifiant_msa
    ? "<identifiants>\n"
      + "  <identifiant>" + xml(acces.identifiant_msa) + "</identifiant>\n"
      + "  <motdepasse>" + xml(motDePasse) + "</motdepasse>\n"
      + "</identifiants>"
    : "<identifiants>\n"
      + "  <siret>" + xml(acces.siret_declarant || "") + "</siret>\n"
      + "  <nom>" + xml(acces.nom_declarant || "") + "</nom>\n"
      + "  <prenom>" + xml(acces.prenom_declarant || "") + "</prenom>\n"
      + "  <motdepasse>" + xml(motDePasse) + "</motdepasse>\n"
      + "  <service>" + conf.service + "</service>\n"
      + "</identifiants>";

  const garde = new AbortController();
  const minuterie = setTimeout(() => garde.abort(), DELAI_AUTH_MS);

  try {
    // ⚠️ PAS DE GZIP ICI : l authentification est la seule requete a corps
    // qui n est pas compressee (section 7.4).
    const rep = await fetch(conf.authentification, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "User-Agent": USER_AGENT,
      },
      body: corps,
      redirect: "manual",
      cache: "no-store",
      signal: garde.signal,
    });

    const code = rep.status;
    if (code !== 200) {
      return {
        ok: false, jeton: null, peremption: null, code: code,
        lecture: lireRefus(code, rep.headers.get("www-authenticate")),
      };
    }

    // LE CORPS EST LE JETON, tel quel (3.1.3).
    const jeton = (await rep.text()).trim();
    if (!jeton) {
      return {
        ok: false, jeton: null, peremption: null, code: 200,
        lecture: "Le service a répondu 200 mais sans jeton.",
      };
    }

    return {
      ok: true, jeton: jeton, peremption: rep.headers.get("expires"),
      code: 200, lecture: "Authentification acceptée.",
    };
  } catch (e: any) {
    const cause = e && e.cause ? e.cause : e;
    const nom = String((e && e.name) || "");
    return {
      ok: false, jeton: null, peremption: null, code: null,
      lecture: nom === "AbortError"
        ? "Aucune réponse de net-entreprises dans le délai."
        : "Liaison impossible : " + String((cause && cause.code) || (cause && cause.message) || e),
    };
  } finally {
    clearTimeout(minuterie);
  }
}

// Va chercher les acces d une societe et rend le mot de passe en clair,
// uniquement en memoire, le temps de l appel.
async function ouvrirAcces(societeId: string): Promise<
  { ok: true; acces: Acces; motDePasse: string } | { ok: false; statut: number; erreur: string }
> {
  const cle = cleDeChiffrement();
  if (!cle) {
    return {
      ok: false, statut: 500,
      erreur: "La variable DSN_CLE_CHIFFREMENT est absente de Vercel, ou ne fait pas "
        + "32 octets une fois décodée en base 64. Sans elle, aucun mot de passe ne peut être lu.",
    };
  }

  const { data, error } = await supabase
    .from("dsn_acces")
    .select("id, regime, siret_declarant, nom_declarant, prenom_declarant, "
      + "identifiant_msa, secret_chiffre, actif")
    .eq("societe_id", societeId)
    .eq("portail", "net-entreprises")
    .maybeSingle();

  if (error) {
    return { ok: false, statut: 500, erreur: "lecture des accès impossible : " + error.message };
  }
  if (!data) {
    return {
      ok: false, statut: 404,
      erreur: "Aucun accès net-entreprises enregistré pour cette société. "
        + "Il faut d'abord enregistrer le SIRET, le nom, le prénom et le mot de passe "
        + "du déclarant.",
    };
  }
  if (data.actif === false) {
    return { ok: false, statut: 409, erreur: "Les accès de cette société sont désactivés." };
  }

  const motDePasse = dechiffrer(data.secret_chiffre, cle);
  if (!motDePasse) {
    return {
      ok: false, statut: 500,
      erreur: "Le mot de passe enregistré est illisible avec la clé actuelle. "
        + "Si DSN_CLE_CHIFFREMENT a changé, il faut réenregistrer les accès.",
    };
  }

  return {
    ok: true,
    acces: {
      id: data.id,
      regime: data.regime || "general",
      siret_declarant: data.siret_declarant,
      nom_declarant: data.nom_declarant,
      prenom_declarant: data.prenom_declarant,
      identifiant_msa: data.identifiant_msa,
      secret_chiffre: data.secret_chiffre,
    },
    motDePasse: motDePasse,
  };
}

// ---------------------------------------------------------------------
// LIRE LE TYPE D ENVOI DANS LE FICHIER LUI-MEME
//
// 🚨 PAS DANS LA BASE : un fichier genere est une photographie. Si
// dsn_mode a change depuis, la base ment et le fichier dit vrai.
// ---------------------------------------------------------------------
function typeEnvoiDuFichier(texte: string): { code: string | null; mot: string } {
  const m = texte.match(/S10\.G00\.00\.005,'([^']*)'/);
  const code = m ? m[1] : null;
  if (code === "01") return { code: code, mot: "essai" };
  if (code === "02") return { code: code, mot: "réel" };
  return { code: code, mot: "inconnu" };
}

// Combien de blocs S20.G00.05 : le depot doit etre UNITAIRE (3.2.1).
function nombreDeDeclarations(texte: string): number {
  const m = texte.match(/S20\.G00\.05\.001,'/g);
  return m ? m.length : 0;
}

// ---------------------------------------------------------------------
// 🆕 18/09 — RETROUVER L IDENTIFIANT DE FLUX D UN DEPOT
//
// 🚨 POURQUOI : la route des retours (app/api/dsn/retours/route.ts)
// rattache chaque retour a sa declaration PAR L IDENTIFIANT DE FLUX. Sans
// lui, les accuses, bilans et comptes rendus arrivent sans qu on sache a
// quelle declaration ils repondent.
//
// ⛔ ON NE LE LIT PAS DANS L ACCUSE : le guide n en donne pas la forme
// (« AEE au format JSON », et rien d autre). Deviner un nom de champ, c est
// refaire les deductions fausses du 17/09.
//
// ✅ ON PASSE PAR LE SERVICE DOCUMENTE, section 3.3 : « lister-depots »
// rend, pour le declarant, la liste de ses depots avec leur idflux, leur
// date et leur statut. La forme est donnee par le guide.
//
// LA METHODE : on releve la liste AVANT le depot, on la releve APRES, et
// l identifiant qui est apparu entre les deux est le notre.
// ⚠️ S IL EN APPARAIT ZERO OU PLUSIEURS, ON NE CHOISIT PAS : on laisse
// l identifiant vide et on le dit. Un cabinet qui depose pour deux societes
// a la meme seconde donnerait deux nouveaux identifiants, et en attribuer
// un au hasard rattacherait les retours de l une a l autre.
//
// ⚠️ LE FUSEAU N EST PAS DIT PAR LE GUIDE. On demande donc large : trois
// heures en arriere, sans borne de fin (« si la date de fin n est pas
// precisee, c est la date du systeme qui est prise en compte »). La plage
// permise pour ce service est de 24 heures.
// ---------------------------------------------------------------------
function enTableau(v: any): any[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function horodatage(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return String(d.getFullYear()) + p(d.getMonth() + 1) + p(d.getDate())
    + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

async function releverIdflux(adresseDepots: string, jeton: string): Promise<string[] | null> {
  const depuis = new Date(Date.now() - 3 * 3600 * 1000);
  const garde = new AbortController();
  const minuterie = setTimeout(() => garde.abort(), DELAI_AUTH_MS);
  try {
    const rep = await fetch(adresseDepots + horodatage(depuis), {
      method: "GET",
      headers: { "Authorization": "DSNLogin jeton=" + jeton, "User-Agent": USER_AGENT },
      redirect: "manual",
      cache: "no-store",
      signal: garde.signal,
    });
    // ⚠️ `null` VEUT DIRE « JE N AI PAS PU LIRE », pas « il n y a rien » :
    // la difference compte, car une liste vide AVANT le depot est normale.
    if (rep.status !== 200) return null;
    const corps: any = await rep.json();
    const racine = corps && corps.depots ? corps.depots : corps;
    const liste: string[] = [];
    // Le guide montre « declarant » et « depot » tantot en objet, tantot en
    // tableau : on normalise.
    for (const decl of enTableau(racine && racine.declarant ? racine.declarant : null)) {
      for (const dep of enTableau(decl && decl.depot ? decl.depot : null)) {
        const id = String((dep && dep.idflux) || "").trim();
        if (id) liste.push(id);
      }
    }
    return liste;
  } catch {
    return null;
  } finally {
    clearTimeout(minuterie);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// POST — ENREGISTRER LES IDENTIFIANTS D UN CLIENT
//
// ⛔ EN POST, JAMAIS EN GET : un mot de passe dans une adresse finit dans
// les journaux de Vercel.
// ═══════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  if (!autorise(req)) return reponse({ erreur: "non autorise" }, 401);

  let corps: any;
  try {
    corps = await req.json();
  } catch {
    return reponse({ erreur: "corps JSON attendu" }, 400);
  }

  if (String(corps.action || "") !== "enregistrer") {
    return reponse({ erreur: "action inconnue : seule « enregistrer » existe en POST" }, 400);
  }

  const societeId = uuid(corps.societe_id);
  if (!societeId) return reponse({ erreur: "societe_id manquant ou mal formé" }, 400);

  const cle = cleDeChiffrement();
  if (!cle) {
    return reponse({
      erreur: "La variable DSN_CLE_CHIFFREMENT est absente de Vercel, ou ne fait pas "
        + "32 octets une fois décodée en base 64.",
    }, 500);
  }

  const { data: societe, error: eSoc } = await supabase
    .from("compta_societes").select("*").eq("id", societeId).maybeSingle();
  if (eSoc) return reponse({ erreur: "lecture de la société impossible : " + eSoc.message }, 500);
  if (!societe) return reponse({ erreur: "société inconnue" }, 404);

  const regime = String(corps.regime || societe.dsn_regime || "general");
  const motDePasse = String(corps.mot_de_passe || "");
  if (!motDePasse) return reponse({ erreur: "mot_de_passe manquant" }, 400);
  // Le guide borne le mot de passe a 30 caracteres (3.1.1).
  if (motDePasse.length > 30) {
    return reponse({ erreur: "le mot de passe dépasse 30 caractères, ce que la norme n'admet pas" }, 400);
  }

  const siret = String(corps.siret_declarant || societe.siret || "").replace(/\s/g, "");
  const nom = String(corps.nom_declarant || "").trim();
  const prenom = String(corps.prenom_declarant || "").trim();
  const identifiantMsa = String(corps.identifiant_msa || "").trim();

  // Les champs exiges ne sont pas les memes selon le portail.
  if (regime === "agricole") {
    if (!identifiantMsa) {
      return reponse({ erreur: "identifiant_msa manquant : le portail MSA n'utilise pas le SIRET" }, 400);
    }
  } else {
    if (!/^\d{14}$/.test(siret)) {
      return reponse({
        erreur: "Le SIRET du déclarant doit faire 14 chiffres. Ce sont les identifiants "
          + "de connexion à net-entreprises.fr, pas ceux de l'établissement déclaré.",
      }, 400);
    }
    if (!nom || !prenom) return reponse({ erreur: "nom_declarant et prenom_declarant sont attendus" }, 400);
  }

  const ligne = {
    tenant_id: societe.tenant_id || null,
    societe_id: societeId,
    portail: "net-entreprises",
    regime: regime,
    siret_declarant: regime === "agricole" ? null : siret,
    nom_declarant: regime === "agricole" ? null : nom,
    prenom_declarant: regime === "agricole" ? null : prenom,
    identifiant_msa: regime === "agricole" ? identifiantMsa : null,
    secret_chiffre: chiffrer(motDePasse, cle),
    cle_version: 1,
    // 🚨 UN NOUVEL ENREGISTREMENT REMET LA VERIFICATION A ZERO : le mot de
    // passe qui vient d etre saisi n a pas encore ete eprouve.
    verifie_le: null,
    dernier_echec: null,
    actif: true,
    maj_le: new Date().toISOString(),
  };

  const { error: eUp } = await supabase
    .from("dsn_acces")
    .upsert(ligne, { onConflict: "societe_id,portail" });

  if (eUp) return reponse({ erreur: "enregistrement impossible : " + eUp.message }, 500);

  return reponse({
    success: true,
    message: "Accès enregistrés, mot de passe chiffré. Il ne pourra plus être affiché : "
      + "seulement remplacé.",
    societe_id: societeId,
    regime: regime,
    a_faire: "Éprouver ces accès : ?action=tester&societe=" + societeId,
  }, 200);
}

// ═══════════════════════════════════════════════════════════════════════
// GET — ESSAI, ETAT, TEST DES ACCES, DEPOT
// ═══════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  if (!autorise(req)) return reponse({ erreur: "non autorise" }, 401);

  const p = req.nextUrl.searchParams;
  const action = String(p.get("action") || "");

  // ───────────────────────────────────────────────────────────────────
  // ESSAI — eprouve la cle de chiffrement SANS aucun identifiant reel.
  // C est ce qui se verifie tout de suite, avant d avoir un client.
  // ───────────────────────────────────────────────────────────────────
  if (action === "essai") {
    const brut = process.env.DSN_CLE_CHIFFREMENT || "";
    const cle = cleDeChiffrement();
    const octets = brut ? Buffer.from(brut, "base64").length : 0;

    let allerRetour = "non tenté";
    let identique = false;
    if (cle) {
      const temoin = "temoin-" + crypto.randomBytes(8).toString("hex");
      const enveloppe = chiffrer(temoin, cle);
      const relu = dechiffrer(enveloppe, cle);
      identique = relu === temoin;
      allerRetour = identique
        ? "chiffré puis déchiffré à l'identique"
        : "ÉCHEC : le texte relu diffère de l'original";
    }

    // La marque GCM doit refuser un texte modifie : on le verifie.
    let marqueSolide = false;
    if (cle) {
      const e = chiffrer("abc", cle).split(":");
      const abime = Buffer.from(e[3], "base64");
      abime[0] = abime[0] ^ 0xff;
      e[3] = abime.toString("base64");
      marqueSolide = dechiffrer(e.join(":"), cle) === null;
    }

    const { error: eTable, count } = await supabase
      .from("dsn_acces").select("id", { count: "exact", head: true });

    return reponse({
      route: "dsn/deposer",
      version: 2,
      cle_presente: !!brut,
      cle_longueur_octets: octets,
      cle_utilisable: !!cle,
      aller_retour: allerRetour,
      marque_protege_contre_modification: marqueSolide,
      table_dsn_acces: eTable ? "INTROUVABLE : " + eTable.message : "présente",
      acces_enregistres: eTable ? null : (count || 0),
      verdict: cle && identique && marqueSolide && !eTable
        ? "Le chiffrement fonctionne et la table est là. Prêt à enregistrer les accès d'un client."
        : "Quelque chose manque : voir les lignes ci-dessus.",
    }, 200);
  }

  // ───────────────────────────────────────────────────────────────────
  // ETAT — ce qui est enregistre pour une societe, sans rien reveler.
  // ───────────────────────────────────────────────────────────────────
  if (action === "etat") {
    const societeId = uuid(p.get("societe"));
    if (!societeId) return reponse({ erreur: "societe manquante ou mal formée" }, 400);

    const { data } = await supabase
      .from("dsn_acces")
      .select("regime, siret_declarant, nom_declarant, prenom_declarant, "
        + "verifie_le, dernier_echec, actif, maj_le")
      .eq("societe_id", societeId).eq("portail", "net-entreprises").maybeSingle();

    if (!data) return reponse({ enregistre: false, message: "aucun accès pour cette société" }, 200);

    return reponse({
      enregistre: true,
      regime: data.regime,
      siret_declarant: data.siret_declarant,
      declarant: [data.prenom_declarant, data.nom_declarant].filter(Boolean).join(" ") || null,
      mot_de_passe: "chiffré, non affichable",
      derniere_verification_reussie: data.verifie_le,
      dernier_echec: data.dernier_echec,
      actif: data.actif,
      maj_le: data.maj_le,
    }, 200);
  }

  // ───────────────────────────────────────────────────────────────────
  // TESTER — une authentification, et rien de plus. Aucun depot.
  // ───────────────────────────────────────────────────────────────────
  if (action === "tester") {
    const societeId = uuid(p.get("societe"));
    if (!societeId) return reponse({ erreur: "societe manquante ou mal formée" }, 400);

    const ouvert = await ouvrirAcces(societeId);
    if (!ouvert.ok) return reponse({ erreur: ouvert.erreur }, ouvert.statut);

    const jeton = await authentifier(ouvert.acces, ouvert.motDePasse);

    await supabase.from("dsn_acces").update(
      jeton.ok
        ? { verifie_le: new Date().toISOString(), dernier_echec: null, maj_le: new Date().toISOString() }
        : { dernier_echec: jeton.lecture, maj_le: new Date().toISOString() }
    ).eq("id", ouvert.acces.id);

    return reponse({
      success: jeton.ok,
      societe_id: societeId,
      code_http: jeton.code,
      lecture: jeton.lecture,
      // ⛔ LE JETON N EST JAMAIS RENDU : seule sa peremption l est.
      jeton: jeton.ok ? "obtenu, non affiché" : null,
      peremption: jeton.peremption,
    }, jeton.ok ? 200 : 400);
  }

  // ───────────────────────────────────────────────────────────────────
  // DEPOSER
  // ───────────────────────────────────────────────────────────────────
  if (action === "deposer") {
    const declarationId = uuid(p.get("declaration"));
    if (!declarationId) {
      return reponse({
        erreur: "declaration manquante ou mal formée : passer l'identifiant de la "
          + "déclaration à déposer (&declaration=…).",
      }, 400);
    }

    // ---- LA DECLARATION ----
    const { data: decl, error: eDecl } = await supabase
      .from("dsn_declarations")
      .select("id, societe_id, tenant_id, periode, nature, type_declaration, numero_ordre, "
        + "chemin_fichier, sha256, nb_lignes, statut, deposee_le, notes")
      .eq("id", declarationId).maybeSingle();

    if (eDecl) return reponse({ erreur: "lecture impossible : " + eDecl.message }, 500);
    if (!decl) return reponse({ erreur: "déclaration inconnue" }, 404);
    if (!decl.chemin_fichier) {
      return reponse({ erreur: "cette déclaration n'a pas de fichier archivé" }, 409);
    }

    // 🚨 DEJA DEPOSEE : on ne redepose pas sans le dire.
    if (decl.deposee_le && p.get("redeposer") !== "oui") {
      return reponse({
        erreur: "Cette déclaration a déjà été déposée le " + decl.deposee_le + ". "
          + "Pour la redéposer malgré tout, ajouter &redeposer=oui — mais la voie normale "
          + "est de générer un « annule et remplace ».",
      }, 409);
    }

    // ---- LE FICHIER, TEL QU IL A ETE ARCHIVE ----
    const { data: blob, error: eDl } = await supabase.storage
      .from(BUCKET).download(decl.chemin_fichier);

    if (eDl || !blob) {
      return reponse({
        erreur: "fichier introuvable dans l'archive (" + decl.chemin_fichier + ")"
          + (eDl ? " : " + eDl.message : ""),
      }, 404);
    }

    const octets = Buffer.from(await blob.arrayBuffer());

    // 🚨 GARDE-FOU 2 : LE FICHIER DEPOSE EST CELUI QUI A ETE CONTROLE.
    const sha = crypto.createHash("sha256").update(octets).digest("hex");
    if (decl.sha256 && sha !== decl.sha256) {
      return reponse({
        erreur: "Le fichier archivé ne correspond plus à celui qui a été généré et contrôlé. "
          + "Il faut le régénérer et le repasser dans dsn-val avant tout dépôt.",
        sha256_attendu: decl.sha256,
        sha256_trouve: sha,
      }, 409);
    }

    // Le fichier est en ISO 8859-1 : c est ainsi qu on le relit.
    const texte = octets.toString("latin1");

    // 🚨 GARDE-FOU 1 : ESSAI OU REEL, LU DANS LE FICHIER.
    const envoi = typeEnvoiDuFichier(texte);
    if (!envoi.code) {
      return reponse({
        erreur: "La rubrique S10.G00.00.005 est absente du fichier : impossible de savoir "
          + "s'il s'agit d'un essai ou d'un envoi réel. Dépôt refusé.",
      }, 409);
    }
    if (envoi.code === "02" && p.get("confirmer") !== "reel") {
      return reponse({
        erreur: "CE FICHIER EST UN ENVOI RÉEL (S10.G00.00.005 = 02). Il sera déclaré aux "
          + "organismes et ne pourra pas être retiré. Pour le déposer, ajouter "
          + "&confirmer=reel à l'adresse.",
        periode: decl.periode,
        nature: decl.nature,
        numero_ordre: decl.numero_ordre,
        nb_lignes: decl.nb_lignes,
      }, 409);
    }

    // DEPOT UNITAIRE (3.2.1) : un seul bloc S20.
    const nbDeclarations = nombreDeDeclarations(texte);
    if (nbDeclarations !== 1) {
      return reponse({
        erreur: "Le fichier contient " + nbDeclarations + " bloc(s) S20.G00.05 ; la norme "
          + "n'admet qu'un seul flux par dépôt. net-entreprises accepterait le dépôt et "
          + "signalerait l'erreur dans le bilan d'anomalies.",
      }, 409);
    }

    // ---- LES ACCES ----
    const ouvert = await ouvrirAcces(decl.societe_id);
    if (!ouvert.ok) return reponse({ erreur: ouvert.erreur }, ouvert.statut);

    const conf = ouvert.acces.regime === "agricole" ? ADRESSES.agricole : ADRESSES.general;

    // ---- L AUTHENTIFICATION ----
    let jeton = await authentifier(ouvert.acces, ouvert.motDePasse);
    if (!jeton.ok || !jeton.jeton) {
      await supabase.from("dsn_acces")
        .update({ dernier_echec: jeton.lecture, maj_le: new Date().toISOString() })
        .eq("id", ouvert.acces.id);
      return reponse({
        erreur: "Authentification refusée : " + jeton.lecture,
        code_http: jeton.code,
        depose: false,
      }, 400);
    }

    await supabase.from("dsn_acces")
      .update({ verifie_le: new Date().toISOString(), dernier_echec: null, maj_le: new Date().toISOString() })
      .eq("id", ouvert.acces.id);

    // 🆕 LA LISTE DES DEPOTS, RELEVEE AVANT : voir `releverIdflux`.
    // ⚠️ UN ECHEC DE CE RELEVE N EMPECHE PAS LE DEPOT : l identifiant de
    // flux sert a ranger les retours, pas a declarer. On deposera quand
    // meme, et on dira que l identifiant n a pas pu etre retrouve.
    const idfluxAvant = await releverIdflux(conf.depots, jeton.jeton);

    // ---- LE DEPOT ----
    // ⚠️ GZIP OBLIGATOIRE sur toute requete a corps sauf l authentification.
    const comprime = zlib.gzipSync(octets);

    async function poser(unJeton: string): Promise<{ code: number; corps: string; type: string | null }> {
      const garde = new AbortController();
      const minuterie = setTimeout(() => garde.abort(), DELAI_DEPOT_MS);
      try {
        const rep = await fetch(conf.depot, {
          method: "POST",
          headers: {
            "Authorization": "DSNLogin jeton=" + unJeton,
            "User-Agent": USER_AGENT,
            "Content-Type": "text/plain",
            "Content-Encoding": "gzip",
          },
          body: new Uint8Array(comprime),
          redirect: "manual",
          cache: "no-store",
          signal: garde.signal,
        });
        return {
          code: rep.status,
          corps: await rep.text(),
          type: rep.headers.get("content-type"),
        };
      } finally {
        clearTimeout(minuterie);
      }
    }

    let envoiRep: { code: number; corps: string; type: string | null };
    try {
      envoiRep = await poser(jeton.jeton);

      // Section 2.3.1 : sur un 401, le logiciel PEUT se reauthentifier et
      // reemettre l appel. UNE SEULE FOIS — sinon on boucle sur un compte
      // qui se bloque.
      if (envoiRep.code === 401) {
        jeton = await authentifier(ouvert.acces, ouvert.motDePasse);
        if (jeton.ok && jeton.jeton) {
          envoiRep = await poser(jeton.jeton);
        }
      }
    } catch (e: any) {
      const nom = String((e && e.name) || "");
      return reponse({
        erreur: nom === "AbortError"
          ? "Aucune réponse de net-entreprises dans le délai. ⚠️ LE DÉPÔT A PEUT-ÊTRE ABOUTI : "
            + "vérifier sur net-entreprises.fr avant de recommencer."
          : "Dépôt impossible : " + String((e && e.message) || e),
        depose: false,
      }, 504);
    }

    // ---- L ACCUSE, OU L AVIS DE REJET ----
    // 200 → accuse d enregistrement. 422 → avis de rejet. Les deux se
    // gardent : le second dit pourquoi.
    const accepte = envoiRep.code === 200;
    const typeRetour = accepte ? "accuse_enregistrement"
      : (envoiRep.code === 422 ? "avis_rejet" : "erreur_depot");

    // 🆕 L IDENTIFIANT DE FLUX : celui qui est apparu entre les deux releves.
    let idflux: string | null = null;
    let idfluxNote: string | null = null;
    if (accepte || envoiRep.code === 422) {
      const idfluxApres = jeton.jeton ? await releverIdflux(conf.depots, jeton.jeton) : null;
      if (idfluxAvant === null || idfluxApres === null) {
        idfluxNote = "L'identifiant de flux n'a pas pu être relevé : la liste des dépôts "
          + "n'a pas répondu. Les retours de ce dépôt arriveront sans être rattachés.";
      } else {
        const nouveaux = idfluxApres.filter(function (x) { return idfluxAvant.indexOf(x) < 0; });
        if (nouveaux.length === 1) {
          idflux = nouveaux[0];
        } else if (nouveaux.length === 0) {
          idfluxNote = "Aucun nouveau dépôt n'apparaît encore dans la liste de net-entreprises : "
            + "l'identifiant de flux n'est pas connu pour l'instant.";
        } else {
          idfluxNote = nouveaux.length + " dépôts sont apparus en même temps pour ce déclarant : "
            + "impossible de dire lequel est celui-ci sans risquer de rattacher les retours "
            + "d'une société à une autre. L'identifiant est laissé vide.";
        }
      }
    }

    const { data: retour } = await supabase.from("dsn_retours").insert({
      tenant_id: decl.tenant_id || null,
      societe_id: decl.societe_id,
      depot_reference: decl.id,
      declaration_id: decl.id,
      idflux: idflux,
      // ⚠️ La nature « 10 » est celle de l accuse d enregistrement ET de
      // l avis de rejet (section 6) : meme cle que ce que la route des
      // retours rangera, donc pas de doublon quand elle repassera.
      nature: (accepte || envoiRep.code === 422) ? "10" : null,
      statut: accepte ? "OK" : (envoiRep.code === 422 ? "KO" : null),
      type_retour: typeRetour,
      contenu: envoiRep.corps || null,
      traite: false,
      notes: "HTTP " + envoiRep.code
        + (envoiRep.type ? " · " + envoiRep.type : "")
        + " · envoi " + envoi.mot
        + " · " + conf.depot,
    }).select().maybeSingle();

    if (accepte) {
      await supabase.from("dsn_declarations").update({
        // ⚠️ UN ESSAI N EST PAS UNE DECLARATION : il est controle, rien
        // n est declare. On garde donc la trace du depot, mais le statut
        // ne passe a « deposee » que pour un envoi reel.
        statut: envoi.code === "02" ? "deposee" : decl.statut,
        deposee_le: new Date().toISOString(),
        // 🆕 Sans lui, les retours ne peuvent pas etre rattaches.
        idflux: idflux,
        maj_le: new Date().toISOString(),
      }).eq("id", decl.id);
    }

    return reponse({
      success: accepte,
      depose: accepte,
      type_envoi: envoi.mot,
      code_http: envoiRep.code,
      adresse: conf.depot,
      fichier: decl.chemin_fichier,
      octets_envoyes: comprime.length,
      octets_avant_compression: octets.length,
      sha256: sha,
      retour_id: retour ? retour.id : null,
      idflux: idflux,
      idflux_note: idfluxNote,
      type_retour: typeRetour,
      // L accuse est garde en entier dans dsn_retours ; ici, un extrait.
      retour_extrait: extrait(envoiRep.corps, 1200),
      message: accepte
        ? (envoi.code === "02"
          ? "Déclaration déposée et accusé d'enregistrement reçu."
          : "Fichier d'essai déposé et accusé reçu : tout a été contrôlé, rien n'a été déclaré.")
        : (envoiRep.code === 422
          ? "Dépôt rejeté. L'avis de rejet est enregistré : il dit ce qui cloche."
          : "Dépôt refusé : " + lireRefus(envoiRep.code, null)),
    }, accepte ? 200 : 400);
  }

  // ───────────────────────────────────────────────────────────────────
  return reponse({
    route: "dsn/deposer",
    version: 2,
    actions: {
      essai: "?action=essai — éprouve la clé de chiffrement, sans identifiants",
      etat: "?action=etat&societe=<uuid>",
      tester: "?action=tester&societe=<uuid> — authentification seule, aucun dépôt",
      deposer: "?action=deposer&declaration=<uuid> — &confirmer=reel si le fichier est réel",
      enregistrer: "POST {action, societe_id, siret_declarant, nom_declarant, "
        + "prenom_declarant, mot_de_passe}",
    },
    rappel: "Changer &v=… à chaque rappel : Safari garde les réponses.",
  }, 200);
}
