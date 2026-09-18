import { NextRequest, NextResponse } from "next/server";
import tls from "tls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LA LIAISON AVEC NET-ENTREPRISES — 18/09/2026, version 1
//
// C est la premiere piece du depot automatique de la DSN. Elle ne depose
// rien et n enregistre rien : ELLE PROUVE QUE VERCEL ATTEINT NET-ENTREPRISES,
// dans le bon format, sur les trois services dont le depot aura besoin.
//
// SOURCE UNIQUE : « Guide d implementation de l API DSN », version 6.9 du
// 04/09/2026 (GIP-MDS, 105 pages), lu en entier sur les sections 2, 3.1,
// 3.2, 3.3, 7, 8, 9 et 10. Tout ce qui suit en vient ; rien n est deduit.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 COMMENT L API FONCTIONNE (sections 2.3 et 3.1)
//
// 1. ON S AUTHENTIFIE : un POST en XML avec le SIRET, le nom, le prenom et
//    le mot de passe du DECLARANT, plus un code de service. Ce sont
//    exactement les quatre champs de l ecran de connexion de
//    net-entreprises.fr.
// 2. LE SERVICE REND UN JETON dans le corps de la reponse, et son heure de
//    peremption dans l en-tete « Expires ».
// 3. CE JETON ACCOMPAGNE CHAQUE APPEL, dans l en-tete :
//      Authorization: DSNLogin jeton=<le jeton>
// 4. LE DEPOT EST UN POST DU FICHIER, compresse en gzip, encode en
//    ISO 8859-1. L accuse d enregistrement (ou l avis de rejet) revient
//    DANS LA MEME REPONSE.
//
// LES CODES DE SERVICE (section 3.1.1) :
//      25  DSN regime general en PRODUCTION
//      97  DSN regime general sur l environnement de TEST des editeurs
//      26  DSN regime agricole en production (94 en test)
//      98  concentrateur (le meme partout)
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 DEUX MODES EXISTENT, UN SEUL NOUS EST OUVERT
//
// LE MODE « CONCENTRATEUR » : l editeur s authentifie avec SON PROPRE SIRET
// et designe le declarant dans l en-tete. Aucun mot de passe de client a
// garder. ⛔ MAIS le SIRET exige est celui « de l etablissement qui a signe
// la charte concentrateur » (section 3.1.1), sur 14 caracteres, obligatoire.
// AcadeMIA Pro LLC n a pas de SIRET : CE MODE NOUS EST FERME.
//
// LE MODE « LOGICIEL DE PAIE » : on s authentifie avec les identifiants du
// client. C est celui que cette route met en oeuvre.
// 🚨 Le guide l ecrit lui-meme, section 3.1.1 : le mot de passe « doit etre
// chiffre s il est stocke dans un logiciel de paie ». Il ne sera JAMAIS
// garde en clair, jamais reaffiche, jamais ecrit dans un journal.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 DEUX AXES A NE PAS CONFONDRE
//
// L ENVIRONNEMENT (test des editeurs / production) choisit L ADRESSE.
// LE TYPE D ENVOI (essai / reel, rubrique S10.G00.00.005) est DANS LE
// FICHIER, et c est compta_societes.dsn_mode qui le commande.
//
// Un client depose TOUJOURS sur la PRODUCTION : d abord un fichier d essai
// (rien n est declare, tout est controle), puis un fichier reel. La
// section 10 le dit : « Les tests de leurs clients declarants sont a
// effectuer sur l environnement de PRODUCTION ».
// L environnement de test des editeurs, lui, exige un SIRET reel pour
// s inscrire et la signature de la charte des editeurs : il nous est
// ferme pour l instant, mais ses adresses sont eprouvees ici quand meme.
//
// ⛔ LES DONNEES FICTIVES S ARRETENT A dsn-val. Au-dela, SIRET et NIR sont
// verifies contre les referentiels reels : TEST DSN SAS n y passera pas.
// Le premier vrai depot se fera avec la premiere entreprise reelle.
//
// ═══════════════════════════════════════════════════════════════════════
// CE QUE FAIT CETTE VERSION 1
//
//   GET ?secret=…&essai=1
//
// Six verifications, lancees ensemble, sur les deux environnements :
//
//   A. L AUTHENTIFICATION, avec une identite FICTIVE. La reponse attendue
//      est un REFUS (401) : c est lui qui prouve que le service a ete
//      atteint, qu il a lu notre XML et qu il a cherche le compte.
//   B. LA CONSULTATION DES DEPOTS, sans jeton. Reponse attendue : 401
//      « Jeton manquant ou invalide ». Elle prouve que les services du
//      regime general (*.dsnrg) nous repondent.
//   C. L HOTE DU DEPOT : une poignee de main TLS et rien d autre. Aucune
//      requete n est envoyee, donc RIEN N EST DEPOSE. Elle prouve que le
//      certificat du point de depot est reconnu par Vercel.
//
// 🚨 L IDENTITE FICTIVE NE PEUT BLOQUER PERSONNE : le SIRET est celui de
// TEST DSN SAS (12345678200002, invente, cle de Luhn juste pour passer le
// controle de forme), le nom et le prenom sont « ESSAI » et « Connexion ».
// Aucun compte reel ne porte cette identite.
//
// ⛔ LA VERIFICATION DES CERTIFICATS N EST JAMAIS DESACTIVEE, meme ici. Le
// guide (section 2.1) dit que tout est « transparent des lors que la
// verification TLS stricte est desactivee » : c est exactement ce qu on ne
// fera pas, parce que cette liaison portera des mots de passe. Si une
// chaine de certification n est pas reconnue, l essai le DIT (code
// UNABLE_TO_VERIFY_LEAF_SIGNATURE ou voisin) et la correction sera
// d embarquer le certificat intermediaire, pas d eteindre le controle.
//
// CE QUE CETTE VERSION NE FAIT PAS ENCORE : garder les identifiants d un
// client (chiffres), tester ses vrais acces, deposer, rapatrier les
// retours. Chaque piece viendra apres que celle-ci aura ete eprouvee.
//
// ═══════════════════════════════════════════════════════════════════════
// COMMENT LIRE LES REFUS (sections 9.1.1 et 9.1.6)
//
//   401 + WWW-Authenticate: Basic realm="net-entreprises.fr"
//        compte inconnu ou mot de passe incorrect
//   401 + Basic realm="Expiration du mot de passe"
//        le mot de passe du declarant est perime
//   401 + DSNLogin realm="Utilisateur non-inscrit au service"
//        le declarant n est pas inscrit a la DSN (attendre J+1 apres
//        l inscription)
//   401 + DSNLogin realm="Jeton manquant ou invalide" / "Expiration du jeton"
//        sur les services metier
//   403  compte bloque apres plusieurs echecs — ou en-tete Host incoherent
//   407  requete jugee dangereuse par le portail
//   422  parametres invalides (controle de forme de net-entreprises)
//   429  contraintes d interrogation non respectees (services de recherche)
//   404 / 503  service indisponible
// ═══════════════════════════════════════════════════════════════════════

