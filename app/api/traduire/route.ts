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

// ---------------------------------------------------------------------------
// 🚨🚨 LA LISTE DES LANGUES ETAIT PLUS COURTE QUE LE DRAPEAU — 29/08.
//
// LE DEFAUT, MESURE. Le selecteur du site propose SEPT langues : francais,
// anglais, espagnol, portugais, allemand, arabe, hebreu. Cette liste n en
// contenait que QUATRE — en, es, ar, he.
//
// CONSEQUENCE : pour le portugais et l allemand, LANGUES[langue_cible]
// valait undefined. La consigne envoyee au modele devenait « Translate the
// French text below to undefined » — et la traduction echouait sans le
// moindre message. Un visiteur choisissait le portugais et voyait tout en
// francais, sans qu aucune erreur ne remonte.
//
// LE PLUS TROMPEUR : les fiches de formation, elles, SONT traduites dans
// les six langues (table formations_traductions, 265 lignes chacune). Le
// visiteur voyait donc les formations dans sa langue et les menus en
// francais. De quoi croire a un defaut d affichage plutot qu a une langue
// jamais branchee.
//
// ⚠️ CETTE LISTE DOIT SUIVRE LE SELECTEUR DE LANGUE DU SITE. Toute langue
// ajoutee au drapeau sans l etre ici echouera en silence.
//
// COMMENT LA MEMOIRE SE REMPLIT. Rien n est genere d avance : chaque texte
// est traduit LA PREMIERE FOIS qu un visiteur l affiche, puis range dans
// traductions_interface. La fois suivante, il est lu depuis la base —
// aucun appel, aucun cout. C est pour cela que l anglais comptait 641
// lignes (quelqu un avait parcouru le site en anglais) et l espagnol 83.
//
// POUR AMORCER UNE LANGUE : parcourir le site une fois dans cette langue.
// Les pages visitees se remplissent, et le reste suivra au fil des
// visiteurs.
// ---------------------------------------------------------------------------
const LANGUES: Record<string, string> = {
  // Les six langues du selecteur, hors francais.
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  ar: "Arabic",
  he: "Hebrew",

  // Les dix autres langues du catalogue. Elles ne figurent pas encore au
  // selecteur, mais la route les accepte : le jour ou une langue est
  // ajoutee au drapeau, rien d autre n est a faire ici.
  it: "Italian",
  nl: "Dutch",
  ru: "Russian",
  zh: "Simplified Chinese",
  ja: "Japanese",
  ko: "Korean",
  tr: "Turkish",
  pl: "Polish",
  sv: "Swedish",
  el: "Greek",
};

// Retire des guillemets englobants ajoutes par le modele,
// sauf si le texte d origine en avait lui-meme.
function retirerGuillemets(
  traduction: string, original: string): string {
  const t = traduction.trim();
  if (t.length < 2) return t;
  const o = (original || "").trim();
  const origineEntoure = o.length > 1
    && (o[0] === '"' || o[0] === "\u00AB")
    && (o[o.length - 1] === '"'
      || o[o.length - 1] === "\u00BB");
  if (origineEntoure) return t;
  const d = t[0];
  const f = t[t.length - 1];
  const paires = (d === '"' && f === '"')
    || (d === "\u00AB" && f === "\u00BB")
    || (d === "\u201C" && f === "\u201D");
  if (paires) return t.slice(1, -1).trim();
  return t;
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
    const { texte, langue_cible } = await req.json();

    if (!texte || !langue_cible || langue_cible === "fr") {
      return NextResponse.json({ traduction: texte });
    }

    // 🚨 UNE LANGUE INCONNUE REND LE TEXTE FRANCAIS, ELLE N ECHOUE PLUS
    // EN SILENCE. Avant cette verification, LANGUES[langue_cible] valait
    // undefined et la consigne partait quand meme au modele, qui rendait
    // n importe quoi. Mieux vaut du francais lisible qu une traduction
    // vers une langue qui n existe pas.
    const nomLangue = LANGUES[langue_cible];
    if (!nomLangue) {
      return NextResponse.json({
        traduction: texte,
        avertissement: "Langue non prise en charge : " + langue_cible,
      });
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
          content: `Translate the French text below to ${nomLangue}. Do not add quotation marks around your answer. Reply ONLY with the translation, nothing else.\n\n${texte}`
        }],
      }),
    });

    const data = await res.json();
    mesurer("traduire", data);
    const brut = data?.content?.[0]?.text || texte;
    const traduction = retirerGuillemets(brut, texte);
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
