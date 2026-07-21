import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Libelle lisible du canal de depot
function canalLabel(c: string): string {
  const map: Record<string, string> = {
    portail: "depot sur le portail",
    fax: "depot par fax",
    courrier: "depot par courrier",
    email: "envoi par email",
    interne: "action interne",
  };
  return map[c] || c;
}

function corps(rows: any[]): string {
  let html = "Bonjour,<br/><br/>Rappel de vos echeances de compliance a venir :<br/><br/>";
  html += "<table border=\"1\" cellpadding=\"6\" cellspacing=\"0\">";
  html += "<tr><th>Echeance</th><th>Date</th><th>Dans</th><th>Canal</th><th>Montant</th></tr>";
  for (const r of rows) {
    const montant = r.amount_due ? (r.amount_due + " " + (r.currency || "")) : "-";
    html += "<tr>"
      + "<td>" + r.title + "</td>"
      + "<td>" + r.due_date + "</td>"
      + "<td>J-" + r.days_before + "</td>"
      + "<td>" + canalLabel(r.channel) + "</td>"
      + "<td>" + montant + "</td>"
      + "</tr>";
  }
  html += "</table><br/>";
  html += "Pensez a preparer les documents correspondants.<br/><br/>AcademIA Pro - Module Compliance";
  return html;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  try {
    // Appel de la fonction SQL : echeances a rappeler aujourd'hui
    const { data: rows, error } = await supabase.rpc("compliance_due_reminders");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun rappel aujourd'hui" });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "AcademIA Pro <contact@hebrewproai.com>",
        to: ["contact@academiapro.fr"],
        subject: "Rappel compliance - " + rows.length + " echeance(s) a venir",
        html: corps(rows),
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: "Envoi Resend echoue: " + t }, { status: 500 });
    }

    return NextResponse.json({ success: true, rappels: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 });
  }
}
