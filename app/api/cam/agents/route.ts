// app/api/cam/agents/route.ts — Connexion centrale CAM ↔ tous les agents
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";

// ============================================================
// REGISTRE DES AGENTS — CAM connait tous les agents
// ============================================================
const AGENTS_REGISTRE: Record<string, { nom: string; route: string; description: string; visible: boolean }> = {
  // Agents métier invisibles
  crm:              { nom: "Agent CRM",           route: "/api/crm",                    description: "Gestion prospects et clients",       visible: false },
  emailing:         { nom: "Agent Emailing",       route: "/api/emailing",               description: "Campagnes emails automatisees",       visible: false },
  marketing:        { nom: "Agent Marketing",      route: "/api/marketing",              description: "Contenu marketing et strategie",     visible: false },
  commercial:       { nom: "Agent Commercial",     route: "/api/agent-commercial",       description: "Pitchs vente et propositions",        visible: false },
  reseaux_sociaux:  { nom: "Agent RS",             route: "/api/agent-reseaux-sociaux",  description: "Posts reseaux sociaux",               visible: false },
  remotivation:     { nom: "Agent Remotivation",   route: "/api/remotivation",           description: "Relance apprenants inactifs",         visible: false },
  // Agents experts invisibles
  mr_comptable:     { nom: "Mr Comptable",         route: "/api/admin/agent",            description: "Comptabilite et finances",            visible: false },
  mr_juridique:     { nom: "Mr Juridique",         route: "/api/admin/agent",            description: "Conseil juridique",                  visible: false },
  mr_qualiopi:      { nom: "Mr Qualiopi",          route: "/api/admin/agent",            description: "Certification et qualite",           visible: false },
  // Agents visibles par l apprenant
  tuteur:           { nom: "Agent Tuteur",         route: "/api/agent-tuteur",           description: "Accompagnement apprenant",           visible: true },
  unia:             { nom: "UNIA",                 route: "/api/agents",                 description: "Conseillere positionnement",          visible: true },
};

// ============================================================
// LOGGER — CAM log toutes les actions
// ============================================================
async function cam_logger(agent: string, action: string, contexte: any, resultat: string) {
  await supabase.from("analytics").insert({
    formation_code: contexte?.formation_code || contexte?.formation || "CAM",
    agent: `CAM → ${agent}`,
    action,
    resultat,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================
// APPEL AGENT — CAM appelle un agent
// ============================================================
async function cam_appeler_agent(agent_id: string, action: string, payload: any) {
  const agent = AGENTS_REGISTRE[agent_id];
  if (!agent) return { erreur: `Agent ${agent_id} inconnu` };

  const url = `${BASE_URL}${agent.route}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    await cam_logger(agent.nom, action, payload, `erreur ${res.status}`);
    return { erreur: `Agent ${agent.nom} erreur ${res.status}` };
  }

  const data = await res.json();
  await cam_logger(agent.nom, action, payload, "succes");
  return { succes: true, agent: agent.nom, data };
}

// ============================================================
// ORCHESTRATION AUTOMATIQUE — CAM decide quel agent appeler
// ============================================================
async function cam_orchestrer(evenement: string, contexte: any) {
  const actions: any[] = [];

  // Nouveau prospect → CRM + Emailing
  if (evenement === "nouveau_prospect") {
    const crm = await cam_appeler_agent("crm", "upsert", { data: contexte });
    actions.push(crm);
    const email = await cam_appeler_agent("emailing", "generer", {
      type: "bienvenue",
      contexte,
      envoyer: false,
    });
    actions.push(email);
  }

  // Nouvel achat → CRM + Emailing + Tuteur
  if (evenement === "nouvel_achat") {
    const crm = await cam_appeler_agent("crm", "upsert", {
      data: { ...contexte, statut: "client" }
    });
    actions.push(crm);
    const email = await cam_appeler_agent("emailing", "generer", {
      type: "bienvenue",
      contexte,
      envoyer: true,
    });
    actions.push(email);
  }

  // Apprenant inactif → Remotivation + Emailing
  if (evenement === "apprenant_inactif") {
    const remot = await cam_appeler_agent("remotivation", "generer", { contexte });
    actions.push(remot);
    if (remot.succes) {
      const email = await cam_appeler_agent("emailing", "generer", {
        type: "remotivation",
        contexte: { ...contexte, message: remot.data?.message },
        envoyer: true,
      });
      actions.push(email);
    }
  }

  // Certification obtenue → Emailing + CRM
  if (evenement === "certification_obtenue") {
    const email = await cam_appeler_agent("emailing", "generer", {
      type: "certification",
      contexte,
      envoyer: true,
    });
    actions.push(email);
    const crm = await cam_appeler_agent("crm", "upsert", {
      data: { ...contexte, statut: "certifie", notes: `Certifie ${contexte.formation}` }
    });
    actions.push(crm);
  }

  // Publication reseaux sociaux → Agent RS
  if (evenement === "publier_rs") {
    const rs = await cam_appeler_agent("reseaux_sociaux", "generer", {
      plateforme: contexte.plateforme || "linkedin",
      type: contexte.type_post || "linkedin_formation",
      contexte,
    });
    actions.push(rs);
  }

  await cam_logger("ORCHESTRATEUR", evenement, contexte, `${actions.length} agents mobilises`);
  return { evenement, actions_executees: actions.length, actions };
}

// ============================================================
// STATUT GLOBAL — CAM affiche l etat de tous les agents
// ============================================================
async function cam_statut_agents() {
  const agents = Object.entries(AGENTS_REGISTRE).map(([id, agent]) => ({
    id,
    nom: agent.nom,
    description: agent.description,
    visible: agent.visible,
    route: agent.route,
    statut: "actif",
  }));

  const { data: logs } = await supabase
    .from("analytics")
    .select("agent,action,timestamp")
    .like("agent", "CAM →%")
    .order("timestamp", { ascending: false })
    .limit(20);

  return {
    total_agents: agents.length,
    agents_visibles: agents.filter(a => a.visible).length,
    agents_invisibles: agents.filter(a => !a.visible).length,
    agents,
    derniers_logs: logs || [],
  };
}

// ============================================================
// ROUTE PRINCIPALE
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "statut") return NextResponse.json(await cam_statut_agents());

    if (action === "appeler") {
      const { agent_id, agent_action, payload } = body;
      return NextResponse.json(await cam_appeler_agent(agent_id, agent_action, payload || {}));
    }

    if (action === "orchestrer") {
      const { evenement, contexte } = body;
      return NextResponse.json(await cam_orchestrer(evenement, contexte || {}));
    }

    return NextResponse.json({ erreur: "Action invalide. Utilise: statut | appeler | orchestrer" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await cam_statut_agents());
}

