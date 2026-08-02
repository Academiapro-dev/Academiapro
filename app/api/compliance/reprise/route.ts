import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];
const MAX_LIGNES = 20000;

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

function montant(v: any): number {
  const t = String(v || "0").replace(/\s/g, "").replace(",", ".");
  const n = Number(t);
  return isNaN(n) ? 0 : r2(n);
}

// Le FEC utilise AAAAMMJJ ; on accepte aussi les dates deja separees.
function dateFec(v: any): string | null {
  const t = String(v || "").trim();
  if (/^\d{8}$/.test(t)) return t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6, 8);
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  return null;
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[|\r\n\t]/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id || !b.contenu) {
      return NextResponse.json(
        { ok: false, erreur: "Dossier et contenu sont necessaires." },
        { status: 400 }
      );
    }

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale")
      .eq("id", b.societe_id)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const brutes = String(b.contenu)
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0; });

    if (brutes.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Contenu trop court." }, { status: 400 });
    }
    if (brutes.length > MAX_LIGNES) {
      return NextResponse.json(
        { ok: false, erreur: "Limite de " + MAX_LIGNES + " lignes par reprise." },
        { status: 400 }
      );
    }

    // Le plan du dossier, pour completer les comptes inconnus.
    const { data: communs } = await supabase
      .from("compta_comptes").select("numero").is("societe_id", null).limit(3000);
    const { data: propresC } = await supabase
      .from("compta_comptes").select("numero").eq("societe_id", b.societe_id).limit(3000);

    const plan: any = {};
    for (const c of communs || []) plan[c.numero] = true;
    for (const c of propresC || []) plan[c.numero] = true;

    const aCreer: any = {};

    // ---- MODE BALANCE D OUVERTURE ----
    if (b.mode === "balance") {
      const date = String(b.date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ ok: false, erreur: "Date d ouverture invalide." }, { status: 400 });
      }

      const numero = "AN" + date.slice(0, 4) + "-REPRISE";

      const { data: deja } = await supabase
        .from("compta_ecritures")
        .select("ecriture_num")
        .eq("societe_id", b.societe_id)
        .eq("ecriture_num", numero)
        .limit(1);

      if ((deja || []).length > 0) {
        return NextResponse.json(
          { ok: false, erreur: "Une balance d ouverture a deja ete reprise pour " + date.slice(0, 4) + "." },
          { status: 409 }
        );
      }

      const lignes: any[] = [];
      const rejets: any[] = [];
      let debit = 0;
      let credit = 0;

      for (let i = 0; i < brutes.length; i = i + 1) {
        const sep = brutes[i].indexOf("\t") >= 0 ? "\t" : brutes[i].indexOf(";") >= 0 ? ";" : ",";
        const c = brutes[i].split(sep).map(function (x) { return x.replace(/^"|"$/g, "").trim(); });

        const compte = String(c[0] || "").replace(/\D/g, "").slice(0, 12);
        if (compte.length < 3) {
          if (i > 0) rejets.push({ ligne: i + 1, valeur: brutes[i].slice(0, 60), motif: "compte illisible" });
          continue;
        }

        const d = montant(c[2]);
        const cr = montant(c[3]);
        if (d === 0 && cr === 0) continue;

        if (!plan[compte]) aCreer[compte] = propre(c[1], 200) || "Compte repris";

        debit = r2(debit + d);
        credit = r2(credit + cr);

        lignes.push({
          societe_id: b.societe_id,
          journal_code: "AN",
          journal_lib: "A nouveaux",
          ecriture_num: numero,
          ecriture_date: date,
          compte_num: compte,
          compte_lib: propre(c[1], 200) || "Compte repris",
          piece_ref: "REPRISE",
          piece_date: date,
          ecriture_lib: "Balance d ouverture reprise",
          debit: d,
          credit: cr,
          devise: "EUR",
          valid_date: new Date().toISOString().slice(0, 10),
          saisi_par: session.email,
        });
      }

      if (lignes.length === 0) {
        return NextResponse.json(
          { ok: false, erreur: "Aucune ligne exploitable.", rejets: rejets },
          { status: 400 }
        );
      }

      const ecart = r2(debit - credit);
      if (Math.abs(ecart) > 0.01) {
        return NextResponse.json(
          {
            ok: false,
            erreur: "La balance ne tombe pas juste : debit " + debit.toFixed(2)
              + " contre credit " + credit.toFixed(2) + ", ecart de " + ecart.toFixed(2)
              + ". Rien n a ete repris.",
          },
          { status: 409 }
        );
      }

      const nouveaux = Object.keys(aCreer).map(function (n) {
        return {
          societe_id: b.societe_id, numero: n, libelle: aCreer[n],
          classe: parseInt(n.charAt(0), 10), type: "repris",
        };
      });
      if (nouveaux.length > 0) await supabase.from("compta_comptes").insert(nouveaux);

      const { error } = await supabase.from("compta_ecritures").insert(lignes);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        mode: "balance",
        ecriture_num: numero,
        lignes: lignes.length,
        debit: debit,
        comptes_crees: nouveaux.length,
        rejets: rejets.slice(0, 30),
        message: lignes.length + " compte(s) repris au " + date + " pour "
          + debit.toFixed(2) + " EUR equilibres."
          + (nouveaux.length > 0 ? " " + nouveaux.length + " compte(s) ajoutes au plan." : ""),
      });
    }

    // ---- MODE FEC ----
    // L en-tete donne l ordre des colonnes : on ne suppose rien.
    const entete = brutes[0].split("|").map(function (x) {
      return x.replace(/^"|"$/g, "").trim().toLowerCase();
    });

    if (entete.length < 13) {
      return NextResponse.json(
        { ok: false, erreur: "Ce fichier ne ressemble pas a un FEC : en-tete a " + entete.length + " colonnes." },
        { status: 400 }
      );
    }

    function col(nom: string): number {
      return entete.indexOf(nom.toLowerCase());
    }

    const iJournal = col("journalcode");
    const iJournalLib = col("journallib");
    const iNum = col("ecriturenum");
    const iDate = col("ecrituredate");
    const iCompte = col("comptenum");
    const iCompteLib = col("comptelib");
    const iPiece = col("pieceref");
    const iPieceDate = col("piecedate");
    const iLib = col("ecriturelib");
    const iDebit = col("debit");
    const iCredit = col("credit");
    const iLettrage = col("ecriturelet");

    if (iNum < 0 || iDate < 0 || iCompte < 0 || iDebit < 0 || iCredit < 0) {
      return NextResponse.json(
        { ok: false, erreur: "En-tete FEC incomplet : colonnes obligatoires absentes." },
        { status: 400 }
      );
    }

    // Les ecritures deja presentes ne sont pas reprises deux fois.
    const { data: existantes } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", b.societe_id)
      .limit(50000);

    const deja: any = {};
    for (const e of existantes || []) deja[e.ecriture_num] = true;

    const { data: verrous } = await supabase
      .from("compta_ecritures")
      .select("ecriture_date")
      .eq("societe_id", b.societe_id)
      .eq("verrouille", true)
      .limit(1);

    const anneeVerrouillee = (verrous || [])[0]
      ? String((verrous || [])[0].ecriture_date).slice(0, 4)
      : null;

    const lignes: any[] = [];
    const rejets: any[] = [];
    let debit = 0;
    let credit = 0;
    let ignorees = 0;

    for (let i = 1; i < brutes.length; i = i + 1) {
      const c = brutes[i].split("|").map(function (x) { return x.replace(/^"|"$/g, "").trim(); });

      const date = dateFec(c[iDate]);
      const numero = propre(c[iNum], 40);
      const compte = String(c[iCompte] || "").replace(/\s/g, "").slice(0, 12);

      if (!date || !numero || !compte) {
        rejets.push({ ligne: i + 1, valeur: brutes[i].slice(0, 70), motif: "ligne incomplete" });
        continue;
      }

      if (deja[numero]) { ignorees = ignorees + 1; continue; }

      if (anneeVerrouillee && date.slice(0, 4) === anneeVerrouillee) {
        rejets.push({ ligne: i + 1, valeur: numero, motif: "exercice verrouille" });
        continue;
      }

      const d = montant(c[iDebit]);
      const cr = montant(c[iCredit]);
      if (d === 0 && cr === 0) continue;

      if (!plan[compte]) aCreer[compte] = propre(c[iCompteLib], 200) || "Compte repris";

      debit = r2(debit + d);
      credit = r2(credit + cr);

      lignes.push({
        societe_id: b.societe_id,
        journal_code: propre(c[iJournal], 10) || "OD",
        journal_lib: propre(c[iJournalLib], 60) || "Reprise",
        ecriture_num: numero,
        ecriture_date: date,
        compte_num: compte,
        compte_lib: propre(c[iCompteLib], 200) || "Compte repris",
        piece_ref: iPiece >= 0 ? propre(c[iPiece], 60) : null,
        piece_date: iPieceDate >= 0 ? dateFec(c[iPieceDate]) : date,
        ecriture_lib: iLib >= 0 ? propre(c[iLib], 200) : "Ecriture reprise",
        debit: d,
        credit: cr,
        lettrage: iLettrage >= 0 ? propre(c[iLettrage], 20) : null,
        devise: "EUR",
        valid_date: new Date().toISOString().slice(0, 10),
        saisi_par: session.email,
      });
    }

    if (lignes.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: ignorees > 0
            ? "Toutes les ecritures de ce fichier sont deja presentes."
            : "Aucune ligne exploitable.",
          ignorees: ignorees,
          rejets: rejets.slice(0, 30),
        },
        { status: 400 }
      );
    }

    const ecart = r2(debit - credit);
    if (Math.abs(ecart) > 0.01 && b.forcer !== true) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Le fichier ne tombe pas juste : debit " + debit.toFixed(2)
            + " contre credit " + credit.toFixed(2) + ", ecart de " + ecart.toFixed(2)
            + ". Rien n a ete repris.",
          debit: debit, credit: credit, ecart: ecart,
        },
        { status: 409 }
      );
    }

    const nouveaux = Object.keys(aCreer).map(function (n) {
      return {
        societe_id: b.societe_id, numero: n, libelle: aCreer[n],
        classe: parseInt(n.charAt(0), 10), type: "repris",
      };
    });
    if (nouveaux.length > 0) await supabase.from("compta_comptes").insert(nouveaux);

    // Par paquets : un FEC de vingt mille lignes ne passe pas d un coup.
    for (let i = 0; i < lignes.length; i = i + 500) {
      const { error } = await supabase.from("compta_ecritures").insert(lignes.slice(i, i + 500));
      if (error) {
        return NextResponse.json(
          { ok: false, erreur: "Interrompu a la ligne " + i + " : " + error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "fec",
      lignes: lignes.length,
      ignorees: ignorees,
      rejetees: rejets.length,
      debit: debit,
      comptes_crees: nouveaux.length,
      rejets: rejets.slice(0, 30),
      message: lignes.length + " ligne(s) reprises pour " + debit.toFixed(2) + " EUR"
        + (ignorees > 0 ? ", " + ignorees + " deja presentes" : "")
        + (nouveaux.length > 0 ? ", " + nouveaux.length + " compte(s) ajoutes au plan" : "") + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
