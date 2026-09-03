// ---------------------------------------------------------------------------
// LA MARQUE DU MODULE COMPLIANCE, SELON L HOTE — 03/09.
//
// POURQUOI CE FICHIER EXISTE. Mr. Comptable et MysterLLC partagent le meme
// module : memes tables, memes routes /api/compliance/*, memes ecrans.
// Le circuit de signature eprouve le 02/09 sur mysterllc.com existe donc
// deja sur mrcomptable.fr — mais tout y etait ecrit en dur « MysterLLC » :
// le lien de signature pointait sur mysterllc.com, l expediteur etait
// contact@mysterllc.com, le pied du document et du courriel disaient
// MysterLLC. Un client de cabinet comptable aurait recu une lettre de
// mission signee... chez un gestionnaire de LLC.
//
// LA REGLE : la marque se lit dans l en-tete host de la requete, en un
// seul endroit. Toute route du module qui ecrit un nom, un lien ou un
// expediteur passe par ici. Le jour ou Mr CRM ou Mr LMS auront leur
// domaine, une ligne suffira.
//
// ⚠️ CE FICHIER NE DECIDE PAS DES DROITS. Il ne fait que nommer. Le
// cloisonnement des donnees reste celui de la session (tenant_id).
// ---------------------------------------------------------------------------

export type MarqueCompliance = {
  code: "mysterllc" | "mrcomptable";
  nom: string;
  site: string;
  domaine: string;
  expediteur: string;
  signature: string; // le pied des courriels et des documents
};

const MYSTERLLC: MarqueCompliance = {
  code: "mysterllc",
  nom: "MysterLLC",
  site: "https://mysterllc.com",
  domaine: "mysterllc.com",
  // Lu dans COMPLIANCE_EXPEDITEUR quand la variable existe (posee sur
  // Vercel, verifiee chez Resend) ; la valeur en dur n est qu un repli.
  expediteur: (process.env.COMPLIANCE_EXPEDITEUR || "").trim() || "MysterLLC <contact@mysterllc.com>",
  signature: "MysterLLC — mysterllc.com",
};

const MRCOMPTABLE: MarqueCompliance = {
  code: "mrcomptable",
  nom: "Mr. Comptable",
  site: "https://mrcomptable.fr",
  domaine: "mrcomptable.fr",
  // contact@mrcomptable.fr est verifie chez Resend (marque directe).
  expediteur: (process.env.MRCOMPTABLE_EXPEDITEUR || "").trim() || "Mr. Comptable <contact@mrcomptable.fr>",
  signature: "Mr. Comptable — mrcomptable.fr",
};

// L hote de la requete, sans port, en minuscules.
function hoteDe(req: { headers: { get: (n: string) => string | null } }): string {
  const brut = req.headers.get("host") || "";
  return brut.split(":")[0].trim().toLowerCase();
}

// MysterLLC par defaut : c est la marque d origine du circuit, et celle
// des previsualisations Vercel et du developpement local.
export function marqueCompliance(req: { headers: { get: (n: string) => string | null } }): MarqueCompliance {
  const hote = hoteDe(req);
  if (hote === "mrcomptable.fr" || hote.endsWith(".mrcomptable.fr")) return MRCOMPTABLE;
  return MYSTERLLC;
}
