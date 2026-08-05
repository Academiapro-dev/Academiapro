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

// UN SEUL CHAPITRE PAR APPEL. La redaction est ce qui prend du temps ;
// decouper le guide en morceaux courts evite que la requete du navigateur
// expire. Chaque appel ajoute son chapitre au fichier texte.
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

    const url = new URL(req.url);
    const slug = (url.searchParams.get("domaine") || "").trim().toLowerCase();
    const d = DOMAINES[slug];
    if (!d) {
      return NextResponse.json(
        { ok: false, erreur: "domaine inconnu", disponibles: Object.keys(DOMAINES) },
        { status: 400 }
      );
    }

    const total = 6;
    const n = Math.max(1, Math.min(total, parseInt(url.searchParams.get("chapitre") || "1", 10) || 1));
    const source = "ebook_" + slug + ".txt";

    // On relit ce qui a deja ete ecrit, pour que le chapitre suivant s y ajoute
    // et pour donner a Claude les titres deja utilises.
    let deja = "";
    if (n > 1) {
      const { data: fichier } = await supabase.storage.from(BUCKET).download(source);
      if (fichier) deja = await fichier.text();
    }

    const titresDeja = (deja.match(/^CHAPITRE\s*:\s*(.+)$/gim) || [])
      .map(function (l: string) { return l.replace(/^CHAPITRE\s*:\s*/i, "").trim(); });

    const invite =
      "Tu rediges UN SEUL CHAPITRE d un guide gratuit offert par un organisme de "
      + "formation francais, destine a des professionnels qui envisagent de se former.\n\n"
      + "Domaine : " + d.nom + "\n"
      + "Titre du guide : " + d.titre + "\n"
      + "Tu rediges le chapitre " + n + " sur " + total + ".\n"
      + (titresDeja.length > 0
          ? "Chapitres deja ecrits, a ne pas repeter :\n- " + titresDeja.join("\n- ") + "\n"
          : "")
      + "\nCe chapitre comporte deux ou trois sections. Ecris du contenu reellement "
      + "utile : des reperes, des methodes, des erreurs courantes, des exemples "
      + "concrets. Environ sept cents mots.\n\n"
      + "FORMAT EXACT, sans aucune balise ni Markdown :\n"
      + "La premiere ligne commence par CHAPITRE: suivi du titre.\n"
      + "Une ligne de section commence par SECTION: suivi du titre.\n"
      + "Une ligne de liste commence par - suivi du texte.\n"
      + "Tout le reste est du paragraphe ordinaire, une ligne par paragraphe.\n\n"
      + "Regles imperatives :\n"
      + "- N invente aucune statistique, aucun chiffre d etude, aucun nom d entreprise.\n"
      + "- N indique aucun prix et ne cite aucune formation par son code.\n"
      + "- Ne promets aucun resultat et ne mentionne aucune certification.\n"
      + "- Ne parle jamais de toi ni de la facon dont ce texte a ete produit.\n"
      + "- N ecris ni introduction ni conclusion du guide : seulement ce chapitre.";

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

    if (texte.length < 400) {
      return NextResponse.json(
        { ok: false, erreur: "reponse trop courte (" + texte.length + " caracteres)" },
        { status: 500 }
      );
    }

    const entete = "TITRE: " + d.titre + "\nDOMAINE: " + d.nom + "\n";
    const contenu = n === 1 ? entete + "\n" + texte : deja + "\n\n" + texte;

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(source, new Blob([contenu], { type: "text/plain; charset=utf-8" }), {
        upsert: true,
        cacheControl: "60",
      });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, erreur: ecriture.error.message }, { status: 500 });
    }

    const faits = (contenu.match(/^CHAPITRE\s*:/gim) || []).length;
    const reste = n < total;

    return NextResponse.json({
      ok: true,
      domaine: d.nom,
      chapitre_ecrit: n,
      chapitres_dans_le_fichier: faits,
      caracteres: contenu.length,
      suite: reste
        ? "https://academiapro.fr/api/admin/ebook-domaine?domaine=" + slug + "&chapitre=" + (n + 1)
        : "https://academiapro.fr/api/admin/pdf-ebook?domaine=" + slug,
      message: reste
        ? "Chapitre " + n + " sur " + total + " ecrit. Ouvrez le lien de suite."
        : "Les " + total + " chapitres sont ecrits. Ouvrez le lien de suite pour la mise en page.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
