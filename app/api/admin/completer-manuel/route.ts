import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const MODELE = "claude-sonnet-4-6";

const CARACTERES_PAR_PAGE = 3200;
const CARACTERES_PAR_PASSE = 14000;
const PAGES_MIN = 30;
const PAGES_MAX = 300;
const QUESTIONS_PAR_QCM = 10;
const QUESTIONS_PAR_MODULE_EXAMEN = 2;
const MODULES_PAR_LOT_EXAMEN = 5;
const SEUIL_REUSSITE = 70;

// Regle d evaluation : on enseigne richement, on evalue sur l essentiel.
const REGLE_EVALUATION =
  "REGLE ABSOLUE POUR LES QUESTIONS : n interroge JAMAIS sur des dates, des noms propres, " +
  "des filiations d ecoles ou des anecdotes historiques. Ces elements figurent dans le cours pour la culture " +
  "du stagiaire, pas pour le pieger. Les questions portent exclusivement sur ce qu un praticien doit savoir FAIRE : " +
  "la methode, le protocole, le choix de la technique selon la situation, les applications concretes, " +
  "les precautions et la securite. Gradue la difficulte : commence par la comprehension, termine par l application.";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const LANGUES: any = { fr: "francais", en: "English", es: "espanol", pt: "portugues", de: "Deutsch" };

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

const EXERCICES = {
  titre: "Exercices pratiques et corriges",
  consigne: "Propose au moins huit exercices progressifs et concrets, chacun suivi de son corrige commente. Consignes precises, duree indicative, materiel necessaire, critere de reussite. Pas d invitation vague a reflechir.",
};

const QCM = {
  titre: "QCM du module",
  consigne:
    "Commence par une phrase adressee au stagiaire lui rappelant que ce questionnaire sert a consolider ses acquis, " +
    "qu il dispose du corrige et qu il peut le refaire autant de fois qu il le souhaite. " +
    "Redige ensuite exactement " + QUESTIONS_PAR_QCM + " questions a choix multiple portant sur ce seul module. " +
    "Quatre propositions par question, une seule correcte. Apres les questions, donne le corrige avec, pour chacune, " +
    "la bonne reponse ET l explication de pourquoi les autres sont fausses.\n\n" + REGLE_EVALUATION,
};

// Derniere section : une CONSIGNE adressee au stagiaire, pas un resume.
const SYNTHESE = { titre: "Votre synthese personnelle", local: true };