// ⚠️ CES TROIS VALEURS DOIVENT RESTER IDENTIQUES A CELLES DU GENERATEUR
// (app/api/dsn/generer/route.ts, bloc S10.G00.00) : l en-tete HTTP et le
// fichier depose doivent nommer le meme logiciel.
const LOGICIEL = "Mr Comptable";
const EDITEUR = "AcadeMIA Pro LLC";
const VERSION_LOGICIEL = "1.0.0";

// Section 8.1 : « Client-DSN (<logiciel>/<version>; <editeur>) ».
const USER_AGENT = "Client-DSN (" + LOGICIEL + "/" + VERSION_LOGICIEL + "; " + EDITEUR + ")";

const DELAI_HTTP_MS = 15000;
const DELAI_TLS_MS = 10000;

type Environnement = "test" | "production";
type Etape = "authentification" | "consultation" | "hote_du_depot";

type Adresses = {
  authentification: string;
  depot: string;
  consultation_depots: string;
  service_regime_general: string;
};

// LA TABLE D ADRESSAGE — section 10.2 du guide, regime general.
// ⚠️ Les exemples du corps du guide montrent d autres hotes
// (net-entreprises.fr, dsn.net-entreprises.fr) : c est la table de la
// section 10 qui fait foi, le guide le dit en 3.1.
// Regime agricole, pour le jour ou il servira : meme authentification avec
// le service 26 (94 en test), depot sur depot.dsnra.net-entreprises.fr
// (depot-formation.dsnra… en test).
const ADRESSES: Record<Environnement, Adresses> = {
  test: {
    authentification: "https://test-services.net-entreprises.fr/authentifier/1.0/",
    depot: "https://depot-edit.dsnrg.net-entreprises.fr/deposer-dsn/2.0/",
    consultation_depots: "https://consultation-edit.dsnrg.net-entreprises.fr/lister-depots/2.0/",
    service_regime_general: "97",
  },
  production: {
    authentification: "https://services.net-entreprises.fr/authentifier/1.0/",
    depot: "https://depot.dsnrg.net-entreprises.fr/deposer-dsn/2.0/",
    consultation_depots: "https://consultation.dsnrg.net-entreprises.fr/lister-depots/2.0/",
    service_regime_general: "25",
  },
};

