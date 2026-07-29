import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODELE = "claude-sonnet-4-6";

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

// On ne donne a l IA que le cours, pas les exercices ni le QCM.
function coursDuModule(contenu: string): string {
  const t = String(contenu || "");
  const coupe = t.indexOf("\n## Exercices pratiques");
  const utile = coupe > 0 ? t.slice(0, coupe) : t;
  return utile.slice(0, 30000);
}

function emailHtml(titreModule: string, note: number, retour: string): string {
  return (
    "<div style=\"font-family:Georgia,serif;line-height:1.7;color:#1a1a1a\">" +
    "<h1 style=\"color:#c8a96e\">Votre synthese a ete evaluee</h1>" +
    "<p>Module : <strong>" + titreModule + "</strong></p>" +
    "<p style=\"font-size:22px;color:#c8a96e\"><strong>" + note + " / 20</strong></p>" +
    "<div style=\"white-space:pre-wrap;background:#faf7f0;border:1px solid #f0e8d8;border-radius:8px;padding:18px\">" +
    retour +
    "</div>" +
    "<p><a href=\"https://academiapro.fr/dashboard\">Retrouver votre espace de formation</a></p>" +
    "<p>L equipe AcademIA Pro</p>" +
    "</div>"
  );
}

export async function GET() {
  try {
    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const { data: attente } = await supabase
      .from("syntheses")
      .select("id, email, formation_code, module_cible, module_titre, texte")
      .eq("statut", "deposee")
      .order("created_at", { ascending: true })
      .limit(1);

    const s = attente && attente.length > 0 ? attente[0] : null;

    if (!s) {
      return NextResponse.json({ ok: true, termine: true, message: "aucune synthese en attente" });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("titre")
      .eq("code", s.formation_code)
      .maybeSingle();

    const { data: module } = await supabase
      .from("lms_cache")
      .select("contenu")
      .eq("cache_key", s.formation_code + "_" + s.module_cible + "_fr")
      .maybeSingle();

    const cours = coursDuModule(String((module && module.contenu) || ""));

    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "contenu du module introuvable" }, { status: 404 });
    }

    const invite =
      "Tu evalues la synthese personnelle d un stagiaire sur un module de formation.\n\n" +
      "FORMATION : " + ((fiche && fiche.titre) || s.formation_code) + "\n" +
      "MODULE : " + (s.module_titre || s.module_cible) + "\n\n" +
      "CONTENU DU MODULE (reference) :\n" + cours + "\n\n" +
      "SYNTHESE DU STAGIAIRE :\n" + s.texte + "\n\n" +
      "Ta reponse comporte deux parties, dans cet ordre exact :\n" +
      "1) Une premiere ligne contenant UNIQUEMENT la note sur 20, sous la forme NOTE: 14\n" +
      "2) Puis un retour ecrit adresse au stagiaire, en le vouvoyant, comportant : ce qu il a bien compris, " +
      "les notions essentielles du module qu il a OMISES, une remarque sur sa capacite a reformuler avec ses propres mots, " +
      "et un conseil concret pour la suite.\n\n" +
      "Sois exigeant mais bienveillant : cette synthese sert a mesurer l integration, pas a sanctionner. " +
      "N evalue jamais sur des dates ou des noms propres. Entre 300 et 500 mots.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 2000,
        system: "Tu es un formateur experimente qui corrige les travaux de ses stagiaires avec exigence et bienveillance, en francais.",
        messages: [{ role: "user", content: invite }],
      }),
    });

    if (!r.ok) {
      return NextResponse.json({ ok: false, erreur: "Claude a repondu " + r.status }, { status: 500 });
    }

    const reponse = await r.json();
    const texte = (reponse.content || [])
      .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
      .join("")
      .trim();

    const trouve = texte.match(/NOTE\s*:\s*(\d{1,2})/i);
    const note = trouve ? Math.min(20, Math.max(0, parseInt(trouve[1], 10))) : 12;
    const retour = texte.replace(/^.*NOTE\s*:\s*\d{1,2}\s*/i, "").trim();

    await supabase
      .from("syntheses")
      .update({
        statut: "evaluee",
        note: note,
        retour: retour,
        updated_at: new Date().toISOString(),
      })
      .eq("id", s.id);

    let envoye = false;
    try {
      const env = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AcademIA Pro <bienvenue@academiapro.fr>",
          to: s.email,
          subject: "Votre synthese a ete evaluee - " + (s.module_titre || s.module_cible),
          html: emailHtml(s.module_titre || s.module_cible, note, retour),
        }),
      });
      envoye = env.ok;
    } catch (e) {
      console.error("envoi email synthese:", e);
    }

    return NextResponse.json({
      ok: true,
      evaluee: s.formation_code + " / " + s.module_cible,
      destinataire: s.email,
      note: note,
      caracteres_retour: retour.length,
      email_envoye: envoye,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
