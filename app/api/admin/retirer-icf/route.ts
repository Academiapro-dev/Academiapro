import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const MENTION =
  '<p style="margin:16px 0;padding:12px 16px;border-left:4px solid #0a3d2e;' +
  'background:#f4f4f0;font-style:italic">' +
  "Cette formation est élaborée dans le respect des plus hauts standards du coaching, " +
  "tels que ceux de l'ICF ou d'autres écoles de référence. Elle ne délivre aucune " +
  "certification de ces organismes." +
  "</p>";

// L ORDRE COMPTE : les expressions les plus longues d abord. Une regle qui
// remplace ICF seul avant « Coaching de Vie ICF ACC » empeche cette derniere
// de jamais correspondre — c est l erreur du premier passage.
const REMPLACEMENTS: [RegExp, string][] = [
  [/coaching\s+de\s+vie\s+ICF\s+ACC/gi, "Coaching de Vie - Méthode Professionnelle Complète"],
  [/coaching\s+de\s+vie\s+référentiel international du coaching\s+ACC/gi, "Coaching de Vie - Méthode Professionnelle Complète"],
  [/ICF\s+(ACC|PCC|MCC)/gi, "coaching professionnel"],
  [/\b(ACC|PCC|MCC)\s*\((Associate|Professional|Master)[^)]*\)/gi, "praticien professionnel"],
  [/(niveau|certification|accr(é|e)ditation|titre)\s+(ACC|PCC|MCC)/gi, "$1 praticien"],
  [/certifi(é|e)e?\s+(par\s+l['’]?\s*)?ICF/gi, "conforme aux standards internationaux du coaching"],
  [/certification\s+(ICF|de\s+l['’]?\s*ICF)/gi, "référentiel international du coaching"],
  [/accr(é|e)dit(é|e)e?\s+(par\s+l['’]?\s*)?ICF/gi, "fondée sur les standards internationaux du coaching"],
  [/label\s+ICF/gi, "référentiel international du coaching"],
  [/membre\s+(de\s+l['’]?\s*)?ICF/gi, "praticien professionnel"],
  [/coach\s+ICF/gi, "coach professionnel"],
  [/(r(é|e)f(é|e)rentiel|standards?|code de d(é|e)ontologie|comp(é|e)tences?)\s+(de\s+l['’]?\s*)?ICF/gi, "$1 international du coaching"],
  [/l['’]\s*ICF/gi, "le référentiel international du coaching"],
  [/\bICF\b/gi, "référentiel international du coaching"],
  [/\b(ACC|PCC|MCC)\b/g, "praticien professionnel"],
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "Réservé à l'administrateur." }, { status: 403 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const executer = url.searchParams.get("executer") === "oui";
    // On repart de la sauvegarde d origine plutot que d empiler les
    // corrections sur un fichier deja modifie.
    const depuisSauvegarde = url.searchParams.get("origine") === "oui";

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "Indiquez un code de formation." }, { status: 400 });
    }

    const chemin = code + "_support_cours.html";
    const cheminSauvegarde = "originaux/" + code + "_support_avant_icf.html";

    const source = depuisSauvegarde ? cheminSauvegarde : chemin;

    const { data, error } = await supabase.storage.from(BUCKET).download(source);
    if (error || !data) {
      return NextResponse.json({ ok: false, erreur: "Fichier introuvable : " + source }, { status: 404 });
    }

    const avant = await data.text();
    const icfAvant = (avant.match(/\bICF\b/gi) || []).length;
    const niveauxAvant = (avant.match(/\b(ACC|PCC|MCC)\b/g) || []).length;

    let apres = avant;
    for (const [motif, remplacement] of REMPLACEMENTS) {
      apres = apres.replace(motif, remplacement);
    }

    if (apres.indexOf("Cette formation est élaborée dans le respect") < 0) {
      const ouverture = apres.search(/<body[^>]*>/i);
      if (ouverture >= 0) {
        const finBalise = apres.indexOf(">", ouverture) + 1;
        apres = apres.slice(0, finBalise) + "\n" + MENTION + "\n" + apres.slice(finBalise);
      } else {
        apres = MENTION + "\n" + apres;
      }
    }

    // La mention contient volontairement le mot ICF : elle n est pas comptee
    // comme un reliquat.
    const sansMention = apres.split(MENTION).join("");
    const icfRestant = (sansMention.match(/\bICF\b/gi) || []).length;
    const niveauxRestants = (sansMention.match(/\b(ACC|PCC|MCC)\b/g) || []).length;

    const position = sansMention.search(/\b(ICF|ACC|PCC|MCC)\b/i);
    const reliquat = position >= 0
      ? sansMention.slice(Math.max(0, position - 150), position + 150)
      : "";

    const titre = (apres.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";

    if (!executer) {
      return NextResponse.json({
        ok: true,
        simulation: true,
        code: code,
        source: source,
        icf_avant: icfAvant,
        icf_restant: icfRestant,
        niveaux_avant: niveauxAvant,
        niveaux_restants: niveauxRestants,
        titre_apres: titre,
        reliquat: reliquat,
        pour_executer: "/api/admin/retirer-icf?code=" + code +
          (depuisSauvegarde ? "&origine=oui" : "") + "&executer=oui",
      });
    }

    // On ne recree la sauvegarde que si elle n existe pas encore : sinon on
    // ecraserait l original par une version deja modifiee.
    if (!depuisSauvegarde) {
      const { data: dejaLa } = await supabase.storage.from(BUCKET).download(cheminSauvegarde);
      if (!dejaLa) {
        await supabase.storage
          .from(BUCKET)
          .upload(cheminSauvegarde, new Blob([avant], { type: "text/html" }), {
            upsert: false,
            contentType: "text/html; charset=utf-8",
          });
      }
    }

    const { error: erreurEcriture } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, new Blob([apres], { type: "text/html" }), {
        upsert: true,
        contentType: "text/html; charset=utf-8",
      });

    if (erreurEcriture) {
      return NextResponse.json({ ok: false, erreur: erreurEcriture.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      source: source,
      icf_avant: icfAvant,
      icf_restant: icfRestant,
      niveaux_avant: niveauxAvant,
      niveaux_restants: niveauxRestants,
      titre_apres: titre,
      reliquat: reliquat,
      suite: "Vérifiez le support, puis réactivez la formation.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