// L IDENTITE FICTIVE DE L ESSAI. Voir l en-tete : elle ne correspond a
// aucun compte, et ne peut donc en bloquer aucun.
const IDENTITE_FICTIVE = {
  siret: "12345678200002",
  nom: "ESSAI",
  prenom: "Connexion",
  motdepasse: "Essai-Liaison-2026",
};

type Resultat = {
  environnement: Environnement;
  etape: Etape;
  adresse: string;
  atteint: boolean;
  code_http: number | null;
  www_authenticate: string | null;
  lecture: string;
  detail: string | null;
  duree_ms: number;
};

// ---------------------------------------------------------------------
// OUTILS
// ---------------------------------------------------------------------

// Une valeur placee dans du XML : les cinq caracteres reserves.
function xml(v: string): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// LE CORPS DE LA DEMANDE D AUTHENTIFICATION — section 3.1.1, recopie de
// l exemple du guide : pas de declaration XML, cinq balises, dans cet ordre.
function corpsIdentifiants(id: {
  siret: string; nom: string; prenom: string; motdepasse: string;
}, service: string): string {
  return "<identifiants>\n"
    + "  <siret>" + xml(id.siret) + "</siret>\n"
    + "  <nom>" + xml(id.nom) + "</nom>\n"
    + "  <prenom>" + xml(id.prenom) + "</prenom>\n"
    + "  <motdepasse>" + xml(id.motdepasse) + "</motdepasse>\n"
    + "  <service>" + xml(service) + "</service>\n"
    + "</identifiants>";
}

// Sans accents et en minuscules, pour reconnaitre un « realm » quel que
// soit son encodage a l arrivee.
function plat(v: string | null): string {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// AAAAMMJJHHMMSS, il y a une heure — le format des plages de recherche
// (section 3.3.1). La plage est limitee a 24 h par le service.
function horodatageIlYAUneHeure(): string {
  const d = new Date(Date.now() - 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return String(d.getUTCFullYear()) + p(d.getUTCMonth() + 1) + p(d.getUTCDate())
    + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds());
}

// UN APPEL HTTP BORNE DANS LE TEMPS.
// ⚠️ redirect « manual » : une redirection vers une page de maintenance
// donnerait sinon un 200 trompeur. On veut voir le 30x.
async function appel(adresse: string, init: {
  method: string; headers: Record<string, string>; body?: string;
}): Promise<Response> {
  const garde = new AbortController();
  const minuterie = setTimeout(() => garde.abort(), DELAI_HTTP_MS);
  try {
    return await fetch(adresse, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      redirect: "manual",
      cache: "no-store",
      signal: garde.signal,
    });
  } finally {
    clearTimeout(minuterie);
  }
}

