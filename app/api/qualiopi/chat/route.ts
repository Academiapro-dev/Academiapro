import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MESSAGES = 50;
const MODELE = "claude-sonnet-4-6";

function sessionDuCookie() {
  try {
    const brut = cookies().get("sb_user")?.value;
    if (!brut) return null;
    const u = JSON.parse(decodeURIComponent(brut));
    if (!u || !u.tenant_id) return null;
    return { tenantId: u.tenant_id, email: u.email || null };
  } catch (e) {
    return null;
  }
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function construireSysteme(
  ind: any,
  org: any,
  commentaire: any,
  nbPreuves: number,
  dernier: any
) {
  const typesAction: string[] = [];
  if (org.action_formation) typesAction.push("actions de formation continue");
  if (org.action_apprentissage) typesAction.push("formation par apprentissage");
  if (org.action_vae) typesAction.push("VAE");
  if (org.action_bilan) typesAction.push("bilans de competences");

  let texte =
    "Tu accompagnes un organisme de formation francais dans sa preparation a la certification " +
    "Qualiopi, indicateur par indicateur. Tu n'es PAS un auditeur et tu ne certifies rien : tu " +
    "aides l'organisme a integrer l'indicateur pour qu'il arrive prepare devant l'auditeur.\n\n";

  texte +=
    "REGLES DE VOCABULAIRE, imperatives :\n" +
    "- Tu n'ecris JAMAIS les mots conforme, valide, certifie, garanti.\n" +
    "- Tu dis que le dossier te parait solide, ou qu'il manque tel element.\n" +
    "- Tu ne promets jamais la reussite de l'audit.\n\n";

  texte +=
    "TON : consultant experimente et exigeant, mais pedagogue. Tu poses des questions concretes " +
    "sur la pratique reelle de l'organisme. Tu ne te contentes pas de reciter le referentiel : tu " +
    "cherches a savoir ce qui existe vraiment chez lui. Tes reponses sont courtes, deux a quatre " +
    "paragraphes au plus. Pas de listes a puces sauf si le client en demande.\n\n";

  texte += "INDICATEUR " + ind.numero + " : " + ind.intitule + "\n\n";
  texte +=
    "NIVEAU ATTENDU PAR LE GUIDE DE LECTURE V9 :\n" +
    (ind.niveau_attendu || "(non renseigne)") +
    "\n\n";
  texte +=
    "EXEMPLES DE PREUVES ET NON-CONFORMITES :\n" +
    (ind.elements_preuve || "(non renseigne)") +
    "\n\n";

  texte += "ORGANISME : " + (org.raison_sociale || "non precise");
  if (typesAction.length > 0) {
    texte += " — types d'action : " + typesAction.join(", ");
  }
  if (org.formations_certifiantes) texte += " — prepare a des certifications";
  if (org.recours_sous_traitance) texte += " — recourt a la sous-traitance";
  if (org.afest) texte += " — realise des formations en situation de travail";
  texte += "\n\n";

  texte +=
    "ETAT DU DOSSIER : " +
    nbPreuves +
    " preuve(s) deposee(s). Note ecrite par le client : " +
    (commentaire || "aucune") +
    ".\n";

  if (dernier) {
    texte += "DERNIER EXAMEN : verdict " + dernier.verdict + ". ";
    if (dernier.points_manquants) {
      texte += "Manques releves : " + dernier.points_manquants;
    }
  } else {
    texte += "Aucun examen n'a encore ete fait sur cet indicateur.";
  }

  return texte;
}

export async function GET(req: NextRequest) {
  const session = sessionDuCookie();
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
    .from("qualiopi_chat")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("indicateur_id", indicateurId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture chat : " + error.message },
      { status: 500 }
    );
  }

  const messages = data || [];
  const nbUtilisateur = messages.filter(
    (m: any) => m.role === "utilisateur"
  ).length;

  return NextResponse.json({
    ok: true,
    messages: messages,
    restants: Math.max(0, MAX_MESSAGES - nbUtilisateur),
    max: MAX_MESSAGES,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionDuCookie();
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Session sans societe rattachee. Reconnectez-vous.",
        },
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
        { ok: false, erreur: "Cle ANTHROPIC_API_KEY absente" },
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
    const ouverture = corps.ouverture === true;
    const messageUtilisateur = corps.message;

    if (!indicateurId) {
      return NextResponse.json(
        { ok: false, erreur: "indicateur_id manquant" },
        { status: 400 }
      );
    }
    if (!ouverture && !messageUtilisateur) {
      return NextResponse.json(
        { ok: false, erreur: "Message vide" },
        { status: 400 }
      );
    }

    const { data: historique, error: errHist } = await supabase
      .from("qualiopi_chat")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .eq("indicateur_id", indicateurId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (errHist) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture chat : " + errHist.message },
        { status: 500 }
      );
    }

    const ancien = historique || [];

    if (ouverture && ancien.length > 0) {
      const nb = ancien.filter((m: any) => m.role === "utilisateur").length;
      return NextResponse.json({
        ok: true,
        deja_ouvert: true,
        messages: ancien,
        restants: Math.max(0, MAX_MESSAGES - nb),
      });
    }

    const nbUtilisateur = ancien.filter(
      (m: any) => m.role === "utilisateur"
    ).length;

    if (!ouverture && nbUtilisateur >= MAX_MESSAGES) {
      return NextResponse.json(
        {
          ok: false,
          erreur:
            "Vous avez atteint la limite de " +
            MAX_MESSAGES +
            " messages pour cet indicateur.",
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

    const { data: prs } = await supabase
      .from("qualiopi_preuves")
      .select("id")
      .eq("tenant_id", session.tenantId)
      .eq("indicateur_id", indicateurId)
      .limit(50);

    const { data: exs } = await supabase
      .from("qualiopi_examens")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .eq("indicateur_id", indicateurId)
      .order("created_at", { ascending: false })
      .limit(1);
    const dernier = (exs || [])[0] || null;

    const messagesApi: any[] = [];
    ancien.forEach((m: any) => {
      messagesApi.push({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.message,
      });
    });

    if (ouverture) {
      messagesApi.push({
        role: "user",
        content:
          "Je commence a travailler cet indicateur. Souhaite-moi la bienvenue en une phrase, " +
          "explique-moi en quelques phrases ce qui est attendu concretement, precise que je peux " +
          "te poser toutes mes questions ici, puis pose-moi une ou deux questions pour savoir ou " +
          "j'en suis dans ma pratique.",
      });
    } else {
      messagesApi.push({ role: "user", content: messageUtilisateur });
    }

    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cleAnthropic,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 1200,
        system: construireSysteme(
          ind,
          org,
          commentaire,
          (prs || []).length,
          dernier
        ),
        messages: messagesApi,
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

    if (!texte) {
      return NextResponse.json(
        { ok: false, erreur: "Reponse vide de l'agent" },
        { status: 500 }
      );
    }

    const aInserer: any[] = [];
    if (!ouverture) {
      aInserer.push({
        tenant_id: session.tenantId,
        indicateur_id: indicateurId,
        role: "utilisateur",
        message: messageUtilisateur,
      });
    }
    aInserer.push({
      tenant_id: session.tenantId,
      indicateur_id: indicateurId,
      role: "agent",
      message: texte,
    });

    const { error: errIns } = await supabase
      .from("qualiopi_chat")
      .insert(aInserer);

    if (errIns) {
      return NextResponse.json(
        { ok: false, erreur: "Ecriture chat : " + errIns.message },
        { status: 500 }
      );
    }

    const { data: nouveau } = await supabase
      .from("qualiopi_chat")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .eq("indicateur_id", indicateurId)
      .order("created_at", { ascending: true })
      .limit(200);

    const nvNbUtilisateur = (nouveau || []).filter(
      (m: any) => m.role === "utilisateur"
    ).length;

    return NextResponse.json({
      ok: true,
      messages: nouveau || [],
      restants: Math.max(0, MAX_MESSAGES - nvNbUtilisateur),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: e.message }, { status: 500 });
  }
}
