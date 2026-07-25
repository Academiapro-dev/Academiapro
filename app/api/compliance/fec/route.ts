import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Siren de remplacement : la LLC n'a pas de SIREN.
// Champ a trancher avec le fiscaliste avant tout depot reel.
const SIREN_PLACEHOLDER = "000000000";

function tenantDeLaSession(req: NextRequest): string | null {
  try {
    const brut = req.cookies.get("sb_user")?.value;
    if (!brut) return null;
    const donnees = JSON.parse(decodeURIComponent(brut));
    return donnees?.tenant_id || null;
  } catch {
    return null;
  }
}

// Format de date FEC : AAAAMMJJ
function dateFec(d: string | null): string {
  if (!d) return "";
  return d.slice(0, 10).replace(/-/g, "");
}

// Montant FEC : virgule decimale, deux chiffres
function montantFec(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
}

// Nettoie un champ texte : pas de pipe, pas de retour ligne
function champ(s: string | null): string {
  if (!s) return "";
  return String(s).replace(/[|\r\n\t]/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const year =
    parseInt(req.nextUrl.searchParams.get("year") || "", 10) ||
    new Date().getFullYear();
  const debut = year + "-01-01";
  const fin = year + "-12-31";

  try {
    const { data: lignes, error } = await supabase
      .from("compta_ecritures")
      .select(
        "journal_code, journal_lib, ecriture_num, ecriture_date, compte_num, compte_lib, comp_aux_num, comp_aux_lib, piece_ref, piece_date, ecriture_lib, debit, credit, lettrage, date_lettrage, valid_date, montant_devise, devise"
      )
      .eq("tenant_id", tenantId)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .order("ecriture_date", { ascending: true })
      .order("ecriture_num", { ascending: true })
      .order("credit", { ascending: true })
      .limit(50000);

    if (error) {
      return NextResponse.json(
        { error: "Lecture ecritures: " + error.message },
        { status: 500 }
      );
    }

    if (!lignes || lignes.length === 0) {
      return NextResponse.json(
        { error: "Aucune ecriture pour l'exercice " + year },
        { status: 404 }
      );
    }

    const entete = [
      "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
      "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
      "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
      "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise",
    ].join("|");

    const corps = lignes.map((l) =>
      [
        champ(l.journal_code),
        champ(l.journal_lib),
        champ(l.ecriture_num),
        dateFec(l.ecriture_date),
        champ(l.compte_num),
        champ(l.compte_lib),
        champ(l.comp_aux_num),
        champ(l.comp_aux_lib),
        champ(l.piece_ref),
        dateFec(l.piece_date),
        champ(l.ecriture_lib),
        montantFec(Number(l.debit || 0)),
        montantFec(Number(l.credit || 0)),
        champ(l.lettrage),
        dateFec(l.date_lettrage),
        dateFec(l.valid_date),
        l.devise && l.devise !== "EUR" ? montantFec(Number(l.montant_devise || 0)) : "",
        l.devise && l.devise !== "EUR" ? champ(l.devise) : "",
      ].join("|")
    );

    const contenu = [entete, ...corps].join("\r\n") + "\r\n";
    const nomFichier = SIREN_PLACEHOLDER + "FEC" + year + "1231.txt";

    return new NextResponse(contenu, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + nomFichier + '"',
        "X-Nb-Lignes": String(lignes.length),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
