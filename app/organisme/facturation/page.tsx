import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

const ACHAT = "https://academiapro.lemonsqueezy.com/checkout/buy/";
const MISE_EN_SERVICE = "b000148c-61e4-4434-9be1-d0d3945cd703";
const ABONNEMENT = "a10511ba-be2a-45f4-b340-2461efcbd4ac";

// ════════════════════════════════════════════════════════════════════════
// LA GRILLE DU 3 SEPTEMBRE 2026. ELLE REMPLACE TOUT CE QUI PRECEDE.
//
// 🚨 CE QUI A ETE SUPPRIME DE CETTE PAGE, ET NE DOIT PAS REVENIR :
//   — le TARIF DE LANCEMENT a moitie prix (abonnement / 2 tant que
//     `lancement_jusqu_au` portait une date). Il n'existe plus.
//   — les 35 % DU PRIX DE VENTE de chaque formation du catalogue
//     (`taux_prelevement`). Remplaces par 40 % du CHIFFRE D'AFFAIRES BRUT
//     realise sur le catalogue, et seulement dans l'offre avec catalogue.
//   — le PLANCHER DE 30 € PAR STAGIAIRE (`plancher_stagiaire`). Il n'y a
//     plus de minimum par stagiaire : il y a un tarif par STAGIAIRE ACTIF,
//     degressif par paliers.
//
// Les colonnes `taux_prelevement`, `plancher_stagiaire` et
// `lancement_jusqu_au` existent encore dans `organismes_formation` mais NE
// SONT PLUS LUES ICI. Ne pas les rebrancher.
//
// LA FACTURATION NE SE FAIT PLUS A L'INSCRIPTION MAIS AU STAGIAIRE ACTIF.
// Un stagiaire actif est inscrit a au moins un parcours non termine au
// cours du mois ; celui qui a termine ou abandonne n'est plus facture le
// mois suivant. La degressivite porte sur le NOMBRE DE STAGIAIRES ACTIFS
// DANS LE MOIS, pas sur un cumul annuel.
//
// ⚠️ CES MONTANTS DEVRONT ETRE LUS DANS `lms_tarifs` (12 lignes, projet
// kpxrbwsbhmggoajtxzqn) QUAND MR LMS EXISTERA. Ils sont ici en clair, dans
// un seul bloc, pour que la page cesse d'afficher l'ancienne formule des
// aujourd'hui. Un seul endroit a changer le jour de la bascule.
// ════════════════════════════════════════════════════════════════════════
const MISE_EN_PLACE = 1500;
const ABONNEMENT_BASE = 200;
const OPTION_ACCOMPAGNEMENT = 180;
const PART_CATALOGUE = 40;

// Paliers du stagiaire actif, dans l'ordre. `jusqu_a` est le rang du
// dernier stagiaire du palier ; null pour le dernier palier.
const PALIERS = [
  { jusqu_a: 10, prix: 49, libelle: "du 1er au 10e" },
  { jusqu_a: 50, prix: 39, libelle: "du 11e au 50e" },
  { jusqu_a: null as number | null, prix: 29, libelle: "au-dela du 50e" },
];

// STATUTS QUI SORTENT DU DECOMPTE. Tout autre statut — y compris vide,
// inconnu ou absent — compte comme actif. Le sens de la regle est celui-ci :
// on ne facture pas un stagiaire dont le parcours est termine ou abandonne,
// et on ne cesse jamais de compter quelqu'un a cause d'un libelle qu'on
// n'aurait pas prevu.
//
// 🚨 AU 03/09, LA SEULE VALEUR PRESENTE EN BASE EST `invitation_envoyee`.
// AUCUN STATUT DE FIN N'EST ECRIT NULLE PART. Tant que rien n'ecrit l'un
// de ces libelles a la fin d'un parcours, AUCUN STAGIAIRE NE SORTIRA JAMAIS
// DE LA FACTURATION — ce qui contredit le devis, qui promet qu'un stagiaire
// ayant termine ou abandonne n'est plus facture le mois suivant.
// Le decompte est donc juste aujourd'hui (personne n'a fini) et deviendra
// faux au premier parcours acheve. La liste ci-dessous est prete ; il reste
// a decider CE QUI ECRIT LA FIN DE PARCOURS.
const STATUTS_TERMINES = ["termine", "terminee", "termines", "fini", "finie", "cloture", "cloturee", "sorti", "sortie", "desinscrit", "desinscrite", "abandon", "abandonne", "abandonnee", "annule", "annulee", "archive", "archivee"];

function estTermine(statut: any): boolean {
  if (!statut) return false;
  const s = String(statut).toLowerCase().trim();
  return STATUTS_TERMINES.indexOf(s) >= 0;
}

