import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// L ABONNEMENT MYSTERLLC — 07/09, PALIERS AJOUTES LE 08/09.
//
// ⚠️ POURQUOI « abonnement » ET NON « facturation ». Une route
// /api/compliance/facturation EXISTE DEJA (703 lignes) : elle gere les
// DOCUMENTS — devis, factures, mandats — avec la numerotation legale
// continue exigee par l article 242 nonies A de l annexe II au CGI.
// Deux choses differentes : celle-ci dit ce qu on paie, l autre produit
// les pieces. ⛔ NE JAMAIS LES CONFONDRE NI LES FUSIONNER.
//
// 🚨 LE FORFAIT EST PAR SOCIETE, PAS PAR CLIENT. Jacques, le 07/09 : « on
// parle de CLIENT possedant une LLC avec un acces pour une seule
// comptabilite, pour eviter qu il y ait un petit malin qui dise nous aussi
// on est client puisqu on a une LLC, et qui utilise 300 comptabilites dans
// une seule licence ».
//
// ══════════════════════════════════════════════════════════════════════════
// 🆕 LES PALIERS DEGRESSIFS — 08/09.
//
// POURQUOI. Le gestionnaire qui suit un portefeuille refacture ses clients
// au prix du marche — de 1 400 a 1 500 € par societe et par an chez un
// cabinet. A 99 € par mois sans degressivite, sa marge se reduit a mesure
// qu il prend des dossiers : il n a aucun interet a en confier davantage.
// Jacques, le 08/09 : « la seule chose qui pourrait le faire changer
// d avis, c est qu il trouve un interet financier et une tranquillite ».
//
// LA GRILLE, EN BASE, dans `tarifs` (produit 'mysterllc', poste
// 'abonnement') avec `seuil_min` et `seuil_max` :
//   comptabilite   1 a 5    99 €     6 a 10   79 €
//                 11 a 25   59 €     au-dela  49 €
//   suivi          49 €, sans palier
//
// 🚨 LE PALIER SE CALCULE SUR LE NOMBRE DE SOCIETES DU CLIENT, PAS SUR
// CELLES QUI ONT LE MEME FORFAIT. Celui qui suit vingt societes en tient
// vingt, quelle que soit la formule de chacune : c est son portefeuille
// qui fait le volume, pas la repartition.
//
// 🚨 LE MEME PRIX POUR TOUTES. Un palier atteint s applique a la
// TOTALITE des societes, pas seulement a celles au-dela du seuil. C est
// plus simple a comprendre et plus simple a facturer — et surtout, une
// facture ou deux societes identiques portent deux montants differents
// provoque toujours un appel.
//
// ⛔ NE JAMAIS RECOPIER CES MONTANTS DANS LE CODE. Une grille ecrite dans
// un ecran ou dans une route finit toujours par diverger de celle qui
// facture. Tout vient de `tarifs`.
//
// ⚠️ SI AUCUN PALIER NE CORRESPOND — table incomplete, seuils qui laissent
// un trou — on retient le dernier palier connu plutot que zero. Facturer
// zero par erreur ne se remarque jamais ; un montant trop eleve, si.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LE PALIER QUI S APPLIQUE A UN NOMBRE DE SOCIETES DONNE.
//
// Les paliers d une offre sont ranges du plus petit seuil au plus grand.
// On prend le premier dans lequel le nombre tombe. Faute de quoi, le
// dernier — voir le commentaire ci-dessus.
function palierPour(paliers: any[], nombre: number): any {
  if (!paliers || paliers.length === 0) return null;
  for (const p of paliers) {
    const min = Number(p.seuil_min) || 1;
    const max = Number(p.seuil_max) || 999999;
    if (nombre >= min && nombre <= max) return p;
  }
  return paliers[paliers.length - 1];
}