// Le debut d un corps de reponse, sur une ligne, pour le diagnostic.
function extrait(texte: string): string | null {
  const t = String(texte || "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > 300 ? t.slice(0, 300) + "…" : t;
}

// CE QU UNE PANNE DE LIAISON VEUT DIRE, en clair.
function lirePanne(e: any): { lecture: string; detail: string } {
  const cause = e && e.cause ? e.cause : e;
  const code = String((cause && cause.code) || (e && e.code) || "");
  const message = String((cause && cause.message) || (e && e.message) || e || "");
  const nom = String((e && e.name) || "");

  let lecture = "Liaison impossible.";
  if (nom === "AbortError" || nom === "TimeoutError" || code === "UND_ERR_CONNECT_TIMEOUT"
    || code === "ETIMEDOUT") {
    lecture = "Aucune réponse dans le délai : l'hôte ne répond pas à Vercel (filtrage possible).";
  } else if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    lecture = "Nom d'hôte introuvable : l'adresse du guide ne se résout pas.";
  } else if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "UND_ERR_SOCKET") {
    lecture = "Connexion refusée ou coupée par l'hôte.";
  } else if (code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || code === "UNABLE_TO_GET_ISSUER_CERT"
    || code === "UNABLE_TO_GET_ISSUER_CERT_LOCALLY" || code === "SELF_SIGNED_CERT_IN_CHAIN"
    || code === "DEPTH_ZERO_SELF_SIGNED_CERT") {
    lecture = "Certificat non reconnu par Vercel : la chaîne de certification est incomplète. "
      + "La correction sera d'embarquer le certificat intermédiaire, jamais d'éteindre le contrôle.";
  } else if (code === "CERT_HAS_EXPIRED") {
    lecture = "Le certificat de l'hôte est périmé.";
  } else if (code === "ERR_TLS_CERT_ALTNAME_INVALID") {
    lecture = "Le certificat ne porte pas ce nom d'hôte.";
  }

  return { lecture: lecture, detail: (code ? code + " — " : "") + message };
}

// ---------------------------------------------------------------------
// A. L AUTHENTIFICATION, AVEC L IDENTITE FICTIVE
// ---------------------------------------------------------------------
async function essaiAuthentification(env: Environnement): Promise<Resultat> {
  const adresse = ADRESSES[env].authentification;
  const debut = Date.now();

  try {
    // ⚠️ Le service d authentification n est PAS concerne par la
    // compression (section 7.4) : le corps part tel quel.
    const rep = await appel(adresse, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "User-Agent": USER_AGENT,
      },
      body: corpsIdentifiants(IDENTITE_FICTIVE, ADRESSES[env].service_regime_general),
    });

    const code = rep.status;
    const www = rep.headers.get("www-authenticate");
    const texte = await rep.text();
    const w = plat(www);

    let lecture = "Réponse non prévue par le guide pour ce service.";
    let detail: string | null = extrait(texte);

    if (code === 200) {
      // Ne peut pas arriver avec une identite fictive. Si cela arrive, le
      // jeton n est JAMAIS rendu : seule sa longueur est dite.
      lecture = "INATTENDU : un jeton a été délivré à une identité fictive.";
      detail = "jeton reçu, " + texte.length + " caractères (non affiché) ; péremption : "
        + (rep.headers.get("expires") || "non dite");
    } else if (code === 401 && w.includes("expiration du mot de passe")) {
      lecture = "Service atteint. Il répond que le mot de passe est périmé.";
    } else if (code === 401 && w.includes("non-inscrit")) {
      lecture = "Service atteint. Il répond que ce déclarant n'est pas inscrit à la DSN.";
    } else if (code === 401) {
      lecture = "Service atteint, XML lu, compte cherché et refusé : "
        + "c'est la réponse attendue avec une identité fictive.";
    } else if (code === 403) {
      lecture = "Service atteint. 403 : compte bloqué après plusieurs échecs, "
        + "ou en-tête Host jugé incohérent.";
    } else if (code === 407) {
      lecture = "Service atteint. 407 : le portail a jugé la requête dangereuse.";
    } else if (code === 422) {
      lecture = "Service atteint et XML lu : net-entreprises juge les paramètres invalides "
        + "(contrôle de forme). La liaison est prouvée.";
    } else if (code >= 300 && code < 400) {
      lecture = "Redirection : le service renvoie ailleurs (maintenance possible).";
      detail = "vers " + (rep.headers.get("location") || "adresse non dite");
    } else if (code === 404 || code === 503) {
      lecture = "Hôte atteint, mais le service est indisponible ou l'adresse a changé.";
    } else if (code === 400 || code === 415) {
      lecture = "Service atteint, mais il refuse la forme de la requête.";
    }

    return {
      environnement: env, etape: "authentification", adresse: adresse,
      atteint: true, code_http: code, www_authenticate: www,
      lecture: lecture, detail: detail, duree_ms: Date.now() - debut,
    };
  } catch (e: any) {
    const p = lirePanne(e);
    return {
      environnement: env, etape: "authentification", adresse: adresse,
      atteint: false, code_http: null, www_authenticate: null,
      lecture: p.lecture, detail: p.detail, duree_ms: Date.now() - debut,
    };
  }
}

