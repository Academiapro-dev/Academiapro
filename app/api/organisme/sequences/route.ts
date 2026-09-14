import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES SEQUENCES DE RELANCE MULTICANAL — 14/09.
//
// CE QUE C EST : une suite d etapes datees en jours — courriel a J0, SMS a
// J+3, rappel d appel a J+7 — que le client applique a UN prospect ou a
// quelques-uns. Le cron fait partir ce qui est du. Des que la personne
// repond, la sequence s arrete d elle-meme.
//
// 🚨 RIEN NE PART SUR TOUTE LA BASE. Le client INSCRIT lui-meme les fiches
// qu il veut suivre : c est la difference entre une relance et du
// harcelement, et c est ce que Jacques a valide le 14/09.
//
// 🚨 LES TROIS VERROUS EXISTANTS S APPLIQUENT, sans exception :
//   1. seulement les prospects venus D EUX-MEMES (formulaire, webinaire,
//      chat, recommandation) — une liste importee n entre pas ;
//   2. JAMAIS deux messages a la meme personne en moins de SEPT JOURS,
//      tous canaux confondus (meme regle que les campagnes) ;
//   3. un desinscrit ne recoit plus rien, ni courriel ni SMS.
// ⚠️ CES VERROUS SONT DANS LE CRON, PAS SEULEMENT ICI : un ecran se
// contourne, une route s appelle directement. Le controle appartient a ce
// qui envoie.
//
// ⚠️ L APPEL N EST JAMAIS AUTOMATIQUE. Une etape « appel » ne compose
// rien : elle pose un rappel dans « A rappeler aujourd hui », la ou le
// client regarde le matin. Un logiciel qui appellerait tout seul a la
// place de quelqu un serait une faute.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const CANAUX = ["email", "sms", "appel"];

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

// Les etapes, nettoyees et remises dans l ordre des jours. Deux etapes le
// meme jour et sur le meme canal n auraient aucun sens : on garde la
// premiere.
function etapesPropres(brut: any): any[] {
  if (!Array.isArray(brut)) return [];
  const vues: any = {};
  const sortie: any[] = [];
  for (const e of brut) {
    const canal = String((e && e.canal) || "").toLowerCase();
    if (CANAUX.indexOf(canal) < 0) continue;
    const jour = Math.max(0, Math.min(365, Number(e && e.jour) || 0));
    const cle = canal + "@" + jour;
    if (vues[cle]) continue;
    vues[cle] = true;
    sortie.push({
      canal: canal,
      jour: jour,
      objet: propre(e && e.objet, 160) || null,
      message: propre(e && e.message, 4000) || null,
    });
  }
  sortie.sort(function (a, b) { return a.jour - b.jour; });
  return sortie;
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const url = new URL(req.url);

  // Les inscrits d une sequence : qui la suit, ou il en est, ce qui est parti.
  if (url.searchParams.get("vue") === "inscrits") {
    const seq = String(url.searchParams.get("sequence") || "").trim();
    let q = supabase
      .from("crm_sequences_inscrits")
      .select("id, sequence_id, fiche_email, fiche_id, etape, prochaine_le, statut, motif_arret, historique, inscrit_le")
      .eq("tenant_id", tenant)
      .order("prochaine_le", { ascending: true })
      .limit(1000);
    if (seq) q = q.eq("sequence_id", seq);
    const { data, error } = await q;
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, inscrits: data || [] });
  }

  const { data, error } = await supabase
    .from("crm_sequences")
    .select("id, nom, description, etapes, actif, updated_at")
    .eq("tenant_id", tenant)
    .order("nom");

  if (error) return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });

  // Le nombre de personnes en cours dans chaque sequence : c est ce qu on
  // regarde avant d en lancer une nouvelle.
  const { data: encours } = await supabase
    .from("crm_sequences_inscrits")
    .select("sequence_id, statut")
    .eq("tenant_id", tenant)
    .limit(5000);

  const compte: any = {};
  for (const i of encours || []) {
    if (!compte[i.sequence_id]) compte[i.sequence_id] = { en_cours: 0, terminees: 0, arretees: 0 };
    if (i.statut === "en_cours") compte[i.sequence_id].en_cours++;
    else if (i.statut === "terminee") compte[i.sequence_id].terminees++;
    else compte[i.sequence_id].arretees++;
  }

  return NextResponse.json({ ok: true, sequences: data || [], compteurs: compte, canaux: CANAUX });
}

