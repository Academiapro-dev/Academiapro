import { mesurer } from "../../../lib/usageIA";
// app/api/crm/route.ts — Agent CRM, cloisonne par organisme
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../lib/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-6";
const ADMINS = ["contact@academiapro.fr"];

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
  mesurer("crm", data);
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

// Chaque prospect appartient a un organisme : celui de la session.
function filtreTenant(requete: any, tenantId: string | null) {
  return tenantId ? requete.eq("tenant_id", tenantId) : requete.is("tenant_id", null);
}

// PORTEE. Un administrateur est rattache a son propre organisme, mais ses
// prospects a lui — ceux qui arrivent par les tunnels publics — sont
// enregistres SANS organisme. Sans cette option, il ne les voit jamais.
function porteeDe(session: any, demande: any): string | null {
  const admin = ADMINS.indexOf(session.email) >= 0;
  if (admin && demande === "editeur") return null;
  return session.tenantId;
}

// UN ENVOI PARTIEL NE DOIT PLUS EFFACER LE RESTE DE LA FICHE.
//
// DEFAUT TROUVE LE 14 AOUT. Les boutons d etape de l ecran client
// (« → Contactes », « → Client ») appellent cette fonction avec TROIS
// champs seulement : email, nom, statut. L ancienne version ecrasait la
// ligne entiere avec ces trois champs et RECALCULAIT LE SCORE dessus —
// un prospect a 85 points retombait a 20 des qu on le faisait avancer,
// et son telephone, sa formation et ses notes disparaissaient au passage.
//
// La regle est desormais : on relit la fiche, on pose par-dessus ce qui
// est reellement fourni, et on score le resultat. Plus l organisme
// travaille son pipeline, plus la fiche s enrichit — l inverse d avant.
function fusionner(existante: any, entrant: any) {
  const fusion: any = Object.assign({}, existante || {});
  for (const cle of Object.keys(entrant || {})) {
    const v = entrant[cle];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    fusion[cle] = v;
  }
  return fusion;
}

async function upsert_prospect(data: any, tenantId: string | null) {
  const { data: existant } = await filtreTenant(
    supabase.from("crm").select("*").eq("email", data.email),
    tenantId
  ).limit(1);

  const ancienne = existant && existant.length > 0 ? existant[0] : null;
  const complete = fusionner(ancienne, data);
  const score = await scorer_prospect(complete);

  // On n ecrit que les champs fournis, plus le score recalcule sur la
  // fiche complete : les colonnes absentes de l envoi restent en base.
  const payload: any = Object.assign({}, data, {
    score: score,
    tenant_id: tenantId,
    derniere_interaction: new Date().toISOString(),
  });

  let result;
  if (ancienne) {
    result = await supabase.from("crm").update(payload).eq("id", ancienne.id);
  } else {
    result = await supabase.from("crm").insert(payload);
  }

  await notifier_cam("prospect_upsert", { ...data, score });
  return { succes: !result.error, score, erreur: result.error ? result.error.message : null };
}

// MARQUER UN PROSPECT PERDU, AVEC SON MOTIF.
//
// C est la donnee la plus instructive du CRM : ce qui fait dire non. Un
// prospect perdu sans motif n apprend rien ; dix prospects perdus pour la
// meme raison disent ou l offre bloque.
//
// Un prospect perdu sort des relances : perdu_le horodate la sortie et
// relance_auto est desarme. ATTENTION : son statut ne le retire PAS des
// lectures — get_prospects ne filtre par statut que si on le lui demande.
// C est l ecran qui masque les perdus, pas la route.
async function marquer_perdu(email: string, motif: string, tenantId: string | null) {
  if (!email) return { erreur: "Email requis" };

  const { data } = await filtreTenant(
    supabase.from("crm").select("id, nom").eq("email", email),
    tenantId
  ).limit(1);

  if (!data || data.length === 0) return { erreur: "Prospect non trouve" };

  const { error } = await supabase
    .from("crm")
    .update({
      statut: "perdu",
      motif_perte: String(motif || "").slice(0, 500) || null,
      perdu_le: new Date().toISOString(),
      relance_auto: false,
      derniere_interaction: new Date().toISOString(),
    })
    .eq("id", data[0].id);

  if (error) return { erreur: error.message };

  await notifier_cam("prospect_perdu", { email, motif });
  return { succes: true, email, motif };
}

