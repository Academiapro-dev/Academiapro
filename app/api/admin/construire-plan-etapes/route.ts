import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const MODELE = "claude-sonnet-4-6";
const MODULES_PAR_ETAPE = 20;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ==================================================================
// CONSTRUIRE UN PLAN EN ETAPES — cree le 19/08.
//
// POURQUOI. Les parcours longs (« 400h minimum » = 2 etapes x 20
// modules, « 600h » = 4 etapes x 20) suivent l'architecture actee
// avec F320 Psychanalyste. Les constructeurs automatiques standards
// (construire-plans, generer-plans) les SAUTENT volontairement :
// cette route est leur outil dedie.
//
// METHODE (celle du plan F320, encodee dans l'invite) :
// - une ETAPE par appel : ?code=F233&etape=1, puis etape=2, etc.
// - progression logique entre etapes : fondements -> approfondissement
//   -> pratique -> exercice du metier
// - etudes de cas, module « travail sur soi » quand le domaine s'y
//   prete, dernier module de chaque etape = synthese (evaluation)
//
// ⚠️ PREMIER JET : le plan produit doit etre RELU PAR JACQUES avant
// toute vente. L'outil degrossit, l'oeil humain finalise.
//
// GARDE-FOUS :
// - refuse si la formation n'est pas un parcours long (400h/600h)
// - refuse si un plan NON-etapes existe deja (le supprimer d'abord,
//   consciemment : delete from lms_plans where formation_code='X')
// - refuse l'etape N si l'etape N-1 n'existe pas (ordre garanti)
// - refuse de reecrire une etape existante sans &refaire=1
// ==================================================================

function formatDe(duree: any): number {
  const d = String(duree || "");
  if (d.indexOf("600h") >= 0) return 4;
  if (d.indexOf("400h") >= 0) return 2;
  return 0;
}

