import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODELE = "claude-sonnet-4-6";
const SEUIL_VALIDATION = 14;

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

function cleDeCache(code: string, moduleCle: string, langue: string): string {
  const m = String(moduleCle).match(/(\d{1,2})\D+(\d{1,2})/);
  if (!m) return code + "_" + moduleCle + "_" + langue;
  return code + "_ch" + m[1] + "_mod" + m[2] + "_" + langue;
}

function sectionQCM(contenu: string): string {
  const t = String(contenu || "");
  const debut = t.search(/^#{1,6}\s*QCM/im);
  if (debut < 0) return "";
  const reste = t.slice(debut);
  const suite = reste.slice(20).search(/^#{1,6}\s+/m);
  return suite > 0 ? reste.slice(0, suite + 20) : reste;
}

// Le contenu du module vient de DEUX SOURCES POSSIBLES : le cache d AcadeMIA
// pour son catalogue, et organisme_modules pour les cours propres du client.
// Sans cette seconde source, un stagiaire suivant une formation de son
// organisme ne pourrait jamais faire corriger son questionnaire.
async function contenuDuModule(code: string, moduleCle: string, langue: string, tenantId: string | null) {
  const { data: cache } = await supabase
    .from("lms_cache")
    .select("contenu")
    .eq("cache_key", cleDeCache(code, moduleCle, langue))
    .maybeSingle();

  if (cache && cache.contenu) {
    return { contenu: String(cache.contenu), titre: null, propre: false };
  }

  if (!tenantId) return { contenu: "", titre: null, propre: false };

  const { data: cours } = await supabase
    .from("organisme_cours")
    .select("id, titre")
    .eq("code", code)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!cours) return { contenu: "", titre: null, propre: false };

  const m = String(moduleCle).match(/(\d{1,2})\D+(\d{1,2})/);
  const chapitre = m ? parseInt(m[1], 10) : 1;
  const numero = m ? parseInt(m[2], 10) : 1;

  const { data: module } = await supabase
    .from("organisme_modules")
    .select("contenu, titre")
    .eq("cours_id", cours.id)
    .eq("tenant_id", tenantId)
    .eq("chapitre", chapitre)
    .eq("numero", numero)
    .maybeSingle();

  if (!module || !module.contenu) return { contenu: "", titre: cours.titre, propre: true };

  return { contenu: String(module.contenu), titre: cours.titre, propre: true };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous pour retrouver votre correction." }, { status: 401 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("formation_code") || "").trim().toUpperCase();
    const moduleCle = (url.searchParams.get("module_cle") || "").trim();

    if (!code || !moduleCle) {
      return NextResponse.json({ ok: false, erreur: "Parametres manquants" }, { status: 400 });
    }

    let requete = supabase
      .from("qcm_reponses")
      .select("reponses, note, retour, statut, updated_at")
      .eq("email", session.email)
      .eq("formation_code", code)
      .eq("module_cle", moduleCle);

    if (session.tenantId) requete = requete.eq("tenant_id", session.tenantId);

    const { data } = await requete.maybeSingle();

    return NextResponse.json({ ok: true, seuil: SEUIL_VALIDATION, copie: data || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous pour faire corriger votre copie." }, { status: 401 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const code = String(corps.formation_code || "").trim().toUpperCase();
    const moduleCle = String(corps.module_cle || "").trim();
    const reponses = String(corps.reponses || "").trim();
    const langue = String(corps.langue || "fr").trim();

    if (!code || !moduleCle) {
      return NextResponse.json({ ok: false, erreur: "Parametres manquants" }, { status: 400 });
    }

    if (reponses.length < 10) {
      return NextResponse.json({ ok: false, erreur: "Repondez avant de faire corriger." }, { status: 400 });
    }

    const source = await contenuDuModule(code, moduleCle, langue, session.tenantId);
    const qcm = sectionQCM(source.contenu);

    if (!qcm) {
      return NextResponse.json({ ok: false, erreur: "QCM introuvable pour ce module." }, { status: 404 });
    }

    let titreFormation = source.titre;

    if (!titreFormation) {
      const { data: fiche } = await supabase
        .from("formations")
        .select("titre")
        .eq("code", code)
        .maybeSingle();
      titreFormation = fiche ? fiche.titre : code;
    }

    const invite =
      "Tu corriges la copie d un stagiaire sur un module de formation.\n\n" +
      "FORMATION : " + titreFormation + "\n" +
      "MODULE : " + moduleCle + "\n\n" +
      "LE QUESTIONNAIRE ET SON CORRIGE, tels qu ils figurent dans le module :\n" + qcm + "\n\n" +
      "LA COPIE DU STAGIAIRE — ses reponses cochees, puis sa note de synthese :\n" + reponses + "\n\n" +
      "Ta reponse comporte deux parties, dans cet ordre exact :\n" +
      "1) Une premiere ligne contenant UNIQUEMENT la note sur 20, sous la forme NOTE: 14\n" +
      "2) Puis un retour adresse au stagiaire, en le vouvoyant, qui comporte obligatoirement :\n" +
      "   - une explication de la note : ce qui a ete compte juste, ce qui a ete compte faux, et pourquoi ;\n" +
      "   - POUR CHAQUE QUESTION MAL REPONDUE OU SANS REPONSE : la bonne reponse ET son explication, " +
      "de facon qu il comprenne le raisonnement et pas seulement la lettre attendue ;\n" +
      "   - une appreciation de sa NOTE DE SYNTHESE : ce qu il a bien saisi, et les notions essentielles du module qu il a omises ;\n" +
      "   - une derniere phrase qui transforme sa principale faiblesse en point de progres concret.\n\n" +
      "COMMENT TU NOTES :\n" +
      "La note tient compte DES DEUX : l exactitude des reponses cochees ET la qualite de la note de synthese. " +
      "Une synthese qui reformule avec justesse, avec ses propres mots, vaut davantage qu une case cochee au hasard.\n" +
      "Ce questionnaire sert a APPRENDRE, pas a sanctionner : tu es exigeant sur le fond et bienveillant sur la forme. " +
      "N evalue jamais sur des dates ni sur des noms propres.\n" +
      "Entre 350 et 700 mots.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 2500,
        system:
          "Tu es un formateur experimente qui corrige les copies de ses stagiaires. " +
          "Ton but n est pas de noter mais de faire progresser : chaque erreur expliquee devient un acquis. " +
          "Tu ecris en francais, avec exigence et bienveillance.",
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
    const note = trouve ? Math.min(20, Math.max(0, parseInt(trouve[1], 10))) : 10;
    const retour = texte.replace(/^.*NOTE\s*:\s*\d{1,2}\s*/i, "").trim();

    await supabase.from("qcm_reponses").upsert(
      {
        email: session.email,
        formation_code: code,
        module_cle: moduleCle,
        reponses: reponses,
        note: note,
        retour: retour,
        statut: "corrigee",
        tenant_id: session.tenantId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email,formation_code,module_cle" }
    );

    const valide = note >= SEUIL_VALIDATION;

    if (valide) {
      await supabase.from("progression_apprenants").upsert(
        {
          user_email: session.email,
          formation_code: code,
          module_cle: moduleCle,
          statut: "valide",
          score: Math.round((note / 20) * 100),
          tenant_id: session.tenantId,
        },
        { onConflict: "user_email,formation_code,module_cle" }
      );
    }

    return NextResponse.json({
      ok: true,
      note: note,
      seuil: SEUIL_VALIDATION,
      valide: valide,
      cours_propre: source.propre,
      retour: retour,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