// ROUVRIR UNE FICHE FERMEE PAR ERREUR.
//
// Sans cette action, une mauvaise manipulation ne se reparait qu en SQL.
// Le motif et la date de perte sont effaces : garder un motif sur une
// fiche rouverte fausserait le regroupement du tableau de bord.
async function rouvrir_prospect(email: string, tenantId: string | null) {
  if (!email) return { erreur: "Email requis" };

  const { data } = await filtreTenant(
    supabase.from("crm").select("id").eq("email", email),
    tenantId
  ).limit(1);

  if (!data || data.length === 0) return { erreur: "Prospect non trouve" };

  const { error } = await supabase
    .from("crm")
    .update({
      statut: "prospect",
      motif_perte: null,
      perdu_le: null,
      derniere_interaction: new Date().toISOString(),
    })
    .eq("id", data[0].id);

  if (error) return { erreur: error.message };
  return { succes: true, email };
}

// ARMER OU DESARMER LA RELANCE AUTOMATIQUE, PROSPECT PAR PROSPECT.
//
// Deux verrous : celui-ci, et la constante ACTIVE de la route
// /api/cron/relance-crm. Tant que l un des deux est ferme, rien ne part.
async function basculer_relance_auto(email: string, actif: boolean, tenantId: string | null) {
  if (!email) return { erreur: "Email requis" };

  const { data } = await filtreTenant(
    supabase.from("crm").select("id").eq("email", email),
    tenantId
  ).limit(1);

  if (!data || data.length === 0) return { erreur: "Prospect non trouve" };

  const { error } = await supabase
    .from("crm")
    .update({ relance_auto: !!actif })
    .eq("id", data[0].id);

  if (error) return { erreur: error.message };
  return { succes: true, email, relance_auto: !!actif };
}

// LES MOTIFS DE PERTE, REGROUPES. Ce que cette liste montre au bout de
// quelques semaines vaut plus qu une etude de marche.
async function motifs_perte(tenantId: string | null) {
  const { data } = await filtreTenant(
    supabase.from("crm").select("motif_perte, perdu_le").eq("statut", "perdu"),
    tenantId
  ).limit(2000);

  const compte: any = {};
  for (const l of (data || [])) {
    const m = (l.motif_perte || "sans motif").trim();
    compte[m] = (compte[m] || 0) + 1;
  }

  const liste = Object.keys(compte)
    .map(function (m) { return { motif: m, nombre: compte[m] }; })
    .sort(function (a, b) { return b.nombre - a.nombre; });

  return { total: (data || []).length, motifs: liste };
}

async function get_prospects(statut: string | undefined, domaine: string | undefined, tenantId: string | null) {
  let query = filtreTenant(
    supabase.from("crm").select("*").order("score", { ascending: false }),
    tenantId
  );
  if (statut) query = query.eq("statut", statut);
  if (domaine) query = query.eq("domaine", domaine);
  const { data } = await query.limit(1000);
  return data || [];
}

async function analyser_prospect(email: string, tenantId: string | null) {
  const { data } = await filtreTenant(
    supabase.from("crm").select("*").eq("email", email),
    tenantId
  ).limit(1);

  if (!data || data.length === 0) return { erreur: "Prospect non trouve" };

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

async function generer_relance(email: string, tenantId: string | null) {
  const { data } = await filtreTenant(
    supabase.from("crm").select("*").eq("email", email),
    tenantId
  ).limit(1);

  if (!data || data.length === 0) return { erreur: "Prospect non trouve" };

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
  }).eq("id", p.id);

  await notifier_cam("relance_generee", { email, formation: p.formation_interesse });
  return { email_relance, prospect: p };
}