// ---------------------------------------------------------------------
// B. LA CONSULTATION DES DEPOTS, SANS JETON
// ---------------------------------------------------------------------
async function essaiConsultation(env: Environnement): Promise<Resultat> {
  const adresse = ADRESSES[env].consultation_depots + horodatageIlYAUneHeure();
  const debut = Date.now();

  try {
    // Un GET n a pas de corps : pas de compression a declarer. fetch
    // annonce de lui-meme qu il accepte gzip, ce que le service exige.
    const rep = await appel(adresse, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
    });

    const code = rep.status;
    const www = rep.headers.get("www-authenticate");
    const texte = await rep.text();

    let lecture = "Réponse non prévue par le guide pour ce service.";
    let detail: string | null = extrait(texte);

    if (code === 401) {
      lecture = "Service atteint : il réclame un jeton, comme attendu sans authentification.";
    } else if (code === 200) {
      lecture = "INATTENDU : le service a répondu sans jeton.";
      detail = "corps de " + texte.length + " caractères (non affiché)";
    } else if (code === 403) {
      lecture = "Service atteint. 403 : accès refusé, ou en-tête Host jugé incohérent.";
    } else if (code === 422 || code === 429) {
      lecture = "Service atteint : il a lu la requête et en refuse les paramètres.";
    } else if (code >= 300 && code < 400) {
      lecture = "Redirection : le service renvoie ailleurs (maintenance possible).";
      detail = "vers " + (rep.headers.get("location") || "adresse non dite");
    } else if (code === 404 || code === 503) {
      lecture = "Hôte atteint, mais le service est indisponible ou l'adresse a changé.";
    } else if (code === 406 || code === 415) {
      lecture = "Service atteint, mais il refuse la forme de la requête (compression).";
    }

    return {
      environnement: env, etape: "consultation", adresse: adresse,
      atteint: true, code_http: code, www_authenticate: www,
      lecture: lecture, detail: detail, duree_ms: Date.now() - debut,
    };
  } catch (e: any) {
    const p = lirePanne(e);
    return {
      environnement: env, etape: "consultation", adresse: adresse,
      atteint: false, code_http: null, www_authenticate: null,
      lecture: p.lecture, detail: p.detail, duree_ms: Date.now() - debut,
    };
  }
}

