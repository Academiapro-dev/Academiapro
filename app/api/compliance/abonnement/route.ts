import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// L ABONNEMENT MYSTERLLC — 07/09, PALIERS AJOUTES LE 08/09, OFFRE
// « CREATION » AJOUTEE LE 11/09.
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
// LA GRILLE, EN BASE, dans `tarifs` (produit 'mysterllc', poste
// 'abonnement') avec `seuil_min` et `seuil_max` :
//   suivi          49 €, sans palier — LLC existante, sans comptabilite
//   comptabilite   1 a 5    99 €     6 a 10   79 €
//                 11 a 25   59 €     au-dela  49 €
//   🆕 creation   109 €, sans palier — la LLC creee par MysterLLC (agent,
//                 statuts, EIN, Operating Agreement, banque) + suivi +
//                 comptabilite. Decision Jacques du 11/09.
//
// 🚨 LE PALIER SE CALCULE SUR LE NOMBRE DE SOCIETES DU CLIENT, PAS SUR
// CELLES QUI ONT LE MEME FORFAIT. 🚨 LE MEME PRIX POUR TOUTES.
// ⛔ NE JAMAIS RECOPIER CES MONTANTS DANS LE CODE. Tout vient de `tarifs`.
// ⚠️ SI AUCUN PALIER NE CORRESPOND, on retient le dernier palier connu.
// 🚨🚨 LA GRILLE COMPLETE EST RENVOYEE, PAS SEULEMENT LE PALIER EN COURS
// (Jacques, 08/09).
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Les offres, dans l ordre ou l ecran les montre.
const OFFRES = ["suivi", "comptabilite", "creation"];

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

  // LA GRILLE MONTREE AU CLIENT : UN PALIER PAR OFFRE, celui qui s applique.
  const grille: any[] = [];
  for (const offre of OFFRES) {
    const p = palierPour(paliersParOffre[offre], volume);
    if (p) grille.push(p);
  }

  const paliersCompta = (paliersParOffre["comptabilite"] || []).map(
    function (p: any) {
      return {
        seuil_min: p.seuil_min,
        seuil_max: p.seuil_max,
        montant: p.montant,
        actuel: volume >= p.seuil_min && volume <= p.seuil_max,
        total_au_seuil: Math.round(p.montant * p.seuil_min * 100) / 100,
      };
    });

  let prochainPalier: any = null;
  const brutCompta = paliersParOffre["comptabilite"] || [];
  const actuel = palierPour(brutCompta, volume);
  if (actuel) {
    for (const p of brutCompta) {
      if (p.seuil_min > volume && p.montant < actuel.montant) {
        prochainPalier = { a_partir_de: p.seuil_min, montant: p.montant, montant_actuel: actuel.montant };
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
    paliers_comptabilite: paliersCompta,
  });
}
