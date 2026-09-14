import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LA RELANCE DES ECHEANCES — 14/09.
//
// QUATRE MOMENTS, ET PAS UN DE PLUS :
//   J-3  rappel avant l echeance        — courriel
//   J+1  premier retard                 — courriel
//   J+8  retard installe                — courriel + SMS
//   J+15 dernier rappel automatique     — courriel + SMS
// Au-dela, plus rien : ce qui suit est une mise en demeure, elle se decide
// et se signe, elle ne s automatise pas.
//
// 🚨 LE SMS EST PAYE PAR LE CLIENT QUI SE SERT DU CRM. Il ne part donc
// qu au-dela de huit jours de retard — la ou il sert vraiment — et
// seulement s il reste du credit et un expediteur declare. Sans cela,
// l etape est notee, jamais facturee a vide.
//
// ⚠️ UNE RELANCE PAR ECHEANCE ET PAR PALIER. `relance_le` et `relances`
// portent la trace : un cron qui repasse deux fois dans la journee
// n envoie rien de plus.
//
// ⚠️ UNE ECHEANCE REGLEE N EST JAMAIS RELANCEE, meme partiellement : c est
// le solde restant qui compte, et il figure dans le message.
//
// Appel : /api/cron/echeances?cle=CRON_SECRET · ?essai=1 pour voir sans
// rien envoyer.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const EXPEDITEUR = (process.env.SEQUENCE_EXPEDITEUR || "").trim()
  || "Suivi des règlements <contact@espaces-formations.fr>";

// Les paliers, en jours par rapport a l echeance. Negatif = avant.
const PALIERS = [
  { jours: -3, sms: false, titre: "Votre règlement arrive à échéance" },
  { jours: 1, sms: false, titre: "Règlement en attente" },
  { jours: 8, sms: true, titre: "Règlement toujours en attente" },
  { jours: 15, sms: true, titre: "Dernier rappel" },
];

function autorise(req: NextRequest): boolean {
  const attendu = (process.env.CRON_SECRET || "").trim();
  if (!attendu) return false;
  const entete = req.headers.get("authorization") || "";
  if (entete === "Bearer " + attendu) return true;
  try { return new URL(req.url).searchParams.get("cle") === attendu; } catch (e) { return false; }
}

function euros(n: any): string {
  return (Number(n) || 0).toFixed(2).replace(".", ",") + " EUR";
}
function jourFr(d: any): string {
  try { return new Date(String(d) + "T12:00:00Z").toLocaleDateString("fr-FR"); } catch (e) { return String(d); }
}

// L ecart en jours entre aujourd hui et l echeance. ⚠️ EN TEXTE, PAS EN
// OBJET DATE : `due_le` est une date sans heure ; la convertir la ramene a
// minuit UTC et decale le compte d un jour en heure francaise.
function ecartJours(due: string): number {
  const a = new Date(String(due) + "T12:00:00Z").getTime();
  const d = new Date();
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  return Math.round((b - a) / 86400000);
}

async function envoyerCourriel(dest: string, objet: string, lignes: string[]): Promise<any> {
  const cle = (process.env.RESEND_API_KEY || "").trim();
  if (!cle) return { ok: false, motif: "RESEND_API_KEY absente" };
  const html = '<div style="font-family:Georgia,serif;max-width:560px;color:#1a1a1a;line-height:1.75">'
    + lignes.map(function (l: string) { return "<p>" + l.replace(/</g, "&lt;") + "</p>"; }).join("")
    + "</div>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EXPEDITEUR, to: [dest], subject: objet, html: html }),
    });
    return r.ok ? { ok: true } : { ok: false, motif: "Resend " + r.status };
  } catch (e: any) { return { ok: false, motif: String(e) }; }
}