// ---------------------------------------------------------------------
// C. L HOTE DU DEPOT : UNE POIGNEE DE MAIN TLS, ET RIEN D AUTRE
//
// 🚨 AUCUNE REQUETE HTTP N EST ENVOYEE : rien ne peut etre depose par
// erreur. On ouvre la session chiffree, on lit le certificat, on referme.
// La verification du certificat reste active : un certificat non reconnu
// fait echouer la poignee de main, et c est ce qu on veut savoir.
// ---------------------------------------------------------------------
function essaiHoteDuDepot(env: Environnement): Promise<Resultat> {
  const hote = new URL(ADRESSES[env].depot).hostname;
  const adresse = "tls://" + hote + ":443";
  const debut = Date.now();

  return new Promise((resoudre) => {
    let rendu = false;
    const rendre = (r: Resultat) => {
      if (rendu) return;
      rendu = true;
      resoudre(r);
    };

    const echec = (e: any) => {
      const p = lirePanne(e);
      rendre({
        environnement: env, etape: "hote_du_depot", adresse: adresse,
        atteint: false, code_http: null, www_authenticate: null,
        lecture: p.lecture, detail: p.detail, duree_ms: Date.now() - debut,
      });
    };

    try {
      const prise = tls.connect({ host: hote, port: 443, servername: hote }, () => {
        const certificat: any = prise.getPeerCertificate();
        const emetteur = certificat && certificat.issuer
          ? [certificat.issuer.O, certificat.issuer.CN].filter(Boolean).map(String).join(" / ")
          : "";
        const protocole = String(prise.getProtocol() || "");
        const fin = certificat && certificat.valid_to ? String(certificat.valid_to) : "";
        prise.end();
        rendre({
          environnement: env, etape: "hote_du_depot", adresse: adresse,
          atteint: true, code_http: null, www_authenticate: null,
          lecture: "Session chiffrée ouverte et certificat reconnu. Rien n'a été envoyé.",
          detail: [protocole, emetteur ? "émis par " + emetteur : "", fin ? "valable jusqu'au " + fin : ""]
            .filter(Boolean).join(" — ") || null,
          duree_ms: Date.now() - debut,
        });
      });

      prise.setTimeout(DELAI_TLS_MS, () => {
        prise.destroy();
        echec({ name: "TimeoutError", message: "poignee de main TLS sans reponse" });
      });
      prise.on("error", (e: any) => echec(e));
    } catch (e: any) {
      echec(e);
    }
  });
}

// ---------------------------------------------------------------------
// LE VERDICT, EN UNE PHRASE PAR ENVIRONNEMENT
// ---------------------------------------------------------------------
function verdictPour(env: Environnement, resultats: Resultat[]): string {
  const les = resultats.filter((r) => r.environnement === env);
  const manques = les.filter((r) => !r.atteint);
  const nom = env === "production" ? "PRODUCTION" : "TEST DES ÉDITEURS";

  if (manques.length === 0) {
    return nom + " : les trois services répondent à Vercel. La liaison est acquise.";
  }
  if (manques.length === les.length) {
    return nom + " : aucun service ne répond à Vercel. Voir « detail » de chaque ligne.";
  }
  return nom + " : " + manques.map((r) => r.etape).join(", ")
    + " ne répond" + (manques.length > 1 ? "ent" : "") + " pas. Voir « detail ».";
}

function reponse(corps: any, statut: number) {
  return NextResponse.json(corps, {
    status: statut,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// GET — L ESSAI DE LIAISON
// ═══════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return reponse({ erreur: "non autorise" }, 401);
  }

  if (req.nextUrl.searchParams.get("essai") !== "1") {
    return reponse({
      route: "dsn/connexion",
      version: 1,
      etat: "Essai de liaison seulement. Rien n'est gardé, rien n'est déposé.",
      usage: "Ajouter &essai=1 à l'adresse. Changer &v=… à chaque rappel : Safari garde les réponses.",
    }, 200);
  }

  const debut = Date.now();

  // Les six verifications partent ensemble : chacune porte son propre
  // delai, l ensemble ne depasse donc pas le plus long d entre eux.
  const resultats = await Promise.all([
    essaiAuthentification("production"),
    essaiConsultation("production"),
    essaiHoteDuDepot("production"),
    essaiAuthentification("test"),
    essaiConsultation("test"),
    essaiHoteDuDepot("test"),
  ]);

  const production = resultats.filter((r) => r.environnement === "production");
  const productionAcquise = production.every((r) => r.atteint);

  return reponse({
    route: "dsn/connexion",
    version: 1,
    essai: true,
    fait_le: new Date().toISOString(),
    region_vercel: process.env.VERCEL_REGION || "inconnue",
    duree_ms: Date.now() - debut,
    en_tete_envoye: USER_AGENT,
    identite_envoyee: {
      siret: IDENTITE_FICTIVE.siret,
      nom: IDENTITE_FICTIVE.nom,
      prenom: IDENTITE_FICTIVE.prenom,
      mot_de_passe: "fictif, non affiché",
    },
    verdict: [
      verdictPour("production", resultats),
      verdictPour("test", resultats),
    ],
    // C est la production qui compte : les clients y deposent, en essai
    // puis en reel. L environnement de test nous est ferme pour l instant.
    liaison_production_acquise: productionAcquise,
    resultats: resultats,
  }, 200);
}