// COUT DES STAGIAIRES ACTIFS DU MOIS, PALIER PAR PALIER.
function coutStagiaires(nb: number): { total: number; detail: any[] } {
  const detail: any[] = [];
  let total = 0;
  let rangPrecedent = 0;

  for (const p of PALIERS) {
    const plafond = p.jusqu_a === null ? nb : Math.min(p.jusqu_a, nb);
    const dans = Math.max(0, plafond - rangPrecedent);
    if (dans > 0) {
      const montant = dans * p.prix;
      total = total + montant;
      detail.push({ libelle: p.libelle, nombre: dans, prix: p.prix, montant: montant });
    }
    rangPrecedent = p.jusqu_a === null ? nb : p.jusqu_a;
    if (rangPrecedent >= nb) break;
  }

  return { total: total, detail: detail };
}

const CADRE: any = {
  minHeight: "100vh",
  background: "#050508",
  color: "#fff",
  fontFamily: "Georgia, serif",
  padding: "40px 20px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "12px",
  padding: "20px 24px",
  marginBottom: "16px",
};

function euros(n: any) {
  return (Number(n) || 0).toLocaleString("fr-FR") + " €";
}

// LE TENANT EST TRANSMIS AU PAIEMENT. Sans lui, le webhook devrait deviner
// l organisme d apres l adresse de l acheteur — or rien ne garantit qu il
// paie avec l adresse de contact de sa fiche.
function lienAchat(variante: string, tenant: string, email: string): string {
  return (
    ACHAT + variante +
    "?checkout%5Bcustom%5D%5Btenant%5D=" + encodeURIComponent(tenant) +
    (email ? "&checkout%5Bemail%5D=" + encodeURIComponent(email) : "")
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LA FACTURATION MR CRM — 06/09.
//
// 🚨 ELLE N A RIEN A VOIR AVEC CELLE DE MR LMS. Pas de mise en place, pas
// de stagiaires, pas de catalogue : un forfait mensuel selon le nombre
// d utilisateurs, et c est tout.
//
// ⚠️ LES SMS ET LES APPELS N Y FIGURENT PAS COMME POSTES A FACTURER : ils
// se paient D AVANCE par credits, depuis /organisme/credits. Les faire
// apparaitre ici laisserait croire a une facture de fin de mois qui ne
// viendra jamais.
//
// ⚠️ LA GRILLE EST LUE EN BASE, jamais ecrite ici. Une grille recopiee
// dans du code finit toujours par mentir.
// ══════════════════════════════════════════════════════════════════════════
async function facturationMrCrm(t: string) {
  const { data: org } = await supabase
    .from("organismes_formation")
    .select("raison_sociale, offre, nb_utilisateurs, statut, email_contact, "
      + "sms_credits, minutes_credits, sms_expediteur, tel_numero")
    .eq("tenant_id", t)
    .maybeSingle();

  const { data: lignes } = await supabase
    .from("tarifs")
    .select("offre, poste, libelle, montant, seuil_min, seuil_max")
    .eq("produit", "crm")
    .in("poste", ["abonnement", "utilisateur_sup", "signature"]);

  const utilisateurs = Math.max(1, Number(org && org.nb_utilisateurs) || 1);

  // 🚨 LE PALIER SE DEDUIT DE L EFFECTIF, PAS DE LA COLONNE `offre`.
  //
  // ⚠️ POURQUOI. `offre` peut avoir ete posee a la main et ne plus
  // correspondre au nombre d utilisateurs reellement rattaches. Le palier
  // qui compte est celui que l effectif impose : c est ce que le client
  // verifiera lui-meme en comptant ses collaborateurs.
  const abonnements = (lignes || [])
    .filter(function (l: any) { return l.poste === "abonnement"; })
    .sort(function (a: any, b: any) {
      return (Number(a.seuil_max) || 9999) - (Number(b.seuil_max) || 9999);
    });

  let palier: any = null;
  for (const a of abonnements) {
    const max = Number(a.seuil_max) || 9999;
    if (utilisateurs <= max) { palier = a; break; }
  }
  // Au-dela du dernier palier, on garde le plus haut et l on facture les
  // utilisateurs supplementaires a l unite.
  if (!palier && abonnements.length > 0) palier = abonnements[abonnements.length - 1];

  const base = palier ? Number(palier.montant) || 0 : 0;
  const plafond = palier ? (Number(palier.seuil_max) || 0) : 0;

  const ligneSup = (lignes || []).filter(function (l: any) {
    return l.poste === "utilisateur_sup";
  })[0];
  const prixSup = ligneSup ? Number(ligneSup.montant) || 0 : 0;

  // ⚠️ LES UTILISATEURS SUPPLEMENTAIRES NE SE COMPTENT QUE SI L ON DEPASSE
  // LE DERNIER PALIER. En dessous, le forfait couvre tout le monde.
  const sup = plafond > 0 && utilisateurs > plafond ? utilisateurs - plafond : 0;
  const coutSup = sup * prixSup;
  const total = base + coutSup;

  const signature = (lignes || []).filter(function (l: any) {
    return l.poste === "signature";
  })[0];

  const smsCredits = Number(org && org.sms_credits) || 0;
  const minutes = Math.floor((Number(org && org.minutes_credits) || 0) / 60);

  const mois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/organisme/crm" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          &larr; Retour à mes contacts
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          EN COURS · {String(mois).toUpperCase()}
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>
          Ma facturation
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.7" }}>
          Votre abonnement est un forfait mensuel. Il ne dépend pas de ce que
          vous en faites, seulement du nombre de personnes qui l&apos;utilisent.
        </p>

        {org && org.statut === "actif" && (
          <div style={{ ...CARTE, borderColor: "rgba(76,175,80,0.4)",
            background: "rgba(76,175,80,0.05)" }}>
            <p style={{ color: "#4caf50", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
              Votre abonnement est actif. Vous n&apos;avez rien à faire.
            </p>
          </div>
        )}

        {/* ---- LE FORFAIT ---- */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "20px 0" }}>
          <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(total)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Par mois, hors taxes
            </p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 200px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
              {utilisateurs}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              utilisateur{utilisateurs > 1 ? "s" : ""}
              {plafond > 0 && utilisateurs <= plafond
                ? " · jusqu'à " + plafond + " compris"
                : ""}
            </p>
          </div>
        </div>

        {/* ---- LE DETAIL ---- */}
        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "28px 0 12px" }}>
          Votre abonnement
        </h2>
        <div style={CARTE}>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr",
            gap: "8px 12px", fontSize: "15px" }}>
            <span style={{ color: "rgba(255,255,255,0.75)" }}>
              {palier ? palier.libelle : "Abonnement"}
            </span>
            <span style={{ color: "#c8a96e", textAlign: "right" }}>{euros(base)}</span>

            {sup > 0 && (
              <>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>
                  {sup} utilisateur{sup > 1 ? "s" : ""} au-delà de {plafond}
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>
                    {" · " + euros(prixSup) + " chacun"}
                  </span>
                </span>
                <span style={{ color: "#c8a96e", textAlign: "right" }}>{euros(coutSup)}</span>
              </>
            )}
          </div>

          {/* 🚨 CE QUI EST COMPRIS SE DIT, sans quoi le client croit payer
              un socle et decouvrir des options ensuite. */}
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
            margin: "16px 0 0", lineHeight: "1.75" }}>
            Fiches, étapes, filtres, recherche, relances, colonnes,
            campagnes, journal d&apos;appels et export sont compris. Il
            n&apos;y a aucun module payant.
          </p>
        </div>

        {/* ---- CE QUI SE PAIE A L USAGE ----
            ⚠️ PRESENTE A PART, ET PAS COMME UNE LIGNE DE FACTURE : ces
            credits se paient D AVANCE. Les melanger au forfait laisserait
            croire a une facture de fin de mois qui ne viendra jamais. */}
        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "28px 0 12px" }}>
          Vos crédits
        </h2>
        <div style={CARTE}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px",
            margin: "0 0 14px", lineHeight: "1.75" }}>
            Les SMS, les appels et les signatures se paient à l&apos;usage,
            par crédits achetés d&apos;avance. Ils ne figurent pas sur votre
            facture mensuelle.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr",
            gap: "8px 12px", fontSize: "15px" }}>
            <span style={{ color: "rgba(255,255,255,0.75)" }}>
              SMS restants
              {!org || !org.sms_expediteur ? (
                <span style={{ color: "#e8a33d", fontSize: "13px" }}>
                  {" "}· expéditeur non réglé
                </span>
              ) : null}
            </span>
            <span style={{ color: smsCredits > 0 ? "#4caf50" : "#e8836a", textAlign: "right" }}>
              {smsCredits}
            </span>

            <span style={{ color: "rgba(255,255,255,0.75)" }}>
              Minutes d&apos;appel restantes
              {!org || !org.tel_numero ? (
                <span style={{ color: "#e8a33d", fontSize: "13px" }}>
                  {" "}· numéro non réglé
                </span>
              ) : null}
            </span>
            <span style={{ color: minutes > 0 ? "#4caf50" : "#e8836a", textAlign: "right" }}>
              {minutes}
            </span>

            {signature && (
              <>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>
                  Signature électronique, à l&apos;unité
                </span>
                <span style={{ color: "#c8a96e", textAlign: "right" }}>
                  {euros(signature.montant)}
                </span>
              </>
            )}
          </div>

          <p style={{ margin: "16px 0 0" }}>
            <a href="/organisme/credits" style={{ color: "#c8a96e", fontSize: "14px", fontWeight: "bold" }}>
              Commander des crédits &rarr;
            </a>
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px",
          lineHeight: "1.8", marginTop: "20px" }}>
          Montants hors taxes. Pour ajouter ou retirer des utilisateurs,
          écrivez-nous : le palier suit l&apos;effectif.
        </p>
      </div>
    </div>
  );
}

