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
// LIRE LES DUREES D ORIGINE DANS LES SUPPORTS — cree le 19/08.
//
// POURQUOI. Une requete « tout a 120h » a ecrase les durees d environ
// 29 grandes formations en base (150h a 600h). Les VRAIES durees sont
// encore ecrites dans les supports de cours HTML du bucket, generes
// AVANT l ecrasement : l en-tete porte « Dur\u00e9e : X h ».
//
// CE QUE FAIT CETTE ROUTE : LECTURE SEULE, AUCUNE ECRITURE, NULLE PART.
// Elle parcourt les supports par tranches de 100, extrait la duree de
// l en-tete, la compare a la duree en base, et rapporte les ecarts.
//
// UTILISATION :
//   /api/admin/lire-durees-supports              → fichiers 1 a 100
//   /api/admin/lire-durees-supports?depart=100   → fichiers 101 a 200
//   ... suivre « prochain_depart » jusqu a « termine: true ».
//
// La reponse liste UNIQUEMENT les ecarts (duree du support differente
// de la duree en base) : c est la liste de restauration.
// ==================================================================

function extraireDuree(html: string): string | null {
  // L en-tete ecrit par le generateur :
  //   <strong>Dur\u00e9e :</strong> 400 h
  const m = String(html || "").match(
    /Dur\u00e9e\s*:\s*<\/strong>\s*(\d{1,4})\s*h/i
  );
  if (m) return m[1] + "h";
  // Repli : premiere mention « NNNh » ou « NNN h » dans les 2000
  // premiers caracteres (l en-tete), si le gabarit differe.
  const tete = String(html || "").slice(0, 2000);
  const m2 = tete.match(/(\d{2,4})\s*h\b/);
  return m2 ? m2[1] + "h" : null;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const depart = Math.max(0, Number(url.searchParams.get("depart") || 0));
    const PAR_TRANCHE = 100;

    const { data: fichiers, error: erreurListe } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (erreurListe) {
      return NextResponse.json({ ok: false, erreur: erreurListe.message }, { status: 500 });
    }

    const supports = (fichiers || [])
      .map(function (f: any) { return f.name; })
      .filter(function (n: string) { return n.indexOf("_support_cours.html") > 0; });

    const tranche = supports.slice(depart, depart + PAR_TRANCHE);

    if (tranche.length === 0) {
      return NextResponse.json({ ok: true, termine: true, message: "rien a examiner a ce depart" });
    }

    // Les durees actuellement en base, pour comparaison.
    const codes = tranche.map(function (n: string) {
      return n.replace("_support_cours.html", "");
    });
    const { data: fiches } = await supabase
      .from("formations")
      .select("code, duree")
      .in("code", codes);
    const dureeEnBase: any = {};
    for (const f of fiches || []) dureeEnBase[f.code] = f.duree;

    let examines = 0;
    let sansDuree = 0;
    const ecarts: any[] = [];
    const erreurs: any[] = [];

    for (const nom of tranche) {
      const code = nom.replace("_support_cours.html", "");

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
        erreurs.push({ fichier: nom, erreur: "decodage impossible" });
        continue;
      }

      const dureeSupport = extraireDuree(html);
      if (!dureeSupport) { sansDuree = sansDuree + 1; continue; }

      const enBase = dureeEnBase[code] || null;
      if (enBase !== dureeSupport) {
        ecarts.push({ code: code, duree_support: dureeSupport, duree_en_base: enBase });
      }
    }

    const derniereTranche = depart + tranche.length >= supports.length;

    return NextResponse.json({
      ok: true,
      mode: "LECTURE SEULE - aucune ecriture",
      supports_dans_le_bucket: supports.length,
      tranche: "fichiers " + (depart + 1) + " a " + (depart + tranche.length),
      examines: examines,
      sans_duree_detectee: sansDuree,
      ecarts_trouves: ecarts.length,
      ecarts: ecarts,
      termine: derniereTranche,
      prochain_depart: derniereTranche ? null : depart + tranche.length,
      consigne: derniereTranche
        ? "Toutes les tranches sont lues."
        : "Relancer avec depart=" + (depart + tranche.length) + " pour continuer.",
      erreurs: erreurs.length > 0 ? erreurs : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
