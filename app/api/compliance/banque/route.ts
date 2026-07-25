import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AIRWALLEX_BASE = "https://api.airwallex.com";

function tenantDeLaSession(req: NextRequest): string | null {
  try {
    const brut = req.cookies.get("sb_user")?.value;
    if (!brut) return null;
    const donnees = JSON.parse(decodeURIComponent(brut));
    return donnees?.tenant_id || null;
  } catch {
    return null;
  }
}

async function jetonAirwallex(): Promise<{ token?: string; erreur?: string }> {
  const clientId = process.env.AIRWALLEX_CLIENT_ID;
  const apiKey = process.env.AIRWALLEX_API_KEY;
  if (!clientId || !apiKey) {
    return { erreur: "Variables AIRWALLEX_CLIENT_ID / AIRWALLEX_API_KEY absentes dans Vercel." };
  }
  const rep = await fetch(AIRWALLEX_BASE + "/api/v1/authentication/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
  });
  const corps = await rep.text();
  if (!rep.ok) {
    return { erreur: "Authentification Airwallex refusee (HTTP " + rep.status + ") : " + corps };
  }
  try {
    const json = JSON.parse(corps);
    if (!json.token) return { erreur: "Reponse d'authentification sans jeton : " + corps };
    return { token: json.token };
  } catch {
    return { erreur: "Reponse d'authentification illisible : " + corps };
  }
}

async function appelAirwallex(token: string, chemin: string) {
  const rep = await fetch(AIRWALLEX_BASE + chemin, {
    headers: { Authorization: "Bearer " + token },
  });
  const corps = await rep.text();
  if (!rep.ok) {
    return { erreur: "Airwallex " + chemin + " (HTTP " + rep.status + ") : " + corps };
  }
  try {
    return { donnees: JSON.parse(corps) };
  } catch {
    return { erreur: "Reponse illisible sur " + chemin + " : " + corps };
  }
}

export async function GET(req: NextRequest) {
  const tenantId = tenantDeLaSession(req);
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const auth = await jetonAirwallex();
    if (!auth.token) {
      return NextResponse.json({ error: auth.erreur }, { status: 502 });
    }

    // ---- Soldes par devise ----
    const soldes = await appelAirwallex(auth.token, "/api/v1/balances/current");
    if (soldes.erreur) {
      return NextResponse.json({ error: soldes.erreur }, { status: 502 });
    }

    // ---- Mouvements bancaires ----
    const mouvements = await appelAirwallex(
      auth.token,
      "/api/v1/financial_transactions?page_size=100"
    );
    if (mouvements.erreur) {
      return NextResponse.json({ error: mouvements.erreur }, { status: 502 });
    }
    const items = Array.isArray(mouvements.donnees?.items)
      ? mouvements.donnees.items
      : Array.isArray(mouvements.donnees)
      ? mouvements.donnees
      : [];

    const transactions = items.map((t: any) => ({
      id: t.id,
      date: t.created_at,
      montant: t.amount,
      devise: t.currency,
      type: t.transaction_type || t.source_type || "",
      description: t.description || "",
      statut: t.status || "",
    }));

    // ---- Ecritures BQ existantes (pour le futur rapprochement) ----
    const { count, error: eBq } = await supabase
      .from("compta_ecritures")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("journal_code", "BQ");
    if (eBq) {
      return NextResponse.json({ error: "Lecture ecritures BQ: " + eBq.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      banque: "Airwallex",
      soldes: soldes.donnees,
      nb_transactions_banque: transactions.length,
      transactions,
      rapprochement: {
        nb_ecritures_bq: count || 0,
        note:
          transactions.length === 0
            ? "Aucun mouvement bancaire : rien a rapprocher pour le moment. Le moteur de correspondance s'activera aux premiers mouvements."
            : "Mouvements presents : moteur de correspondance a construire (etape suivante).",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e) },
      { status: 500 }
    );
  }
}
