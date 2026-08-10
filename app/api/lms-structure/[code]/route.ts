import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  const code = params.code?.toUpperCase();
  const lang = req.nextUrl.searchParams.get("lang") || "fr";

  const { data: lms } = await supabase
    .from("formations_lms")
    .select("contenu")
    .eq("formation_code", code)
    .limit(1);

  const contenu = lms && lms.length > 0 ? lms[0].contenu : null;

  // LE SOMMAIRE SUIT LE PLAN QUI A REELLEMENT ETE PRODUIT.
  //
  // Deux plans coexistent pour certaines formations : le JSON de
  // formations_lms, herite d un premier manuel, et lms_plans, sur lequel les
  // supports ont ete generes. Le sommaire lisait le JSON pendant que le cours
  // servait lms_plans : le stagiaire cliquait sur un module et en lisait un
  // autre. lms_plans fait desormais foi ; le JSON reste intact.
  const { data: plans } = await supabase
    .from("lms_plans")
    .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
    .eq("formation_code", code)
    .order("chapitre_num", { ascending: true })
    .order("module_num", { ascending: true });

  let chapitres = [];

  if (plans && plans.length > 0) {
    const parNumero = new Map();

    for (const ligne of plans) {
      const num = Number(ligne.chapitre_num) || 1;
      if (!parNumero.has(num)) {
        parNumero.set(num, {
          numero: num,
          titre: ligne.chapitre_titre || ("Chapitre " + num),
          modules: [],
        });
      }
      parNumero.get(num).modules.push({
        numero: Number(ligne.module_num) || parNumero.get(num).modules.length + 1,
        titre: ligne.module_titre || ("Module " + (parNumero.get(num).modules.length + 1)),
        type: ligne.type || "theorie",
      });
    }

    chapitres = Array.from(parNumero.values()).sort((a, b) => a.numero - b.numero);
  } else {
    // REPLI : les formations dont le plan n a pas encore ete construit dans
    // lms_plans continuent d afficher le sommaire du JSON.
    let bruts = contenu?.chapitres || [];
    chapitres = bruts.map((ch, idx) => {
      const modules = (ch.modules || []).map((mod, midx) => ({
        numero: mod.numero || midx + 1,
        titre: mod.titre || ("Module " + (midx + 1)),
        type: mod.type || "theorie",
      }));
      return {
        numero: ch.numero || idx + 1,
        titre: ch.titre || ("Chapitre " + (idx + 1)),
        modules,
      };
    });
  }

  if (chapitres.length === 0) {
    return NextResponse.json({ chapitres: [] });
  }

  // Si langue != fr, traduire les titres via lms_cache si disponible
  if (lang !== "fr") {
    for (const ch of chapitres) {
      for (const mod of ch.modules) {
        const cache_key = code + "_ch" + ch.numero + "_mod" + mod.numero + "_" + lang;
        const { data: cache } = await supabase
          .from("lms_cache")
          .select("contenu")
          .eq("cache_key", cache_key)
          .limit(1);
        // Le titre traduit est dans le premier heading du contenu cache
        if (cache && cache.length > 0 && cache[0].contenu) {
          const firstHeading = cache[0].contenu
            .split("\n")
            .find(l => l.trim().startsWith("#"));
          if (firstHeading) {
            mod.titre = firstHeading.replace(/^#+\s*/, "").trim().substring(0, 80);
          }
        }
      }
    }
  }

  const formateur = contenu?.formateur || contenu?.meta?.expert || null;
  const coach = contenu?.coach || null;
  const expert_titre = contenu?.meta?.expert_titre || null;

  return NextResponse.json({ chapitres, code, langue: lang, formateur, coach, expert_titre });
}
