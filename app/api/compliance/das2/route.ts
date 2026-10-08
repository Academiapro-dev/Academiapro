import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

// Seuil annuel par beneficiaire : en deca, rien n est a declarer.
const SEUIL = 1200;

// Comptes concernes par la declaration des honoraires.
const NATURES = [
  { racine: "6226", nature: "honoraires", libelle: "Honoraires" },
  { racine: "6221", nature: "commissions", libelle: "Commissions et courtages" },
  { racine: "6222", nature: "commissions", libelle: "Commissions sur ventes" },
  { racine: "6227", nature: "honoraires", libelle: "Frais d'actes et de contentieux" },
  { racine: "6228", nature: "honoraires", libelle: "Divers - rémunérations d'intermédiaires" },
  { racine: "6231", nature: "autres", libelle: "Annonces et insertions" },
  { racine: "6516", nature: "droits", libelle: "Droits d'auteur et de reproduction" },
];

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

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Le beneficiaire : le compte auxiliaire quand il existe, sinon le libelle
// de l ecriture nettoye de ce qui n identifie personne.
function beneficiaire(l: any): string {
  if (l.comp_aux_lib) return String(l.comp_aux_lib).trim();
  if (l.comp_aux_num) return String(l.comp_aux_num).trim();

  let t = String(l.ecriture_lib || "").trim();
  t = t
    .replace(/facture\s*(n[°o]?\s*)?[A-Z0-9\-\/]+/gi, "")
    .replace(/\b(FA|FC|AV)[-\s]?\d+/gi, "")
    .replace(/\d{2}\/\d{2}\/\d{2,4}/g, "")
    .replace(/\b\d[\d\s,.]*\s*(EUR|€)\b/gi, "")
    .replace(/[-–—]+\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return t || "Bénéficiaire non identifié";
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    }

    // LE BARRAGE : elle nomme les beneficiaires d honoraires.
    const refus = await lecture(id);
    if (refus) return refus;

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, siren, exercice_debut, exercice_fin")
      .eq("id", id)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    // La DAS2 porte sur l annee civile, pas sur l exercice.
    const annee = parseInt(req.nextUrl.searchParams.get("year") || "", 10)
      || (dossier.exercice_fin
        ? parseInt(String(dossier.exercice_fin).slice(0, 4), 10)
        : new Date().getFullYear());

    const debut = annee + "-01-01";
    const fin = annee + "-12-31";

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, comp_aux_num, comp_aux_lib, ecriture_lib, ecriture_num, ecriture_date, debit, credit, piece_ref")
      .eq("societe_id", id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    const retenues = (lignes || []).filter(function (l: any) {
      const n = String(l.compte_num || "");
      return NATURES.some(function (x) { return n.startsWith(x.racine); });
    });

    const parBeneficiaire: any = {};

    // 🆕 08/10 — UNE CONTREPASSATION ANNULE SON ECRITURE D ORIGINE, Y COMPRIS
    // DANS LA DAS2. Le beneficiaire se lit sur le compte auxiliaire, a defaut
    // sur le libelle de l ecriture. Or une contrepassation porte son propre
    // libelle (« Contrepassation de AC2026-0003 - … ») : quand l ecriture
    // d origine n avait pas de tiers, les deux tombaient sous deux noms
    // differents, et l honoraire annule restait « a declarer ». Trouve le
    // 08/10 en preparant l essai de la DAS2 (Test Dupont SARL).
    // La contrepassation est donc rangee sous le beneficiaire de la ligne
    // qu elle annule : meme ecriture (« CONTREPASSATION <numero> » dans la
    // piece), meme compte, meme montant. Si l origine n est pas dans
    // l annee lue, rien ne change.
    const PREFIXE_CP = "CONTREPASSATION ";
    const origineDe = function (l: any): string {
      const p = String(l.piece_ref || "");
      return p.indexOf(PREFIXE_CP) === 0 ? p.slice(PREFIXE_CP.length).trim() : "";
    };
    const montantAbsolu = function (l: any): string {
      return Math.abs(r2((Number(l.debit) || 0) - (Number(l.credit) || 0))).toFixed(2);
    };
    const origineParLigne: any = {};
    const origineParEcriture: any = {};
    for (const l of retenues) {
      if (origineDe(l)) continue;
      const o = { nom: beneficiaire(l), identifiant: l.comp_aux_num || null };
      origineParLigne[l.ecriture_num + "|" + l.compte_num + "|" + montantAbsolu(l)] = o;
      if (!origineParEcriture[l.ecriture_num]) origineParEcriture[l.ecriture_num] = o;
    }

    for (const l of retenues) {
      let nom = beneficiaire(l);
      let identifiantLigne = l.comp_aux_num || null;
      const origine = origineDe(l);
      if (origine && !l.comp_aux_lib && !l.comp_aux_num) {
        const o = origineParLigne[origine + "|" + l.compte_num + "|" + montantAbsolu(l)]
          || origineParEcriture[origine];
        if (o) {
          nom = o.nom;
          identifiantLigne = o.identifiant;
        }
      }
      const cle = nom.toLowerCase();
      const n = String(l.compte_num);
      const nature = (NATURES.find(function (x) { return n.startsWith(x.racine); }) || NATURES[0]);

      if (!parBeneficiaire[cle]) {
        parBeneficiaire[cle] = {
          beneficiaire: nom,
          identifiant: identifiantLigne,
          montant: 0,
          natures: {},
          lignes: [],
        };
      }

      const p = parBeneficiaire[cle];
      const montant = r2((Number(l.debit) || 0) - (Number(l.credit) || 0));
      if (montant === 0) continue;

      p.montant = r2(p.montant + montant);
      p.natures[nature.nature] = r2((p.natures[nature.nature] || 0) + montant);
      p.lignes.push({
        date: l.ecriture_date,
        ecriture: l.ecriture_num,
        piece: l.piece_ref,
        compte: n,
        libelle: l.ecriture_lib,
        montant: montant,
      });
    }

    // 🆕 08/10 — un beneficiaire dont tout a ete contrepasse (total nul)
    // n en est plus un : il ne figure pas dans la liste.
    const tous = Object.keys(parBeneficiaire)
      .filter(function (k) { return parBeneficiaire[k].montant !== 0; })
      .map(function (k) {
        const p = parBeneficiaire[k];
        return {
          ...p,
          a_declarer: p.montant >= SEUIL,
          identification_incomplete: !p.identifiant
            || p.beneficiaire === "Bénéficiaire non identifié",
        };
      })
      .sort(function (a: any, b: any) { return b.montant - a.montant; });

    const aDeclarer = tous.filter(function (p: any) { return p.a_declarer; });
    const incomplets = aDeclarer.filter(function (p: any) { return p.identification_incomplete; });

    return NextResponse.json({
      ok: true,
      dossier: {
        code: dossier.code, raison_sociale: dossier.raison_sociale, siren: dossier.siren,
      },
      annee: annee,
      seuil: SEUIL,
      total_a_declarer: r2(aDeclarer.reduce(function (s: number, p: any) { return s + p.montant; }, 0)),
      nb_a_declarer: aDeclarer.length,
      nb_sous_seuil: tous.length - aDeclarer.length,
      nb_identification_incomplete: incomplets.length,
      beneficiaires: tous,
      avertissement:
        "Les bénéficiaires sont déduits du compte auxiliaire, ou à défaut du libellé "
        + "des écritures. Vérifiez chaque identité avant dépôt : un bénéficiaire mal "
        + "identifié est le premier motif de rejet de la DAS2.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
