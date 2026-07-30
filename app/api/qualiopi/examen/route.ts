import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BUCKET = "qualiopi-preuves";
const MAX_EXAMENS = 5;
const MODELE = "claude-sonnet-4-6";

// L organisme vient du JETON SIGNE. Cette route telecharge les preuves du
// client et les envoie a l agent : avec l ancien cookie forge, on exfiltrait
// les documents d un autre organisme.
function societeDeSession() {
  const session = sessionCourante();
  if (!session || !session.tenantId) return null;
  return { tenantId: session.tenantId, email: session.email };
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: {
      fetch: function (u: any, o: any) {
        return fetch(u, { ...(o || {}), cache: "no-store" });
      },
    },
  });
}

// Le verdict de l agent n est PAS un statut de la grille. Sans cette
// traduction, l avancement recevait une valeur que la grille ne comptait
// dans aucune colonne. Et « conforme » n est jamais pose automatiquement :
// une IA ne declare pas la conformite, c est l organisme qui tranche.
const STATUT_DEPUIS_VERDICT: Record<string, string> = {
  a_retravailler: "en_cours",
  en_bonne_voie: "en_cours",
  pret_pour_audit: "a_verifier",
};

const TYPES_IMAGE = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export async function GET(req: NextRequest) {
  const session = societeDeSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const supabase = client();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, erreur: "Variables Supabase absentes" },
      { status: 500 }
    );
  }

  const indicateurId = req.nextUrl.searchParams.get("indicateur_id");
  if (!indicateurId) {
    return NextResponse.json(
      { ok: false, erreur: "indicateur_id manquant" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("qualiopi_examens")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("indicateur_id", indicateurId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture examens : " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    examens: data || [],
    restants: Math.max(0, MAX_EXAMENS - (data || []).length),
    max: MAX_EXAMENS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = societeDeSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const supabase = client();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, erreur: "Variables Supabase absentes" },
        { status: 500 }
      );
    }

    const cleAnthropic = process.env.ANTHROPIC_API_KEY;
    if (!cleAnthropic) {
      return NextResponse.json(
        { ok: false, erreur: "Cle ANTHROPIC_API_KEY absente des variables d'environnement" },
        { status: 500 }
      );
    }

    let corps: any = {};
    try {
      corps = await req.json();
    } catch (e) {
      return NextResponse.json(
        { ok: false, erreur: "Corps de requete illisible" },
        { status: 400 }
      );
    }

    const indicateurId = corps.indicateur_id;
    if (!indicateurId) {
      return NextResponse.json(
        { ok: false, erreur: "indicateur_id manquant" },
        { status: 400 }
      );
    }

    const { data: dejaFaits, error: errCompte } = await supabase
      .from("qualiopi_examens")
      .select("id")
      .eq("tenant_id", session.tenantId)
      .eq("indicateur_id", indicateurId)
      .limit(20);

    if (errCompte) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture examens : " + errCompte.message },
        { status: 500 }
      );
    }
    if ((dejaFaits || []).length >= MAX_EXAMENS) {
      return NextResponse.json(
        {
          ok: false,
          erreur:
            "Vous avez atteint la limite de " +
            MAX_EXAMENS +
            " examens pour cet indicateur. Utilisez le chat pour affiner votre dossier.",
        },
        { status: 429 }
      );
    }

    const { data: inds, error: errInd } = await supabase
      .from("qualiopi_indicateurs")
      .select("*")
      .eq("id", indicateurId)
      .limit(1);

    if (errInd) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture indicateur : " + errInd.message },
        { status: 500 }
      );
    }
    if (!inds || inds.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Indicateur introuvable" },
        { status: 404 }
      );
    }
    const ind = inds[0];

    const { data: orgs } = await supabase
      .from("qualiopi_organisme")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .limit(1);
    const org = (orgs || [])[0] || {};

    const { data: avs } = await supabase
      .from("qualiopi_avancement")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .eq("indicateur_id", indicateurId)
      .limit(1);
    const commentaire = (avs || [])[0] ? (avs || [])[0].commentaire : null;

    const { data: preuves, error: errPr } = await supabase
      .from("qualiopi_preuves")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .eq("indicateur_id", indicateurId)
      .limit(20);

    if (errPr) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture preuves : " + errPr.message },
        { status: 500 }
      );
    }

    const contenu: any[] = [];
    let nbLus = 0;
    let nbIllisibles = 0;
    const journal: string[] = [];

    for (const p of preuves || []) {
      if (!p.storage_path) continue;
      try {
        const dl = await supabase.storage.from(BUCKET).download(p.storage_path);
        if (dl.error || !dl.data) {
          nbIllisibles++;
          journal.push("Fichier illisible : " + p.titre);
          continue;
        }
        const buf = Buffer.from(await dl.data.arrayBuffer());
        const type = p.mime_type || "";

        if (type === "application/pdf") {
          contenu.push({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: buf.toString("base64"),
            },
          });
          contenu.push({
            type: "text",
            text: "Document ci-dessus : " + p.titre + (p.notes ? " — note du client : " + p.notes : ""),
          });
          nbLus++;
        } else if (TYPES_IMAGE.indexOf(type) >= 0) {
          contenu.push({
            type: "image",
            source: {
              type: "base64",
              media_type: type,
              data: buf.toString("base64"),
            },
          });
          contenu.push({
            type: "text",
            text: "Image ci-dessus : " + p.titre + (p.notes ? " — note du client : " + p.notes : ""),
          });
          nbLus++;
        } else if (
          type.indexOf("text") >= 0 ||
          type.indexOf("json") >= 0 ||
          type.indexOf("csv") >= 0
        ) {
          contenu.push({
            type: "text",
            text:
              "Document texte « " + p.titre + " » :\n" +
              buf.toString("utf-8").slice(0, 40000),
          });
          nbLus++;
        } else {
          nbIllisibles++;
          journal.push(
            "Format non lu : " + p.titre + " (" + (type || "type inconnu") + ")"
          );
        }
      } catch (e: any) {
        nbIllisibles++;
        journal.push("Erreur sur " + p.titre + " : " + e.message);
      }
    }

    const typesAction: string[] = [];
    if (org.action_formation) typesAction.push("actions de formation continue");
    if (org.action_apprentissage) typesAction.push("formation par apprentissage");
    if (org.action_vae) typesAction.push("VAE");
    if (org.action_bilan) typesAction.push("bilans de competences");

    const systeme =
      "Tu accompagnes un organisme de formation francais dans sa preparation a la certification Qualiopi. " +
      "Tu n'es PAS un auditeur et tu ne certifies rien : tu aides l'organisme a integrer chaque indicateur " +
      "pour qu'il arrive prepare devant l'auditeur.\n\n" +
      "REGLES DE VOCABULAIRE, imperatives :\n" +
      "- Tu n'ecris JAMAIS les mots conforme, valide, certifie, garanti.\n" +
      "- Tu dis que le dossier te parait solide, ou qu'il manque tel element.\n" +
      "- Tu ne promets jamais la reussite de l'audit.\n\n" +
      "TON : celui d'un consultant experimente et exigeant. Tu dis ce qui va, et surtout ce qui ne va pas. " +
      "Un dossier incomplet doit etre signale comme tel, meme si le client a fourni des documents. " +
      "Ne complimente pas par politesse : ton utilite tient a ta franchise.\n\n" +
      "Tu reponds UNIQUEMENT en JSON valide, sans balise markdown, avec exactement ces cles :\n" +
      '{"verdict":"a_retravailler|en_bonne_voie|pret_pour_audit",' +
      '"synthese":"deux a quatre phrases",' +
      '"points_forts":"ce qui est present et solide, ou chaine vide",' +
      '"points_manquants":"ce qui manque, precisement, avec ce que l\'auditeur demandera"}\n\n' +
      "VERDICTS :\n" +
      "- a_retravailler : des elements essentiels du niveau attendu sont absents.\n" +
      "- en_bonne_voie : l'essentiel est la, mais il reste des manques ou des imprecisions.\n" +
      "- pret_pour_audit : tous les elements du niveau attendu sont couverts par les preuves et le commentaire.";

    const enTete =
      "INDICATEUR " + ind.numero + " : " + ind.intitule + "\n\n" +
      "NIVEAU ATTENDU PAR LE GUIDE DE LECTURE V9 :\n" + (ind.niveau_attendu || "(non renseigne)") + "\n\n" +
      "EXEMPLES DE PREUVES ET NON-CONFORMITES :\n" + (ind.elements_preuve || "(non renseigne)") + "\n\n" +
      "ORGANISME : " + (org.raison_sociale || "non precise") +
      (typesAction.length > 0 ? " — types d'action : " + typesAction.join(", ") : "") +
      (org.formations_certifiantes ? " — prepare a des certifications" : "") +
      (org.recours_sous_traitance ? " — recourt a la sous-traitance" : "") +
      "\n\n" +
      "CE QUE LE CLIENT DECLARE :\n" + (commentaire || "(aucun commentaire ecrit)") + "\n\n" +
      "PREUVES DEPOSEES : " + (preuves || []).length + " fichier(s), " + nbLus + " lu(s)" +
      (nbIllisibles > 0 ? ", " + nbIllisibles + " non lisible(s)" : "") + ".";

    const messages: any[] = [
      {
        role: "user",
        content: [{ type: "text", text: enTete }].concat(contenu).concat([
          {
            type: "text",
            text:
              "Examine ce dossier au regard du niveau attendu et rends ton verdict en JSON.",
          },
        ]),
      },
    ];

    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cleAnthropic,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 1500,
        system: systeme,
        messages: messages,
      }),
    });

    if (!reponse.ok) {
      const txt = await reponse.text();
      return NextResponse.json(
        {
          ok: false,
          erreur: "Appel a l'agent : code " + reponse.status,
          detail: txt.slice(0, 500),
        },
        { status: 500 }
      );
    }

    const data = await reponse.json();
    const texte = (data.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    let verdict: any = {};
    try {
      const propre = texte.replace(/```json/g, "").replace(/```/g, "").trim();
      verdict = JSON.parse(propre);
    } catch (e: any) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Reponse de l'agent illisible",
          detail: texte.slice(0, 500),
        },
        { status: 500 }
      );
    }

    const usage = data.usage || {};
    const cout =
      ((usage.input_tokens || 0) / 1000000) * 3 +
      ((usage.output_tokens || 0) / 1000000) * 15;

    const verdictRetenu = verdict.verdict || "a_retravailler";

    const { data: enregistre, error: errIns } = await supabase
      .from("qualiopi_examens")
      .insert({
        tenant_id: session.tenantId,
        indicateur_id: indicateurId,
        verdict: verdictRetenu,
        synthese: verdict.synthese || null,
        points_forts: verdict.points_forts || null,
        points_manquants: verdict.points_manquants || null,
        documents_lus: nbLus,
        documents_illisibles: nbIllisibles,
        cout_estime: cout,
      })
      .select()
      .limit(1);

    if (errIns) {
      return NextResponse.json(
        { ok: false, erreur: "Ecriture examen : " + errIns.message },
        { status: 500 }
      );
    }

    // On n ecrase JAMAIS un indicateur que l organisme a lui-meme declare
    // conforme : son jugement prime sur celui de l agent.
    const statutActuel = (avs || [])[0] ? (avs || [])[0].statut : null;

    if (statutActuel !== "conforme" && statutActuel !== "non_applicable") {
      await supabase
        .from("qualiopi_avancement")
        .upsert(
          {
            tenant_id: session.tenantId,
            indicateur_id: indicateurId,
            statut: STATUT_DEPUIS_VERDICT[verdictRetenu] || "en_cours",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,indicateur_id" }
        );
    }

    return NextResponse.json({
      ok: true,
      examen: (enregistre || [])[0] || null,
      restants: Math.max(0, MAX_EXAMENS - (dejaFaits || []).length - 1),
      journal: journal,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, erreur: e.message },
      { status: 500 }
    );
  }
}
