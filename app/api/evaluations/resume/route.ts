import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODELE = "claude-sonnet-4-6";
const MOTS_MINIMUM = 150;
const SEUIL_RESUME = 60;
const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function compterMots(t: string): number {
  const propre = String(t || "").trim();
  if (!propre) return 0;
  return propre.split(/\s+/).length;
}

function nettoyerJson(brut: string): string {
  let t = String(brut || "").trim();
  t = t.replace(/```json/g, "").replace(/```/g, "").trim();
  const debut = t.indexOf("{");
  const fin = t.lastIndexOf("}");
  if (debut >= 0 && fin > debut) t = t.slice(debut, fin + 1);
  return t;
}

export async function POST(req: Request) {
  try {
    const email = emailDeSession();
    if (!email) {
      return NextResponse.json({ ok: false, erreur: "non connecte" }, { status: 401 });
    }

    const corps = await req.json().catch(() => ({}));
    const code = String(corps.formation || "").trim();
    const texte = String(corps.texte || "").trim();
    const consigne = String(corps.consigne || "");
    const duree = Number(corps.duree_secondes || 0);
    const collage = Boolean(corps.collage_detecte);

    if (!code || !texte) {
      return NextResponse.json({ ok: false, erreur: "formation ou texte manquant" }, { status: 400 });
    }

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

    const nbMots = compterMots(texte);

    // Trop court : on tranche sans appeler le modele.
    if (nbMots < MOTS_MINIMUM) {
      const justif =
        "Texte trop court : " + nbMots + " mots pour un minimum attendu de " + MOTS_MINIMUM + ".";
      await supabase.from("evaluations_resumes").insert({
        email: email,
        formation_slug: code,
        consigne: consigne,
        texte: texte,
        nb_mots: nbMots,
        duree_secondes: duree,
        collage_detecte: collage,
        verdict: "insuffisant",
        note: 0,
        justification: justif,
        modele: "aucun",
      });
      return NextResponse.json({
        ok: true,
        verdict: "insuffisant",
        note: 0,
        justification: justif,
        nb_mots: nbMots,
      });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine")
      .eq("code", code)
      .maybeSingle();
    const titre = (fiche && fiche.titre) || code;

    const invite =
      "Tu evalues la restitution ecrite d un stagiaire pour un organisme de formation. Ta notation doit pouvoir etre defendue devant un auditeur.\n\n" +
      "Formation suivie : " + titre + " (" + code + ")\n\n" +
      "Le stagiaire devait, avec ses propres mots : (1) exposer ce qu il retient de la formation, (2) expliquer comment il compte l appliquer concretement dans son activite en donnant un exemple precis, (3) donner les points forts et les points a ameliorer de la formation.\n\n" +
      "TU NE NOTES QUE LES VOLETS (1) ET (2). Le volet (3) est une appreciation sur la formation : il ne doit JAMAIS influencer la note, meme s il est severe ou critique.\n\n" +
      "Grille de notation sur 100 :\n" +
      "- 50 points : comprehension reelle du contenu (les notions sont exactes, reformulees, pas recopiees).\n" +
      "- 50 points : application concrete et PERSONNELLE (un exemple ancre dans SA situation, son metier, son public, ses contraintes). Un propos generique, interchangeable avec n importe quel stagiaire, vaut 0 sur ce volet.\n\n" +
      "Sois exigeant sur le volet 2 : c est lui qui distingue une appropriation reelle d un texte passe-partout. Ne penalise ni le style, ni l orthographe, ni la longueur au-dela du minimum.\n\n" +
      "Texte du stagiaire :\n---\n" + texte.slice(0, 12000) + "\n---\n\n" +
      "Reponds UNIQUEMENT par un objet JSON, sans texte avant ni apres, sans balises de code :\n" +
      '{"note":0,"comprehension":0,"application":0,"exemple_personnel":false,"justification":"deux a quatre phrases expliquant la note, citant ce qui est concret ou ce qui manque"}';

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
        messages: [{ role: "user", content: invite }],
      }),
    });

    const reponse = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, erreur: "Claude a repondu " + r.status },
        { status: 500 }
      );
    }

    const brut = (reponse.content || [])
      .map((b: any) => (b && b.type === "text" ? b.text : ""))
      .join("\n");

    let avis: any = null;
    try {
      avis = JSON.parse(nettoyerJson(brut));
    } catch (e) {
      return NextResponse.json(
        { ok: false, erreur: "analyse illisible", apercu: String(brut).slice(0, 300) },
        { status: 500 }
      );
    }

    const note = Math.max(0, Math.min(100, Number(avis.note) || 0));
    const verdict = note >= SEUIL_RESUME ? "suffisant" : "insuffisant";
    const justification = String(avis.justification || "");

    await supabase.from("evaluations_resumes").insert({
      email: email,
      formation_slug: code,
      consigne: consigne,
      texte: texte,
      nb_mots: nbMots,
      duree_secondes: duree,
      collage_detecte: collage,
      verdict: verdict,
      note: note,
      justification: justification,
      modele: MODELE,
    });

    return NextResponse.json({
      ok: true,
      verdict: verdict,
      note: note,
      justification: justification,
      nb_mots: nbMots,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