async function stats_crm(tenantId: string | null) {
  const { data: tous } = await filtreTenant(
    supabase.from("crm").select("statut,score,domaine,source,relance_auto"),
    tenantId
  ).limit(5000);

  if (!tous) return {};

  const total = tous.length;
  const prospects = tous.filter(p => p.statut === "prospect").length;
  const chauds = tous.filter(p => (p.score || 0) >= 60).length;
  const clients = tous.filter(p => p.statut === "client").length;
  const perdus = tous.filter(p => p.statut === "perdu").length;
  const relance_armee = tous.filter(p => !!p.relance_auto).length;
  const score_moyen = total > 0 ? Math.round(tous.reduce((s, p) => s + (p.score || 0), 0) / total) : 0;

  const par_domaine = tous.reduce((acc: any, p) => {
    if (p.domaine) acc[p.domaine] = (acc[p.domaine] || 0) + 1;
    return acc;
  }, {});

  const par_source = tous.reduce((acc: any, p) => {
    if (p.source) acc[p.source] = (acc[p.source] || 0) + 1;
    return acc;
  }, {});

  return { total, prospects, chauds, clients, perdus, relance_armee, score_moyen, par_domaine, par_source };
}

// 🚨 L ATTESTATION AUTOMATIQUE — LE JETON INTERNE AJOUTE LE 31/08.
//
// LE DEFAUT, ET IL N AURAIT ETE VU QUE PAR LE PREMIER CLIENT REEL.
//
// Cette fonction est le SEUL chemin par lequel un apprenant qui termine
// vraiment sa formation recoit son attestation : quand la progression
// atteint 100 %, elle appelle /api/admin/certificat. Or cet appel est un
// fetch DE SERVEUR A SERVEUR — il ne transporte AUCUN COOKIE.
//
// Depuis que /api/admin/certificat exige « une session OU un jeton
// interne », un appel sans l un ni l autre repond 401. La fonction etait
// donc devenue muette : elle appelait, la route refusait, et le catch
// avalait l echec sans rien dire. Aucune attestation n aurait ete emise.
//
// POURQUOI PERSONNE NE L A VU : le seul certificat de la table a ete
// produit le 10/08 depuis l ECRAN D ADMINISTRATION, ou la session existe.
// Ce chemin-la marchait, et masquait l autre. Verifie en base le 31/08 :
// une seule ligne, celle de l administrateur.
//
// ⚠️ LE JETON EST SESSION_SECRET, exactement ce que /api/admin/certificat
// compare. Il ne quitte JAMAIS le serveur — il n est pas expose au
// navigateur, et cette route ne le renvoie a personne.
//
// ⚠️ IL SERT AUSSI DE CLE MACHINE POUR LE MIDDLEWARE. Depuis le 31/08,
// le middleware filtre /api/admin et refuse ce qui n a ni session ni
// en-tete d authentification. L en-tete authorization pose ci-dessous
// laisse donc passer l appel jusqu a la route, qui reste seule juge.
async function declencher_certificat_auto(email: string, formationCode: string) {
  try {
    const { data: existant } = await supabase
      .from("certificats_delivres")
      .select("id")
      .eq("user_email", email)
      .eq("formation_code", formationCode)
      .limit(1);

    if (existant && existant.length > 0) return;

    const { data: formationsData } = await supabase
      .from("formations")
      .select("titre")
      .eq("code", formationCode)
      .limit(1);

    const { data: crmData } = await supabase
      .from("crm")
      .select("nom, prenom")
      .eq("email", email)
      .limit(1);

    const nomComplet = crmData && crmData[0] ? ((crmData[0].prenom || "") + " " + (crmData[0].nom || "")).trim() : email;
    const formationTitre = formationsData && formationsData[0] ? formationsData[0].titre : formationCode;

    const secretInterne = process.env.SESSION_SECRET || "";
    if (!secretInterne) {
      console.error("[crm] SESSION_SECRET absente : attestation non emise pour " + email);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";
    const reponse = await fetch(baseUrl + "/api/admin/certificat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Laisse passer le filet du middleware ; la route verifie
        // elle-meme la valeur du jeton dans le corps.
        "Authorization": "Bearer " + secretInterne,
      },
      body: JSON.stringify({
        nom: nomComplet || email,
        formation: formationTitre,
        code: formationCode,
        niveau: "Expert",
        date: new Date().toLocaleDateString("fr-FR"),
        userEmail: email,
        jeton_interne: secretInterne,
      }),
    });

    // ⚠️ L ECHEC NE DOIT PLUS ETRE MUET. C est precisement le silence qui
    // a laisse ce defaut invisible : sans cette trace, une attestation non
    // emise ne se remarque que le jour ou l apprenant la reclame.
    if (!reponse.ok) {
      console.error(
        "[crm] attestation refusee pour " + email + " — HTTP " + reponse.status
      );
    }
  } catch (e) {
    console.error("Erreur declenchement certificat auto:", e);
  }
}

