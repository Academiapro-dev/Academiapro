import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const MODELE = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Les huit domaines proposes sur /lead-magnets/ebook. Le slug sert de nom de
// fichier : ebook_<slug>.txt puis ebook_<slug>.pdf.
// CE PREMIER APPEL N ECRIT QUE LE TEXTE. La mise en page est faite ensuite
// par /api/admin/pdf-ebook?domaine=<slug> — decouper les deux evite que la
// requete du navigateur expire pendant la redaction.
const DOMAINES: any = {
  "ia": { nom: "Intelligence artificielle", titre: "Guide Pratique de l Intelligence Artificielle" },
  "business": { nom: "Business et management", titre: "Guide Pratique du Management" },
  "marketing": { nom: "Marketing et vente", titre: "Guide Pratique du Marketing et de la Vente" },
  "bien-etre": { nom: "Bien-etre et developpement personnel", titre: "Guide Pratique du Bien-etre au Travail" },
  "securite": { nom: "Securite et prevention", titre: "Guide Pratique de la Prevention des Risques" },
  "finance": { nom: "Comptabilite et finance", titre: "Guide Pratique de la Gestion et des Chiffres" },
  "langues": { nom: "Langues", titre: "Guide Pratique de l Apprentissage des Langues" },
  "technique": { nom: "Technique et numerique", titre: "Guide Pratique des Outils Numeriques" },
};

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const slug = (new URL(req.url).searchParams.get("domaine") || "").trim().toLowerCase();
    const d = DOMAINES[slug];
    if (!d) {
      return NextResponse.json(
        { ok: false, erreur: "domaine inconnu", disponibles: Object.keys(DOMAINES) },
        { status: 400 }
      );
    }

    const invite =
      "Tu rediges un guide gratuit offert par un organisme de formation francais, destine "
      + "a des professionnels qui envisagent de se former.\n\n"
      + "Domaine : " + d.nom + "\n"
      + "Titre : " + d.titre + "\n\n"
      + "Produis un guide structure en francais, de six chapitres, chacun comportant "
      + "deux a trois sections. Ecris du contenu reellement utile : des reperes, des "
      + "methodes, des erreurs courantes, des exemples concrets. Compte environ quatre "
      + "mille mots au total.\n\n"
      + "FORMAT EXACT, sans aucune balise ni Markdown :\n"
      + "Une ligne de chapitre commence par CHAPITRE: suivi du titre.\n"
      + "Une ligne de section commence par SECTION: suivi du titre.\n"
      + "Une ligne de liste commence par - suivi du texte.\n"
      + "Tout le reste est du paragraphe ordinaire, une ligne par paragraphe.\n\n"
      + "Regles imperatives :\n"
      + "- N invente aucune statistique, aucun chiffre d etude, aucun nom d entreprise cliente.\n"
      + "- N indique aucun prix et ne cite aucune formation par son code.\n"
      + "- Ne promets aucun resultat et ne mentionne aucune certification.\n"
      + "- Ne parle jamais de toi ni de la facon dont ce texte a ete produit.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 8000,
        messages: [{ role: "user", content: invite }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return NextResponse.json(
        { ok: false, erreur: "Claude a repondu " + r.status + " : " + detail.slice(0, 200) },
        { status: 500 }
      );
    }

    const reponse = await r.json();
    const texte = (reponse.content || [])
      .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
      .join("\n")
      .trim();

    if (texte.length < 2000) {
      return NextResponse.json(
        { ok: false, erreur: "reponse trop courte (" + texte.length + " caracteres)" },
        { status: 500 }
      );
    }

    // On range le titre en tete, separe par une ligne dediee : la mise en
    // page le relira sans avoir besoin de connaitre la table des domaines.
    const contenu = "TITRE: " + d.titre + "\nDOMAINE: " + d.nom + "\n\n" + texte;
    const sortie = "ebook_" + slug + ".txt";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(sortie, new Blob([contenu], { type: "text/plain; charset=utf-8" }), {
        upsert: true,
        cacheControl: "60",
      });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, erreur: ecriture.error.message }, { status: 500 });
    }

    const chapitres = (texte.match(/^CHAPITRE\s*:/gim) || []).length;
    const sections = (texte.match(/^SECTION\s*:/gim) || []).length;

    return NextResponse.json({
      ok: true,
      etape: "1 sur 2 — texte ecrit",
      domaine: d.nom,
      fichier: sortie,
      caracteres: contenu.length,
      chapitres: chapitres,
      sections: sections,
      suite: "https://academiapro.fr/api/admin/pdf-ebook?domaine=" + slug,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
