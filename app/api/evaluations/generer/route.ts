import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NB_QUESTIONS = 10;
const MODELE = "claude-sonnet-4-6";
const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function nettoyerJson(brut: string): string {
  let t = String(brut || "").trim();
  t = t.replace(/```json/g, "").replace(/```/g, "").trim();
  const debut = t.indexOf("[");
  const fin = t.lastIndexOf("]");
  if (debut >= 0 && fin > debut) t = t.slice(debut, fin + 1);
  return t;
}

async function lireSupport(code: string): Promise<string> {
  try {
    const { data } = await supabase.storage
      .from("formations-pdf")
      .download(code + "_support_cours.html");
    if (!data) return "";
    const texte = await data.text();
    // On retire les balises pour ne garder que le contenu pedagogique.
    const propre = texte
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return propre.slice(0, 40000);
  } catch (e) {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const email = emailDeSession();
    if (!email) {
      return NextResponse.json({ ok: false, erreur: "non connecte" }, { status: 401 });
    }

    const corps = await req.json().catch(() => ({}));
    const code = String(corps.formation || "").trim();
    const type = String(corps.type || "finale").trim();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "formation manquante" }, { status: 400 });
    }

    // L'apprenant ne peut declencher une generation que sur une formation acquise.
    if (ADMINS.indexOf(email) < 0) {
      const { data: acces } = await supabase
        .from("acces_formations")
        .select("formation")
        .ilike("email", email)
        .eq("formation", code)
        .maybeSingle();
      if (!acces) {
        return NextResponse.json({ ok: false, erreur: "formation non acquise" }, { status: 403 });
      }
    }

    // Deja generees ? On ne depense pas deux fois.
    const { data: existantes } = await supabase
      .from("evaluations_questions")
      .select("id")
      .eq("formation_slug", code)
      .eq("type", type);
    if (existantes && existantes.length >= NB_QUESTIONS) {
      return NextResponse.json({ ok: true, deja: true, nb: existantes.length });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau")
      .eq("code", code)
      .maybeSingle();

    const titre = (fiche && fiche.titre) || code;
    const support = await lireSupport(code);

    if (!support && !fiche) {
      return NextResponse.json(
        { ok: false, erreur: "ni support de cours ni fiche formation trouves pour " + code },
        { status: 404 }
      );
    }

    const consigneType =
      type === "positionnement"
        ? "Ces questions servent a situer le niveau de depart de l apprenant AVANT la formation. Elles doivent couvrir les prerequis et les notions de base."
        : "Ces questions servent a verifier les acquis APRES la formation. Elles doivent porter sur les points essentiels du programme et exiger de la comprehension, pas de la memorisation litterale.";

    const source = support
      ? "Voici le support de cours reel de la formation, sur lequel tu dois TE BASER EXCLUSIVEMENT :\n\n" + support
      : "Aucun support de cours n est disponible. Base-toi sur le titre, le domaine et le niveau de la formation, et reste sur des notions incontestables du domaine.";

    const invite =
      "Tu construis l evaluation officielle d un organisme de formation. La rigueur prime sur la quantite : une seule bonne reponse fausse invalide un certificat.\n\n" +
      "Formation : " + titre + "\n" +
      "Code : " + code + "\n" +
      "Domaine : " + ((fiche && fiche.domaine) || "non precise") + "\n" +
      "Niveau : " + ((fiche && fiche.niveau) || "non precise") + "\n\n" +
      consigneType + "\n\n" +
      source + "\n\n" +
      "Redige exactement " + NB_QUESTIONS + " questions a choix multiple en francais.\n" +
      "Regles imperatives :\n" +
      "- 4 options par question, une seule est correcte, et elle doit etre INDISCUTABLE.\n" +
      "- Les 3 mauvaises options doivent etre plausibles mais clairement fausses pour qui a suivi la formation.\n" +
      "- Aucune question sur des chiffres anecdotiques, des dates ou le nom de l organisme.\n" +
      "- Aucune option du type 'toutes les reponses ci-dessus'.\n" +
      "- Si une notion n est pas certaine, ne la traite pas.\n\n" +
      "Reponds UNIQUEMENT par un tableau JSON, sans texte avant ni apres, sans balises de code, au format :\n" +
      '[{"question":"...","options":["...","...","...","..."],"bonne_reponse":0}]\n' +
      "bonne_reponse est l index (0 a 3) de l option correcte.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 4000,
        messages: [{ role: "user", content: invite }],
      }),
    });

    const reponse = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, erreur: "Claude a repondu " + r.status, detail: reponse },
        { status: 500 }
      );
    }

    const texte = (reponse.content || [])
      .map((b: any) => (b && b.type === "text" ? b.text : ""))
      .join("\n");

    let questions: any[] = [];
    try {
      questions = JSON.parse(nettoyerJson(texte));
    } catch (e) {
      return NextResponse.json(
        { ok: false, erreur: "reponse illisible", apercu: String(texte).slice(0, 400) },
        { status: 500 }
      );
    }

    const lignes = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.question || !Array.isArray(q.options) || q.options.length !== 4) continue;
      const bonne = Number(q.bonne_reponse);
      if (!(bonne >= 0 && bonne <= 3)) continue;
      lignes.push({
        formation_slug: code,
        type: type,
        ordre: i + 1,
        question: String(q.question),
        options: q.options.map((o: any) => String(o)),
        bonne_reponse: bonne,
      });
    }

    if (lignes.length < NB_QUESTIONS) {
      return NextResponse.json(
        { ok: false, erreur: "seulement " + lignes.length + " questions valides sur " + NB_QUESTIONS },
        { status: 500 }
      );
    }

    // On repart d une base propre pour ce couple formation/type.
    await supabase.from("evaluations_questions").delete().eq("formation_slug", code).eq("type", type);

    const { error: erreurInsert } = await supabase.from("evaluations_questions").insert(lignes);
    if (erreurInsert) {
      return NextResponse.json({ ok: false, erreur: erreurInsert.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, nb: lignes.length, support_utilise: support.length > 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