export async function GET(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ ok: false, erreur: "non autorise" }, { status: 401 });
  const essai = new URL(req.url).searchParams.get("essai") === "1";

  const { data: lignes, error } = await supabase
    .from("organisme_echeances")
    .select("*")
    .is("regle_le", null)
    .order("due_le", { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  if (!lignes || lignes.length === 0) return NextResponse.json({ ok: true, message: "Aucune échéance en attente.", traites: 0 });

  const journal: any[] = [];
  let courriels = 0, sms = 0, ignores = 0;

  for (const l of lignes) {
    const ecart = ecartJours(l.due_le);
    const palier = PALIERS.filter(function (p) { return p.jours === ecart; })[0];
    if (!palier) { ignores++; continue; }

    // ⚠️ DEJA RELANCE AUJOURD HUI : on ne repasse pas. Deux messages le
    // meme jour pour la meme somme, c est ce qui fait perdre un client.
    if (l.relance_le && String(l.relance_le).slice(0, 10) === new Date().toISOString().slice(0, 10)) {
      ignores++; continue;
    }

    const { data: f } = await supabase
      .from("organisme_factures")
      .select("id, numero, destinataire_nom, destinataire_email, montant_ttc")
      .eq("id", l.facture_id).maybeSingle();
    if (!f || !f.destinataire_email) {
      journal.push({ echeance: l.id, etat: "sans adresse" });
      ignores++; continue;
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, email_contact, telephone, sms_expediteur, sms_credits")
      .eq("tenant_id", l.tenant_id).maybeSingle();

    const maison = (org && org.raison_sociale) || "";
    const reste = Math.round(((Number(l.montant) || 0) - (Number(l.montant_regle) || 0)) * 100) / 100;

    const corps = ecart < 0
      ? [
          "Bonjour,",
          "Nous vous rappelons que l'échéance de " + euros(reste) + " concernant la facture "
            + f.numero + " arrive le " + jourFr(l.due_le) + ".",
          "Si le règlement est déjà parti, ce message n'appelle aucune suite.",
          maison ? "Cordialement," : "Cordialement,",
          maison,
        ]
      : [
          "Bonjour,",
          "L'échéance de " + euros(reste) + " concernant la facture " + f.numero
            + " était due le " + jourFr(l.due_le) + " et n'a pas été enregistrée à ce jour.",
          Number(l.montant_regle) > 0
            ? "Un règlement partiel de " + euros(l.montant_regle) + " a bien été reçu ; il reste " + euros(reste) + "."
            : "",
          ecart >= 15
            ? "Sans règlement de votre part, ce dossier sera suivi autrement. Si un différend existe, dites-le-nous : nous préférons en parler."
            : "Si le règlement est déjà parti, ce message n'appelle aucune suite.",
          "Cordialement,",
          maison,
        ].filter(Boolean);

    let resCourriel: any = { ok: true, essai: true };
    if (!essai) resCourriel = await envoyerCourriel(f.destinataire_email, palier.titre + " — facture " + f.numero, corps);
    if (resCourriel.ok) courriels++;

    // ---- LE SMS, AU-DELA DE HUIT JOURS SEULEMENT ----
    let resSms: any = null;
    if (palier.sms) {
      const credits = Number(org && org.sms_credits) || 0;
      const expediteur = (org && org.sms_expediteur) || "";
      if (!expediteur || credits <= 0) {
        resSms = { ok: false, motif: !expediteur ? "aucun expéditeur SMS déclaré" : "crédits SMS épuisés" };
      } else if (essai) {
        resSms = { ok: true, essai: true };
      } else {
        const hote = req.headers.get("host") || "";
        try {
          const rs = await fetch("https://" + hote + "/api/organisme/sms", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-cle-cron": (process.env.CRON_SECRET || "") },
            body: JSON.stringify({
              tenant: l.tenant_id,
              numero: (org && org.telephone) || "",
              texte: "Facture " + f.numero + " : " + euros(reste) + " dus depuis le " + jourFr(l.due_le) + ".",
              origine: "echeance",
            }),
          });
          const ds = await rs.json().catch(function () { return {}; });
          resSms = rs.ok && ds.ok ? { ok: true } : { ok: false, motif: (ds && ds.erreur) || "SMS refusé" };
        } catch (e: any) { resSms = { ok: false, motif: String(e) }; }
      }
      if (resSms && resSms.ok) sms++;
    }

    journal.push({
      echeance: l.id, facture: f.numero, client: f.destinataire_nom,
      palier: palier.jours, reste: reste,
      courriel: resCourriel.ok ? "envoye" : "echec : " + (resCourriel.motif || ""),
      sms: resSms ? (resSms.ok ? "envoye" : "non : " + (resSms.motif || "")) : null,
    });

    if (!essai && resCourriel.ok) {
      await supabase.from("organisme_echeances").update({
        relance_le: new Date().toISOString(),
        relances: (Number(l.relances) || 0) + 1,
      }).eq("id", l.id);
    }
  }

  return NextResponse.json({
    ok: true, essai: essai, examinees: lignes.length,
    courriels: courriels, sms: sms, ignorees: ignores, journal: journal,
  });
}
