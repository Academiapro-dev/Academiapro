import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

// Mentions que nos supports ne doivent PAS porter : ce sont des allegations
// de certification ou de financement que la LLC ne peut pas revendiquer.
const INTERDITS = [
  "ICF",
  "RNCP",
  "France Competences",
  "France Compétences",
  "Qualiopi",
  "CPF",
  "Compte Personnel de Formation",
  "repertoire specifique",
  "répertoire spécifique",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Un mot court comme ICF ou CPF ne doit se declencher que s il est isole :
// sinon "specification" contiendrait "CPF" par accident.
function occurrences(texte: string, terme: string): number {
  const echappe = terme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const motif = terme.length <= 4
    ? new RegExp("\\b" + echappe + "\\b", "g")
    : new RegExp(echappe, "gi");
  const trouve = texte.match(motif);
  return trouve ? trouve.length : 0;
}

export async function GET(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "Réservé à l'administrateur." }, { status: 403 });
    }

    const url = new URL(req.url);
    const codeDemande = (url.searchParams.get("code") || "").trim().toUpperCase();
    const debut = parseInt(url.searchParams.get("debut") || "0", 10) || 0;
    const taille = parseInt(url.searchParams.get("taille") || "40", 10) || 40;

    let codes: string[] = [];

    if (codeDemande) {
      codes = [codeDemande];
    } else {
      const { data: formations } = await supabase
        .from("formations")
        .select("code")
        .order("code")
        .limit(1000);
      codes = (formations || []).map(function (f: any) { return f.code; });
    }

    const lot = codes.slice(debut, debut + taille);
    const signales: any[] = [];
    let lus = 0;
    let absents = 0;

    for (const code of lot) {
      const chemin = code + "_support_cours.html";

      const { data, error } = await supabase.storage.from(BUCKET).download(chemin);
      if (error || !data) {
        absents = absents + 1;
        continue;
      }

      const texte = await data.text();
      lus = lus + 1;

      const trouves: any = {};
      let total = 0;

      for (const terme of INTERDITS) {
        const n = occurrences(texte, terme);
        if (n > 0) {
          trouves[terme] = n;
          total = total + n;
        }
      }

      if (total > 0) {
        signales.push({ code: code, mentions: trouves, total: total });
      }
    }

    const suivant = debut + taille;

    return NextResponse.json({
      ok: true,
      lot: debut + " a " + Math.min(suivant, codes.length),
      total_formations: codes.length,
      supports_lus: lus,
      supports_absents: absents,
      signales: signales,
      termine: suivant >= codes.length,
      suivant: suivant >= codes.length ? null : suivant,
      pour_continuer: suivant >= codes.length
        ? null
        : "/api/admin/verifier-mentions?debut=" + suivant + "&taille=" + taille,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
