import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
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

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

async function appeler(cle: string, systeme: string, invite: string, jetons: number) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cle,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELE,
      max_tokens: jetons,
      system: systeme,
      messages: [{ role: "user", content: invite }],
    }),
  });

  if (!r.ok) return "";

  const data = await r.json();
  return (data.content || [])
    .map(function (x: any) { return x && x.type === "text" ? x.text : ""; })
    .join("")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut rediger une formation." },
        { status: 403 }
      );
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.module_id) {
      return NextResponse.json({ ok: false, erreur: "Module non precise." }, { status: 400 });
    }

    const { data: module } = await supabase
      .from("organisme_modules")
      .select("id, cours_id, chapitre, chapitre_titre, numero, titre, type, contenu")
      .eq("id", b.module_id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!module) {
      return NextResponse.json({ ok: false, erreur: "Module introuvable." }, { status: 404 });
    }

    if (module.contenu && String(module.contenu).trim().length > 200 && b.remplacer !== true) {
      return NextResponse.json(
        { ok: false, erreur: "Ce module est deja redige. Cochez le remplacement pour le reecrire." },
        { status: 409 }
      );
    }

    const { data: cours } = await supabase
      .from("organisme_cours")
      .select("titre, domaine, duree, objectifs, public_cible")
      .eq("id", module.cours_id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "Formation introuvable." }, { status: 404 });
    }

    // Le plan complet est fourni a l agent : c est ce qui evite qu il repete
    // au module 3 ce qu il a deja dit au module 1.
    const { data: freres } = await supabase
      .from("organisme_modules")
      .select("chapitre, chapitre_titre, numero, titre, type")
      .eq("cours_id", module.cours_id)
      .eq("tenant_id", tenant)
      .order("chapitre", { ascending: true })
      .order("numero", { ascending: true })
      .limit(500);

    const plan = (freres || [])
      .map(function (m: any) {
        const ici = m.chapitre === module.chapitre && m.numero === module.numero;
        return "  " + m.chapitre + "." + m.numero + " " + m.titre +
          " (" + m.type + ")" + (ici ? "   <-- LE MODULE A REDIGER" : "");
      })
      .join("\n");

    const contexte =
      "FORMATION : " + cours.titre +
      (cours.domaine ? " — domaine " + cours.domaine : "") +
      (cours.duree ? " — " + cours.duree + " heures" : "") + "\n" +
      (cours.objectifs ? "OBJECTIFS DE LA FORMATION :\n" + cours.objectifs + "\n" : "") +
      (cours.public_cible ? "PUBLIC : " + cours.public_cible + "\n" : "") +
      "\nPLAN COMPLET :\n" + plan + "\n\n" +
      "MODULE A REDIGER : " + module.chapitre + "." + module.numero + " — " + module.titre +
      "\nCHAPITRE : " + (module.chapitre_titre || "") + "\n";

    const systeme =
      "Tu rediges des supports de formation professionnelle pour des organismes francais. " +
      "Ton ecriture est dense, precise et professionnelle : chaque paragraphe apprend quelque chose. " +
      "Tu n ecris jamais de remplissage, jamais de formule creuse, jamais de repetition. " +
      "Tu utilises ## pour les grands titres et ### pour les sous-titres, un tiret pour les listes. " +
      "Tu ne traites QUE le module demande : ce qui releve des autres modules du plan est laisse aux autres modules.";

    let contenu = "";

    if (module.type === "evaluation") {
      const invite =
        contexte +
        "\nRedige un module d EVALUATION en deux parties.\n\n" +
        "PARTIE 1 — une synthese des acquis du chapitre, sous le titre ## Ce que vous devez maitriser, " +
        "en quatre a six paragraphes denses qui recapitulent les notions et les gestes essentiels.\n\n" +
        "PARTIE 2 — un questionnaire, IMPERATIVEMENT au format suivant, sans aucun ecart :\n\n" +
        "## QCM\n\n" +
        "Q1. [enonce complet et precis]\n" +
        "A) [proposition]\nB) [proposition]\nC) [proposition]\nD) [proposition]\n" +
        "Reponse : A - [explication de trois lignes au moins, qui dit POURQUOI c est juste et pourquoi les autres ne le sont pas]\n\n" +
        "Redige exactement 10 questions numerotees Q1 a Q10. " +
        "N evalue JAMAIS sur des dates ni sur des noms propres : uniquement la methode, " +
        "le protocole, l application et la securite.";

      contenu = await appeler(cle, systeme, invite, 8000);
    } else {
      const orientation = module.type === "pratique"
        ? "Ce module est PRATIQUE : construis-le autour de procedures et d exercices reellement " +
          "executables. Chaque exercice comporte son objectif, sa preparation, son deroule etape " +
          "par etape, ses variantes et ses erreurs frequentes."
        : "Ce module est THEORIQUE : expose les notions, leurs fondements, leurs limites et leurs " +
          "applications professionnelles, avec des exemples concrets tires du terrain.";

      const partie1 = await appeler(
        cle, systeme,
        contexte + "\n" + orientation +
        "\n\nRedige LA PREMIERE MOITIE du module : introduction, fondements, notions centrales. " +
        "Commence directement par un titre ##, sans preambule. Vise 900 a 1200 mots.",
        5000
      );

      const partie2 = await appeler(
        cle, systeme,
        contexte + "\n" + orientation +
        "\n\nVoici la premiere moitie deja redigee :\n\n" + partie1.slice(0, 6000) +
        "\n\nRedige LA SUITE ET LA FIN du module, sans rien repeter : approfondissement, " +
        "application professionnelle, erreurs frequentes, points cles a retenir sous forme de " +
        "liste, et un glossaire de huit termes. Vise 900 a 1200 mots.",
        5000
      );

      contenu = (partie1 + "\n\n" + partie2).trim();
    }

    if (!contenu || contenu.length < 300) {
      return NextResponse.json(
        { ok: false, erreur: "L agent n a rien produit d exploitable. Reessayez." },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("organisme_modules")
      .update({ contenu: contenu, updated_at: new Date().toISOString() })
      .eq("id", module.id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      module: module.chapitre + "." + module.numero,
      titre: module.titre,
      signes: contenu.length,
      message: "Module redige : " + contenu.length.toLocaleString("fr-FR") + " signes.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
