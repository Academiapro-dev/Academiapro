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

// Le corrige ne doit jamais partir dans une conversation : le stagiaire
// obtiendrait les reponses en demandant gentiment.
function sansQCM(contenu: string): string {
  const t = String(contenu || "");
  const debut = t.search(/^#{1,6}\s*QCM/im);
  if (debut < 0) return t;
  return t.slice(0, debut).trim();
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

    const tenant = session.tenantId;
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Cette formation ne fait pas partie de votre espace." },
        { status: 403 }
      );
    }

    const { data: cours } = await supabase
      .from("organisme_cours")
      .select("id, titre, domaine, objectifs, publie")
      .eq("code", code)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "Formation introuvable." }, { status: 404 });
    }

    if (!cours.publie && session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Cette formation n est pas encore ouverte." },
        { status: 403 }
      );
    }

    const chapitre = Number(b.chapitre) || 1;
    const numero = Number(b.module) || 1;

    const { data: module } = await supabase
      .from("organisme_modules")
      .select("chapitre, chapitre_titre, numero, titre, type, contenu")
      .eq("cours_id", cours.id)
      .eq("tenant_id", tenant)
      .eq("chapitre", chapitre)
      .eq("numero", numero)
      .maybeSingle();

    // Le plan complet permet de renvoyer le stagiaire vers le bon module
    // quand sa question releve d ailleurs.
    const { data: plan } = await supabase
      .from("organisme_modules")
      .select("chapitre, numero, titre")
      .eq("cours_id", cours.id)
      .eq("tenant_id", tenant)
      .order("chapitre", { ascending: true })
      .order("numero", { ascending: true })
      .limit(300);

    const sommaire = (plan || [])
      .map(function (m: any) { return "  " + m.chapitre + "." + m.numero + " " + m.titre; })
      .join("\n");

    const texte = module ? sansQCM(module.contenu || "") : "";

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
      "FORMATION : " + cours.titre + (cours.domaine ? " — " + cours.domaine : "") + "\n" +
      (cours.objectifs ? "OBJECTIFS : " + cours.objectifs + "\n" : "") +
      "\nPLAN DE LA FORMATION :\n" + sommaire + "\n\n" +
      (module
        ? "MODULE EN COURS DE LECTURE : " + module.chapitre + "." + module.numero + " — " +
          module.titre + "\n\nCONTENU DU MODULE :\n" + texte.slice(0, 40000)
        : "Le stagiaire n a pas ouvert de module precis.");

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
      ancre: !!module && texte.length > 200,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
