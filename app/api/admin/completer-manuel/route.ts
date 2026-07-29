import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const MODELE = "claude-sonnet-4-6";

// Le COURS suit la duree annoncee : une page par heure de formation.
// Les exercices et le QCM s ajoutent par-dessus, dans chaque module.
const CARACTERES_PAR_PAGE = 3200;
const CARACTERES_PAR_PASSE = 14000;
const PAGES_MIN = 30;
const PAGES_MAX = 300;
const QUESTIONS_PAR_QCM = 10;
const QUESTIONS_PAR_MODULE_EXAMEN = 2;
const MODULES_PAR_LOT_EXAMEN = 5;
const SEUIL_REUSSITE = 70;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LANGUES: any = { fr: "francais", en: "English", es: "espanol", pt: "portugues", de: "Deutsch" };

// Missions du COURS. Chacune apporte une matiere differente : la repetition
// devient structurellement impossible.
const COURS = [
  {
    titre: "Fondements et cadre conceptuel",
    consigne: "Expose les fondements theoriques : origines, auteurs de reference, concepts cles, cadre conceptuel. Cite des travaux et des recherches.",
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
    consigne: "Recense les erreurs les plus courantes, leurs causes, leurs consequences et la maniere de les corriger. Un tableau erreur / remede est bienvenu.",
  },
  {
    titre: "Applications professionnelles",
    consigne: "Montre comment transposer ce module dans la pratique professionnelle : publics concernes, adaptations, cadre d intervention, indicateurs de suivi.",
  },
  {
    titre: "Approfondissement et ressources",
    consigne: "Approfondis les points delicats non couverts jusqu ici, ouvre sur les debats du domaine, et termine par une bibliographie commentee et un glossaire.",
  },
];

// Ces deux sections sont produites dans TOUS les modules, sans exception.
const EXERCICES = {
  titre: "Exercices pratiques et corriges",
  consigne: "Propose au moins huit exercices progressifs et concrets, chacun suivi de son corrige commente. Consignes precises, duree indicative, materiel necessaire, critere de reussite. Pas d invitation vague a reflechir.",
};

const QCM = {
  titre: "QCM du module",
  consigne: "Redige exactement " + QUESTIONS_PAR_QCM + " questions a choix multiple portant sur ce seul module. Quatre propositions par question, une seule correcte. Apres les questions, donne le corrige avec, pour chacune, la bonne reponse ET l explication de pourquoi les autres sont fausses.",
};