export async function POST(req: NextRequest) {
  const tenant = tenantDeSession();
  const email = emailDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });
  const action = String(b.action || "creer");

  // ---- CREER OU MODIFIER UNE SEQUENCE ----
  if (action === "creer" || action === "modifier") {
    const nom = propre(b.nom, 120);
    if (nom.length < 2) return NextResponse.json({ ok: false, erreur: "Donnez un nom à la séquence." }, { status: 400 });

    const etapes = etapesPropres(b.etapes);
    if (etapes.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Ajoutez au moins une étape : un canal et un jour." }, { status: 400 });
    }
    // ⚠️ UN COURRIEL OU UN SMS SANS TEXTE NE PEUT RIEN ENVOYER. On le dit
    // ici plutot que de laisser le cron echouer en silence dans trois jours.
    for (const e of etapes) {
      if (e.canal !== "appel" && !e.message) {
        return NextResponse.json({ ok: false, erreur: "L'étape " + e.canal + " du jour " + e.jour + " n'a pas de message." }, { status: 400 });
      }
    }

    const ligne: any = {
      tenant_id: tenant, nom: nom,
      description: propre(b.description, 500) || null,
      etapes: etapes, actif: true, updated_at: new Date().toISOString(),
    };

    const id = propre(b.id, 60);
    if (id) {
      const { data, error } = await supabase.from("crm_sequences").update(ligne).eq("id", id).eq("tenant_id", tenant).select("id, nom, etapes").maybeSingle();
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, sequence: data, message: "Séquence enregistrée — " + etapes.length + " étape(s)." });
    }

    ligne.cree_par = email || null;
    const { data, error } = await supabase.from("crm_sequences").insert(ligne).select("id, nom, etapes").maybeSingle();
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, sequence: data, message: "Séquence créée — " + etapes.length + " étape(s)." });
  }

  if (action === "desactiver" || action === "reactiver") {
    const id = propre(b.id, 60);
    const { error } = await supabase.from("crm_sequences").update({ actif: action === "reactiver", updated_at: new Date().toISOString() }).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: action === "reactiver" ? "Séquence remise en service." : "Séquence arrêtée : aucune nouvelle inscription." });
  }

  // ---- INSCRIRE DES FICHES ----
  //
  // 🚨 LES REFUS SONT DITS UN PAR UN, avec leur motif. Inscrire trente
  // fiches et n en voir partir que douze sans savoir pourquoi rendrait
  // l outil incomprehensible.
  if (action === "inscrire") {
    const sequenceId = propre(b.sequence_id, 60);
    const fiches: string[] = Array.isArray(b.fiches) ? b.fiches.map(function (x: any) { return String(x); }) : [];
    if (!sequenceId || fiches.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Séquence ou fiches non précisées." }, { status: 400 });
    }

    const { data: seq } = await supabase.from("crm_sequences").select("id, nom, etapes, actif").eq("id", sequenceId).eq("tenant_id", tenant).maybeSingle();
    if (!seq) return NextResponse.json({ ok: false, erreur: "Séquence introuvable." }, { status: 404 });
    if (!seq.actif) return NextResponse.json({ ok: false, erreur: "Cette séquence est arrêtée." }, { status: 409 });

    const etapes = Array.isArray(seq.etapes) ? seq.etapes : [];
    if (etapes.length === 0) return NextResponse.json({ ok: false, erreur: "Cette séquence n'a aucune étape." }, { status: 409 });

    const inscrits: any[] = [];
    const refuses: any[] = [];

    for (const cle of fiches) {
      const parEmail = cle.indexOf("@") > 0;
      const r = parEmail
        ? await supabase.from("crm").select("*").eq("tenant_id", tenant).eq("email", cle.toLowerCase()).maybeSingle()
        : await supabase.from("crm").select("*").eq("tenant_id", tenant).eq("id", cle).maybeSingle();
      const f = r.data;

      if (!f) { refuses.push({ cle: cle, motif: "Fiche introuvable" }); continue; }
      if (f.desinscrit) { refuses.push({ cle: cle, motif: "Désinscrit — ne reçoit plus de messages" }); continue; }
      if (f.statut === "perdu" || f.statut === "client") { refuses.push({ cle: cle, motif: "Fiche " + f.statut }); continue; }

      // ⚠️ UNE SEQUENCE A LA FOIS PAR FICHE. Deux sequences en parallele
      // enverraient deux messages le meme jour a la meme personne.
      const { data: deja } = await supabase
        .from("crm_sequences_inscrits")
        .select("id, sequence_id")
        .eq("tenant_id", tenant)
        .eq("statut", "en_cours")
        .or("fiche_id.eq." + (f.id || "00000000-0000-0000-0000-000000000000") + ",fiche_email.eq." + (f.email || "-"))
        .limit(1)
        .maybeSingle();
      if (deja) { refuses.push({ cle: cle, motif: "Déjà dans une séquence en cours" }); continue; }

      const premier = etapes[0];
      const prochaine = new Date(Date.now() + (Number(premier.jour) || 0) * 86400000).toISOString();

      const { error } = await supabase.from("crm_sequences_inscrits").insert({
        tenant_id: tenant, sequence_id: sequenceId,
        fiche_email: f.email || null, fiche_id: f.id || null,
        etape: 0, prochaine_le: prochaine, statut: "en_cours",
        historique: [],
      });

      if (error) refuses.push({ cle: cle, motif: error.message });
      else inscrits.push({ cle: cle, nom: f.nom || f.email, prochaine_le: prochaine });
    }

    return NextResponse.json({
      ok: true, inscrits: inscrits, refuses: refuses,
      message: inscrits.length + " fiche(s) inscrite(s)" + (refuses.length > 0 ? ", " + refuses.length + " écartée(s)." : "."),
    });
  }

  // ---- ARRETER POUR UNE FICHE ----
  //
  // 🚨 ON ARRETE, ON NE SUPPRIME PAS. L historique de ce qui est parti doit
  // rester : c est lui qui prouve qu on n a pas harcele quelqu un.
  if (action === "arreter") {
    const id = propre(b.id, 60);
    const motif = propre(b.motif, 200) || "arrêt manuel";
    const { error } = await supabase
      .from("crm_sequences_inscrits")
      .update({ statut: "arretee", arrete_le: new Date().toISOString(), motif_arret: motif, prochaine_le: null })
      .eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Séquence arrêtée pour cette fiche." });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
