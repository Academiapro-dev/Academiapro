// app/api/crm/route.ts — Agent CRM connecté à CAM
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-6";

async function appel_claude(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data.content[0].text || "";
}

async function notifier_cam(evenement: string, data: any) {
  await supabase.from("analytics").insert({
    formation_code: data.formation_interesse || "CRM",
    agent: "Agent CRM",
    action: evenement,
    resultat: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });
}

async function scorer_prospect(prospect: any): Promise<number> {
  let score = 0;
  if (prospect.email) score += 20;
  if (prospect.telephone) score += 15;
  if (prospect.formation_interesse) score += 25;
  if (prospect.domaine) score += 10;
  if (prospect.source === "webinaire") score += 20;
  if (prospect.source === "formulaire") score += 15;
  if (prospect.source === "chat") score += 10;
  return Math.min(score, 100);
}

// Ajouter ou mettre à jour un prospect
async function upsert_prospect(data: any) {
  const score = await scorer_prospect(data);
  const payload = { ...data, score, derniere_interaction: new Date().toISOString() };

  const { data: existant } = await supabase
    .from("crm").select("id").eq("email", data.email).limit(1);

  let result;
  if (existant && existant.length > 0) {
    result = await supabase.from("crm").update(payload).eq("email", data.email);
  } else {
    result = await supabase.from("crm").insert(payload);
  }

  await notifier_cam("prospect_upsert", { ...data, score });
  return { succes: !result.error, score };
}

// Récupérer tous les prospects avec filtres
async function get_prospects(statut?: string, domaine?: string) {
  let query = supabase.from("crm").select("*").order("score", { ascending: false });
  if (statut) query = query.eq("statut", statut);
  if (domaine) query = query.eq("domaine", domaine);
  const { data } = await query;
  return data || [];
}

// Analyse IA d'un prospect
async function analyser_prospect(email: string) {
  const { data } = await supabase.from("crm").select("*").eq("email", email).limit(1);
  if (!data || data.length === 0) return { erreur: "Prospect non trouvé" };

  const p = data[0];
  const analyse = await appel_claude(
    "Tu es l Agent CRM d AcadémIA Pro. Tu analyses les prospects et donnes des recommandations commerciales precises. Pas de guillemets doubles.",
    `Analyse ce prospect et donne 3 recommandations d action:
Nom: ${p.nom}
Email: ${p.email}
Formation interesse: ${p.formation_interesse}
Domaine: ${p.domaine}
Source: ${p.source}
Statut: ${p.statut}
Score: ${p.score}
Notes: ${p.notes}
Derniere interaction: ${p.derniere_interaction}`
  );

  await notifier_cam("analyse_prospect", { email, score: p.score });
  return { prospect: p, analyse };
}

// Relance automatique
async function generer_relance(email: string) {
  const { data } = await supabase.from("crm").select("*").eq("email", email).limit(1);
  if (!data || data.length === 0) return { erreur: "Prospect non trouvé" };

  const p = data[0];
  const email_relance = await appel_claude(
    "Tu es l Agent Emailing d AcadémIA Pro. Tu rediges des emails de relance personnalises et efficaces. Ton style est chaleureux et professionnel. Pas de guillemets doubles.",
    `Redige un email de relance personnalise pour:
Nom: ${p.nom || "cher(e) apprenant(e)"}
Formation interesse: ${p.formation_interesse || "nos formations"}
Domaine: ${p.domaine || "votre domaine"}
Source: ${p.source}
Notes: ${p.notes || ""}

L email doit:
- Avoir un objet percutant
- Etre chaleureux et personnalise
- Rappeler la valeur de la formation
- Avoir un CTA clair vers academiapro.fr
- Faire 150 mots maximum`
  );

  await supabase.from("crm").update({
    derniere_interaction: new Date().toISOString(),
    notes: (p.notes || "") + ` | Relance envoyee ${new Date().toLocaleDateString("fr-FR")}`
  }).eq("email", email);

  await notifier_cam("relance_generee", { email, formation: p.formation_interesse });
  return { email_relance, prospect: p };
}

// Statistiques CRM
async function stats_crm() {
  const { data: tous } = await supabase.from("crm").select("statut,score,domaine,source");
  if (!tous) return {};

  const total = tous.length;
  const prospects = tous.filter(p => p.statut === "prospect").length;
  const chauds = tous.filter(p => p.score >= 60).length;
  const clients = tous.filter(p => p.statut === "client").length;
  const score_moyen = total > 0 ? Math.round(tous.reduce((s, p) => s + (p.score || 0), 0) / total) : 0;

  const par_domaine = tous.reduce((acc: any, p) => {
    if (p.domaine) acc[p.domaine] = (acc[p.domaine] || 0) + 1;
    return acc;
  }, {});

  const par_source = tous.reduce((acc: any, p) => {
    if (p.source) acc[p.source] = (acc[p.source] || 0) + 1;
    return acc;
  }, {});

  return { total, prospects, chauds, clients, score_moyen, par_domaine, par_source };
}


async function lms_update(email: string, data: any) {
  if (!email) return { erreur: "Email requis" };

  const { data: existant } = await supabase
    .from("crm").select("id,modules_valides,progression").eq("email", email).limit(1);

  const payload = {
    email,
    statut: "client",
    formation_active: data.formation_code,
    modules_valides: data.modules_valides || 0,
    progression: data.progression_pct || 0,
    derniere_connexion: new Date().toISOString(),
    derniere_interaction: new Date().toISOString(),
    notes: data.notes || "",
  };

  let err;
  if (existant && existant.length > 0) {
    const r = await supabase.from("crm").update(payload).eq("email", email);
    err = r.error;
  } else {
    const r = await supabase.from("crm").insert({ ...payload, score: 80 });
    err = r.error;
  }

  // Notifier CAM
  await supabase.from("analytics").insert({
    formation_code: data.formation_code || "CRM",
    agent: "CRM ↔ LMS",
    action: "progression_mise_a_jour",
    resultat: email + " — " + data.progression_pct + "% — " + data.modules_valides + " modules",
    timestamp: new Date().toISOString(),
  });

  // Si progression >= 100% → déclencher email certification
  if (data.progression_pct >= 100) {
    await fetch(process.env.NEXT_PUBLIC_SITE_URL + "/api/emailing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generer",
        type: "certification",
        contexte: { email, prenom: data.prenom || "", formation: data.formation_code },
        envoyer: true,
      }),
    });
  }

  // Si inactif depuis 7 jours → déclencher remotivation (géré par Agent Remotivation)
  if (data.jours_inactif && data.jours_inactif >= 7) {
    await fetch(process.env.NEXT_PUBLIC_SITE_URL + "/api/remotivation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generer",
        contexte: { email, prenom: data.prenom || "", formation: data.formation_code, jours_inactif: data.jours_inactif },
      }),
    });
  }

  if (err) return { erreur: err.message };
  return { succes: true, email, progression: data.progression_pct };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "upsert") return NextResponse.json(await upsert_prospect(body.data));
    if (action === "prospects") return NextResponse.json(await get_prospects(body.statut, body.domaine));
    if (action === "analyser") return NextResponse.json(await analyser_prospect(body.email));
    if (action === "relance") return NextResponse.json(await generer_relance(body.email));
    if (action === "lms_update") return NextResponse.json(await lms_update(body.email, body.data || {}));
    if (action === "stats") return NextResponse.json(await stats_crm());

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await stats_crm());
}
