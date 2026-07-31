import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

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

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut creer une formation." },
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
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const titre = String(b.titre || "").trim();
    if (titre.length < 5) {
      return NextResponse.json(
        { ok: false, erreur: "Decrivez la formation en quelques mots au moins." },
        { status: 400 }
      );
    }

    const duree = Number(b.duree) > 0 ? Number(b.duree) : 14;
    const chapitres = Math.min(8, Math.max(2, Number(b.chapitres) || 4));
    const domaine = b.domaine ? String(b.domaine).trim() : "";
    const publicVise = b.public_cible ? String(b.public_cible).trim() : "";
    const precisions = b.precisions ? String(b.precisions).trim() : "";

    const invite =
      "Construis le PLAN d une formation professionnelle a distance.\n\n" +
      "INTITULE : " + titre + "\n" +
      (domaine ? "DOMAINE : " + domaine + "\n" : "") +
      "DUREE TOTALE : " + duree + " heures\n" +
      (publicVise ? "PUBLIC VISE : " + publicVise + "\n" : "") +
      (precisions ? "PRECISIONS DU COMMANDITAIRE : " + precisions + "\n" : "") +
      "\nCONTRAINTES :\n" +
      "- Exactement " + chapitres + " chapitres.\n" +
      "- Chaque chapitre comporte 3 ou 4 modules, dont LE DERNIER EST TOUJOURS de type evaluation.\n" +
      "- Les autres modules sont de type theorie ou pratique, en alternant quand le sujet s y prete.\n" +
      "- Les titres sont concrets et professionnels, jamais scolaires : on doit deviner ce qu on saura faire.\n" +
      "- La progression va du fondamental a l application, sans repetition entre chapitres.\n\n" +
      "Redige aussi, pour la fiche de la formation :\n" +
      "- objectifs : ce que le stagiaire saura faire a l issue, en quatre a six lignes.\n" +
      "- prerequis : deux a trois lignes, honnetes.\n" +
      "- public_cible : deux a trois lignes.\n" +
      "- description : un paragraphe de presentation commerciale, six a huit lignes.\n\n" +
      "Reponds UNIQUEMENT en JSON valide, sans balise markdown, exactement ainsi :\n" +
      '{"objectifs":"...","prerequis":"...","public_cible":"...","description":"...",' +
      '"chapitres":[{"numero":1,"titre":"...","modules":[{"numero":1,"titre":"...","type":"theorie"}]}]}';

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
        system:
          "Tu es un ingenieur pedagogique qui construit des programmes de formation professionnelle " +
          "pour des organismes francais certifies Qualiopi. Tes plans sont concrets, progressifs et " +
          "orientes competences. Tu reponds uniquement en JSON valide.",
        messages: [{ role: "user", content: invite }],
      }),
    });

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, erreur: "L agent a repondu " + r.status },
        { status: 500 }
      );
    }

    const reponse = await r.json();
    const texte = (reponse.content || [])
      .map(function (x: any) { return x && x.type === "text" ? x.text : ""; })
      .join("")
      .trim();

    let plan: any = null;
    try {
      plan = JSON.parse(texte.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (e) {
      return NextResponse.json(
        { ok: false, erreur: "Plan illisible. Reformulez votre demande et reessayez." },
        { status: 500 }
      );
    }

    if (!plan || !Array.isArray(plan.chapitres) || plan.chapitres.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Plan vide." }, { status: 500 });
    }

    // Le code se fabrique tout seul, comme a la creation manuelle.
    const { data: dernier } = await supabase
      .from("organisme_cours")
      .select("code")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(50);

    let rang = 1;
    for (const c of dernier || []) {
      const m = String(c.code).match(/(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10) + 1;
        if (n > rang) rang = n;
      }
    }
    const code = "C" + String(rang).padStart(3, "0");

    const { data: cree, error: erreurCours } = await supabase
      .from("organisme_cours")
      .insert({
        tenant_id: tenant,
        code: code,
        titre: titre,
        description: plan.description || null,
        objectifs: plan.objectifs || null,
        prerequis: plan.prerequis || null,
        public_cible: plan.public_cible || publicVise || null,
        duree: duree,
        prix: b.prix ? Number(b.prix) : null,
        domaine: domaine || null,
        objectif: "autre_formation",
        code_nsf: b.code_nsf ? String(b.code_nsf).trim() : null,
        publie: false,
      })
      .select("id, code, titre")
      .limit(1);

    if (erreurCours) {
      return NextResponse.json({ ok: false, erreur: erreurCours.message }, { status: 500 });
    }

    const cours = (cree || [])[0];
    if (!cours) {
      return NextResponse.json({ ok: false, erreur: "Formation non creee." }, { status: 500 });
    }

    // Les modules sont crees VIDES : leur contenu se redigera ensuite, un par
    // un, sinon la generation depasserait le temps alloue.
    const lignes: any[] = [];

    for (const ch of plan.chapitres) {
      const numeroCh = Number(ch.numero) || lignes.length + 1;
      const mods = Array.isArray(ch.modules) ? ch.modules : [];

      for (let i = 0; i < mods.length; i = i + 1) {
        const mod = mods[i];
        const numeroMod = Number(mod.numero) || i + 1;
        const type = ["theorie", "pratique", "evaluation"].indexOf(String(mod.type)) >= 0
          ? String(mod.type)
          : "theorie";

        lignes.push({
          tenant_id: tenant,
          cours_id: cours.id,
          chapitre: numeroCh,
          chapitre_titre: String(ch.titre || "Chapitre " + numeroCh).slice(0, 200),
          numero: numeroMod,
          titre: String(mod.titre || "Module " + numeroMod).slice(0, 200),
          type: type,
          contenu: null,
          ordre: numeroCh * 100 + numeroMod,
        });
      }
    }

    if (lignes.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Aucun module dans le plan." }, { status: 500 });
    }

    const { error: erreurModules } = await supabase
      .from("organisme_modules")
      .insert(lignes);

    if (erreurModules) {
      return NextResponse.json({ ok: false, erreur: erreurModules.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      cours: cours,
      chapitres: plan.chapitres.length,
      modules: lignes.length,
      message:
        "Formation " + cours.code + " creee avec " + plan.chapitres.length +
        " chapitres et " + lignes.length + " modules. Redigez-les un par un depuis l editeur.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
