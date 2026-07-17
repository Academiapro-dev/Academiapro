import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PALIERS = [
  { niveau: 3, jours: 30, sujet: "Mise en demeure amiable - Facture {NUM}" },
  { niveau: 2, jours: 15, sujet: "Relance - Facture {NUM} en attente de reglement" },
  { niveau: 1, jours: 7, sujet: "Rappel - Facture {NUM}" },
];

function corps(niveau: number, f: any): string {
  const intro = "Bonjour " + (f.client_nom || "") + ",<br/><br/>";
  const detail = "Facture <b>" + f.numero + "</b> du " + f.date_emission
    + " - montant : <b>" + f.montant_ttc + " " + (f.devise || "EUR") + "</b>.<br/><br/>";
  if (niveau === 1) {
    return intro + "Sauf erreur de notre part, la facture suivante reste en attente de reglement :<br/><br/>"
      + detail + "Si le reglement a deja ete effectue, merci de ne pas tenir compte de ce message.<br/><br/>"
      + "Bien cordialement,<br/>AcademIA Pro LLC";
  }
  if (niveau === 2) {
    return intro + "Malgre notre precedent rappel, la facture suivante demeure impayee :<br/><br/>"
      + detail + "Nous vous remercions de proceder au reglement sous 8 jours.<br/><br/>"
      + "Bien cordialement,<br/>AcademIA Pro LLC";
  }
  return intro + "Malgre nos relances, la facture suivante demeure impayee :<br/><br/>"
    + detail + "Sans reglement sous 8 jours, nous nous reservons le droit d engager toute procedure de recouvrement utile.<br/><br/>"
    + "La presente vaut mise en demeure au sens de l article 1344 du Code civil francais.<br/><br/>"
    + "AcademIA Pro LLC";
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  try {
    const { data: factures } = await supabase.from("factures")
      .select("*")
      .neq("statut_paiement", "payee")
      .eq("est_avoir", false);

    const traites: string[] = [];
    const sautes: string[] = [];

    for (const f of factures || []) {
      const anciennete = Math.floor((Date.now() - new Date(f.date_emission).getTime()) / 86400000);
      const relances = Array.isArray(f.relances) ? f.relances : [];
      const niveauxFaits = relances.map((r: any) => r.niveau);

      const palier = PALIERS.find(p => anciennete >= p.jours && !niveauxFaits.includes(p.niveau));
      if (!palier) continue;

      if (!f.client_email) {
        sautes.push(f.numero + " (email manquant)");
        continue;
      }

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "AcademIA Pro <contact@hebrewproai.com>",
          to: [f.client_email],
          bcc: ["contact@academiapro.fr"],
          subject: palier.sujet.replace("{NUM}", f.numero),
          html: corps(palier.niveau, f),
        }),
      });
      if (!r.ok) {
        sautes.push(f.numero + " (erreur envoi)");
        continue;
      }

      relances.push({ niveau: palier.niveau, date: new Date().toISOString().slice(0, 10) });
      await supabase.from("factures").update({ relances }).eq("id", f.id);
      traites.push(f.numero + " (niveau " + palier.niveau + ")");

      if (palier.niveau === 3) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "AcademIA Alerte <contact@hebrewproai.com>",
            to: ["contact@academiapro.fr"],
            subject: "ALERTE - Facture " + f.numero + " a J+30 impaye",
            html: "La facture " + f.numero + " (" + f.client_nom + ", " + f.montant_ttc + " " + (f.devise || "EUR") + ") a recu sa mise en demeure. Suivi manuel recommande.",
          }),
        });
      }
    }

    return NextResponse.json({ success: true, traites, sautes });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
