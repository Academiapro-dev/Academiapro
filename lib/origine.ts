// ---------------------------------------------------------------------------
// LE CONTROLE D ORIGINE, EN UN SEUL ENDROIT — 01/09.
//
// 🚨 POURQUOI CE FICHIER EXISTE.
//
// La fonction origineLegitime() etait RECOPIEE A L IDENTIQUE dans chaque
// route du module compliance. Chaque copie portait sa propre liste de
// domaines, et rien ne les reliait.
//
// CE QUE CELA A PRODUIT, DEUX FOIS EN VINGT-QUATRE HEURES :
//   - le 31/08, mysterllc.com est ajoute a f5472 et f1120. Six autres
//     routes l ignorent encore.
//   - le 01/09, Jacques ouvre le dossier d une societe depuis
//     mysterllc.com : « Erreur : Acces refuse » en rouge, sur un ecran
//     qu un prospect verrait la semaine suivante.
//
// ⚠️ UNE REGLE RECOPIEE N EST PAS UNE REGLE, C EST UNE PROMESSE DE L OUBLIER
// QUELQUE PART. Le jour ou Mr CRM ou Mr LMS auront leur domaine, une seule
// ligne suffira ici — au lieu de huit fichiers a retrouver.
//
// ---------------------------------------------------------------------------
// CE QUE CE CONTROLE PROTEGE, ET CE QU IL NE PROTEGE PAS.
//
// ⚠️ IL EST FALSIFIABLE EN UNE LIGNE. Les en-tetes origin et referer sont
// poses par le navigateur, mais n importe quel outil en ligne de commande
// les fabrique. Ce controle n est PAS une barriere d authentification.
//
// LA VRAIE BARRIERE EST LA SESSION SIGNEE, verifiee dans chaque route apres
// ce controle. Celui-ci ne sert qu a bloquer les appels croises depuis un
// site tiers dans un navigateur ordinaire — utile, mais mineur.
//
// ⚠️ NE PAS LE RENFORCER EN CROYANT SECURISER : cela donnerait une illusion
// de protection. Le renforcement utile porte sur la session, pas ici.
// ---------------------------------------------------------------------------

// Les domaines des produits. Un domaine ajoute ici vaut pour TOUTES les
// routes qui importent cette fonction.
//
// ⚠️ ON COMPARE SUR LE NOM D HOTE, PAS PAR INCLUSION DE CHAINE. L ancienne
// version faisait origine.includes("academiapro.fr") : « academiapro.fr.
// attaquant.com » l aurait donc satisfaite. La comparaison porte desormais
// sur l hote exact, ou sur un sous-domaine reel.
const DOMAINES = [
  "academiapro.fr",
  "mrcomptable.fr",
  "mrqualiopi.fr",
  "mysterllc.com",
  "espaces-formations.fr",
];

// Les environnements de travail. Ils restent acceptes : sans eux, aucune
// previsualisation Vercel ni aucun developpement local ne fonctionnerait.
const ENVIRONNEMENTS = [
  "vercel.app",
  "localhost",
  "127.0.0.1",
];

// Extrait le nom d hote d une origine ou d un referent, sans le port.
// Rend une chaine vide si l entete est absent ou illisible.
function hoteDe(valeur: string): string {
  const v = String(valeur || "").trim();
  if (!v) return "";
  try {
    return new URL(v).hostname.toLowerCase();
  } catch {
    // Certains outils envoient un hote nu, sans schema.
    return v.split("/")[0].split(":")[0].toLowerCase();
  }
}

function hoteAutorise(hote: string): boolean {
  if (!hote) return false;

  for (const d of DOMAINES) {
    // L hote exact, ou un sous-domaine reel : « www.mysterllc.com » passe,
    // « mysterllc.com.attaquant.net » non.
    if (hote === d || hote.endsWith("." + d)) return true;
  }

  for (const e of ENVIRONNEMENTS) {
    if (hote === e || hote.endsWith("." + e)) return true;
  }

  return false;
}

// ⚠️ UN APPEL SANS origin NI referer EST ACCEPTE, et c est volontaire.
// Les navigateurs n envoient pas toujours ces en-tetes — notamment sur une
// navigation directe ou depuis certains clients de messagerie. Les refuser
// casserait des usages legitimes pour un gain nul, puisque le controle est
// de toute facon falsifiable. La session, elle, est verifiee ensuite.
export function origineLegitime(req: { headers: { get: (n: string) => string | null } }): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";

  if (!origine && !referent) return true;

  if (origine && hoteAutorise(hoteDe(origine))) return true;
  if (referent && hoteAutorise(hoteDe(referent))) return true;

  return false;
}

// Pour les journaux : dit quel hote a ete refuse, sans exposer l information
// dans la reponse.
export function hoteAppelant(req: { headers: { get: (n: string) => string | null } }): string {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return hoteDe(origine) || hoteDe(referent) || "aucun";
}
