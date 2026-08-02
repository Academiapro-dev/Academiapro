import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const CLASSES: any = {
  1: "Capitaux", 2: "Immobilisations", 3: "Stocks", 4: "Tiers",
  5: "Tresorerie", 6: "Charges", 7: "Produits",
};

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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const code = (req.nextUrl.searchParams.get("societe") || "").trim().toUpperCase();
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    const compteDemande = (req.nextUrl.searchParams.get("compte") || "").trim();
    const vueDemandee = (req.nextUrl.searchParams.get("vue") || "").trim();
    const journalDemande = (req.nextUrl.searchParams.get("journal") || "").trim().toUpperCase();

    const { data: dossiers } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, exercice_debut, exercice_fin, actif")
      .limit(500);

    const liste = (dossiers || []).filter(function (s: any) { return s.actif !== false; });

    if (liste.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Aucun dossier comptable." }, { status: 404 });
    }

    let dossier: any = null;
    if (id) dossier = liste.find(function (s: any) { return s.id === id; }) || null;
    else if (code) {
      dossier = liste.find(function (s: any) {
        return String(s.code || "").trim().toUpperCase() === code;
      }) || null;
    } else if (liste.length === 1) dossier = liste[0];

    if (!dossier) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Precisez le dossier : ?societe=CODE",
          dossiers: liste.map(function (s: any) {
            return { code: s.code, raison_sociale: s.raison_sociale };
          }),
        },
        { status: 400 }
      );
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

    let requete = supabase
      .from("compta_ecritures")
      .select("journal_code, journal_lib, ecriture_num, ecriture_date, compte_num, compte_lib, ecriture_lib, piece_ref, debit, credit, lettrage")
      .eq("societe_id", dossier.id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin);

    if (compteDemande) requete = requete.eq("compte_num", compteDemande);
    if (journalDemande) requete = requete.eq("journal_code", journalDemande);

    const { data: lignes, error } = await requete
      .order("ecriture_date", { ascending: true })
      .order("ecriture_num", { ascending: true })
      .limit(50000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const mouvements = lignes || [];
    const entete = {
      dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale },
      periode: { debut: debut, fin: fin },
    };

    // ---- LIVRE JOURNAL : les ecritures groupees par piece, dans l ordre. ----
    if (vueDemandee === "journal") {
      const pieces: any = {};
      const journaux: any = {};

      for (const l of mouvements) {
        const n = String(l.ecriture_num);
        if (!pieces[n]) {
          pieces[n] = {
            ecriture_num: n,
            journal_code: l.journal_code,
            journal_lib: l.journal_lib,
            date: l.ecriture_date,
            piece_ref: l.piece_ref,
            libelle: l.ecriture_lib,
            lignes: [],
            debit: 0,
            credit: 0,
          };
        }
        const p = pieces[n];
        p.lignes.push({
          compte: l.compte_num,
          libelle_compte: l.compte_lib,
          libelle: l.ecriture_lib,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          lettrage: l.lettrage,
        });
        p.debit = r2(p.debit + (Number(l.debit) || 0));
        p.credit = r2(p.credit + (Number(l.credit) || 0));

        if (!journaux[l.journal_code]) {
          journaux[l.journal_code] = { code: l.journal_code, libelle: l.journal_lib, pieces: 0, debit: 0 };
        }
        journaux[l.journal_code].debit = r2(journaux[l.journal_code].debit + (Number(l.debit) || 0));
      }

      const ecritures = Object.keys(pieces)
        .map(function (k) {
          const p = pieces[k];
          return { ...p, equilibree: Math.abs(r2(p.debit - p.credit)) < 0.01 };
        })
        .sort(function (a: any, b: any) {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          if (da !== db) return da - db;
          return String(a.ecriture_num).localeCompare(String(b.ecriture_num));
        });

      for (const e of ecritures) {
        if (journaux[e.journal_code]) journaux[e.journal_code].pieces += 1;
      }

      return NextResponse.json({
        ok: true,
        vue: "journal",
        ...entete,
        journal_filtre: journalDemande || null,
        journaux: Object.keys(journaux).sort().map(function (k) { return journaux[k]; }),
        totaux: {
          pieces: ecritures.length,
          lignes: mouvements.length,
          desequilibrees: ecritures.filter(function (e: any) { return !e.equilibree; }).length,
        },
        ecritures: ecritures,
      });
    }

    // ---- GRAND LIVRE : un compte, avec son solde progressif. ----
    if (compteDemande) {
      let cumul = 0;
      const detail = mouvements.map(function (l: any) {
        const debit = Number(l.debit) || 0;
        const credit = Number(l.credit) || 0;
        cumul = r2(cumul + debit - credit);
        return {
          date: l.ecriture_date,
          journal: l.journal_code,
          ecriture: l.ecriture_num,
          piece: l.piece_ref,
          libelle: l.ecriture_lib,
          debit: debit,
          credit: credit,
          solde_progressif: cumul,
          lettrage: l.lettrage,
        };
      });

      const totalDebit = r2(detail.reduce(function (s: number, l: any) { return s + l.debit; }, 0));
      const totalCredit = r2(detail.reduce(function (s: number, l: any) { return s + l.credit; }, 0));

      return NextResponse.json({
        ok: true,
        vue: "grand_livre",
        ...entete,
        compte: {
          numero: compteDemande,
          libelle: mouvements.length > 0 ? mouvements[0].compte_lib : "",
          debit: totalDebit,
          credit: totalCredit,
          solde: r2(totalDebit - totalCredit),
        },
        mouvements: detail,
      });
    }

    // ---- BALANCE : un compte par ligne. ----
    const comptes: any = {};

    for (const l of mouvements) {
      const num = String(l.compte_num || "");
      if (!comptes[num]) {
        comptes[num] = { numero: num, libelle: l.compte_lib, debit: 0, credit: 0, lignes: 0 };
      }
      const c = comptes[num];
      c.debit = r2(c.debit + (Number(l.debit) || 0));
      c.credit = r2(c.credit + (Number(l.credit) || 0));
      c.lignes = c.lignes + 1;
    }

    const balance = Object.keys(comptes).sort().map(function (num) {
      const c = comptes[num];
      const solde = r2(c.debit - c.credit);
      return {
        ...c,
        classe: parseInt(num.charAt(0), 10),
        classe_nom: CLASSES[parseInt(num.charAt(0), 10)] || "",
        solde: solde,
        solde_debiteur: solde > 0 ? solde : 0,
        solde_crediteur: solde < 0 ? r2(-solde) : 0,
      };
    });

    const totalDebit = r2(balance.reduce(function (s: number, c: any) { return s + c.debit; }, 0));
    const totalCredit = r2(balance.reduce(function (s: number, c: any) { return s + c.credit; }, 0));
    const ecart = r2(totalDebit - totalCredit);

    const parClasse: any = {};
    for (const c of balance) {
      const k = String(c.classe);
      if (!parClasse[k]) {
        parClasse[k] = { classe: c.classe, nom: c.classe_nom, debit: 0, credit: 0, comptes: 0 };
      }
      parClasse[k].debit = r2(parClasse[k].debit + c.debit);
      parClasse[k].credit = r2(parClasse[k].credit + c.credit);
      parClasse[k].comptes = parClasse[k].comptes + 1;
    }

    const classes = Object.keys(parClasse).sort().map(function (k) {
      const c = parClasse[k];
      return { ...c, solde: r2(c.debit - c.credit) };
    });

    return NextResponse.json({
      ok: true,
      vue: "balance",
      ...entete,
      totaux: {
        debit: totalDebit,
        credit: totalCredit,
        ecart: ecart,
        equilibre: Math.abs(ecart) < 0.01,
        nb_comptes: balance.length,
        nb_lignes: mouvements.length,
      },
      classes: classes,
      balance: balance,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
