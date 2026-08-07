import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Grille arretee : 90 EUR d abonnement preleve par Lemon Squeezy, plus
// 19 EUR par dossier vivant factures ici. L abonnement n est PAS refacture,
// il ferait doublon avec le prelevement.
const PRIX_DOSSIER = 19;
const PRODUIT = "comptable";

// Un dossier vivant : societe active ET au moins une ecriture SAISIE dans
// le mois. On lit created_at et non ecriture_date : une ecriture de janvier
// saisie en aout temoigne d un travail d aout.
async function dossiersVivants(tenant: string, debut: string, fin: string) {
  const { data: societes, error: eSoc } = await supabase
    .from("compta_societes")
    .select("id, code, raison_sociale")
    .eq("tenant_id", tenant)
    .eq("actif", true);

  if (eSoc) throw new Error("societes: " + eSoc.message);
  if (!societes || societes.length === 0) return [];

  const vivants: any[] = [];

  for (const s of societes) {
    const { count, error } = await supabase
      .from("compta_ecritures")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant)
      .eq("societe_id", s.id)
      .gte("created_at", debut)
      .lt("created_at", fin);

    if (error) throw new Error("ecritures " + s.code + ": " + error.message);
    if ((count || 0) > 0) vivants.push(s);
  }

  return vivants;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Securite : meme cle que la creation de facture.
    const cle = req.headers.get("x-cle-facture") || url.searchParams.get("cle") || "";
    if (!process.env.CLE_API_FACTURE || cle !== process.env.CLE_API_FACTURE) {
      return NextResponse.json({ ok: false, erreur: "Non autorise" }, { status: 401 });
    }

    // Periode : le mois ECOULE par defaut. On facture en septembre le
    // travail d aout. Parametre periode=2026-08 pour forcer.
    const force = url.searchParams.get("periode");
    let annee: number;
    let mois: number;

    if (force && /^\d{4}-\d{2}$/.test(force)) {
      annee = parseInt(force.slice(0, 4), 10);
      mois = parseInt(force.slice(5, 7), 10);
    } else {
      const now = new Date();
      const p = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      annee = p.getUTCFullYear();
      mois = p.getUTCMonth() + 1;
    }

    const periode = String(annee) + "-" + String(mois).padStart(2, "0");
    const debut = new Date(Date.UTC(annee, mois - 1, 1)).toISOString();
    const fin = new Date(Date.UTC(annee, mois, 1)).toISOString();

    const essai = url.searchParams.get("essai") === "1";

    // Cabinets = tenants distincts presents dans compta_societes.
    const { data: toutes, error: eAll } = await supabase
      .from("compta_societes")
      .select("tenant_id")
      .eq("actif", true);

    if (eAll) {
      return NextResponse.json({ ok: false, erreur: eAll.message }, { status: 500 });
    }

    const cabinets: string[] = [];
    for (const l of toutes || []) {
      if (l.tenant_id && cabinets.indexOf(l.tenant_id) < 0) cabinets.push(l.tenant_id);
    }

    const resultats: any[] = [];

    for (const tenant of cabinets) {
      const vivants = await dossiersVivants(tenant, debut, fin);

      if (vivants.length === 0) {
        resultats.push({ tenant, periode, dossiers: 0, statut: "aucun dossier vivant" });
        continue;
      }

      const montant_ht = Math.round(vivants.length * PRIX_DOSSIER * 100) / 100;

      // Coordonnees du cabinet.
      const { data: org } = await supabase
        .from("organismes_formation")
        .select("raison_sociale, email_contact, numero_tva")
        .eq("tenant_id", tenant)
        .maybeSingle();

      if (essai) {
        resultats.push({
          tenant,
          periode,
          dossiers: vivants.length,
          montant_ht,
          client: (org && org.raison_sociale) || null,
          numero_tva: (org && org.numero_tva) || null,
          statut: "essai, rien emis",
          codes: vivants.map(function (v: any) { return v.code; }),
        });
        continue;
      }

      // Verrou d unicite : la contrainte (tenant, periode, produit) refuse
      // la seconde execution du meme mois. C est la base qui garantit,
      // pas le code.
      const { error: eVerrou } = await supabase
        .from("facturation_periodes")
        .insert({
          tenant_id: tenant,
          periode: periode,
          produit: PRODUIT,
          nb_dossiers: vivants.length,
          montant_ht: montant_ht,
        });

      if (eVerrou) {
        resultats.push({
          tenant,
          periode,
          dossiers: vivants.length,
          statut: "deja facture",
        });
        continue;
      }

      const description =
        "Mr. Comptable — gestion des dossiers, période " +
        periode +
        " — " +
        vivants.length +
        " dossier(s) × " +
        PRIX_DOSSIER +
        " € HT";

      // Prestataire hors UE, preneur assujetti en France : la TVA est
      // autoliquidee par le client. Sans son numero de TVA, la facture
      // n est pas reguliere.
      const reponse = await fetch(new URL("/api/admin/creer-facture", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cle-facture": process.env.CLE_API_FACTURE || "",
        },
        body: JSON.stringify({
          projet: "academia",
          tenant_id: tenant,
          client_nom: (org && org.raison_sociale) || "Cabinet " + tenant.slice(0, 8),
          client_email: (org && org.email_contact) || null,
          client_pays: "FR",
          type_client: "B2B",
          numero_tva_client: (org && org.numero_tva) || null,
          montant_ht: montant_ht,
          taux_tva: 0,
          autoliquidation: true,
          zone: "UE",
          devise: "EUR",
          description: description,
        }),
      });

      const jf = await reponse.json().catch(function () { return null; });

      if (!jf || !jf.success) {
        // La facture a echoue : on libere le verrou pour pouvoir relancer.
        await supabase
          .from("facturation_periodes")
          .delete()
          .eq("tenant_id", tenant)
          .eq("periode", periode)
          .eq("produit", PRODUIT);

        resultats.push({
          tenant,
          periode,
          dossiers: vivants.length,
          statut: "echec facture",
          detail: (jf && jf.error) || "reponse illisible",
        });
        continue;
      }

      await supabase
        .from("facturation_periodes")
        .update({ facture_numero: jf.numero, facture_id: jf.facture_id })
        .eq("tenant_id", tenant)
        .eq("periode", periode)
        .eq("produit", PRODUIT);

      resultats.push({
        tenant,
        periode,
        dossiers: vivants.length,
        montant_ht,
        numero: jf.numero,
        sans_tva_client: !(org && org.numero_tva),
        statut: "facture emise",
      });
    }

    return NextResponse.json({
      ok: true,
      periode: periode,
      cabinets: cabinets.length,
      resultats: resultats,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
