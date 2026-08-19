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
// LIRE LES DUREES ECRITES DANS LES SUPPORTS — v2 du 19/08.
//
// LECTURE SEULE, AUCUNE ECRITURE. Un seul appel fait tout :
//  - parcourt TOUS les supports du bucket en boucle interne,
//  - ignore les copies de sauvegarde (codes B_...),
//  - ignore les codes absents de la table formations,
//  - ne rapporte QUE les formations dont la fiche dit 120h alors
//    que le support dit PLUS de 120h : ce sont les grandes
//    formations ecrasees ce matin, a restaurer.
// Garde-fou temps : s arrete proprement avant 300 s et donne un
// depart de reprise — normalement inutile (lecture rapide).
//   /api/admin/duree-v2
// ==================================================================

function extraireDuree(html: string): number | null {
  const m = String(html || "").match(
    /Dur\u00e9e\s*:\s*<\/strong>\s*([0-9]{1,4})\s*h/i
  ) || String(html || "").match(
    /Dur\u00e9e\s*:\s*([0-9]{1,4})\s*h/i
  ) || String(html || "").match(
    /Duree\s*:\s*([0-9]{1,4})\s*h/i
  );
  return m ? parseInt(m[1], 10) : null;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const depart = Math.max(0, Number(url.searchParams.get("depart") || 0));
    const LIMITE_MS = 240000; // marge sous les 300 s
    const debutTraitement = Date.now();

    const { data: fichiers, error: erreurListe } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (erreurListe) {
      return NextResponse.json({ ok: false, erreur: erreurListe.message }, { status: 500 });
    }

    // Les vrais supports seulement : pas les copies B_...
    const supports = (fichiers || [])
      .map(function (f: any) { return f.name; })
      .filter(function (n: string) {
        return n.indexOf("_support_cours.html") > 0 && n.indexOf("B_") !== 0;
      });

    // Les durees actuelles de toutes les fiches, en un appel.
    const { data: fiches } = await supabase
      .from("formations")
      .select("code, duree")
      .limit(100000);

    const dureeFiche: any = {};
    for (const f of fiches || []) dureeFiche[f.code] = String(f.duree || "");

    let examines = 0;
    let ignoresSansFiche = 0;
    let sansDuree = 0;
    const aRestaurer: any[] = [];
    const erreurs: any[] = [];
    let arretTemps = false;
    let position = depart;

    for (; position < supports.length; position++) {
      if (Date.now() - debutTraitement > LIMITE_MS) { arretTemps = true; break; }

      const nom = supports[position];
      const code = nom.replace("_support_cours.html", "");

      if (dureeFiche[code] === undefined) { ignoresSansFiche++; continue; }
      // Seules les fiches actuellement a 120h ont pu etre ecrasees.
      if (dureeFiche[code].indexOf("120") !== 0) continue;

      const lecture = await supabase.storage.from(BUCKET).download(nom);
      if (lecture.error || !lecture.data) {
        erreurs.push({ fichier: nom });
        continue;
      }

      examines++;

      let html = "";
      try { html = await lecture.data.text(); }
      catch (e) { erreurs.push({ fichier: nom }); continue; }

      const heures = extraireDuree(html);
      if (heures === null) { sansDuree++; continue; }

      if (heures > 120) {
        aRestaurer.push({ code: code, duree_a_restaurer: heures + "h" });
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "LECTURE SEULE - aucune ecriture",
      supports_reels: supports.length,
      fiches_a_120h_examinees: examines,
      sans_duree_dans_le_support: sansDuree,
      copies_ou_sans_fiche_ignorees: ignoresSansFiche,
      a_restaurer: aRestaurer,
      nombre_a_restaurer: aRestaurer.length,
      termine: !arretTemps,
      prochain_depart: arretTemps ? position : null,
      consigne: arretTemps
        ? "Temps limite atteint : relancer avec ?depart=" + position
        : "Lecture complete. Coller ce rapport a Claude : il construira la requete de restauration.",
      erreurs: erreurs.length > 0 ? erreurs : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