export default async function PageFacturationClient() {
  const session = sessionCourante();

  if (!session || !session.tenantId) {
    return (
      <div style={CADRE}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e", fontSize: "24px" }}>Votre facturation</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7" }}>
            Connectez-vous avec le compte de votre organisme.
          </p>
        </div>
      </div>
    );
  }

  const t = session.tenantId;

  // ══════════════════════════════════════════════════════════════════════
  // 🚨 MR CRM N EST PAS MR LMS — CORRIGE LE 06/09.
  //
  // LE DEFAUT. Cet ecran est servi par mrlms.fr ET par mrcrm.fr : un seul
  // fichier, un seul chemin. Il n avait jamais ete adapte, et un client
  // Mr CRM voyait la facturation d un organisme de formation — 380 € par
  // mois, 1 500 € de mise en place, des stagiaires actifs, une part
  // catalogue. Rien de tout cela n existe chez Mr CRM.
  //
  // ⚠️ MR CRM N A AUCUNE MISE EN PLACE. Les 1 500 € sont pour Mr LMS seul.
  // ⚠️ MR CRM N A NI STAGIAIRES NI CATALOGUE : son abonnement se compte en
  // UTILISATEURS, et les SMS et appels se paient d avance par credits.
  //
  // 🚨 RETURN ANTICIPE, PAS DE BRANCHES DANS TOUT LE FICHIER. Le code LMS
  // qui suit fonctionne et n est pas touche : s il fallait le parsemer de
  // conditions, chaque correction future porterait sur deux produits a la
  // fois.
  //
  // ⚠️ LE DOMAINE SE LIT DANS L EN-TETE `host`. Le middleware reecrit le
  // chemin, mais l en-tete reste celui que le navigateur a envoye — c est
  // la seule facon de savoir sous quelle marque on est servi.
  // ══════════════════════════════════════════════════════════════════════
  const entetes: any = await headers();
  const hote = String(entetes.get("host") || "").toLowerCase();

  if (hote.indexOf("mrcrm.fr") >= 0) {
    return await facturationMrCrm(t);
  }

  const { data: org } = await supabase
    .from("organismes_formation")
    .select("raison_sociale, offre, gestion_souscrite, statut, frais_installation, mise_en_service_facturee_le, email_contact, essai_jusqu_au")
    .eq("tenant_id", t)
    .maybeSingle();

  const maintenant = new Date();
  const debut = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
  const fin = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + 1, 1));

  // LES STAGIAIRES ACTIFS SE COMPTENT SUR TOUT LE REGISTRE, PAS SUR LES
  // SEULES INSCRIPTIONS DU MOIS. Un stagiaire inscrit en juin et toujours
  // en cours de parcours en septembre est actif en septembre. L'ancienne
  // page ne regardait que `created_at` du mois : elle facturait l'entree,
  // pas le suivi.
  const { data: registre } = await supabase
    .from("organisme_apprenants")
    .select("email, nom, formation_code, prix_vente, statut, created_at")
    .eq("tenant_id", t)
    .limit(5000);

  // LE CATALOGUE SOUSCRIT SERT A DEUX CHOSES : distinguer les formations
  // AcadémIA des formations propres a l'organisme, et calculer la part.
  const { data: catalogue } = await supabase
    .from("organisme_catalogue")
    .select("formation_code, prix_vente_public")
    .eq("tenant_id", t)
    .eq("actif", true)
    .limit(1000);

  const prixDe: any = {};
  const souscrites = new Set<string>();
  for (const c of catalogue || []) {
    prixDe[c.formation_code] = Number(c.prix_vente_public) || 0;
    souscrites.add(c.formation_code);
  }

  const { data: fiches } = await supabase
    .from("formations")
    .select("code, titre")
    .limit(1000);

  const titreDe: any = {};
  for (const f of fiches || []) titreDe[f.code] = f.titre;

  // ══════════════════════════════════════════════════════════════════════
  // LA FIN DE PARCOURS SE CALCULE, ELLE NE S'ECRIT PAS — DECISION DU 03/09.
  //
  // Le devis promet qu'un stagiaire ayant termine ou abandonne n'est plus
  // facture le mois suivant. Or AUCUN STATUT DE FIN N'EXISTAIT EN BASE : la
  // seule valeur presente etait `invitation_envoyee`. Sans regle, personne
  // ne serait jamais sorti de la facturation.
  //
  // DEUX VOIES, LES DEUX RETENUES :
  //   — AUTOMATIQUE, ici : un parcours est termine quand TOUS les modules
  //     de son plan sont valides. Rien n'est ecrit en base ; le calcul se
  //     refait a chaque affichage. Tant que la regle est jeune, on veut
  //     pouvoir la corriger en changeant le code, pas en reparant des
  //     lignes.
  //   — DECLAREE, ailleurs : l'organisme marque lui-meme un abandon depuis
  //     « Mes stagiaires ». Une decision humaine, elle, laisse une trace :
  //     elle ecrit dans `organisme_apprenants.statut` et sort par
  //     `estTermine()` plus bas.
  //
  // ⚠️ LE JOUR OU UN SECOND ECRAN AURA BESOIN DE CETTE INFORMATION — le
  // bilan pedagogique et financier, par exemple — IL FAUDRA BASCULER VERS
  // L'ECRITURE. Le calcul sera alors eprouve et on saura quoi ecrire.
  //
  // 🚨 UN PLAN VIDE NE CLOT RIEN. Une formation dont le plan n'a pas encore
  // ete construit compte zero module : `termine` resterait vrai des la
  // premiere validation, et le stagiaire sortirait de la facturation sans
  // avoir rien fini. On exige donc STRICTEMENT PLUS DE ZERO MODULE AU PLAN.
  // Meme regle pour les formations propres de l'organisme, qui vivent dans
  // `organisme_cours` et non dans `lms_plans` : elles ne se cloturent que
  // par la sortie declaree.
  //
  // `module_cle` vaut chapitre_num + "_" + module_num (« 1_2 », « 3_4 ») :
  // la correspondance avec `lms_plans` est directe. Les trois types du plan
  // — theorie, pratique, evaluation — comptent tous.
  // ══════════════════════════════════════════════════════════════════════
  const codesInscrits: string[] = [];
  for (const a of registre || []) {
    const c = a.formation_code || "";
    if (c && codesInscrits.indexOf(c) < 0) codesInscrits.push(c);
  }

  const modulesAuPlan: any = {};
  if (codesInscrits.length > 0) {
    const { data: plan } = await supabase
      .from("lms_plans")
      .select("formation_code")
      .in("formation_code", codesInscrits)
      .limit(20000);

    for (const p of plan || []) {
      modulesAuPlan[p.formation_code] = (modulesAuPlan[p.formation_code] || 0) + 1;
    }
  }

  const { data: progression } = await supabase
    .from("progression_apprenants")
    .select("user_email, formation_code, module_cle")
    .eq("tenant_id", t)
    .eq("statut", "valide")
    .limit(20000);

  // Un module valide deux fois ne compte qu'une fois : on retient les cles
  // distinctes, pas le nombre de lignes.
  const clesValidees: any = {};
  for (const p of progression || []) {
    const cle = String(p.user_email || "").toLowerCase().trim() + "|" + (p.formation_code || "");
    if (!clesValidees[cle]) clesValidees[cle] = new Set<string>();
    clesValidees[cle].add(String(p.module_cle || ""));
  }

  function avancement(email: string, code: string) {
    const auPlan = modulesAuPlan[code] || 0;
    const jeu = clesValidees[String(email || "").toLowerCase().trim() + "|" + code];
    const valides = jeu ? jeu.size : 0;
    return {
      auPlan: auPlan,
      valides: valides,
      termine: auPlan > 0 && valides >= auPlan,
    };
  }

  // QUELLE OFFRE. L'offre avec catalogue donne acces aux formations
  // AcadémIA : son abonnement comprend l'accompagnement jusqu'au bilan
  // pedagogique et financier, et une part de 40 % s'applique sur le
  // catalogue. L'offre sans catalogue porte les seules formations de
  // l'organisme ; l'accompagnement y est une option.
  //
  // 🚨 LES VALEURS REELLES DE LA COLONNE `offre` AU 03/09 SONT `pack` (7
  // organismes) ET `crm` (1). Il n'y a NI « b » NI « catalogue » en base :
  // une detection fondee sur ces mots n'aurait reconnu personne et aurait
  // facture tout le monde sans part catalogue.
  //   — `pack` : le pack marque blanche, catalogue AcadémIA compris.
  //   — `crm` : sans catalogue.
  // Les libelles `b` et `offre_b` restent acceptes : ce sont ceux du devis,
  // et rien ne garantit qu'un futur enregistrement n'en portera pas.
  //
  // ⚠️ TOUTE NOUVELLE VALEUR D'OFFRE DONNANT ACCES AU CATALOGUE DOIT ETRE
  // AJOUTEE ICI. Sans quoi la part de 40 % ne sera pas facturee, en silence.
  // Sans valeur lisible, on retient l'offre sans catalogue : c'est la moins
  // couteuse, et une facture ne se gonfle pas sur une supposition.
  const OFFRES_AVEC_CATALOGUE = ["pack", "b", "offre_b", "catalogue"];

  const valeurOffre = org && org.offre ? String(org.offre).toLowerCase().trim() : "";
  const avecCatalogue =
    OFFRES_AVEC_CATALOGUE.indexOf(valeurOffre) >= 0 ||
    valeurOffre.indexOf("catalogue") >= 0;

  const accompagnement = avecCatalogue ? true : !!(org && org.gestion_souscrite);
  const optionFacturee = accompagnement && !avecCatalogue;
  const abonnement = ABONNEMENT_BASE + (accompagnement ? OPTION_ACCOMPAGNEMENT : 0);

  const statut = org && org.statut ? String(org.statut) : "essai";
  const actif = statut === "actif";
  const miseEnServiceReglee =
    (org && Number(org.frais_installation) > 0) ||
    !!(org && org.mise_en_service_facturee_le);
  const emailOrg = (org && org.email_contact) || session.email || "";

  // DUREE DE L ESSAI. Un essai sans fin n en est pas un : le client doit
  // savoir combien de jours il lui reste, sans avoir a le chercher.
  const finEssai = org && org.essai_jusqu_au ? new Date(org.essai_jusqu_au + "T23:59:59") : null;
  const joursRestants = finEssai
    ? Math.ceil((finEssai.getTime() - maintenant.getTime()) / 86400000)
    : null;
  const essaiExpire = joursRestants !== null && joursRestants < 0;

  // LES STAGIAIRES ACTIFS DU MOIS, PAR PERSONNE ET NON PAR INSCRIPTION.
  // Un stagiaire inscrit a trois parcours est un stagiaire, pas trois. Il
  // est actif tant qu'AU MOINS UN de ses parcours n'est pas termine : celui
  // qui a fini sa premiere formation et en suit une seconde reste facture.
  const actifsParEmail: any = {};
  const sortis: any = {};

  for (const a of registre || []) {
    const cle = String(a.email || "").toLowerCase().trim();
    if (!cle) continue;

    const code = a.formation_code || "";
    const av = code ? avancement(a.email, code) : { auPlan: 0, valides: 0, termine: false };

    // SORTIE DECLAREE d'abord : elle prime sur le calcul. Un organisme qui
    // marque un abandon sait quelque chose que la progression ne dit pas.
    const declare = estTermine(a.statut);

    if (declare || av.termine) {
      if (!sortis[cle]) {
        sortis[cle] = {
          email: a.email,
          nom: a.nom,
          motif: declare ? "sortie déclarée" : "parcours terminé",
        };
      }
      continue;
    }

    if (!actifsParEmail[cle]) {
      actifsParEmail[cle] = { email: a.email, nom: a.nom, parcours: [] };
    }

    actifsParEmail[cle].parcours.push({
      code: code,
      titre: code ? (titreDe[code] || code) : "sans formation",
      catalogue: code ? souscrites.has(code) : false,
      prix: Number(a.prix_vente) || prixDe[code] || 0,
      quand: a.created_at,
      auPlan: av.auPlan,
      valides: av.valides,
    });
  }

  // Un stagiaire qui a un parcours fini ET un parcours en cours reste
  // actif : on le retire de la liste des sortis.
  for (const cle of Object.keys(actifsParEmail)) {
    if (sortis[cle]) delete sortis[cle];
  }

  const listeSortis = Object.values(sortis);
  const stagiairesActifs = Object.values(actifsParEmail);
  const nbActifs = stagiairesActifs.length;
  const cout = coutStagiaires(nbActifs);

  // LA PART CATALOGUE PORTE SUR LE CHIFFRE D'AFFAIRES BRUT DU MOIS, c'est
  // a dire sur ce que l'organisme a vendu ce mois-ci sur les formations du
  // catalogue AcadémIA. On retient donc les inscriptions CREEES dans le
  // mois : c'est la vente qui declenche la part, pas le suivi.
  let caCatalogue = 0;
  const ventesCatalogue: any[] = [];

  for (const a of registre || []) {
    const code = a.formation_code || "";
    if (!code || !souscrites.has(code)) continue;

    const quand = a.created_at ? new Date(a.created_at).getTime() : 0;
    if (!quand || quand < debut.getTime() || quand >= fin.getTime()) continue;

    const prix = Number(a.prix_vente) || prixDe[code] || 0;
    caCatalogue = caCatalogue + prix;
    ventesCatalogue.push({
      nom: a.nom || a.email,
      titre: titreDe[code] || code,
      prix: prix,
    });
  }

  caCatalogue = Math.round(caCatalogue * 100) / 100;
  const part = avecCatalogue ? Math.round(caCatalogue * PART_CATALOGUE) / 100 : 0;
  const total = Math.round((abonnement + cout.total + part) * 100) / 100;
  const mois = maintenant.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const BOUTON: any = {
    display: "inline-block",
    background: "#c8a96e",
    color: "#050508",
    padding: "14px 26px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "15px",
    marginRight: "12px",
    marginTop: "8px",
  };

  const BOUTON_CLAIR: any = {
    ...BOUTON,
    background: "transparent",
    color: "#c8a96e",
    border: "1px solid rgba(200,169,110,0.5)",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          EN COURS · {mois.toUpperCase()}
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Ma facturation</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Ce qui sera facturé en fin de mois, mis à jour en continu
        </p>

        {!actif && (
          <div style={{ ...CARTE, border: "1px solid " + (essaiExpire ? "rgba(232,131,106,0.6)" : "rgba(232,163,61,0.55)"), background: essaiExpire ? "rgba(232,131,106,0.07)" : "rgba(232,163,61,0.06)", marginTop: "22px" }}>
            <p style={{ color: essaiExpire ? "#e8836a" : "#e8a33d", fontSize: "17px", fontWeight: "bold", margin: "0 0 8px" }}>
              {essaiExpire
                ? "Votre période d'essai est terminée"
                : "Votre abonnement n'est pas encore actif"}
            </p>

            {joursRestants !== null && !essaiExpire && (
              <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 8px", lineHeight: "1.7" }}>
                Il vous reste <strong>{joursRestants} jour{joursRestants > 1 ? "s" : ""}</strong> d'essai,
                jusqu'au {finEssai ? finEssai.toLocaleDateString("fr-FR") : ""}.
              </p>
            )}

            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", margin: "0 0 6px", lineHeight: "1.8" }}>
              {essaiExpire
                ? "Vos données sont conservées : votre espace reprend là où vous l'avez laissé dès la souscription."
                : "Votre espace fonctionne, mais rien n'est encore souscrit. Deux règlements ouvrent votre accès : la mise en place, une seule fois, puis l'abonnement mensuel."}
            </p>

            {!miseEnServiceReglee && (
              <a href={lienAchat(MISE_EN_SERVICE, t, emailOrg)} style={BOUTON}>
                Régler la mise en place
              </a>
            )}

            <a
              href={lienAchat(ABONNEMENT, t, emailOrg)}
              style={miseEnServiceReglee ? BOUTON : BOUTON_CLAIR}
            >
              Activer mon abonnement mensuel
            </a>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "14px 0 0", lineHeight: "1.7" }}>
              Sans engagement de durée, résiliable à tout moment avec un préavis d'un mois.
              Le règlement est encaissé par Lemon Squeezy, qui établit votre facture et applique
              la TVA de votre pays.
            </p>
          </div>
        )}

        {actif && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.45)", background: "rgba(76,175,80,0.05)", marginTop: "22px" }}>
            <p style={{ color: "#4caf50", fontSize: "15px", margin: 0, lineHeight: "1.8" }}>
              Votre abonnement est actif. Les prélèvements sont en place, vous n'avez rien à faire.
            </p>
          </div>
        )}

        {!miseEnServiceReglee && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.45)" }}>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.75" }}>
              La mise en place — espace, import de vos formations, paramétrage et prise en main —
              est facturée {euros(MISE_EN_PLACE)} une seule fois, à la signature. Elle n'est pas
              reconduite.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(abonnement)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Abonnement{accompagnement ? " · accompagnement compris" : ""}
            </p>
          </div>
          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
            <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(cout.total)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              {nbActifs} stagiaire(s) actif(s) ce mois
            </p>
          </div>

          {avecCatalogue && (
            <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(part)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                Part catalogue · {PART_CATALOGUE} % de {euros(caCatalogue)}
              </p>
            </div>
          )}

          <div style={{ ...CARTE, flex: "1 1 170px", marginBottom: 0, border: "1px solid rgba(200,169,110,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
              {euros(total)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
              Total du mois, hors taxes
            </p>
          </div>
        </div>

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 14px" }}>
          Votre abonnement
        </h2>

        <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
            <span>Poste</span>
            <span>Montant</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)" }}>
            <span>Espace, hébergement, support et mises à jour</span>
            <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{euros(ABONNEMENT_BASE)}</span>
          </div>

          {accompagnement && (
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)" }}>
              <span>
                Accompagnement jusqu'au bilan pédagogique et financier
                {!optionFacturee && (
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px" }}> · compris dans votre offre</span>
                )}
              </span>
              <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{euros(OPTION_ACCOMPAGNEMENT)}</span>
            </div>
          )}

          {!accompagnement && (
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <span>Accompagnement jusqu'au bilan pédagogique et financier · non souscrit</span>
              <span>{euros(OPTION_ACCOMPAGNEMENT)} en option</span>
            </div>
          )}
        </div>

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 14px" }}>
          Vos stagiaires actifs, palier par palier
        </h2>

        {nbActifs === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun stagiaire actif ce mois-ci. Seul l'abonnement sera facturé.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Palier</span>
              <span>Stagiaires</span>
              <span>Tarif</span>
              <span>Montant</span>
            </div>

            {cout.detail.map(function (d: any, i: number) {
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                  <span>{d.libelle}</span>
                  <span>{d.nombre}</span>
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>{euros(d.prix)} / mois</span>
                  <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{euros(d.montant)}</span>
                </div>
              );
            })}
          </div>
        )}

        {listeSortis.length > 0 && (
          <div style={{ ...CARTE, background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.3)", marginTop: "16px" }}>
            <p style={{ color: "#4caf50", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.75" }}>
              {listeSortis.length} stagiaire(s) ne sont plus facturés : leur parcours est terminé
              ou a été clos.
            </p>
            {listeSortis.map(function (x: any, i: number) {
              return (
                <p key={i} style={{ color: "rgba(255,255,255,0.6)", fontSize: "13.5px", margin: "0 0 3px", lineHeight: "1.6" }}>
                  {x.nom || x.email} · {x.motif}
                </p>
              );
            })}
          </div>
        )}

        <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 14px" }}>
          Le détail, stagiaire par stagiaire
        </h2>

        {nbActifs === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Le détail apparaîtra dès la première inscription.
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2.4fr 1fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
              <span>Stagiaire</span>
              <span>Parcours en cours</span>
              <span>Avancement</span>
              <span>Origine</span>
            </div>

            {stagiairesActifs.map(function (s: any, i: number) {
              const duCatalogue = s.parcours.filter(function (p: any) { return p.catalogue; }).length;
              // L'AVANCEMENT DIT POURQUOI LE STAGIAIRE EST ENCORE FACTURE.
              // Sans lui, l'organisme lit une ligne de facture sans pouvoir
              // la contester : c'est exactement ce qu'on veut eviter.
              const mesurables = s.parcours.filter(function (p: any) { return p.auPlan > 0; });
              const valides = mesurables.reduce(function (n: number, p: any) { return n + p.valides; }, 0);
              const auPlan = mesurables.reduce(function (n: number, p: any) { return n + p.auPlan; }, 0);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2.4fr 1fr 1fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                  <span style={{ wordBreak: "break-all" }}>{s.nom || s.email}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    {s.parcours.map(function (p: any) { return p.titre; }).join(" · ")}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "12.5px" }}>
                    {auPlan > 0 ? valides + " / " + auPlan + " modules" : "—"}
                  </span>
                  <span style={{ color: duCatalogue > 0 ? "#c8a96e" : "#4caf50", fontSize: "12.5px" }}>
                    {duCatalogue > 0 ? "catalogue AcadémIA" : "vos formations"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {avecCatalogue && (
          <div style={{ marginTop: "26px" }}>
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 14px" }}>
              Vos ventes sur le catalogue ce mois-ci
            </h2>

            {ventesCatalogue.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune vente sur le catalogue ce mois-ci. Aucune part n'est due.
                </p>
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2.4fr 1fr", background: "rgba(200,169,110,0.12)", padding: "13px 18px", fontSize: "12.5px", color: "#c8a96e", fontWeight: "bold" }}>
                  <span>Stagiaire</span>
                  <span>Formation du catalogue</span>
                  <span>Votre prix</span>
                </div>

                {ventesCatalogue.map(function (v: any, i: number) {
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2.4fr 1fr", padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", alignItems: "center" }}>
                      <span style={{ wordBreak: "break-all" }}>{v.nom}</span>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{v.titre}</span>
                      <span style={{ color: "#c8a96e", fontWeight: "bold" }}>{euros(v.prix)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            Comment se calcule votre facture : l'abonnement mensuel, puis un montant par stagiaire
            actif — {euros(49)} du 1er au 10e, {euros(39)} du 11e au 50e, {euros(29)} au-delà
            {avecCatalogue ? ", et " + PART_CATALOGUE + " % du chiffre d'affaires brut réalisé sur les formations du catalogue AcadémIA" : ""}.
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 10px", lineHeight: "1.8" }}>
            Un stagiaire actif est inscrit à au moins un parcours non terminé au cours du mois.
            Un parcours est terminé lorsque tous ses modules sont validés, ou lorsque vous le
            clôturez vous-même en cas d&apos;abandon. Un stagiaire inscrit à plusieurs parcours
            compte pour un, et reste facturé tant qu&apos;il lui en reste un en cours.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.8" }}>
            Rien n'est dû sur le chiffre d'affaires de vos propres formations. La facture est
            établie en fin de mois, à terme échu, réglable à trente jours. Cette page est mise à
            jour en continu : vous n'avez aucune déclaration à faire.
          </p>
        </div>
      </div>
    </div>
  );
}
