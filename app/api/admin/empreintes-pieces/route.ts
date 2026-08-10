import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "pieces-comptables";
const COFFRES = ["documents-comptables", "pieces-comptables", "documents-signes"];

// Dix par appel : chaque piece se telecharge avant d etre hachee, et une
// facture scannee pese plusieurs megaoctets.
const PAR_LOT = 10;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// L EMPREINTE, C EST LA PREUVE QUE LA PIECE N A PAS BOUGE.
//
// Sans elle, rien ne distingue le justificatif d origine d une facture
// modifiee apres coup. C est ce qu un controleur demande, et c est ce qui
// manquait aux pieces reprises depuis les depenses : le SQL les a
// rattachees, mais il ne pouvait pas lire les fichiers pour les hacher.
//
// La route repare cela : elle relit chaque document dans son coffre et
// calcule son empreinte SHA-256.

function coffreEtChemin(chemin: string): { coffre: string; chemin: string } {
  const c = String(chemin || "");
  for (const nom of COFFRES) {
    if (c.indexOf(nom + "/") === 0) {
      return { coffre: nom, chemin: c.slice(nom.length + 1) };
    }
  }
  return { coffre: BUCKET, chemin: c };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(String(session.email).toLowerCase().trim()) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const essai = url.searchParams.get("essai") === "1";

    const { data: pieces, error } = await supabase
      .from("compta_pieces")
      .select("id, nom, chemin, octets")
      .is("empreinte_sha256", null)
      .order("created_at", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const aTraiter = (pieces || []).filter(function (p: any) {
      return p.chemin && String(p.chemin).length > 3;
    });

    if (essai) {
      return NextResponse.json({
        ok: true,
        essai: true,
        sans_empreinte: aTraiter.length,
        exemple: aTraiter.slice(0, 5).map(function (p: any) {
          const place = coffreEtChemin(p.chemin);
          return { nom: p.nom, coffre: place.coffre, chemin: place.chemin };
        }),
        message: "Rien n a ete modifie.",
      });
    }

    if (aTraiter.length === 0) {
      return NextResponse.json({
        ok: true,
        restant: 0,
        message: "Toutes les pieces portent leur empreinte.",
      });
    }

    const lot = aTraiter.slice(0, PAR_LOT);
    const resultats: any[] = [];
    let calculees = 0;

    for (const p of lot) {
      try {
        const place = coffreEtChemin(p.chemin);

        const { data: fichier, error: eLecture } = await supabase.storage
          .from(place.coffre)
          .download(place.chemin);

        if (eLecture || !fichier) {
          resultats.push({
            nom: p.nom,
            statut: "fichier introuvable au coffre " + place.coffre,
          });
          continue;
        }

        const octets = Buffer.from(await fichier.arrayBuffer());
        const empreinte = crypto.createHash("sha256").update(octets).digest("hex");

        const { error: eMaj } = await supabase
          .from("compta_pieces")
          .update({ empreinte_sha256: empreinte, octets: octets.length })
          .eq("id", p.id);

        if (eMaj) {
          resultats.push({ nom: p.nom, statut: "echec : " + eMaj.message });
        } else {
          calculees = calculees + 1;
          resultats.push({
            nom: p.nom,
            octets: octets.length,
            empreinte: empreinte.slice(0, 16) + "…",
            statut: "empreinte calculee",
          });
        }
      } catch (e: any) {
        resultats.push({ nom: p.nom, statut: "echec : " + String(e.message || e) });
      }
    }

    const restant = aTraiter.length - lot.length;

    return NextResponse.json({
      ok: true,
      examinees: lot.length,
      calculees: calculees,
      restant: restant,
      resultats: resultats,
      message: restant > 0
        ? "Il reste " + restant + " piece(s). Rouvrez la meme adresse pour continuer."
        : "Termine.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