export async function GET() {
  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) {
    return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });
  }
  if (!tenant) {
    return NextResponse.json({ ok: false, erreur: "Aucun espace rattaché à votre compte." }, { status: 403 });
  }

  const [societesR, tarifsR] = await Promise.all([
    supabase
      .from("compliance_tenants")
      .select("id, label, legal_name, formation_state, forfait, formation_date")
      .eq("tenant_id", tenant)
      .order("label", { ascending: true }),
    supabase
      .from("tarifs")
      .select("offre, poste, libelle, montant, commentaire, seuil_min, seuil_max")
      .eq("produit", "mysterllc")
      .eq("poste", "abonnement")
      .order("seuil_min", { ascending: true }),
  ]);

  if (societesR.error) {
    console.error("[compliance/abonnement] " + societesR.error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }

  // 🚨 UNE OFFRE PORTE PLUSIEURS PALIERS. L ancienne version ecrivait
  // `grille[t.offre] = t`, ce qui ECRASAIT a chaque tour : avec quatre
  // lignes « comptabilite », seule la derniere survivait — 49 € au lieu
  // de 99 pour tout le monde, sans que rien ne le signale.
  const paliersParOffre: any = {};
  for (const t of tarifsR.data || []) {
    if (!paliersParOffre[t.offre]) paliersParOffre[t.offre] = [];
    paliersParOffre[t.offre].push({
      offre: t.offre,
      libelle: t.libelle,
      montant: Number(t.montant) || 0,
      commentaire: t.commentaire || "",
      seuil_min: Number(t.seuil_min) || 1,
      seuil_max: Number(t.seuil_max) || 999999,
    });
  }

  const societes = societesR.data || [];

  // 🚨 LE VOLUME, C EST LE PORTEFEUILLE ENTIER — y compris les societes
  // sans forfait. Elles ne se facturent pas, mais elles comptent : le
  // gestionnaire qui en ajoute une vingtieme ne doit pas voir son prix
  // remonter parce que trois d entre elles attendent leur souscription.
  const volume = societes.length;

  let total = 0;
  let nbSansForfait = 0;

  const lignes = societes.map(function (s: any) {
    const paliers = s.forfait ? paliersParOffre[s.forfait] : null;
    const p = paliers ? palierPour(paliers, volume) : null;

    if (p) total = total + p.montant;
    else nbSansForfait++;

    return {
      id: s.id,
      label: s.label,
      legal_name: s.legal_name,
      formation_state: s.formation_state,
      formation_date: s.formation_date,
      forfait: s.forfait || null,
      libelle: p ? p.libelle : null,
      montant: p ? p.montant : 0,
      seuil_min: p ? p.seuil_min : null,
      seuil_max: p ? p.seuil_max : null,
    };
  });

  // ⚠️ LA GRILLE MONTREE AU CLIENT NE REPREND QU UN PALIER PAR OFFRE :
  // celui qui s applique a lui. Afficher les quatre donnerait quatre
  // cartes au meme titre, et le client se demanderait laquelle le
  // concerne. Les paliers suivants sont annonces a part, plus bas.
  const grille: any[] = [];
  for (const offre of ["suivi", "comptabilite"]) {
    const p = palierPour(paliersParOffre[offre], volume);
    if (p) grille.push(p);
  }

  // 🆕 CE QUE COUTERAIT LE PALIER SUIVANT.
  //
  // ⚠️ ON NE L AFFICHE QUE S IL EXISTE ET S IL EST MOINS CHER. C est le
  // seul endroit ou le client apprend qu il a interet a confier plus de
  // societes — et c est precisement ce qu on cherche.
  let prochainPalier: any = null;
  const paliersCompta = paliersParOffre["comptabilite"] || [];
  const actuel = palierPour(paliersCompta, volume);
  if (actuel) {
    for (const p of paliersCompta) {
      if (p.seuil_min > volume && p.montant < actuel.montant) {
        prochainPalier = {
          a_partir_de: p.seuil_min,
          montant: p.montant,
          montant_actuel: actuel.montant,
        };
        break;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    societes: lignes,
    grille: grille,
    total: Math.round(total * 100) / 100,
    nb_societes: lignes.length,
    nb_sans_forfait: nbSansForfait,
    volume: volume,
    prochain_palier: prochainPalier,
  });
}
