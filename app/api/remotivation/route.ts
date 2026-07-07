import { mesurer } from "../../../lib/usageIA";
// app/api/remotivation/route.ts — Agent Remotivation connecté à CAM
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
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  mesurer("remotivation", data);
  return data.content[0].text || "";
}

const SYSTEM_REMOTIVATION = `Tu es l Agent Remotivation d AcadémIA Pro. Tu aides les apprenants demotives a reprendre leur formation avec des messages chaleureux bienveillants et personnalises. Tu connais la psychologie de la motivation et de l apprentissage. Pas de guillemets doubles. Pas de markdown.`;

async function generer_message(contexte: any): Promise<string> {
  const jours = contexte.jours_inactif || 7;
  const urgence = jours > 30 ? "critique" : jours > 14 ? "importante" : "douce";

  return await appel_claude(
    SYSTEM_REMOTIVATION,
    `Genere un message de remotivation personnalise pour un apprenant inactif.
Prénom: ${contexte.prenom || "cher apprenant"}
Formation: ${contexte.formation || "votre formation"}
Jours inactif: ${jours}
Progression: ${contexte.progression || "en cours"}
Urgence: ${urgence}

Le message doit:
- Etre chaleureux et bienveillant sans culpabiliser
- Rappeler pourquoi ils ont commence cette formation
- Proposer une aide concrete du formateur ou coach
- Avoir un CTA simple pour reprendre
- Faire 100 mots maximum`
  );
}

async function scanner_inactifs() {
  const { data: stagiaires } = await supabase
    .from("stagiaires")
    .select("email, formation_code, nom, prenom, updated_at")
    .eq("statut_paiement", "paye");

  if (!stagiaires) return [];

  const maintenant = new Date();
  const inactifs = stagiaires.filter(s => {
    if (!s.updated_at) return false;
    const derniere = new Date(s.updated_at);
    const jours = Math.floor((maintenant.getTime() - derniere.getTime()) / (1000 * 60 * 60 * 24));
    return jours >= 7;
  }).map(s => {
    const jours = Math.floor((maintenant.getTime() - new Date(s.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    return { ...s, jours_inactif: jours };
  });

  return inactifs;
}

async function stats_remotivation() {
  const { data } = await supabase.from("remotivation").select("statut,action");
  if (!data) return { total: 0, par_action: {} };
  const total = data.length;
  const par_action = data.reduce((acc: any, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1;
    return acc;
  }, {});
  return { total, par_action };
}

export async function POST(req: NextRequest) {
  // Garde-fou : n accepter que les appels du site
  const origineApp = req.headers.get("origin") || "";
  const referentApp = req.headers.get("referer") || "";
  const appelLegitime =
    origineApp.includes("academiapro.fr")
    || referentApp.includes("academiapro.fr")
    || origineApp.includes("vercel.app")
    || referentApp.includes("vercel.app")
    || origineApp.includes("localhost")
    || referentApp.includes("localhost");
  if (!appelLegitime) {
    return NextResponse.json(
      { error: "Acces refuse" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "generer") {
      const { contexte } = body;
      const message = await generer_message(contexte || {});

      await supabase.from("remotivation").insert({
        apprenant_email: contexte?.email || "",
        formation: contexte?.formation || "",
        jours_inactif: contexte?.jours_inactif || 0,
        message,
        action: "message_genere",
        statut: "envoye",
      });

      return NextResponse.json({ succes: true, message });
    }

    if (action === "scanner") {
      const inactifs = await scanner_inactifs();
      return NextResponse.json({ inactifs, total: inactifs.length });
    }

    if (action === "stats") return NextResponse.json(await stats_remotivation());

    if (action === "liste") {
      const { data } = await supabase.from("remotivation").select("*").order("created_at", { ascending: false }).limit(50);
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(await stats_remotivation());
}

