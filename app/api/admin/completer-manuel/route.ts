import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const MODELE = "claude-sonnet-4-6";

// Regle de volume : une page par heure de programme, plancher 30, plafond 300.
const PAGES_MIN = 30;
const PAGES_MAX = 300;
const CARACTERES_PAR_PAGE = 3200;
const CARACTERES_PAR_PASSE = 14000;
const PASSES_MIN = 3;
const PASSES_MAX = 8;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LANGUES: any = { fr: "francais", en: "English", es: "espanol", pt: "portugues", de: "Deutsch" };

// Chaque passe a une mission DIFFERENTE : c est ce qui empeche le remplissage.
const MISSIONS = [
  {
    titre: "Fondements et cadre conceptuel",
    consigne: "Expose les fondements theoriques : origines, auteurs de reference, concepts cles, cadre conceptuel. Cite des travaux et des recherches. Aucune liste d exercices ici.",
  },
  {
    titre: "Methode et protocole",
    consigne: "Decris la methode operatoire etape par etape : preparation, deroulement, criteres de reussite, variantes selon les publics. Sois concret et sequentiel.",
  },
  {
    titre: "Etudes de cas",
    consigne: "Presente au moins quatre situations reelles et detaillees : contexte, difficulte rencontree, demarche suivie, resultat, enseignement a en tirer. Des recits, pas des generalites.",
  },
  {
    titre: "Erreurs frequentes et remediation",
    consigne: "Recense les erreurs les plus courantes, leurs causes, leurs consequences et la maniere de les corriger. Un tableau de correspondance erreur / remede est bienvenu.",
  },
  {
    titre: "Exercices et corriges",
    consigne: "Propose au moins huit exercices progressifs, chacun suivi de son corrige commente. Des consignes precises, pas des invitations vagues a reflechir.",
  },
  {
    titre: "Applications professionnelles",
    consigne: "Montre comment transposer ce module dans la pratique professionnelle : publics concernes, adaptations, cadre d intervention, indicateurs de suivi.",
  },
  {
    titre: "Approfondissement et ressources",
    consigne: "Approfondis les points delicats non couverts jusqu ici, ouvre sur les debats du domaine, et termine par une bibliographie commentee et un glossaire.",
  },
  {
    titre: "Synthese operationnelle",
    consigne: "Redige une synthese utile : points cles a retenir, memento d une page, grille d auto-evaluation, et checklist de mise en oeuvre.",
  },
];

// Les heures sont ecrites dans le titre du module : "Relation therapeutique (20 h)".
function heuresDuTitre(titre: string): number {
  const m = String(titre || "").match(/(\d+)\s*h/i);
  return m ? Number(m[1]) : 0;
}

function systemePour(langue: string): string {
  const n = LANGUES[langue] || "francais";
  return "Tu es un formateur expert de niveau universitaire. Tu rediges des manuels denses, precis et de haute qualite academique, entierement en " + n + "." +
    " Tu ne delayes jamais : chaque paragraphe apporte une information nouvelle." +
    " Tu n inventes aucune certification, aucun titre officiel, aucun prix.";
}

