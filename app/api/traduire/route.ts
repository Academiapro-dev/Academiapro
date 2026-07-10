import { mesurer } from "../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client admin local (service_role) : la table
// traductions_interface est verrouillee par RLS, la cle
// anon publique ne peut ni la lire ni y ecrire.
function clientAdminTraductions() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    || "https://kpxrbwsbhmggoajtxzqn.supabase.co";
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!cle) return null;
  return createClient(url, cle);
}

export const runtime = "nodejs";
export const maxDuration = 30;

const cache: Record<string, string> = {};

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
    const { texte, langue_cible } = await req.json();

    if (!texte || !langue_cible || langue_cible === "fr") {
      return NextResponse.json({ traduction: texte });
    }

    const cacheKey = `${langue_cible}:${texte.slice(0, 50)}`;
    if (cache[cacheKey]) {
      return NextResponse.json({ traduction: cache[cacheKey] });
    }

    // Memoire persistante : lire la base avant tout appel
    // Claude. En cas d absence ou de panne, on continue
    // comme avant - jamais pire qu avant.
    let supa = null;
    try {
      supa = clientAdminTraductions();
      if (supa) {
        const { data: memo } = await supa
          .from("traductions_interface")
          .select("traduction")
          .eq("langue", langue_cible)
          .eq("texte_source", texte)
          .maybeSingle();
        if (memo && memo.traduction) {
          cache[cacheKey] = memo.traduction;
          return NextResponse.json(
            { traduction: memo.traduction });
        }
      }
    } catch {
      supa = null;
    }

    const LANGUES: Record<string, string> = {
      en: "English",
      es: "Spanish",
      ar: "Arabic",
      he: "Hebrew",
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Translate this French text to ${LANGUES[langue_cible]}. Reply ONLY with the translation, nothing else: "${texte}"`
        }],
      }),
    });

    const data = await res.json();
    mesurer("traduire", data);
    const traduction = data?.content?.[0]?.text || texte;
    cache[cacheKey] = traduction;
    if (supa && traduction && traduction !== texte) {
      try {
        await supa.from("traductions_interface").insert({
          langue: langue_cible,
          texte_source: texte,
          traduction: traduction,
        });
      } catch {
        // Doublon ou panne : sans gravite, la traduction
        // est deja rendue.
      }
    }

    return NextResponse.json({ traduction });
  } catch {
    return NextResponse.json({ traduction: "" }, { status: 500 });
  }
}
