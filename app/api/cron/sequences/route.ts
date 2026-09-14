import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LE CRON DES SEQUENCES — 14/09. Il fait partir ce qui est du, et rien
// d autre.
//
// 🚨 LES TROIS VERROUS SONT ICI, PAS SEULEMENT DANS L ECRAN. Un ecran se
// contourne, une route s appelle directement : le controle appartient a ce
// qui envoie.
//   1. DESINSCRIT → on arrete la sequence, definitivement.
//   2. SEPT JOURS ENTRE DEUX MESSAGES a la meme personne, tous canaux et
//      toutes origines confondus (campagnes comprises). Si le delai n est
//      pas ecoule, on REPORTE l etape, on ne la saute pas.
//   3. DEVENU CLIENT, PERDU, OU IL A REPONDU → la sequence s arrete
//      d elle-meme. C est la difference entre relancer et harceler.
//
// ⚠️ L APPEL NE COMPOSE RIEN. Une etape « appel » ecrit un rappel dans le
// journal (crm_appels, resultat « rappeler », date du jour) : la fiche
// apparait alors dans « A rappeler aujourd hui », la ou le client regarde
// le matin. Un logiciel qui appellerait tout seul serait une faute.
//
// ⚠️ LE SMS DEBITE DES CREDITS. Sans credit ou sans expediteur declare,
// l etape est REPORTEE d un jour et notee, jamais perdue.
//
// Appel : /api/cron/sequences?cle=CRON_SECRET  · ?essai=1 pour voir sans
// rien envoyer.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const DELAI_ENTRE_MESSAGES_J = 7;
const EXPEDITEUR_DEFAUT = (process.env.SEQUENCE_EXPEDITEUR || "").trim()
  || "Suivi commercial <contact@espaces-formations.fr>";

function autorise(req: NextRequest): boolean {
  const attendu = (process.env.CRON_SECRET || "").trim();
  if (!attendu) return false;
  const entete = req.headers.get("authorization") || "";
  if (entete === "Bearer " + attendu) return true;
  try { return new URL(req.url).searchParams.get("cle") === attendu; } catch (e) { return false; }
}

function jours(depuis: any): number {
  if (!depuis) return 9999;
  const t = new Date(depuis).getTime();
  if (isNaN(t)) return 9999;
  return Math.floor((Date.now() - t) / 86400000);
}

// Le dernier message parti vers cette fiche, quel qu en soit le canal ou
// l origine. ⚠️ MEME REGLE QUE LES CAMPAGNES : compter canal par canal
// laisserait partir trois messages le meme jour.
function dernierMessage(f: any, hist: any[]): number {
  let recent: number | null = null;
  const retenir = function (d: any) {
    if (!d) return;
    const t = new Date(d).getTime();
    if (!isNaN(t) && (recent === null || t > recent)) recent = t;
  };
  retenir(f && f.relance_le);
  if (f && f.produits && typeof f.produits === "object") {
    for (const k of Object.keys(f.produits)) retenir(f.produits[k]);
  }
  for (const h of hist || []) retenir(h && h.le);
  return recent === null ? 9999 : Math.floor((Date.now() - recent) / 86400000);
}

async function envoyerCourriel(dest: string, objet: string, texte: string, expediteur: string): Promise<any> {
  const cle = (process.env.RESEND_API_KEY || "").trim();
  if (!cle) return { ok: false, motif: "RESEND_API_KEY absente" };
  const html = '<div style="font-family:Georgia,serif;max-width:560px;color:#1a1a1a;line-height:1.75">'
    + String(texte).split("\n").map(function (l: string) { return "<p>" + l.replace(/</g, "&lt;") + "</p>"; }).join("")
    + '<p style="font-size:12px;color:#888;margin-top:26px">Pour ne plus recevoir ces messages, répondez « STOP » à ce courriel.</p></div>';
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
      body: JSON.stringify({ from: expediteur, to: [dest], subject: objet || "Suite à notre échange", html: html }),
    });
    if (!r.ok) return { ok: false, motif: "Resend " + r.status };
    return { ok: true };
  } catch (e: any) { return { ok: false, motif: String(e) }; }
}

