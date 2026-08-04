import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const MODELE = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function echapper(t: string): string {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// "8h", "120h", "250h - 10 mois" -> 8, 120, 250. Zero si illisible.
function heuresDe(duree: any): number {
  const m = String(duree || "").replace(",", ".").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return n > 0 ? n : 0;
}

// UN MODULE TOUTES LES DEUX HEURES, plancher 4, plafond 20.
// 8h -> 4 modules, 16h -> 8, 24h -> 12, 40h et au-dela -> 20.
// Le plafond de 20 correspond au catalogue existant ET a la limite
// d extraction de construire-plans, qui s arrete a 20 titres.
// Sans duree lisible, on garde l ancien comportement (10 a 16).
function moduleDe(heures: number): { mini: number; maxi: number } {
  if (heures <= 0) return { mini: 10, maxi: 16 };
  const cible = Math.round(heures / 2);
  const n = Math.max(4, Math.min(20, cible));
  return { mini: n, maxi: n };
}

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
    const demande = (url.searchParams.get("code") || "").trim().toUpperCase();

    const { data: fichiers } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    const existants = new Set((fichiers || []).map((f) => f.name));

    const { data: formations } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree")
      .order("code", { ascending: true });

    const candidates = (formations || []).filter(
      (f: any) =>
        String(f.code || "").indexOf("SK") !== 0 &&
        !existants.has(f.code + "_support_cours.html")
    );

    const fiche = demande
      ? (formations || []).find((f: any) => f.code === demande)
      : candidates[0];

    if (!fiche) {
      return NextResponse.json({ ok: true, termine: true, restants: 0, message: "aucune formation sans support" });
    }

    if (existants.has(fiche.code + "_support_cours.html")) {
      return NextResponse.json({ ok: true, code: fiche.code, deja: true, restants: candidates.length });
    }

    // LE DECOUPAGE SUIT LA DUREE REELLE, il n est plus fixe a 10-16.
    const heures = heuresDe(fiche.duree);
    const bornes = moduleDe(heures);
    const combien = bornes.mini === bornes.maxi
      ? "exactement " + bornes.mini + " modules"
      : bornes.mini + " a " + bornes.maxi + " modules";
    const parModule = heures > 0 && bornes.maxi > 0
      ? Math.max(1, Math.round(heures / bornes.maxi))
      : 0;

    const invite =
      "Tu rediges le support de cours officiel d un organisme de formation professionnelle francais.\n\n" +
      "Formation : " + fiche.titre + "\n" +
      "Domaine : " + (fiche.domaine || "non precise") + "\n" +
      "Niveau : " + (fiche.niveau || "non precise") + "\n" +
      (heures > 0 ? "Duree totale : " + heures + " heures.\n" : "") +
      "\nProduis un document structure en francais comprenant, dans cet ordre :\n" +
      "1. OBJECTIFS DE LA FORMATION : un paragraphe de 5 a 8 lignes.\n" +
      "2. PREREQUIS : 3 a 5 lignes.\n" +
      "3. PUBLIC CIBLE : 3 a 5 lignes.\n" +
      "4. COMPETENCES VISEES : 6 a 10 puces.\n" +
      "5. PROGRAMME : " + combien + ". Chaque module sur une ligne au format exact :\n" +
      "Module N - Titre du module (XXh)\n" +
      "suivi de 2 a 4 lignes decrivant son contenu.\n" +
      "6. MODALITES D EVALUATION : un paragraphe.\n\n" +
      "Regles imperatives :\n" +
      (heures > 0
        ? "- LE NOMBRE DE MODULES EST IMPOSE : " + combien + ", ni plus ni moins.\n" +
          "- LE TOTAL DES HEURES DES MODULES DOIT FAIRE EXACTEMENT " + heures + " HEURES" +
          (parModule > 0 ? ", soit environ " + parModule + " heures par module" : "") + ".\n"
        : "- Le total des heures doit etre coherent avec le niveau annonce.\n") +
      "- N invente AUCUNE certification, aucun titre RNCP, aucun label, aucun organisme tiers.\n" +
      "- N indique AUCUN prix.\n" +
      "- Pas de promesse de resultat ni de garantie chiffree.\n" +
      "- Ecris en texte brut, sans balises HTML, sans Markdown, sans introduction ni conclusion sur toi-meme.";

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

    const reponse = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, code: fiche.code, erreur: "Claude a repondu " + r.status },
        { status: 500 }
      );
    }

    const texte = (reponse.content || [])
      .map((b: any) => (b && b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    if (texte.length < 1500) {
      return NextResponse.json(
        { ok: false, code: fiche.code, erreur: "reponse trop courte (" + texte.length + " caracteres)" },
        { status: 500 }
      );
    }

    const corps = texte
      .split(/\n{2,}/)
      .map((p) => "<p>" + echapper(p).replace(/\n/g, "<br>") + "</p>")
      .join("\n");

    const html =
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">\n' +
      "<title>" + echapper(fiche.titre) + " \u2014 Acad\u00e9mIA Pro</title>\n" +
      "<style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:30px;background:#fff;color:#1a1a1a;line-height:1.7;} h1{color:#c8a96e;} p{margin:0 0 14px;}</style>\n" +
      "</head><body>\n" +
      "<h1>Acad\u00e9mIA Pro</h1>\n" +
      "<p>Support de cours officiel \u2014 Document confidentiel</p>\n" +
      "<h1>" + echapper(fiche.titre) + "</h1>\n" +
      "<p><strong>Code :</strong> " + echapper(fiche.code) +
      " | <strong>Domaine :</strong> " + echapper(fiche.domaine || "") +
      " | <strong>Niveau :</strong> " + echapper(fiche.niveau || "") +
      (heures > 0 ? " | <strong>Dur\u00e9e :</strong> " + heures + " h" : "") + "</p>\n" +
      corps +
      "\n</body></html>";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(fiche.code + "_support_cours.html", new Blob([html], { type: "text/html" }), {
        upsert: false,
        cacheControl: "60",
      });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, code: fiche.code, erreur: ecriture.error.message }, { status: 500 });
    }

    await supabase.from("supports_inventaire").upsert(
      {
        fichier: fiche.code + "_support_cours.html",
        code_fichier: fiche.code,
        titre_interne: fiche.titre,
        titre_fiche: fiche.titre,
        statut: "conforme",
        taille: html.length,
        bavardage: false,
        sections: 6,
        risque: "",
        extrait: texte.slice(0, 300),
        vu_le: new Date().toISOString(),
      },
      { onConflict: "fichier" }
    );

    return NextResponse.json({
      ok: true,
      code: fiche.code,
      titre: fiche.titre,
      heures: heures,
      modules_demandes: bornes.maxi,
      taille: html.length,
      restants: Math.max(candidates.length - 1, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