function reparerAccents(s: string): string {
  let t = String(s || "");
  t = t.replace(/[\u0080-\u009F]/g, "");
  try { t = t.normalize("NFC"); } catch (e) {}
  return t;
}

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
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
    const etape = Number(url.searchParams.get("etape") || 0);
    const refaire = url.searchParams.get("refaire") === "1";

    if (!code || !etape) {
      return NextResponse.json({
        ok: false,
        erreur: "parametres requis : ?code=F233&etape=1 (puis etape=2, ...)",
      }, { status: 400 });
    }

    const { data: fiche } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, duree, description, objectifs, public_cible")
      .eq("code", code)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ ok: false, erreur: "formation introuvable" }, { status: 404 });
    }

    const nbEtapes = formatDe(fiche.duree);
    if (nbEtapes === 0) {
      return NextResponse.json({
        ok: false,
        code: code,
        erreur: "pas un parcours long (duree : " + String(fiche.duree) + ") - cette route ne traite que les 400h (2 etapes) et 600h (4 etapes)",
      }, { status: 400 });
    }

    if (etape < 1 || etape > nbEtapes) {
      return NextResponse.json({
        ok: false,
        code: code,
        erreur: "etape " + etape + " invalide : cette formation (" + String(fiche.duree) + ") compte " + nbEtapes + " etapes",
      }, { status: 400 });
    }

    // Etat du plan existant, chapitre par chapitre.
    const { data: existant } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_titre")
      .eq("formation_code", code)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true });

    const lignesExistantes = existant || [];
    const chapitres = new Set(lignesExistantes.map((l: any) => l.chapitre_num));

    // GARDE : un plan standard (non-etapes) occupe la place -> refus.
    const titresChapitres = lignesExistantes
      .map((l: any) => String(l.chapitre_titre || ""));
    const estPlanEtapes = titresChapitres.length === 0
      || titresChapitres.some((t: string) => t.indexOf("tape") >= 0);
    if (!estPlanEtapes) {
      return NextResponse.json({
        ok: false,
        code: code,
        erreur: "un plan standard existe deja pour " + code + " : le supprimer d'abord, consciemment (delete from lms_plans where formation_code = '" + code + "')",
      }, { status: 409 });
    }

    // GARDE : ordre des etapes.
    if (etape > 1 && !chapitres.has(etape - 1)) {
      return NextResponse.json({
        ok: false,
        code: code,
        erreur: "l'etape " + (etape - 1) + " n'existe pas encore : construire les etapes dans l'ordre",
      }, { status: 409 });
    }

    // GARDE : etape deja construite.
    if (chapitres.has(etape) && !refaire) {
      return NextResponse.json({
        ok: false,
        code: code,
        erreur: "l'etape " + etape + " existe deja : ajouter &refaire=1 pour la remplacer",
      }, { status: 409 });
    }

    // Contexte : le support si disponible, et les etapes deja ecrites.
    let extrait = "";
    try {
      const { data: fichier } = await supabase.storage
        .from(BUCKET)
        .download(code + "_support_cours.html");
      if (fichier) {
        extrait = reparerAccents(texteBrut((await fichier.text()).slice(0, 60000))).slice(0, 8000);
      }
    } catch (e) { /* support absent : on fait sans */ }

    let etapesFaites = "";
    for (let c = 1; c < etape; c++) {
      const modulesDuChapitre = lignesExistantes
        .filter((l: any) => l.chapitre_num === c)
        .map((l: any) => "- " + l.module_titre)
        .join("\n");
      const titreDuChapitre = (lignesExistantes.find((l: any) => l.chapitre_num === c) || {}).chapitre_titre || "";
      etapesFaites += "\nETAPE " + c + " (deja construite) : " + titreDuChapitre + "\n" + modulesDuChapitre + "\n";
    }

    const positionnement =
      nbEtapes === 2
        ? (etape === 1
          ? "Cette etape 1 sur 2 pose les FONDEMENTS COMPLETS du domaine : origines, piliers, concepts cles, methode de base. Inclure si pertinent un module de travail sur soi ou de posture professionnelle."
          : "Cette etape 2 sur 2 est la MAITRISE ET L'EXERCICE : pratique avancee, etudes de cas approfondies (au moins 3 modules d'etudes de cas), installation ou application professionnelle, preparation a l'examen final.")
        : (etape === 1
          ? "Cette etape 1 sur 4 remonte AUX SOURCES du domaine : la genealogie complete, les fondateurs et piliers historiques, les concepts fondateurs. Inclure si pertinent un module de travail sur soi."
          : etape === 2
          ? "Cette etape 2 sur 4 couvre la THEORIE APPROFONDIE : les concepts avances et TOUS les auteurs et courants majeurs qui ont affine le domaine apres les fondateurs."
          : etape === 3
          ? "Cette etape 3 sur 4 est LA PRATIQUE : cadre, technique, deroulement concret, avec au moins 4 modules d'etudes de cas longitudinales detaillees."
          : "Cette etape 4 sur 4 est L'EXERCICE DU METIER : deontologie, cadre legal reel (sans promesse de titre d'Etat), installation, etudes de cas d'installation, preparation a l'examen final, synthese generale.");

    const invite =
      "Tu concois le plan d'une grande formation professionnelle organisee en " + nbEtapes + " etapes de " + MODULES_PAR_ETAPE + " modules.\n\n" +
      "Formation : " + fiche.titre + "\n" +
      "Domaine : " + (fiche.domaine || "non precise") + "\n" +
      "Duree affichee : " + String(fiche.duree) + "\n" +
      (fiche.description ? "Description : " + String(fiche.description).slice(0, 500) + "\n" : "") +
      (fiche.public_cible ? "Public : " + String(fiche.public_cible).slice(0, 300) + "\n" : "") +
      (extrait ? "\nExtrait du support de cours :\n" + extrait + "\n" : "") +
      (etapesFaites ? "\nETAPES DEJA CONSTRUITES (ne repete AUCUN de leurs modules, construis la SUITE logique) :\n" + etapesFaites : "") +
      "\nA CONSTRUIRE MAINTENANT : l'etape " + etape + " sur " + nbEtapes + ".\n" +
      positionnement + "\n\n" +
      "EXIGENCES :\n" +
      "- EXACTEMENT " + MODULES_PAR_ETAPE + " modules, progression logique du premier au dernier.\n" +
      "- Le DERNIER module est la synthese de l'etape (type evaluation).\n" +
      "- Des titres PRECIS et concrets, jamais generiques. Cite les auteurs, methodes et notions par leur nom quand le domaine en a.\n" +
      "- Types : 'theorie', 'pratique' (manipulations, etudes de cas, exercices) ou 'evaluation'. Varie selon la nature reelle de chaque module.\n" +
      "- Donne aussi un TITRE D'ETAPE court et evocateur, au format : Étape " + etape + " - <titre>.\n" +
      "- Aucune mention de certification d'Etat, de titre reglemente, de prix.\n\n" +
      "Reponds UNIQUEMENT par un objet JSON, sans commentaire, sans balises, au format exact :\n" +
      "{\"titre_etape\":\"Étape " + etape + " - ...\",\"modules\":[{\"module\":1,\"titre\":\"...\",\"type\":\"theorie\"}, ...]}";

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

    if (!r.ok) {
      return NextResponse.json({ ok: false, code: code, erreur: "Claude a repondu " + r.status }, { status: 500 });
    }

    const reponse = await r.json();
    let texte = (reponse.content || [])
      .map((b: any) => (b && b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    texte = texte.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

    let plan: any = null;
    try {
      plan = JSON.parse(texte);
    } catch (e) {
      return NextResponse.json({ ok: false, code: code, erreur: "reponse illisible de Claude" }, { status: 500 });
    }

    const titreEtape = String((plan && plan.titre_etape) || ("Étape " + etape)).slice(0, 200);
    const modules = ((plan && plan.modules) || [])
      .filter((l: any) => l && l.module && l.titre)
      .slice(0, MODULES_PAR_ETAPE)
      .map((l: any, i: number) => ({
        formation_code: code,
        chapitre_num: etape,
        chapitre_titre: titreEtape,
        module_num: i + 1,
        module_titre: String(l.titre).slice(0, 200),
        type: ["theorie", "pratique", "evaluation"].indexOf(String(l.type)) >= 0 ? String(l.type) : "theorie",
      }));

    if (modules.length < MODULES_PAR_ETAPE) {
      return NextResponse.json({
        ok: false,
        code: code,
        erreur: "etape incomplete (" + modules.length + "/" + MODULES_PAR_ETAPE + " modules) : relancer",
      }, { status: 500 });
    }

    if (refaire) {
      await supabase.from("lms_plans").delete()
        .eq("formation_code", code).eq("chapitre_num", etape);
    }

    const { error } = await supabase.from("lms_plans").insert(modules);
    if (error) {
      return NextResponse.json({ ok: false, code: code, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      titre: fiche.titre,
      etape: etape,
      etapes_totales: nbEtapes,
      titre_etape: titreEtape,
      modules: modules.map((m: any) => m.module_num + ". " + m.module_titre + " [" + m.type + "]"),
      consigne: etape < nbEtapes
        ? "RELIRE les 20 titres ci-dessus, puis construire l'etape suivante : ?code=" + code + "&etape=" + (etape + 1)
        : "Plan complet (" + nbEtapes + " etapes x 20). RELECTURE FINALE PAR JACQUES obligatoire avant toute vente.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