function systemePour(langue: string): string {
  const n = LANGUES[langue] || "francais";
  return "Tu es un formateur expert de niveau universitaire. Tu rediges des manuels denses, precis et de haute qualite academique, entierement en " + n + "." +
    " Tu ne delayes jamais : chaque paragraphe apporte une information nouvelle." +
    " Tu n inventes aucun titre officiel et aucun prix.";
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

async function appeler(cle: string, langue: string, invite: string): Promise<string> {
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
      messages: [{ role: "user", content: invite }],
    }),
  });

  if (!r.ok) throw new Error("Claude a repondu " + r.status);

  const reponse = await r.json();
  return (reponse.content || [])
    .map(function (b: any) { return b && b.type === "text" ? b.text : ""; })
    .join("")
    .trim();
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
    const examen = url.searchParams.get("examen") === "oui";

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, duree")
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

    // La duree annoncee en base est la seule source de verite.
    const trouve = String(fiche.duree || "").match(/(\d{1,4})/);
    const heuresTotal = trouve ? parseInt(trouve[1], 10) : 0;
    const pagesCours = Math.min(PAGES_MAX, Math.max(PAGES_MIN, heuresTotal));
    const cibleCoursParModule = Math.round((pagesCours * CARACTERES_PAR_PAGE) / plan.length);
    const passesCours = Math.max(1, Math.min(COURS.length, Math.ceil(cibleCoursParModule / CARACTERES_PAR_PASSE)));

    // ---- EXAMEN FINAL : deux questions par module, produit par lots ----
    if (examen) {
      const total = plan.length * QUESTIONS_PAR_MODULE_EXAMEN;
      const blocs: string[] = [];
      let numero = 1;

      for (let d = 0; d < plan.length; d += MODULES_PAR_LOT_EXAMEN) {
        const lot = plan.slice(d, d + MODULES_PAR_LOT_EXAMEN);
        const sommaire = lot
          .map(function (m: any) { return "Module " + m.module_num + " : " + m.module_titre; })
          .join("\n");
        const combien = lot.length * QUESTIONS_PAR_MODULE_EXAMEN;

        const invite =
          "Formation: " + fiche.titre + "\n" +
          "Langue: " + (LANGUES[langue] || "francais") + "\n\n" +
          "SECTION A REDIGER : partie d un examen final\n" +
          "Redige " + combien + " questions a choix multiple, soit EXACTEMENT " +
          QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, dans l ordre des modules ci-dessous. " +
          "Numerote-les a partir de " + numero + ". " +
          "Quatre propositions par question, une seule correcte. Les deux questions d un meme module doivent porter sur des aspects DIFFERENTS de ce module. " +
          "Apres les questions, donne le corrige avec la bonne reponse et son explication.\n\n" +
          "MODULES CONCERNES :\n" + sommaire;

        const texte = await appeler(cle, langue, invite);
        if (texte.length > 400) blocs.push(texte);
        numero += combien;
      }

      if (blocs.length === 0) {
        return NextResponse.json({ ok: false, code: code, erreur: "examen non produit" }, { status: 500 });
      }

      const contenuExamen =
        "## Examen final\n\n" +
        "Cet examen porte sur l ensemble des " + plan.length + " modules de la formation, a raison de " +
        QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, soit " + total + " questions.\n\n" +
        blocs.join("\n\n") +
        "\n\n## Obtenir votre Certification AcademIA Pro\n\n" +
        "Corrigez vos reponses a l aide des corriges ci-dessus et comptez vos points : chaque bonne reponse vaut un point, sur " +
        total + " au total.\n\n" +
        "A partir de " + SEUIL_REUSSITE + " % de bonnes reponses, soit " +
        Math.ceil((total * SEUIL_REUSSITE) / 100) + " points, la Certification AcademIA Pro de la formation " +
        fiche.titre + " vous est delivree. Vous la telechargez depuis votre espace personnel sur academiapro.fr.\n\n" +
        "En dessous de ce seuil, reprenez les modules ou vos reponses etaient fausses, puis repassez l examen. " +
        "Le nombre de tentatives n est pas limite : l objectif est votre maitrise, pas votre classement.\n";

      const cleExamen = code + "_ch99_mod1_" + langue;

      const { data: dejaExamen } = await supabase
        .from("lms_cache")
        .select("cache_key")
        .eq("cache_key", cleExamen)
        .maybeSingle();

      if (dejaExamen) {
        await supabase.from("lms_cache").update({ contenu: contenuExamen }).eq("cache_key", cleExamen);
      } else {
        await supabase.from("lms_cache").insert({
          cache_key: cleExamen,
          formation_code: code,
          chapitre_num: 99,
          module_num: 1,
          langue: langue,
          contenu: contenuExamen,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        ok: true,
        code: code,
        examen: true,
        modules: plan.length,
        questions: total,
        lots: blocs.length,
        caracteres: contenuExamen.length,
        pages_estimees: Math.round(contenuExamen.length / CARACTERES_PAR_PAGE),
      });
    }

    const { data: cache } = await supabase
      .from("lms_cache")
      .select("cache_key")
      .eq("formation_code", code)
      .eq("langue", langue);

    const dejaLa = new Set((cache || []).map((c: any) => c.cache_key));

    let aFaire = plan.filter(function (l: any) {
      return !dejaLa.has(code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue);
    });

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
        pages_cours: pagesCours,
        cible_cours_par_module: cibleCoursParModule,
        passes_cours: passesCours,
      });
    }

    const l = aFaire[0];
    const chapitre = { numero: l.chapitre_num, titre: l.chapitre_titre };
    const module = { numero: l.module_num, titre: l.module_titre, type: l.type };

    const missions = COURS.slice(0, passesCours).concat([EXERCICES, QCM]);
    const morceaux: string[] = [];
    const dejaEcrites: string[] = [];

    for (const mission of missions) {
      const texte = await appeler(
        cle,
        langue,
        invitePour(fiche.titre, chapitre, module, langue, mission, dejaEcrites)
      );

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
      await supabase.from("lms_cache").update({ contenu: contenu }).eq("cache_key", cacheKey);
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
      pages_cours: pagesCours,
      modules_du_plan: plan.length,
      cible_cours_par_module: cibleCoursParModule,
      passes_cours: passesCours,
      sections: dejaEcrites,
      produit: "ch" + l.chapitre_num + "/mod" + l.module_num,
      caracteres: contenu.length,
      pages_estimees: Math.round(contenu.length / CARACTERES_PAR_PAGE),
      restants: refaire ? 0 : aFaire.length - 1,
      total: plan.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
