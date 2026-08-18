import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ==================================================================
// REPARER LES TITRES DE RUBRIQUE DES SUPPORTS — cree le 18/08 au soir.
//
// POURQUOI. Le generateur de supports ecrivait ses titres de rubrique
// sans accents (PREREQUIS, COMPETENCES VISEES, MODALITES D EVALUATION)
// et le modele les recopiait tels quels. Le generateur est corrige, mais
// tous les supports produits AVANT la correction portent le defaut.
//
// CE QUE FAIT CETTE ROUTE. Elle parcourt les fichiers *_support_cours.html
// du bucket et remplace les trois titres fautifs par leur version
// accentuee. RIEN D'AUTRE n'est modifie : trois chaines fixes, aucun
// appel a l'IA, aucune regeneration.
//
// 🚨 MODE ESSAI PAR DEFAUT. Sans parametre, la route LIT et RAPPORTE,
// elle n'ecrit RIEN. L'ecriture n'a lieu qu'avec &ecrire=1.
//
// UTILISATION :
//   /api/admin/reparer-titres-supports                → essai (aucune ecriture)
//   /api/admin/reparer-titres-supports?ecrire=1       → repare 10 fichiers
//   /api/admin/reparer-titres-supports?ecrire=1&lot=25 → repare 25 fichiers
//   Rappeler la route jusqu'a « termine: true ».
//
// CAS LIMITES PREVUS :
//   - fichier sans titre fautif → ignore, compte dans « deja_bons »
//   - fichier illisible → signale dans « erreurs », la route continue
//   - bucket vide ou aucun support → « termine: true » immediatement
// ==================================================================

// Les remplacements, du plus long au plus court pour eviter qu'un
// remplacement partiel n'en casse un autre. On couvre aussi la variante
// avec apostrophe au cas ou certains supports l'auraient ecrite.
const REMPLACEMENTS: Array<[string, string]> = [
  ["MODALITES D EVALUATION", "MODALIT\u00c9S D\u2019\u00c9VALUATION"],
  ["MODALITES D'EVALUATION", "MODALIT\u00c9S D\u2019\u00c9VALUATION"],
  ["COMPETENCES VISEES", "COMP\u00c9TENCES VIS\u00c9ES"],
  ["PREREQUIS", "PR\u00c9REQUIS"],
];

function reparer(html: string): { texte: string; touches: string[] } {
  let sortie = String(html || "");
  const touches: string[] = [];

  for (const paire of REMPLACEMENTS) {
    const avant = paire[0];
    const apres = paire[1];
    if (sortie.indexOf(avant) >= 0) {
      sortie = sortie.split(avant).join(apres);
      touches.push(avant);
    }
  }

  return { texte: sortie, touches: touches };
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const ecrire = url.searchParams.get("ecrire") === "1";
    const lot = Math.max(1, Math.min(50, Number(url.searchParams.get("lot") || 10)));

    // Tous les supports du bucket (a la racine, comme les ecrit le generateur).
    const { data: fichiers, error: erreurListe } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (erreurListe) {
      return NextResponse.json({ ok: false, erreur: erreurListe.message }, { status: 500 });
    }

    const supports = (fichiers || [])
      .map(function (f: any) { return f.name; })
      .filter(function (n: string) { return n.indexOf("_support_cours.html") > 0; });

    if (supports.length === 0) {
      return NextResponse.json({ ok: true, termine: true, message: "aucun support dans le bucket" });
    }

    let examines = 0;
    let dejaBons = 0;
    let aReparer = 0;
    let repares = 0;
    const details: any[] = [];
    const erreurs: any[] = [];

    for (const nom of supports) {
      // En mode ecriture, on s'arrete au lot demande pour rester dans les
      // temps Vercel. En mode essai, la lecture est rapide : on parcourt tout.
      if (ecrire && repares >= lot) break;

      const lecture = await supabase.storage.from(BUCKET).download(nom);
      if (lecture.error || !lecture.data) {
        erreurs.push({ fichier: nom, erreur: (lecture.error && lecture.error.message) || "lecture impossible" });
        continue;
      }

      examines = examines + 1;

      let html = "";
      try {
        html = await lecture.data.text();
      } catch (e: any) {
        erreurs.push({ fichier: nom, erreur: "decodage impossible : " + String(e.message || e) });
        continue;
      }

      const resultat = reparer(html);

      if (resultat.touches.length === 0) {
        dejaBons = dejaBons + 1;
        continue;
      }

      aReparer = aReparer + 1;

      if (!ecrire) {
        // MODE ESSAI : on rapporte, on ne touche a rien.
        details.push({ fichier: nom, titres_fautifs: resultat.touches });
        continue;
      }

      const ecriture = await supabase.storage
        .from(BUCKET)
        .upload(nom, new Blob([resultat.texte], { type: "text/html" }), {
          upsert: true,
          cacheControl: "60",
        });

      if (ecriture.error) {
        erreurs.push({ fichier: nom, erreur: ecriture.error.message });
        continue;
      }

      repares = repares + 1;
      details.push({ fichier: nom, repare: true, titres_corriges: resultat.touches });
    }

    const resteApresCePassage = ecrire ? aReparer - repares : aReparer;

    return NextResponse.json({
      ok: true,
      mode: ecrire ? "ECRITURE" : "ESSAI (aucune ecriture)",
      supports_dans_le_bucket: supports.length,
      examines: examines,
      deja_bons: dejaBons,
      a_reparer_trouves: aReparer,
      repares_ce_passage: ecrire ? repares : 0,
      termine: ecrire ? resteApresCePassage <= 0 : null,
      consigne: ecrire
        ? (resteApresCePassage > 0
            ? "Rappeler la meme adresse : il reste des fichiers a reparer."
            : "Tous les supports sont repares.")
        : "Mode essai : rien n'a ete modifie. Verifier la liste ci-dessous, puis relancer avec &ecrire=1.",
      details: details.slice(0, 60),
      erreurs: erreurs.length > 0 ? erreurs : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
