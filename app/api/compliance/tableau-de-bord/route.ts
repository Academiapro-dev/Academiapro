import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 90;

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

// Le pays est une donnee du dossier, pas une deduction faite sur sa forme
// juridique. Absent, on suppose la France : c est le cas courant.
function estFrancais(dossier: any): boolean {
  return String(dossier.pays || "FR").toUpperCase() === "FR";
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    // LE FILTRE : dossiersAutorises rend TOUJOURS une liste, bornee a
    // l organisme de la session et aux dossiers confies au collaborateur.
    // Une liste vide signifie « aucun dossier visible » — on s arrete la.
    const autorises = await dossiersAutorises();
    if (autorises.length === 0) {
      return NextResponse.json({ ok: true, total: 0, dossiers: [], alertes: 0 });
    }

    const { data: dossiers } = await supabase
      .from("compta_societes")
      .select("*")
      .eq("actif", true)
      .in("id", autorises)
      .limit(500);

    const liste = dossiers || [];
    if (liste.length === 0) {
      return NextResponse.json({ ok: true, total: 0, dossiers: [], alertes: 0 });
    }

    const ids = liste.map(function (s: any) { return s.id; });

    // Tout se lit en quatre requetes, pas une par dossier : a cinquante
    // dossiers, la difference se voit.
    const { data: ecritures } = await supabase
      .from("compta_ecritures")
      .select("societe_id, compte_num, debit, credit, ecriture_date, ecriture_num, piece_ref, journal_code")
      .in("societe_id", ids)
      .limit(100000);

    const { data: releves } = await supabase
      .from("compta_releves")
      .select("societe_id, ecriture_num, ignore")
      .in("societe_id", ids)
      .limit(50000);

    const { data: pieces } = await supabase
      .from("compta_pieces")
      .select("societe_id, ecriture_num")
      .in("societe_id", ids)
      .limit(20000);

    const { data: provisions } = await supabase
      .from("compta_provisions")
      .select("societe_id, montant_provision, montant_reprise")
      .in("societe_id", ids)
      .limit(5000);

    const parDossier: any = {};
    for (const s of liste) {
      parDossier[s.id] = {
        debit: 0, credit: 0, lignes: 0, derniere: null,
        tvaCollectee: 0, tvaDeductible: 0, tvaDecaisser: 0,
        liquidationPassee: false,
        ecrituresSansPiece: {}, avecPiece: {},
        relevesOuverts: 0, provisions: 0,
      };
    }

    const moisCourant = new Date().toISOString().slice(0, 7);

    for (const l of ecritures || []) {
      const p = parDossier[l.societe_id];
      if (!p) continue;
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;
      const num = String(l.compte_num || "");

      p.debit = r2(p.debit + debit);
      p.credit = r2(p.credit + credit);
      p.lignes = p.lignes + 1;

      const t = l.ecriture_date ? new Date(l.ecriture_date).getTime() : 0;
      if (t && (!p.derniere || t > p.derniere)) p.derniere = t;

      if (String(l.ecriture_date || "").slice(0, 7) === moisCourant) {
        if (num === "445710") p.tvaCollectee = r2(p.tvaCollectee + credit - debit);
        if (num === "445660" || num === "445620") p.tvaDeductible = r2(p.tvaDeductible + debit - credit);
        if (num === "445510") p.tvaDecaisser = r2(p.tvaDecaisser + credit - debit);
      }

      if (String(l.ecriture_num || "").indexOf("TVA") >= 0) p.liquidationPassee = true;
      if (!l.piece_ref && l.journal_code !== "AN") p.ecrituresSansPiece[l.ecriture_num] = true;
    }

    for (const r of releves || []) {
      const p = parDossier[r.societe_id];
      if (!p) continue;
      if (!r.ecriture_num && !r.ignore) p.relevesOuverts = p.relevesOuverts + 1;
    }

    for (const pi of pieces || []) {
      const p = parDossier[pi.societe_id];
      if (!p || !pi.ecriture_num) continue;
      p.avecPiece[pi.ecriture_num] = true;
    }

    for (const pr of provisions || []) {
      const p = parDossier[pr.societe_id];
      if (!p) continue;
      const restante = r2(Number(pr.montant_provision) - (Number(pr.montant_reprise) || 0));
      if (restante > 0.005) p.provisions = r2(p.provisions + restante);
    }

    const maintenant = Date.now();

    const resultat = liste.map(function (s: any) {
      const p = parDossier[s.id];
      const ecart = r2(p.debit - p.credit);
      const equilibre = Math.abs(ecart) < 0.01;

      const sansPiece = Object.keys(p.ecrituresSansPiece).filter(function (n) {
        return !p.avecPiece[n];
      }).length;

      const tvaDue = r2(p.tvaCollectee - p.tvaDeductible);
      const tvaAtraiter = tvaDue > 0.005 && !p.liquidationPassee;
      const dormant = p.derniere ? (maintenant - p.derniere) > 40 * 86400000 : p.lignes === 0;

      const francais = estFrancais(s);

      // L ordre de priorite : ce qui bloque d abord, ce qui traine ensuite.
      //
      // 🆕 CES PHRASES SONT AFFICHEES TELLES QUELLES sur l ecran « Mes
      // dossiers », sous le nom de chaque societe. Elles etaient les seules
      // lignes non accentuees d un ecran montre aux cabinets comptables —
      // corrige le 02/09.
      let priorite = 0;
      const raisons: string[] = [];
      if (!equilibre && p.lignes > 0) { priorite = priorite + 100; raisons.push("balance déséquilibrée"); }
      if (tvaAtraiter) { priorite = priorite + 50; raisons.push("TVA du mois non liquidée"); }
      if (p.relevesOuverts > 0) { priorite = priorite + 20; raisons.push(p.relevesOuverts + " ligne(s) de relevé à rapprocher"); }
      if (sansPiece > 0) { priorite = priorite + 5; raisons.push(sansPiece + " écriture(s) sans pièce"); }
      if (dormant && p.lignes > 0) { priorite = priorite + 10; raisons.push("aucune écriture depuis plus de 40 jours"); }

      // On ne reclame un SIREN qu a une societe francaise : une societe
      // etrangere n est pas immatriculee au registre francais.
      if (!s.siren && francais) { priorite = priorite + 3; raisons.push("SIREN manquant"); }

      return {
        id: s.id,
        code: s.code,
        raison_sociale: s.raison_sociale,
        siren: s.siren,
        forme: s.forme,
        pays: String(s.pays || "FR").toUpperCase(),
        francais: francais,
        regime_tva: s.regime_tva,
        lignes: p.lignes,
        debit: p.debit,
        equilibre: equilibre,
        ecart: ecart,
        releves_ouverts: p.relevesOuverts,
        ecritures_sans_piece: sansPiece,
        tva_due: tvaDue > 0 ? tvaDue : 0,
        tva_a_liquider: tvaAtraiter,
        provisions: p.provisions,
        derniere_ecriture: p.derniere ? new Date(p.derniere).toISOString() : null,
        dormant: dormant,
        priorite: priorite,
        raisons: raisons,
      };
    }).sort(function (a: any, b: any) {
      return b.priorite - a.priorite;
    });

    return NextResponse.json({
      ok: true,
      restreint: true,
      total: resultat.length,
      alertes: resultat.filter(function (s: any) { return s.priorite > 0; }).length,
      desequilibres: resultat.filter(function (s: any) { return !s.equilibre && s.lignes > 0; }).length,
      tva_a_liquider: resultat.filter(function (s: any) { return s.tva_a_liquider; }).length,
      banque_a_rapprocher: resultat.filter(function (s: any) { return s.releves_ouverts > 0; }).length,
      dormants: resultat.filter(function (s: any) { return s.dormant && s.lignes > 0; }).length,
      lignes_totales: resultat.reduce(function (s: number, x: any) { return s + x.lignes; }, 0),
      dossiers: resultat,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