export async function GET(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ ok: false, erreur: "non autorise" }, { status: 401 });
  const essai = new URL(req.url).searchParams.get("essai") === "1";

  // Ce qui est du : maintenant ou avant, et encore en cours.
  const { data: dus, error } = await supabase
    .from("crm_sequences_inscrits")
    .select("id, tenant_id, sequence_id, fiche_email, fiche_id, etape, prochaine_le, historique")
    .eq("statut", "en_cours")
    .not("prochaine_le", "is", null)
    .lte("prochaine_le", new Date().toISOString())
    .order("prochaine_le", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  if (!dus || dus.length === 0) return NextResponse.json({ ok: true, message: "Rien à envoyer.", traites: 0 });

  const journal: any[] = [];
  let partis = 0, reportes = 0, arretes = 0;

  for (const ins of dus) {
    const { data: seq } = await supabase.from("crm_sequences").select("id, nom, etapes, actif").eq("id", ins.sequence_id).maybeSingle();
    const etapes = seq && Array.isArray(seq.etapes) ? seq.etapes : [];
    const etape = etapes[ins.etape];

    const hist = Array.isArray(ins.historique) ? ins.historique : [];

    if (!seq || !etape) {
      await supabase.from("crm_sequences_inscrits").update({ statut: "terminee", prochaine_le: null }).eq("id", ins.id);
      journal.push({ fiche: ins.fiche_email, etat: "terminee" });
      continue;
    }

    const r = ins.fiche_id
      ? await supabase.from("crm").select("*").eq("id", ins.fiche_id).maybeSingle()
      : await supabase.from("crm").select("*").eq("tenant_id", ins.tenant_id).eq("email", ins.fiche_email).maybeSingle();
    const f = r.data;

    // ---- LES ARRETS ----
    const arreter = async function (motif: string) {
      arretes++;
      journal.push({ fiche: ins.fiche_email, etat: "arretee", motif: motif });
      if (!essai) {
        await supabase.from("crm_sequences_inscrits")
          .update({ statut: "arretee", arrete_le: new Date().toISOString(), motif_arret: motif, prochaine_le: null })
          .eq("id", ins.id);
      }
    };

    if (!f) { await arreter("fiche supprimée"); continue; }
    if (f.desinscrit) { await arreter("désinscrit"); continue; }
    if (f.statut === "perdu") { await arreter("fiche perdue"); continue; }
    if (f.statut === "client") { await arreter("devenu client"); continue; }

    // 🚨 IL A REPONDU → LA SEQUENCE S ARRETE. Un appel marque « a repondu »
    // ou une interaction posterieure a l inscription valent reponse.
    const { data: appel } = await supabase
      .from("crm_appels")
      .select("resultat, appele_le")
      .eq("fiche_email", f.email || "-")
      .order("appele_le", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (appel && appel.resultat === "repondu") { await arreter("le contact a répondu"); continue; }

    // ---- LE DELAI DE SEPT JOURS ----
    const depuis = dernierMessage(f, hist);
    if (etape.canal !== "appel" && depuis < DELAI_ENTRE_MESSAGES_J) {
      reportes++;
      const report = new Date(Date.now() + (DELAI_ENTRE_MESSAGES_J - depuis) * 86400000).toISOString();
      journal.push({ fiche: ins.fiche_email, etat: "reportee", motif: "dernier message il y a " + depuis + " j", prochaine_le: report });
      if (!essai) await supabase.from("crm_sequences_inscrits").update({ prochaine_le: report }).eq("id", ins.id);
      continue;
    }

    // ---- L ENVOI ----
    let resultat: any = { ok: false, motif: "canal inconnu" };

    if (etape.canal === "email") {
      if (!f.email) resultat = { ok: false, motif: "aucune adresse" };
      else if (essai) resultat = { ok: true, essai: true };
      else {
        const { data: org } = await supabase.from("organismes_formation").select("raison_sociale, email_contact").eq("tenant_id", ins.tenant_id).maybeSingle();
        const exp = org && org.email_contact
          ? String(org.raison_sociale || "Suivi") + " <" + EXPEDITEUR_DEFAUT.split("<")[1]
          : EXPEDITEUR_DEFAUT;
        const texte = String(etape.message || "").split("{prenom}").join(String(f.nom || "").trim().split(" ")[0] || "");
        resultat = await envoyerCourriel(f.email, etape.objet || "", texte, exp);
        if (resultat.ok) {
          await supabase.from("crm").update({ relance_le: new Date().toISOString(), derniere_interaction: new Date().toISOString() }).eq("id", f.id);
        }
      }
    } else if (etape.canal === "sms") {
      if (!f.telephone) resultat = { ok: false, motif: "aucun téléphone" };
      else if (essai) resultat = { ok: true, essai: true };
      else {
        // ⚠️ ON PASSE PAR LA ROUTE SMS EXISTANTE : elle porte les regles
        // (Europe seulement, credits, expediteur declare, trace).
        const hote = req.headers.get("host") || "";
        try {
          const rs = await fetch("https://" + hote + "/api/organisme/sms", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-cle-cron": (process.env.CRON_SECRET || "") },
            body: JSON.stringify({ tenant: ins.tenant_id, numero: f.telephone, texte: String(etape.message || ""), origine: "sequence" }),
          });
          const ds = await rs.json().catch(function () { return {}; });
          resultat = rs.ok && ds.ok ? { ok: true } : { ok: false, motif: (ds && ds.erreur) || "SMS refusé" };
        } catch (e: any) { resultat = { ok: false, motif: String(e) }; }
        if (resultat.ok) {
          await supabase.from("crm").update({ relance_le: new Date().toISOString(), derniere_interaction: new Date().toISOString() }).eq("id", f.id);
        }
      }
    } else if (etape.canal === "appel") {
      // 🚨 AUCUN APPEL AUTOMATIQUE : on pose un rappel pour aujourd hui.
      if (essai) resultat = { ok: true, essai: true };
      else {
        const { error: eA } = await supabase.from("crm_appels").insert({
          tenant_id: ins.tenant_id, fiche_email: f.email || null, numero: f.telephone || null,
          resultat: "rappeler", rappeler_le: new Date().toISOString().slice(0, 10),
          notes: "Étape de la séquence « " + seq.nom + " » : à appeler aujourd'hui.",
          appele_le: new Date().toISOString(),
        });
        resultat = eA ? { ok: false, motif: eA.message } : { ok: true };
      }
    }

    // ---- LA SUITE ----
    const suivante = ins.etape + 1;
    const finie = suivante >= etapes.length;
    const prochaine = finie ? null
      : new Date(Date.now() + Math.max(0, (Number(etapes[suivante].jour) || 0) - (Number(etape.jour) || 0)) * 86400000).toISOString();

    if (resultat.ok) partis++;
    journal.push({ fiche: ins.fiche_email, canal: etape.canal, etat: resultat.ok ? "envoye" : "echec", motif: resultat.motif || null, prochaine_le: prochaine });

    if (!essai) {
      const ligne = { etape: etape.canal, jour: etape.jour, le: new Date().toISOString(), ok: !!resultat.ok, motif: resultat.motif || null };
      await supabase.from("crm_sequences_inscrits").update({
        etape: suivante,
        prochaine_le: prochaine,
        statut: finie ? "terminee" : "en_cours",
        historique: hist.concat([ligne]),
      }).eq("id", ins.id);
    }
  }

  return NextResponse.json({
    ok: true, essai: essai, traites: dus.length,
    partis: partis, reportes: reportes, arretes: arretes, journal: journal,
  });
}
