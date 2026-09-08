import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════════════
// L ENRICHISSEMENT PAR DROPCONTACT — 08/09/2026.
//
// CE QU IL APPORTE. L Annuaire des Entreprises donne le SIREN, la raison
// sociale, la ville et le dirigeant. Il NE DONNE NI SITE WEB NI ADRESSE
// ELECTRONIQUE — verifie, le champ n existe pas dans sa reponse.
// Dropcontact les trouve a partir du nom du dirigeant et de la societe.
//
// 🚨🚨 L API NE REPOND PAS IMMEDIATEMENT. On envoie un lot, elle rend un
// IDENTIFIANT DE TRAITEMENT, et le resultat n est disponible que quelques
// minutes plus tard. Il faut revenir le chercher. C est pour cela que
// cette route a DEUX MODES :
//
//   ?envoyer=1   prend les lignes a enrichir, les envoie, garde l identifiant
//   ?relever=1   revient chercher les resultats et ecrit les adresses
//   ?compter=1   ne fait rien, dit seulement ou on en est
//
// ⛔ NE JAMAIS FUSIONNER LES DEUX MODES EN UN SEUL APPEL qui attendrait la
// reponse : le traitement peut prendre plusieurs minutes, Vercel coupe, et
// le credit est consomme pour rien.
//
// 🚨 SANS PRENOM ET NOM DE DIRIGEANT, DROPCONTACT NE TROUVE RIEN. Les
// lignes qui n en ont pas sont ecartees AVANT l envoi, pour ne pas
// consommer de credit inutilement.
//   prospects_ecommerce  : 10 788 exploitables sur 20 000
//   prospects_immobilier :  9 002 exploitables sur 10 000
//
// ⚠️ LE CREDIT EST LA RESSOURCE RARE. 4 000 par mois au 14/09. Le lot par
// defaut est volontairement petit : mieux vaut plusieurs passages qu un
// gros lot rate.
// ═══════════════════════════════════════════════════════════════════════

const API_ENVOI = "https://api.dropcontact.io/batch";
const API_RELEVE = "https://api.dropcontact.io/batch/";

// LES TABLES TRAITEES, DANS L ORDRE.
//
// ⚠️ L ORDRE COMPTE : c est celui dans lequel les credits seront
// consommes. `immobilier` d abord — 9 002 dirigeants sur 10 000, le
// meilleur rendement, et la campagne Mr CRM est la plus proche.
const ORDRE = ["immobilier", "ecommerce"];

const TABLES: any = {
  immobilier: "prospects_immobilier",
  ecommerce: "prospects_ecommerce",
};

// COMBIEN DE LIGNES PAR LOT.
// ⚠️ Dropcontact accepte de gros lots, mais un lot rate est un lot perdu.
// 250 se traite vite et se releve en une fois.
const LOT = 250;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function cle(): string {
  return (process.env.DROPCONTACT_API_KEY || "").trim();
}

