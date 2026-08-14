import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// LA RELANCE AUTOMATIQUE DES PROSPECTS DU CRM.
//
// CONSTRUITE MAIS ENDORMIE. Tant que ACTIVE vaut false, la route lit,
// calcule, et ne poste rien : elle renvoie ce qu elle AURAIT envoye. On
// peut donc l eprouver sans risque, et l ouvrir le jour ou les premiers
// messages auront montre qu ils sont bien recus.
//
// POURQUOI CETTE PRUDENCE. Le domaine d envoi a quinze jours d existence
// et sept messages a son actif. Une relance mal tournee partie toute seule
// ne se rattrape pas : une reputation abimee ne se repare pas, elle se
// remplace par un autre domaine.
//
// CHAQUE PROSPECT PORTE AUSSI SON PROPRE INTERRUPTEUR — la colonne
// relance_auto. Meme la route ouverte, seuls ceux qu on a marques sont
// relances. Deux verrous valent mieux qu un.
const ACTIVE = false;

// Le delai avant relance, et le nombre maximum de relances par prospect.
// Trois messages sans reponse suffisent : au-dela, on insiste.
const JOURS_AVANT_RELANCE = 7;
const RELANCES_MAX = 2;
const LOT = 5;

const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.academiapro.fr>";
const REPONSE = "contact@academiapro.fr";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

async function redigerRelance(p: any): Promise<string | null> {
  const cle = process.env.ANTHROPIC_API_KEY || "";
  if (!cle) return null;

  const contexte = [
    "Nom : " + (p.nom || "inconnu"),
    p.formation_interesse ? "Interesse par : " + p.formation_interesse : "",
    p.domaine ? "Domaine : " + p.domaine : "",
    p.source ? "Venu par : " + p.source : "",
    p.notes ? "Notes : " + p.notes : "",
    p.relances ? "Deja relance " + p.relances + " fois" : "Jamais relance",
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: "Redige une relance courte a ce prospect d un organisme "
            + "de formation. Trois paragraphes au maximum. Pas de formule "
            + "commerciale creuse, pas de point d exclamation. Tutoiement "
            + "interdit : vouvoiement. Termine par une question simple a "
            + "laquelle il peut repondre en une ligne.\n\n"
            + "Ne rends que le corps du message, sans objet ni signature.\n\n"
            + contexte,
        }],
      }),
    });

    const d = await r.json();
    if (!r.ok || !d.content || !d.content[0]) return null;
    return String(d.content[0].text || "").trim() || null;
  } catch (e) {
    return null;
  }
}

async function envoyer(destinataire: string, sujet: string, texte: string) {
  const html = texte.replace(/\n/g, "<br/>")
    + "<br/><br/>Jacques Lalou<br/>AcadeMIA Pro<br/>academiapro.fr";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      reply_to: REPONSE,
      to: destinataire,
      subject: sujet,
      html: html,
    }),
  });

  return r.ok;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  const limite = new Date();
  limite.setDate(limite.getDate() - JOURS_AVANT_RELANCE);

  // QUI EST RELANCE : un prospect qui a une adresse, qui n est ni client ni
  // perdu, qui n est pas desinscrit, qui n a pas donne signe depuis le
  // delai, et qui n a pas deja ete relance trop souvent.
  const { data: cibles, error } = await supabase
    .from("crm")
    .select("id, nom, email, statut, score, source, domaine, formation_interesse, notes, relances, derniere_interaction, relance_auto")
    .not("email", "is", null)
    .not("statut", "in", "(client,perdu)")
    .not("desinscrit", "is", true)
    .eq("relance_auto", true)
    .lt("derniere_interaction", limite.toISOString())
    .or("relances.is.null,relances.lt." + RELANCES_MAX)
    .order("score", { ascending: false })
    .limit(LOT);

  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  if (!cibles || cibles.length === 0) {
    return NextResponse.json({
      active: ACTIVE,
      info: "aucun prospect a relancer",
    });
  }

  const apercu: any[] = [];
  let envoyes = 0;

  for (const p of cibles) {
    const texte = await redigerRelance(p);
    if (!texte) continue;

    // MODE ENDORMI : on montre ce qui partirait, on n envoie rien.
    if (!ACTIVE) {
      apercu.push({
        nom: p.nom,
        email: p.email,
        score: p.score,
        relances_deja: p.relances || 0,
        message: texte,
      });
      continue;
    }

    // MARQUAGE AVANT ENVOI, comme pour la campagne : si l appel echoue, la
    // ligne porte deja son compteur et ne sera pas reprise deux fois.
    await supabase
      .from("crm")
      .update({
        relances: (p.relances || 0) + 1,
        relance_le: new Date().toISOString(),
      })
      .eq("id", p.id);

    const ok = await envoyer(
      String(p.email),
      "Suite a votre demande",
      texte);

    if (ok) envoyes++;
    await pause(2000);
  }

  return NextResponse.json({
    active: ACTIVE,
    examines: cibles.length,
    envoyes: ACTIVE ? envoyes : 0,
    apercu: ACTIVE ? undefined : apercu,
    note: ACTIVE
      ? undefined
      : "Route endormie : rien n a ete envoye. Passer ACTIVE a true pour ouvrir.",
  });
}
