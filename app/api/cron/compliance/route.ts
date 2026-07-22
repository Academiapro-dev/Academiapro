import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function corps(rows: any[], nomSociete: string): string {
  let html = "Bonjour,<br/><br/>Rappel des echeances a venir pour <strong>"
    + nomSociete + "</strong> :<br/><br/>";
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
  html += "Pensez a preparer les documents correspondants.<br/><br/>Mr. Compliance";
  return html;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const journal: string[] = [];

  try {
    // Echeances a rappeler aujourd'hui, TOUS clients confondus
    const { data: rows, error } = await supabase.rpc("compliance_due_reminders");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun rappel aujourd'hui" });
    }

    // ---- REGROUPEMENT PAR CLIENT ----
    const parTenant: Record<string, any[]> = {};
    for (const r of rows) {
      const t = r.tenant_id;
      if (!t) {
        journal.push("Echeance sans tenant_id ignoree : " + (r.title || "sans titre"));
        continue;
      }
      if (!parTenant[t]) parTenant[t] = [];
      parTenant[t].push(r);
    }

    const tenantIds = Object.keys(parTenant);
    if (tenantIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucune echeance rattachee a un client",
        journal,
      });
    }

    // Nom de chaque societe, pour personnaliser le message
    const { data: societes } = await supabase
      .from("compliance_tenants")
      .select("tenant_id, legal_name, label")
      .in("tenant_id", tenantIds)
      .limit(500);

    const nomParTenant: Record<string, string> = {};
    for (const s of societes || []) {
      nomParTenant[s.tenant_id] = s.legal_name || s.label || "votre societe";
    }

    // Adresse email du proprietaire de chaque societe
    const { data: membres } = await supabase
      .from("compliance_membres")
      .select("tenant_id, user_id")
      .in("tenant_id", tenantIds)
      .eq("actif", true)
      .eq("role", "proprietaire")
      .limit(500);

    const emailParTenant: Record<string, string> = {};
    for (const m of membres || []) {
      try {
        const { data: compte } = await supabase.auth.admin.getUserById(m.user_id);
        const adresse = compte?.user?.email;
        if (adresse && !emailParTenant[m.tenant_id]) {
          emailParTenant[m.tenant_id] = adresse;
        }
      } catch (e: unknown) {
        journal.push(
          "Lecture du compte " + m.user_id + " impossible : " +
          (e instanceof Error ? e.message : String(e))
        );
      }
    }

    // ---- UN EMAIL PAR CLIENT ----
    let envoyes = 0;
    const echecs: string[] = [];

    for (const t of tenantIds) {
      const destinataire = emailParTenant[t];
      const nom = nomParTenant[t] || "votre societe";

      if (!destinataire) {
        echecs.push("Aucune adresse email pour " + nom);
        continue;
      }

      if (!process.env.RESEND_API_KEY) {
        echecs.push("RESEND_API_KEY absente");
        break;
      }

      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "Mr. Compliance <contact@hebrewproai.com>",
            to: [destinataire],
            subject: "Rappel compliance - " + parTenant[t].length + " echeance(s) a venir",
            html: corps(parTenant[t], nom),
          }),
        });

        if (r.ok) {
          envoyes++;
        } else {
          const texte = await r.text();
          echecs.push(nom + " : Resend a refuse (" + texte.slice(0, 200) + ")");
        }
      } catch (e: unknown) {
        echecs.push(
          nom + " : appel a Resend impossible (" +
          (e instanceof Error ? e.message : String(e)) + ")"
        );
      }
    }

    return NextResponse.json({
      success: true,
      nb_echeances: rows.length,
      nb_clients: tenantIds.length,
      emails_envoyes: envoyes,
      echecs,
      journal,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e && e.message ? e.message : e), journal },
      { status: 500 }
    );
  }
}