function gabaritSynthese(titreModule: string): string {
  return "Vous venez de terminer ce module. Avant de passer au suivant, redigez VOTRE PROPRE SYNTHESE de " +
    titreModule + ".\n\n" +
    "Ce qui est attendu :\n\n" +
    "- de 300 a 500 mots, avec vos mots, sans recopier le cours ;\n" +
    "- les notions cles du module, telles que vous les avez comprises ;\n" +
    "- la methode ou le protocole, decrit comme si vous l expliquiez a un confrere ;\n" +
    "- deux situations concretes dans lesquelles vous comptez l appliquer ;\n" +
    "- ce qui reste flou pour vous, s il y a lieu.\n\n" +
    "Deposez votre synthese dans votre espace personnel sur academiapro.fr. " +
    "Elle sera evaluee et vous recevrez un retour ecrit signalant les points essentiels que vous auriez omis.\n\n" +
    "Ce travail compte davantage que le QCM. Le QCM verifie que vous reconnaissez une bonne reponse ; " +
    "la synthese verifie que vous avez reellement integre le module et que vous savez le transmettre.";
}

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
    const reset = url.searchParams.get("reset") === "oui";
    const cible = url.searchParams.get("cible") || "";
    const examen = url.searchParams.get("examen") === "oui";
    const lot = Number(url.searchParams.get("lot") || 0);

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

    const trouve = String(fiche.duree || "").match(/(\d{1,4})/);
    const heuresTotal = trouve ? parseInt(trouve[1], 10) : 0;
    const pagesCours = Math.min(PAGES_MAX, Math.max(PAGES_MIN, heuresTotal));
    const cibleCoursParModule = Math.round((pagesCours * CARACTERES_PAR_PAGE) / plan.length);
    const passesCours = Math.max(1, Math.min(COURS.length, Math.ceil(cibleCoursParModule / CARACTERES_PAR_PASSE)));

    const cleExamen = code + "_ch99_mod1_" + langue;

    // ---- EXAMEN FINAL : un lot de cinq modules par appel ----
    if (examen) {
      const debut = lot * MODULES_PAR_LOT_EXAMEN;
      const lots = Math.ceil(plan.length / MODULES_PAR_LOT_EXAMEN);

      if (debut >= plan.length) {
        return NextResponse.json({ ok: true, code: code, examen: true, termine: true, lots: lots });
      }

      const groupe = plan.slice(debut, debut + MODULES_PAR_LOT_EXAMEN);
      const sommaire = groupe
        .map(function (m: any) { return "Module " + m.module_num + " : " + m.module_titre; })
        .join("\n");
      const combien = groupe.length * QUESTIONS_PAR_MODULE_EXAMEN;
      const premier = debut * QUESTIONS_PAR_MODULE_EXAMEN + 1;

      const invite =
        "Formation: " + fiche.titre + "\n" +
        "Langue: " + (LANGUES[langue] || "francais") + "\n\n" +
        "SECTION A REDIGER : partie d un examen final\n" +
        "Redige " + combien + " questions a choix multiple, soit EXACTEMENT " +
        QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, dans l ordre des modules ci-dessous. " +
        "Numerote-les a partir de " + premier + ". " +
        "Quatre propositions par question, une seule correcte. Les deux questions d un meme module doivent porter sur des aspects DIFFERENTS de ce module. " +
        "Apres les questions, donne le corrige avec la bonne reponse et son explication.\n\n" +
        REGLE_EVALUATION + "\n\n" +
        "MODULES CONCERNES :\n" + sommaire;

      const texte = await appeler(cle, langue, invite);

      const { data: existant } = await supabase
        .from("lms_cache")
        .select("contenu")
        .eq("cache_key", cleExamen)
        .maybeSingle();

      let contenuExamen = "";

      if (lot === 0) {
        const total = plan.length * QUESTIONS_PAR_MODULE_EXAMEN;
        contenuExamen =
          "## Examen final\n\n" +
          "Cet examen porte sur l ensemble des " + plan.length + " modules de la formation, a raison de " +
          QUESTIONS_PAR_MODULE_EXAMEN + " questions par module, soit " + total + " questions.\n\n" +
          texte;
      } else {
        contenuExamen = String((existant && existant.contenu) || "") + "\n\n" + texte;
      }

      if (debut + MODULES_PAR_LOT_EXAMEN >= plan.length) {
        const total = plan.length * QUESTIONS_PAR_MODULE_EXAMEN;
        contenuExamen +=
          "\n\n## Obtenir votre Certification AcademIA Pro\n\n" +
          "Comptez vos points : chaque bonne reponse vaut un point, sur " + total + " au total.\n\n" +
          "A partir de " + SEUIL_REUSSITE + " % de bonnes reponses, soit " +
          Math.ceil((total * SEUIL_REUSSITE) / 100) + " points, la Certification AcademIA Pro de la formation " +
          fiche.titre + " vous est delivree. Vous la recevez par email et la telechargez depuis votre espace personnel sur academiapro.fr.\n\n" +
          "En dessous de ce seuil, reprenez les modules ou vos reponses etaient fausses, puis repassez l examen. " +
          "Le nombre de tentatives n est pas limite : l objectif est votre maitrise, pas votre classement.\n";
      }

      if (existant) {
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
        lot: lot,
        lots: lots,
        lot_suivant: debut + MODULES_PAR_LOT_EXAMEN < plan.length ? lot + 1 : null,
        modules_traites: groupe.length,
        caracteres: contenuExamen.length,
      });
    }

    // ---- MODULES : une seule section par appel ----
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
    const cacheKey = code + "_ch" + l.chapitre_num + "_mod" + l.module_num + "_" + langue;

    const { data: ligne } = await supabase
      .from("lms_cache")
      .select("contenu")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    let contenuActuel = reset ? "" : String((ligne && ligne.contenu) || "");

    const missions: any[] = COURS.slice(0, passesCours).concat([EXERCICES, QCM, SYNTHESE]);
    const dejaEcrites = missions
      .map(function (m: any) { return m.titre; })
      .filter(function (t: string) { return contenuActuel.indexOf("## " + t) >= 0; });

    const suivante = missions.filter(function (m: any) {
      return dejaEcrites.indexOf(m.titre) < 0;
    })[0];

    if (!suivante) {
      return NextResponse.json({
        ok: true,
        code: code,
        module: "ch" + l.chapitre_num + "/mod" + l.module_num,
        module_termine: true,
        sections: dejaEcrites,
        caracteres: contenuActuel.length,
        pages_estimees: Math.round(contenuActuel.length / CARACTERES_PAR_PAGE),
        restants: refaire ? 0 : aFaire.length - 1,
      });
    }

    let texte = "";

    if (suivante.local) {
      texte = gabaritSynthese(module.titre);
    } else {
      texte = await appeler(
        cle,
        langue,
        invitePour(fiche.titre, chapitre, module, langue, suivante, dejaEcrites)
      );

      if (texte.length < 400) {
        return NextResponse.json(
          { ok: false, code: code, erreur: "section trop courte : " + suivante.titre },
          { status: 500 }
        );
      }
    }

    const nouveau = (contenuActuel ? contenuActuel + "\n\n" : "") + "## " + suivante.titre + "\n\n" + texte;

    if (ligne) {
      await supabase.from("lms_cache").update({ contenu: nouveau }).eq("cache_key", cacheKey);
    } else {
      await supabase.from("lms_cache").insert({
        cache_key: cacheKey,
        formation_code: code,
        chapitre_num: l.chapitre_num,
        module_num: l.module_num,
        langue: langue,
        contenu: nouveau,
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
      passes_cours: passesCours,
      module: "ch" + l.chapitre_num + "/mod" + l.module_num,
      section_produite: suivante.titre,
      sans_ia: suivante.local === true,
      sections_faites: dejaEcrites.length + 1,
      sections_totales: missions.length,
      caracteres: nouveau.length,
      pages_estimees: Math.round(nouveau.length / CARACTERES_PAR_PAGE),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