function propre(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

// ─────────────────────────────────────────────────────────────────────
// MODE MESURE.
// ─────────────────────────────────────────────────────────────────────
async function mesurer(): Promise<any> {
  const etat: any[] = [];

  for (const nom of ORDRE) {
    const table = TABLES[nom];

    const { count: total } = await supabase
      .from(table).select("id", { count: "exact", head: true });

    const { count: exploitables } = await supabase
      .from(table).select("id", { count: "exact", head: true })
      .not("dirigeant_nom", "is", null)
      .not("dirigeant_prenom", "is", null);

    const { count: aEnvoyer } = await supabase
      .from(table).select("id", { count: "exact", head: true })
      .not("dirigeant_nom", "is", null)
      .not("dirigeant_prenom", "is", null)
      .is("email", null)
      .is("dropcontact_lot", null);

    const { count: enAttente } = await supabase
      .from(table).select("id", { count: "exact", head: true })
      .not("dropcontact_lot", "is", null)
      .is("email", null);

    const { count: avecEmail } = await supabase
      .from(table).select("id", { count: "exact", head: true })
      .not("email", "is", null);

    etat.push({
      table: table,
      total: total,
      exploitables: exploitables,
      a_envoyer: aEnvoyer,
      en_attente_de_releve: enAttente,
      avec_email: avecEmail,
    });
  }

  return etat;
}

// ─────────────────────────────────────────────────────────────────────
// MODE ENVOI.
// ─────────────────────────────────────────────────────────────────────
async function envoyer(nom: string): Promise<any> {
  const table = TABLES[nom];

  // 🚨 ON N ENVOIE QUE CE QUI A UN PRENOM ET UN NOM. Sans eux, Dropcontact
  // ne trouve rien et le credit est consomme pour rien.
  // ⚠️ ET RIEN QUI SOIT DEJA PARTI : `dropcontact_lot is null`.
  const { data: lignes, error } = await supabase
    .from(table)
    .select("id, siren, raison_sociale, dirigeant_prenom, dirigeant_nom, ville")
    .not("dirigeant_nom", "is", null)
    .not("dirigeant_prenom", "is", null)
    .is("email", null)
    .is("dropcontact_lot", null)
    .order("id", { ascending: true })
    .limit(LOT);

  if (error) return { table: table, erreur: error.message };
  if (!lignes || lignes.length === 0) {
    return { table: table, info: "rien a envoyer" };
  }

  // LE FORMAT ATTENDU PAR DROPCONTACT.
  // ⚠️ `siren` EST NOTRE CLE DE RAPPROCHEMENT AU RETOUR. Dropcontact rend
  // les lignes dans le meme ordre, mais on ne s y fie pas : on renvoie
  // notre propre reference dans chaque ligne.
  const donnees = lignes.map(function (l: any) {
    return {
      first_name: propre(l.dirigeant_prenom),
      last_name: propre(l.dirigeant_nom),
      company: propre(l.raison_sociale),
      siren: propre(l.siren),
      city: propre(l.ville),
      country: "France",
    };
  });

  let reponse: any = null;
  try {
    const r = await fetch(API_ENVOI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": cle(),
      },
      body: JSON.stringify({
        data: donnees,
        siren: true,
        language: "fr",
      }),
    });

    const texte = await r.text();
    try { reponse = JSON.parse(texte); }
    catch { return { table: table, erreur: "reponse illisible : " + texte.slice(0, 200) }; }

    if (!r.ok) {
      return { table: table, erreur: "HTTP " + r.status, detail: texte.slice(0, 200) };
    }
  } catch (e: any) {
    return { table: table, erreur: String(e && e.message ? e.message : e) };
  }

  const lot = reponse && (reponse.request_id || reponse.id);
  if (!lot) {
    return { table: table, erreur: "aucun identifiant de lot rendu", reponse: reponse };
  }

  // 🚨 ON MARQUE LES LIGNES AVANT DE RENDRE LA MAIN. Si l ecriture
  // echouait, le lot serait paye et introuvable.
  const ids = lignes.map(function (l: any) { return l.id; });
  const { error: errMarque } = await supabase
    .from(table)
    .update({ dropcontact_lot: String(lot), dropcontact_le: new Date().toISOString() })
    .in("id", ids);

  if (errMarque) {
    return {
      table: table,
      erreur: "lot envoye mais non marque : " + errMarque.message,
      lot: lot,
      avertissement: "NOTER CET IDENTIFIANT : le credit est consomme",
    };
  }

  return { table: table, envoyees: lignes.length, lot: String(lot) };
}