async function lms_update(email: string, data: any, tenantId: string | null) {
  if (!email) return { erreur: "Email requis" };

  const { data: existant } = await filtreTenant(
    supabase.from("crm").select("id").eq("email", email),
    tenantId
  ).limit(1);

  if ((data.progression_pct || 0) >= 100 && data.formation_code) {
    await declencher_certificat_auto(email, data.formation_code);
  }

  const payload = {
    email,
    tenant_id: tenantId,
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
    const r = await supabase.from("crm").update(payload).eq("id", existant[0].id);
    err = r.error;
  } else {
    const r = await supabase.from("crm").insert({ ...payload, score: 80 });
    err = r.error;
  }

  await supabase.from("analytics").insert({
    formation_code: data.formation_code || "CRM",
    agent: "CRM ↔ LMS",
    action: "progression_mise_a_jour",
    resultat: email + " — " + data.progression_pct + "% — " + data.modules_valides + " modules",
    timestamp: new Date().toISOString(),
  });

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
  // Une SESSION SIGNEE est desormais exigee : l en-tete de provenance ne
  // prouvait rien, et c est la session qui porte l organisme.
  const session = sessionCourante();
  if (!session) {
    return NextResponse.json({ erreur: "Connectez-vous" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const t = porteeDe(session, body.portee);

    if (action === "upsert") return NextResponse.json(await upsert_prospect(body.data, t));
    if (action === "prospects") return NextResponse.json(await get_prospects(body.statut, body.domaine, t));
    if (action === "analyser") return NextResponse.json(await analyser_prospect(body.email, t));
    if (action === "relance") return NextResponse.json(await generer_relance(body.email, t));
    if (action === "perdu") return NextResponse.json(await marquer_perdu(body.email, body.motif, t));
    if (action === "rouvrir") return NextResponse.json(await rouvrir_prospect(body.email, t));
    if (action === "motifs_perte") return NextResponse.json(await motifs_perte(t));
    if (action === "relance_auto") return NextResponse.json(await basculer_relance_auto(body.email, body.actif, t));
    if (action === "lms_update") return NextResponse.json(await lms_update(session.email, body.data || {}, t));
    if (action === "stats") return NextResponse.json(await stats_crm(t));

    return NextResponse.json({ erreur: "Action invalide" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = sessionCourante();
  if (!session) {
    return NextResponse.json({ erreur: "Connectez-vous" }, { status: 401 });
  }
  const portee = new URL(req.url).searchParams.get("portee");
  return NextResponse.json(await stats_crm(porteeDe(session, portee)));
}
