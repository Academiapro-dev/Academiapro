import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 90;

const ADMINS = ["contact@academiapro.fr"];

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

// Virgule decimale : sans elle, Excel francais lit les montants comme du texte.
function nombre(n: any): string {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  if (v === 0) return "";
  return v.toFixed(2).replace(".", ",");
}

function cellule(v: any): string {
  const t = String(v === null || v === undefined ? "" : v).replace(/"/g, '""');
  return t.indexOf(";") >= 0 || t.indexOf("\n") >= 0 || t.indexOf('"') >= 0
    ? '"' + t + '"'
    : t;
}

function jour(v: any): string {
  if (!v) return "";
  const t = String(v).slice(0, 10).split("-");
  if (t.length !== 3) return String(v);
  return t[2] + "/" + t[1] + "/" + t[0];
}

function fabriquer(entete: string[], lignes: any[][], nom: string) {
  const corps = [entete.join(";")]
    .concat(lignes.map(function (l) { return l.map(cellule).join(";"); }))
    .join("\r\n");

  // La marque d ordre des octets : sans elle, les accents sortent en charabia.
  const contenu = "\uFEFF" + corps + "\r\n";

  return new NextResponse(contenu, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="' + nom + '.csv"',
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    const quoi = (req.nextUrl.searchParams.get("quoi") || "balance").trim();

    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // LE BARRAGE DE LECTURE : un export emporte le dossier entier.
    const refus = await lecture(id);
    if (refus) return refus;

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, exercice_debut, exercice_fin")
      .eq("id", id)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const annee = parseInt(req.nextUrl.searchParams.get("year") || "", 10);
    let debut: string;
    let fin: string;

    if (annee) {
      debut = annee + "-01-01";
      fin = annee + "-12-31";
    } else if (dossier.exercice_debut && dossier.exercice_fin) {
      debut = String(dossier.exercice_debut).slice(0, 10);
      fin = String(dossier.exercice_fin).slice(0, 10);
    } else {
      const a = new Date().getFullYear();
      debut = a + "-01-01";
      fin = a + "-12-31";
    }

    const suffixe = dossier.code + "-" + debut.slice(0, 4);

    // ---- PLAN COMPTABLE ----
    if (quoi === "plan") {
      const { data: communs } = await supabase
        .from("compta_comptes").select("*").is("societe_id", null).limit(3000);
      const { data: propres } = await supabase
        .from("compta_comptes").select("*").eq("societe_id", id).limit(3000);

      const plan: any = {};
      for (const c of communs || []) plan[c.numero] = { ...c, origine: "commun" };
      for (const c of propres || []) plan[c.numero] = { ...c, origine: "dossier" };

      const lignes = Object.keys(plan).sort().map(function (n) {
        const c = plan[n];
        return [c.numero, c.libelle, c.classe, c.type || "", c.lettrable ? "oui" : "non", c.origine];
      });

      return fabriquer(
        ["Compte", "Libelle", "Classe", "Type", "Lettrable", "Origine"],
        lignes,
        "plan-comptable-" + suffixe
      );
    }

    const { data: ecritures } = await supabase
      .from("compta_ecritures")
      .select("journal_code, journal_lib, ecriture_num, ecriture_date, compte_num, compte_lib, piece_ref, piece_date, ecriture_lib, debit, credit, lettrage, verrouille")
      .eq("societe_id", id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .order("ecriture_date", { ascending: true })
      .order("ecriture_num", { ascending: true })
      .limit(50000);

    const mouvements = ecritures || [];

    // ---- LIVRE JOURNAL ----
    if (quoi === "journal") {
      const lignes = mouvements.map(function (l: any) {
        return [
          jour(l.ecriture_date), l.journal_code, l.ecriture_num,
          l.compte_num, l.compte_lib, l.piece_ref || "",
          l.ecriture_lib, nombre(l.debit), nombre(l.credit),
          l.lettrage || "", l.verrouille ? "verrouillee" : "",
        ];
      });

      return fabriquer(
        ["Date", "Journal", "Ecriture", "Compte", "Libelle du compte", "Piece",
          "Libelle", "Debit", "Credit", "Lettrage", "Etat"],
        lignes,
        "journal-" + suffixe
      );
    }

    // ---- GRAND LIVRE : tous les comptes, avec leur solde progressif ----
    if (quoi === "grand-livre") {
      const parCompte: any = {};
      for (const l of mouvements) {
        const n = String(l.compte_num);
        if (!parCompte[n]) parCompte[n] = [];
        parCompte[n].push(l);
      }

      const lignes: any[][] = [];
      for (const n of Object.keys(parCompte).sort()) {
        let cumul = 0;
        for (const l of parCompte[n]) {
          cumul = r2(cumul + (Number(l.debit) || 0) - (Number(l.credit) || 0));
          lignes.push([
            n, l.compte_lib, jour(l.ecriture_date), l.journal_code, l.ecriture_num,
            l.ecriture_lib, nombre(l.debit), nombre(l.credit), nombre(cumul), l.lettrage || "",
          ]);
        }
      }

      return fabriquer(
        ["Compte", "Libelle du compte", "Date", "Journal", "Ecriture",
          "Libelle", "Debit", "Credit", "Solde progressif", "Lettrage"],
        lignes,
        "grand-livre-" + suffixe
      );
    }

    // ---- BALANCE ----
    const comptes: any = {};
    for (const l of mouvements) {
      const n = String(l.compte_num);
      if (!comptes[n]) comptes[n] = { libelle: l.compte_lib, debit: 0, credit: 0, lignes: 0 };
      comptes[n].debit = r2(comptes[n].debit + (Number(l.debit) || 0));
      comptes[n].credit = r2(comptes[n].credit + (Number(l.credit) || 0));
      comptes[n].lignes = comptes[n].lignes + 1;
    }

    const lignes = Object.keys(comptes).sort().map(function (n) {
      const c = comptes[n];
      const solde = r2(c.debit - c.credit);
      return [
        n, c.libelle, c.lignes,
        nombre(c.debit), nombre(c.credit),
        nombre(solde > 0 ? solde : 0),
        nombre(solde < 0 ? -solde : 0),
      ];
    });

    const totalDebit = r2(Object.keys(comptes).reduce(function (s, n) { return s + comptes[n].debit; }, 0));
    const totalCredit = r2(Object.keys(comptes).reduce(function (s, n) { return s + comptes[n].credit; }, 0));

    lignes.push(["", "TOTAUX", "", nombre(totalDebit), nombre(totalCredit), "", ""]);

    return fabriquer(
      ["Compte", "Libelle", "Mouvements", "Total debit", "Total credit",
        "Solde debiteur", "Solde crediteur"],
      lignes,
      "balance-" + suffixe
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
