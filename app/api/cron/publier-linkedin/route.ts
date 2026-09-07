import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// LA PUBLICATION DIFFEREE DES POSTS LINKEDIN — 07/09/2026.
//
// 🚨 CETTE ROUTE NE COMPOSE RIEN ET N APPELLE PAS LINKEDIN.
//
// Elle lit `posts_linkedin`, prend ce dont la date est arrivee, et passe la
// main a /api/linkedin/publier — qui detient deja la page, le jeton, la
// version de l API et l enregistrement dans `linkedin_publications`.
//
// ⛔ NE JAMAIS DUPLIQUER ICI L APPEL A api.linkedin.com. Un seul endroit
// parle a LinkedIn ; deux endroits, c est deux versions d API a tenir a
// jour et une divergence garantie.
//
// 🚨 LES TEXTES SONT ECRITS D AVANCE ET RELUS PAR JACQUES. C est le point
// entier du montage : la route publie ce qui est pret, elle n invente rien.
// ⛔ NE JAMAIS BRANCHER UNE COMPOSITION PAR IA SUR CETTE CHAINE. Ce serait
// publier sous les marques du texte que personne n a lu.
//
// ⚠️ UN SEUL POST PAR MARQUE ET PAR PASSAGE. Deux posts le meme jour sur
// la meme page se font de l ombre et donnent l air d un automate. Si deux
// dates sont echues pour une marque, le plus ancien sort et l autre attend
// le lendemain.
//
// 🚨 NI VENDREDI NI SAMEDI POUR HEBREWPRO. Chabbat commence le vendredi
// soir. La garde est ici, pas seulement dans les dates : une date mal
// saisie ne doit pas pouvoir faire paraitre un post ces jours-la.
// ⚠️ LE JOUR SE CALCULE A PARIS. Vercel execute en temps universel, et un
// cron du soir tombe deja le lendemain a Paris.
//
// ⚠️ LA CLE D APPEL. /api/linkedin/publier accepte soit une session
// administrateur, soit l en-tete `x-cle-publication` egal a
// LINKEDIN_CLE_PUBLICATION. C est la seconde voie qui est utilisee ici —
// elle est prevue pour les crons par le fichier lui-meme.
// ⛔ SI CETTE VARIABLE MANQUE DANS VERCEL, LA ROUTE REPOND 403 ET RIEN NE
// PART. Le message le dit.
// ---------------------------------------------------------------------------

// 🚨 L ADRESSE EST ABSOLUE ET SANS www : academiapro.fr ne redirige pas,
// contrairement a mysterllc.com, mrcrm.fr et mrlms.fr.
const SITE = "https://academiapro.fr";

// Les marques soumises a l interdit du vendredi et du samedi.
const MARQUES_CHABBAT = ["hebrewpro"];

const NOMS_JOURS = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// LE JOUR DE LA SEMAINE A PARIS.
// 🚨 ON NE SE FIE PAS A getDay() SUR LA DATE BRUTE : le serveur tourne en
// temps universel et le jour differe de celui de Paris pendant deux heures
// chaque nuit.
function jourAParis(quand: Date): number {
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "short",
  });
  const table: any = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return table[format.format(quand)];
}

