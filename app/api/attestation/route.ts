import { NextResponse } from "next/server";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const HD = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

export const dynamic = "force-dynamic";

async function lire(chemin: string) {
  try {
    const r = await fetch(SB_URL + "/rest/v1/" + chemin, { headers: HD, cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return [];
  }
}

// "120h", "250h - 10 mois" -> "120", "250". Chaine vide si absent.
function heuresDe(duree: any): string {
  const m = String(duree || "").replace(",", ".").match(/[\d.]+/);
  if (!m) return "";
  const n = Number(m[0]);
  return n > 0 ? String(n) : "";
}

export async function GET(req: Request) {
  const certif = (new URL(req.url).searchParams.get("certif") || "").trim();
  if (!certif) {
    return NextResponse.json({ ok: false, erreur: "Numero d attestation non precise." }, { status: 400 });
  }

  // 1. L attestation elle-meme : qui, quelle formation.
  const lignes = await lire(
    "certificats_delivres?certif_id=eq." + encodeURIComponent(certif) +
    "&select=certif_id,user_email,nom,formation_code,formation_titre,niveau,date_obtention&limit=1"
  );

  if (lignes.length === 0) {
    return NextResponse.json({ ok: false, erreur: "Attestation introuvable." }, { status: 404 });
  }

  const att = lignes[0];
  const code = String(att.formation_code || "").toUpperCase();

  // 2. La fiche de la formation.
  const fiches = await lire(
    "formations?code=eq." + encodeURIComponent(code) +
    "&select=code,titre,duree,objectifs,niveau,domaine&limit=1"
  );
  const fiche = fiches[0] || null;

  // 3. Le plan pedagogique : chapitres et modules, dans l ordre.
  const plan = await lire(
    "lms_plans?formation_code=eq." + encodeURIComponent(code) +
    "&select=chapitre_num,chapitre_titre,module_num,module_titre,type" +
    "&order=chapitre_num.asc,module_num.asc&limit=500"
  );

  // 4. Ce que l apprenant a valide. Le B2C n a pas de tenant.
  const progres = await lire(
    "progression_apprenants?user_email=eq." + encodeURIComponent(att.user_email) +
    "&formation_code=eq." + encodeURIComponent(code) +
    "&statut=eq.valide&select=module_cle,score,date_validation&limit=500"
  );

  const valides: any = {};
  for (const p of progres) valides[String(p.module_cle)] = p;

  // 5. On assemble le plan par chapitre, en marquant ce qui est valide.
  const parChapitre: any[] = [];
  for (const m of plan) {
    const cle = String(m.chapitre_num) + "_" + String(m.module_num);
    const v = valides[cle] || null;

    let bloc = parChapitre.find(function (c: any) { return c.numero === m.chapitre_num; });
    if (!bloc) {
      bloc = { numero: m.chapitre_num, titre: m.chapitre_titre, modules: [] };
      parChapitre.push(bloc);
    }

    bloc.modules.push({
      numero: m.module_num,
      titre: m.module_titre,
      type: m.type,
      valide: !!v,
      score: v ? v.score : null,
      date: v ? v.date_validation : null,
    });
  }

  const totalModules = plan.length;
  const totalValides = plan.filter(function (m: any) {
    return !!valides[String(m.chapitre_num) + "_" + String(m.module_num)];
  }).length;

  return NextResponse.json({
    ok: true,
    attestation: {
      numero: att.certif_id,
      nom: att.nom || att.user_email,
      delivree_le: att.date_obtention,
    },
    formation: {
      code: code,
      titre: (fiche && fiche.titre) || att.formation_titre || code,
      heures: heuresDe(fiche && fiche.duree),
      objectifs: fiche ? fiche.objectifs : null,
      niveau: (fiche && fiche.niveau) || att.niveau || null,
      domaine: fiche ? fiche.domaine : null,
    },
    parcours: {
      chapitres: parChapitre,
      total_modules: totalModules,
      modules_valides: totalValides,
    },
  });
}
