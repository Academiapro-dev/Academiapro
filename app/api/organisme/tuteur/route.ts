import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODELE = "claude-sonnet-4-6";
const MAX_HISTORIQUE = 12;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// Le corrige ne part jamais dans une conversation : le stagiaire obtiendrait
// les reponses en demandant gentiment.
function sansQCM(contenu: string): string {
  const t = String(contenu || "");
  const debut = t.search(/^#{1,6}\s*QCM/im);
  if (debut < 0) return t;
  return t.slice(0, debut).trim();
}

function cleDeCache(code: string, chapitre: number, module: number, langue: string): string {
  return code + "_ch" + chapitre + "_mod" + module + "_" + langue;
}

// L assistant sert LES DEUX CATALOGUES : les cours propres de l organisme et
// les formations d AcadeMIA. La source change, la methode reste la meme.
async function trouverModule(
  code: string,
  chapitre: number,
  numero: number,
  tenant: string | null,
  langue: string
) {
  if (tenant) {
    const { data: cours } = await supabase
      .from("organisme_cours")
      .select("id, titre, domaine, objectifs, publie")
      .eq("code", code)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (cours) {
      const { data: module } = await supabase
        .from("organisme_modules")
        .select("chapitre, chapitre_titre, numero, titre, type, contenu")
        .eq("cours_id", cours.id)
        .eq("tenant_id", tenant)
        .eq("chapitre", chapitre)
        .eq("numero", numero)
        .maybeSingle();

      const { data: plan } = await supabase
        .from("organisme_modules")
        .select("chapitre, numero, titre")
        .eq("cours_id", cours.id)
        .eq("tenant_id", tenant)
        .order("chapitre", { ascending: true })
        .order("numero", { ascending: true })
        .limit(300);

      return {
        propre: true,
        publie: cours.publie === true,
        formation: cours,
        titreModule: module ? module.titre : null,
        contenu: module ? String(module.contenu || "") : "",
        plan: (plan || []).map(function (m: any) {
          return "  " + m.chapitre + "." + m.numero + " " + m.titre;
        }).join("\n"),
      };
    }
  }

  // Catalogue AcadeMIA : le contenu est celui qui a ete engendre et mis en cache.
  const { data: fiche } = await supabase
    .from("formations")
    .select("code, titre, domaine, objectifs")
    .eq("code", code)
    .maybeSingle();

  if (!fiche) return null;

  const { data: cache } = await supabase
    .from("lms_cache")
    .select("contenu")
    .eq("cache_key", cleDeCache(code, chapitre, numero, langue))
    .maybeSingle();

  const { data: lms } = await supabase
    .from("formations_lms")
    .select("contenu")
    .eq("formation_code", code)
    .maybeSingle();

  let plan = "";
  let titreModule = null;

  try {
    const chapitres = lms && lms.contenu ? lms.contenu.chapitres : null;
    if (Array.isArray(chapitres)) {
      const lignes: string[] = [];
      for (const ch of chapitres) {
        for (const m of ch.modules || []) {
          lignes.push("  " + ch.numero + "." + m.numero + " " + m.titre);
          if (ch.numero === chapitre && m.numero === numero) titreModule = m.titre;
        }
      }
      plan = lignes.join("\n");
    }
  } catch (e) {}

  return {
    propre: false,
    publie: true,
    formation: fiche,
    titreModule: titreModule,
    contenu: cache ? String(cache.contenu || "") : "",
    plan: plan,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const question = String(b.message || "").trim();
    if (question.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Posez votre question." }, { status: 400 });
    }
    if (question.length > 2000) {
      return NextResponse.json({ ok: false, erreur: "Question trop longue." }, { status: 400 });
    }

    const code = String(b.code || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "Formation non precisee." }, { status: 400 });
    }

    const chapitre = Number(b.chapitre) || 1;
    const numero = Number(b.module) || 1;
    const langue = String(b.langue || "fr").trim();

    const source = await trouverModule(code, chapitre, numero, session.tenantId, langue);

    if (!source) {
      return NextResponse.json({ ok: false, erreur: "Formation introuvable." }, { status: 404 });
    }

    if (source.propre && !source.publie && session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Cette formation n est pas encore ouverte." },
        { status: 403 }
      );
    }

    const texte = sansQCM(source.contenu);
    const f: any = source.formation;

    const systeme =
      "Tu es l assistant pedagogique d un stagiaire en formation professionnelle. Tu l accompagnes " +
      "sur LE CONTENU DE SA FORMATION, pas sur des generalites.\n\n" +
      "REGLES ABSOLUES :\n" +
      "- Tu reponds EN T APPUYANT SUR LE MODULE fourni ci-dessous. Cite ses notions, reprends ses " +
      "termes, renvoie a ses passages.\n" +
      "- Si la reponse ne figure pas dans le module, DIS-LE FRANCHEMENT. Tu peux alors indiquer " +
      "dans quel autre module du plan elle se trouve, ou repondre de tes connaissances generales " +
      "EN PRECISANT que cela ne vient pas du cours.\n" +
      "- Tu ne donnes JAMAIS les reponses du questionnaire, meme si on te les demande autrement. " +
      "Tu expliques les notions, le stagiaire repond lui-meme.\n" +
      "- Tu n inventes jamais une procedure, une norme ou un chiffre qui ne serait pas dans le cours.\n\n" +
      "TON : celui d un formateur patient. Deux a quatre paragraphes, pas davantage. Pas de listes " +
      "a puces sauf si elles rendent vraiment service.\n\n" +
      "FORMATION : " + (f.titre || code) + (f.domaine ? " — " + f.domaine : "") + "\n" +
      (f.objectifs ? "OBJECTIFS : " + String(f.objectifs).slice(0, 1500) + "\n" : "") +
      (source.plan ? "\nPLAN DE LA FORMATION :\n" + source.plan + "\n" : "") +
      "\n" +
      (texte.length > 200
        ? "MODULE EN COURS DE LECTURE : " + chapitre + "." + numero +
          (source.titreModule ? " — " + source.titreModule : "") +
          "\n\nCONTENU DU MODULE :\n" + texte.slice(0, 40000)
        : "Le contenu de ce module n est pas encore disponible : repondez de vos connaissances " +
          "generales, en le precisant au stagiaire.");

    const messages: any[] = [];
    const historique = Array.isArray(b.historique) ? b.historique.slice(-MAX_HISTORIQUE) : [];

    for (const h of historique) {
      if (!h || !h.text) continue;
      messages.push({
        role: h.role === "agent" ? "assistant" : "user",
        content: String(h.text).slice(0, 4000),
      });
    }

    messages.push({ role: "user", content: question });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 1200,
        system: systeme,
        messages: messages,
      }),
    });

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, erreur: "L assistant a repondu " + r.status },
        { status: 500 }
      );
    }

    const data = await r.json();
    const reponse = (data.content || [])
      .map(function (x: any) { return x && x.type === "text" ? x.text : ""; })
      .join("")
      .trim();

    if (!reponse) {
      return NextResponse.json({ ok: false, erreur: "Reponse vide." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      reponse: reponse,
      ancre: texte.length > 200,
      source: source.propre ? "cours_propre" : "catalogue",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