// ─────────────────────────────────────────────────────────────────────
// MODE RELEVE.
// ─────────────────────────────────────────────────────────────────────
async function relever(nom: string): Promise<any> {
  const table = TABLES[nom];

  // Les lots en attente, du plus ancien au plus recent.
  const { data: enAttente } = await supabase
    .from(table)
    .select("dropcontact_lot")
    .not("dropcontact_lot", "is", null)
    .is("email", null)
    .order("dropcontact_le", { ascending: true })
    .limit(500);

  if (!enAttente || enAttente.length === 0) {
    return { table: table, info: "aucun lot en attente" };
  }

  const lots: string[] = [];
  for (const l of enAttente) {
    const v = String(l.dropcontact_lot);
    if (lots.indexOf(v) < 0) lots.push(v);
  }

  const resultats: any[] = [];

  for (const lot of lots) {
    let reponse: any = null;
    try {
      const r = await fetch(API_RELEVE + encodeURIComponent(lot), {
        headers: { "X-Access-Token": cle() },
      });
      const texte = await r.text();
      try { reponse = JSON.parse(texte); }
      catch {
        resultats.push({ lot: lot, erreur: "reponse illisible" });
        continue;
      }
      if (!r.ok) {
        resultats.push({ lot: lot, erreur: "HTTP " + r.status });
        continue;
      }
    } catch (e: any) {
      resultats.push({ lot: lot, erreur: String(e && e.message ? e.message : e) });
      continue;
    }

    // ⚠️ TANT QUE LE TRAITEMENT N EST PAS FINI, Dropcontact repond sans
    // donnees. On ne touche a rien et on reviendra.
    if (!reponse || reponse.success !== true || !reponse.data) {
      resultats.push({
        lot: lot,
        info: "pas encore pret",
        reason: reponse ? reponse.reason : null,
      });
      continue;
    }

    let ecrites = 0;
    let sansEmail = 0;

    for (const d of reponse.data) {
      const siren = propre(d.siren);
      if (!siren) { sansEmail++; continue; }

      // L adresse : Dropcontact rend une liste, la premiere est la
      // meilleure. ⚠️ ON NE PREND QUE CELLES QU IL DIT FIABLES.
      let email: string | null = null;
      if (Array.isArray(d.email) && d.email.length > 0) {
        const premier = d.email[0];
        if (premier && premier.email) email = String(premier.email).trim().toLowerCase();
      } else if (typeof d.email === "string") {
        email = d.email.trim().toLowerCase();
      }

      const site = propre(d.website) || propre(d.company_website);
      const tel = propre(d.phone);
      const li = propre(d.linkedin);

      if (!email && !site && !tel && !li) { sansEmail++; continue; }

      const maj: any = { statut: email ? "enrichi" : "sans_email" };
      if (email) maj.email = email;
      if (site) maj.site_web = site;
      if (tel) maj.telephone = tel;
      if (li) maj.linkedin = li;

      const { error } = await supabase
        .from(table).update(maj).eq("siren", siren);

      if (!error && email) ecrites++;
    }

    // 🚨 LES LIGNES DU LOT QUI N ONT RIEN DONNE NE DOIVENT PAS RESTER EN
    // ATTENTE INDEFINIMENT. On les marque, sinon la releve les reprendrait
    // a chaque passage.
    await supabase
      .from(table)
      .update({ statut: "sans_email" })
      .eq("dropcontact_lot", lot)
      .is("email", null)
      .eq("statut", "a_enrichir");

    resultats.push({ lot: lot, adresses_trouvees: ecrites, sans_resultat: sansEmail });
  }

  return { table: table, lots: resultats };
}

// ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;

  if (p.get("compter") === "1") {
    return NextResponse.json({
      mode: "mesure, aucun credit consomme",
      cle_presente: cle() !== "",
      lot_par_envoi: LOT,
      tables: await mesurer(),
    });
  }

  if (!cle()) {
    return NextResponse.json(
      { erreur: "DROPCONTACT_API_KEY absente de Vercel" }, { status: 500 });
  }

  // Une table precise peut etre demandee : ?table=ecommerce
  const demandee = (p.get("table") || "").trim();
  if (demandee !== "" && !TABLES[demandee]) {
    return NextResponse.json(
      { erreur: "table inconnue", possibles: ORDRE }, { status: 400 });
  }
  const aTraiter = demandee !== "" ? [demandee] : ORDRE;

  // 🚨 LA RELEVE EN PREMIER, TOUJOURS. Relever avant d envoyer libere les
  // lignes du lot precedent et evite d empiler des lots en attente.
  if (p.get("relever") === "1") {
    const out: any[] = [];
    for (const nom of aTraiter) out.push(await relever(nom));
    return NextResponse.json({ mode: "releve", resultats: out });
  }

  if (p.get("envoyer") === "1") {
    // ⚠️ UNE SEULE TABLE PAR ENVOI, la premiere qui a du travail. Envoyer
    // sur les deux consommerait deux lots dans le meme appel.
    for (const nom of aTraiter) {
      const r = await envoyer(nom);
      if (!r.info) return NextResponse.json({ mode: "envoi", resultat: r });
    }
    return NextResponse.json({ mode: "envoi", info: "rien a envoyer nulle part" });
  }

  return NextResponse.json({
    erreur: "preciser ?envoyer=1, ?relever=1 ou ?compter=1",
  }, { status: 400 });
}