// L APPEL A LA ROUTE QUI PARLE A LINKEDIN.
async function publierUn(post: any): Promise<any> {
  const cle = (process.env.LINKEDIN_CLE_PUBLICATION || "").trim();
  if (!cle) {
    return { ok: false, erreur: "LINKEDIN_CLE_PUBLICATION absente de Vercel" };
  }

  try {
    const r = await fetch(SITE + "/api/linkedin/publier", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cle-publication": cle,
      },
      body: JSON.stringify({
        produit: post.marque,
        texte: post.texte,
        url: post.lien || "",
        titre: post.titre_lien || "",
      }),
    });

    const data = await r.json().catch(function () { return {}; });
    return {
      ok: r.ok && data && data.ok === true,
      statut: r.status,
      post: data ? data.post : null,
      erreur: data ? data.erreur : null,
      detail: data ? data.detail : null,
    };
  } catch (e: any) {
    return { ok: false, erreur: String(e && e.message ? e.message : e) };
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const maintenant = new Date();
  const jour = jourAParis(maintenant);

  // TOUT CE QUI EST DU, DU PLUS ANCIEN AU PLUS RECENT.
  const { data: dus, error: errLecture } = await supabase
    .from("posts_linkedin")
    .select("id, marque, texte, lien, titre_lien, slug_article, publier_le")
    .eq("publie", false)
    .lte("publier_le", maintenant.toISOString())
    .order("publier_le", { ascending: true })
    .limit(50);

  if (errLecture) {
    return NextResponse.json({ erreur: errLecture.message }, { status: 500 });
  }

  // 🚨 UN SEUL PAR MARQUE. On garde le plus ancien de chaque, et on ecarte
  // les suivants — ils sortiront les jours d apres.
  const retenus: any[] = [];
  const dejaVues: any = {};
  const reportes: any[] = [];

  for (const p of (dus || [])) {
    if (dejaVues[p.marque]) {
      reportes.push({ marque: p.marque, slug: p.slug_article, motif: "un autre post de cette marque sort aujourd hui" });
      continue;
    }
    // LA GARDE CHABBAT.
    if (MARQUES_CHABBAT.indexOf(p.marque) >= 0 && (jour === 5 || jour === 6)) {
      reportes.push({ marque: p.marque, slug: p.slug_article, motif: "aucune parution le " + NOMS_JOURS[jour] });
      continue;
    }
    dejaVues[p.marque] = true;
    retenus.push(p);
  }

  // MODE MESURE : ?compter=1 ne publie RIEN.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const { count: enAttente } = await supabase
      .from("posts_linkedin")
      .select("id", { count: "exact", head: true })
      .eq("publie", false);

    return NextResponse.json({
      mode: "mesure, aucune publication",
      jour_a_paris: NOMS_JOURS[jour],
      cle_publication_presente: !!(process.env.LINKEDIN_CLE_PUBLICATION || "").trim(),
      en_attente: enAttente || 0,
      echus: (dus || []).length,
      seraient_publies: retenus.map(function (p) {
        return { marque: p.marque, slug: p.slug_article };
      }),
      reportes: reportes,
    });
  }

  const resultats: any[] = [];

  for (const p of retenus) {
    const r = await publierUn(p);

    if (r.ok) {
      await supabase
        .from("posts_linkedin")
        .update({
          publie: true,
          publie_le: new Date().toISOString(),
          urn: r.post || null,
          motif_echec: null,
        })
        .eq("id", p.id)
        .eq("publie", false);
    } else {
      // ⚠️ ON NE MARQUE PAS PUBLIE. Le post repassera demain, et le motif
      // reste visible en base pour comprendre.
      await supabase
        .from("posts_linkedin")
        .update({
          motif_echec: String(r.erreur || "") + " " + String(r.detail || ""),
        })
        .eq("id", p.id);
    }

    resultats.push({
      marque: p.marque,
      slug: p.slug_article,
      publie: r.ok === true,
      urn: r.post || null,
      erreur: r.ok ? null : r.erreur,
    });

    // Un post toutes les trois secondes : rien ne presse, et LinkedIn
    // n aime pas les rafales.
    await pause(3000);
  }

  const { count: restants } = await supabase
    .from("posts_linkedin")
    .select("id", { count: "exact", head: true })
    .eq("publie", false);

  return NextResponse.json({
    jour_a_paris: NOMS_JOURS[jour],
    publies: resultats.filter(function (r) { return r.publie; }).length,
    echecs: resultats.filter(function (r) { return !r.publie; }).length,
    detail: resultats,
    reportes: reportes,
    reste_en_attente: restants || 0,
  });
}
