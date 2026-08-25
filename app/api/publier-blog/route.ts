import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// PUBLICATION PROGRAMMEE DES ARTICLES DE BLOG.
//
// 🚨 POURQUOI CETTE ROUTE EXISTE — 25/08.
//
// LA DOCTRINE DU 24/08 : rien ne se publie sans que Jacques l ait lu.
// Ses mots : « je prefere qu il n y ait pas d articles plutot que des
// articles qui agissent contre moi ». Les trois crons qui redigeaient et
// publiaient seuls ont ete retires de vercel.json le meme jour.
//
// MAIS LA RELECTURE N EST PAS LE FACTEUR LIMITANT. Jacques peut relire dix
// articles d affilee. Ce qui manquait, c est le moyen d ETALER dans le
// temps ce qui a ete relu d un bloc. Sans cette tuyauterie, inserer dix
// articles valides les met TOUS EN LIGNE LE MEME JOUR — ce qui ne
// ressemble a rien pour un lecteur, et n aide pas au referencement.
//
// LE MECANISME :
//   - publier_le NULL     : comportement d avant, publie a l insertion.
//   - publier_le PASSEE   : l article bascule au prochain passage.
//   - publier_le FUTURE   : l article attend, invisible, publie a false.
//
// ⚠️ CETTE ROUTE NE REDIGE RIEN ET NE DECIDE DE RIEN. Elle bascule un
// drapeau sur des articles DEJA ECRITS ET DEJA RELUS. C est la difference
// exacte avec les crons supprimes le 24/08, et elle n est pas negociable :
// si un jour cette route se met a creer du contenu, la doctrine est rompue.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  try {
    const supabase = clientAdmin();

    // MODE MESURE : ?compter=1 rend ce qui attend, sans rien publier.
    // Meme convention que les campagnes de prospection.
    const compter = req.nextUrl.searchParams.get("compter") === "1";

    const maintenant = new Date().toISOString();

    // CE QUI DOIT BASCULER : non publie, date renseignee, date arrivee.
    const { data: mursData, error: errLecture } = await supabase
      .from("blog")
      .select("id, titre, marque, publier_le")
      .eq("publie", false)
      .not("publier_le", "is", null)
      .lte("publier_le", maintenant)
      .order("publier_le", { ascending: true });

    if (errLecture) {
      return NextResponse.json({ erreur: errLecture.message }, { status: 500 });
    }

    const murs = mursData || [];

    // CE QUI ATTEND ENCORE, pour que la reponse dise l etat complet.
    const { data: attenteData } = await supabase
      .from("blog")
      .select("id, titre, marque, publier_le")
      .eq("publie", false)
      .not("publier_le", "is", null)
      .gt("publier_le", maintenant)
      .order("publier_le", { ascending: true })
      .limit(20);

    const attente = (attenteData || []).map(function (a: any) {
      return { titre: a.titre, marque: a.marque, prevu_le: a.publier_le };
    });

    if (compter) {
      return NextResponse.json({
        mode: "mesure",
        a_publier_maintenant: murs.length,
        prochains: attente,
      });
    }

    if (murs.length === 0) {
      return NextResponse.json({
        publies: 0,
        info: "aucun article a publier",
        prochains: attente,
      });
    }

    let publies = 0;
    const details: any[] = [];
    const echecs: any[] = [];

    for (const a of murs) {
      // La clause eq("publie", false) est une securite : si deux passages
      // se chevauchaient, le second ne toucherait rien.
      const { error } = await supabase
        .from("blog")
        .update({ publie: true })
        .eq("id", a.id)
        .eq("publie", false);

      if (error) {
        echecs.push({ titre: a.titre, erreur: error.message });
        continue;
      }

      publies++;
      details.push({ titre: a.titre, marque: a.marque, prevu_le: a.publier_le });
    }

    return NextResponse.json({
      publies: publies,
      echecs: echecs.length,
      articles: details,
      premiers_echecs: echecs.slice(0, 5),
      prochains: attente,
    });
  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
