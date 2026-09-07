import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// L ABONNEMENT MYSTERLLC — 07/09.
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
// Un gestionnaire qui suit trois LLC paie donc trois fois. C est la meme
// logique que la licence Mr CRM : ce qu on vend, c est un acces par
// dossier, pas un compte.
//
// ⚠️ LA GRILLE EST LUE EN BASE, jamais ecrite ici. Deux lignes dans
// `tarifs` avec `produit = 'mysterllc'` : 'suivi' a 49 € et 'comptabilite'
// a 99 €. Recopier ces montants dans le code creerait deux verites.
//
// ⚠️ UNE SOCIETE SANS FORFAIT N EST PAS FACTUREE. La colonne
// `compliance_tenants.forfait` peut etre vide — une societe ajoutee au
// portefeuille mais pas encore souscrite. On l affiche a part plutot que
// de lui appliquer un tarif qu elle n a pas choisi.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

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
      .select("offre, poste, libelle, montant, commentaire")
      .eq("produit", "mysterllc")
      .eq("poste", "abonnement"),
  ]);

  if (societesR.error) {
    console.error("[compliance/facturation] " + societesR.error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }

  const grille: any = {};
  for (const t of tarifsR.data || []) {
    grille[t.offre] = {
      offre: t.offre,
      libelle: t.libelle,
      montant: Number(t.montant) || 0,
      commentaire: t.commentaire || "",
    };
  }

  // ⚠️ ON RATTACHE SON TARIF A CHAQUE SOCIETE, ET ON TOTALISE. Le client
  // voit ce qu il paie ligne par ligne : c est ce qui evite la question
  // « pourquoi ce montant ? » a la reception de la facture.
  let total = 0;
  let nbSansForfait = 0;

  const lignes = (societesR.data || []).map(function (s: any) {
    const f = s.forfait ? grille[s.forfait] : null;
    if (f) total = total + f.montant;
    else nbSansForfait++;
    return {
      id: s.id,
      label: s.label,
      legal_name: s.legal_name,
      formation_state: s.formation_state,
      formation_date: s.formation_date,
      forfait: s.forfait || null,
      libelle: f ? f.libelle : null,
      montant: f ? f.montant : 0,
    };
  });

  return NextResponse.json({
    ok: true,
    societes: lignes,
    grille: [grille.suivi, grille.comptabilite].filter(Boolean),
    total: Math.round(total * 100) / 100,
    nb_societes: lignes.length,
    nb_sans_forfait: nbSansForfait,
  });
}