function invitePour(
  titreFormation: string,
  chapitre: any,
  module: any,
  langue: string,
  mission: any,
  dejaEcrites: string[]
): string {
  const n = LANGUES[langue] || "francais";

  let texte =
    "Formation: " + titreFormation + "\n" +
    "Chapitre " + chapitre.numero + ": " + chapitre.titre + "\n" +
    "Module " + module.numero + ": " + module.titre + "\n" +
    "Langue: " + n + "\n\n" +
    "SECTION A REDIGER : " + mission.titre + "\n" +
    mission.consigne + "\n\n";

  if (dejaEcrites.length > 0) {
    texte += "SECTIONS DEJA REDIGEES DANS CE MODULE, A NE PAS REPRENDRE :\n- " +
      dejaEcrites.join("\n- ") + "\n" +
      "N y reviens pas, meme brievement. Apporte uniquement du contenu nouveau.\n\n";
  }

  if (module.type === "pratique") {
    texte += "Ce module est de nature PRATIQUE : privilegie les scripts complets, les fiches de suivi et les protocoles.\n";
  }
  if (module.type === "evaluation") {
    texte += "Ce module est de nature EVALUATIVE : privilegie les questions, les corriges commentes et les criteres de notation.\n";
  }

  texte += "Redige directement le contenu de la section, sans introduction sur ce que tu vas faire, sans conclusion sur ce que tu viens de faire.";

  return texte;
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
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const langue = (url.searchParams.get("langue") || "fr").trim();
    const refaire = url.searchParams.get("refaire") === "oui";
    const cible = url.searchParams.get("cible") || "";

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, erreur: "formation introuvable" }, { status: 404 });
    }

    const { data: plan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", code)
      .gt("chapitre_num", 0)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    if (!plan || plan.length === 0) {
      return NextResponse.json({ ok: false, code: code, erreur: "aucun plan" }, { status: 404 });
    }

    // Cible de volume, calculee une fois pour toute la formation.
    let heuresTotal = 0;
    for (const l of plan) heuresTotal += heuresDuTitre(l.module_titre);
    const pagesCibles = Math.min(PAGES_MAX, Math.max(PAGES_MIN, heuresTotal));
    const caracteresCibles = pagesCibles * CARACTERES_PAR_PAGE;
    const cibleParModule = Math.round(caracteresCibles / plan.length);
    const nbPasses = Math.min(
      PASSES_MAX,
      Math.max(PASSES_MIN, Math.ceil(cibleParModule / CARACTERES_PAR_PASSE))
    );

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key")
      .eq("formation_code", code)
      .eq("langue", langue);

    const dejaLa = new Set((cache || []).map((c: any) => c.cache_key));

    let aFaire = plan.filter(function (l: any) {
      return !dejaLa.has(code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue);
    });

    // Mode refaire : on cible un module precis, meme s il existe deja.
    if (refaire && cible) {
      aFaire = plan.filter(function (l: any) {
        return "ch" + l.chapitre_num + "_mod" + l.module_num === cible;
      });
      if (aFaire.length === 0) {
        return NextResponse.json({ ok: false, erreur: "module " + cible + " introuvable dans le plan" }, { status: 404 });
      }
    }

    if (aFaire.length === 0) {
      return NextResponse.json({
        ok: true,
        code: code,
        termine: true,
        restants: 0,
        total: plan.length,
        heures: heuresTotal,
        pages_cibles: pagesCibles,
        cible_par_module: cibleParModule,
      });
    }

    const l = aFaire[0];
    const chapitre = { numero: l.chapitre_num, titre: l.chapitre_titre };
    const module = { numero: l.module_num, titre: l.module_titre, type: l.type };

    const morceaux: string[] = [];
    const dejaEcrites: string[] = [];

    for (let i = 0; i < nbPasses; i++) {
      const mission = MISSIONS[i % MISSIONS.length];

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
          system: systemePour(langue),
          messages: [
            { role: "user", content: invitePour(fiche.titre, chapitre, module, langue, mission, dejaEcrites) },
          ],
        }),
      });

      if (!r.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: code,
            erreur: "Claude a repondu " + r.status + " a la passe " + (i + 1),
            passes_reussies: morceaux.length,
          },
          { status: 500 }
        );
      }

      const reponse = await r.json();
      const texte = (reponse.content || [])
        .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
        .join("")
        .trim();

      if (texte.length > 400) {
        morceaux.push("## " + mission.titre + "\n\n" + texte);
        dejaEcrites.push(mission.titre);
      }
    }

    const contenu = morceaux.join("\n\n");

    if (contenu.length < 800) {
      return NextResponse.json(
        { ok: false, code: code, erreur: "contenu trop court sur ch" + l.chapitre_num + "/mod" + l.module_num },
        { status: 500 }
      );
    }

    const cacheKey = code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue;

    if (dejaLa.has(cacheKey)) {
      await supabase
        .from("lms_cache")
        .update({ contenu: contenu })
        .eq("cache_key", cacheKey);
    } else {
      await supabase.from("lms_cache").insert({
        cache_key: cacheKey,
        formation_code: code,
        chapitre_num: l.chapitre_num,
        module_num: l.module_num,
        langue: langue,
        contenu: contenu,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      titre: fiche.titre,
      heures: heuresTotal,
      pages_cibles: pagesCibles,
      modules_du_plan: plan.length,
      cible_par_module: cibleParModule,
      passes: nbPasses,
      produit: "ch" + l.chapitre_num + "/mod" + l.module_num,
      caracteres: contenu.length,
      pages_estimees: Math.round(contenu.length / CARACTERES_PAR_PAGE),
      sections: dejaEcrites,
      restants: refaire ? 0 : aFaire.length - 1,
      total: plan.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
