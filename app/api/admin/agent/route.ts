import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, message, agent, historique, facture } = body;

    // Action : generer une facture
    if (action === "generer_facture") {
      const { client, montant, description, numero } = facture;
      const date = new Date().toLocaleDateString("fr-FR");
      
      const factureHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Facture ${numero}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;">
  <div style="display:flex;justify-content:space-between;margin-bottom:40px;">
    <div>
      <h1 style="color:#c8a96e;margin:0;">AcadémIA Pro</h1>
      <p style="color:#666;margin:5px 0;">contact@academiapro.fr</p>
      <p style="color:#666;margin:5px 0;">academiapro.fr</p>
    </div>
    <div style="text-align:right;">
      <h2 style="margin:0;">FACTURE</h2>
      <p style="color:#666;">N° ${numero}</p>
      <p style="color:#666;">Date : ${date}</p>
    </div>
  </div>
  <div style="margin-bottom:30px;padding:20px;background:#f8f8f8;border-radius:8px;">
    <h3 style="margin:0 0 10px;">Facturé à :</h3>
    <p style="margin:0;">${client}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
    <tr style="background:#050508;color:#fff;">
      <th style="padding:12px;text-align:left;">Description</th>
      <th style="padding:12px;text-align:right;">Montant HT</th>
      <th style="padding:12px;text-align:right;">TVA</th>
      <th style="padding:12px;text-align:right;">Total TTC</th>
    </tr>
    <tr style="border-bottom:1px solid #ddd;">
      <td style="padding:12px;">${description}</td>
      <td style="padding:12px;text-align:right;">${montant}€</td>
      <td style="padding:12px;text-align:right;">Non applicable (micro-entreprise)</td>
      <td style="padding:12px;text-align:right;">${montant}€</td>
    </tr>
  </table>
  <div style="text-align:right;margin-bottom:30px;">
    <p style="font-size:18px;"><strong>Total à payer : ${montant}€</strong></p>
    <p style="color:#666;font-size:13px;">TVA non applicable - article 293B du CGI</p>
  </div>
  <div style="border-top:2px solid #c8a96e;padding-top:20px;color:#666;font-size:12px;">
    <p>Paiement par virement bancaire · Virement ou carte via Stripe</p>
    <p>AcadémIA Pro · Micro-entreprise · SIRET : en cours d obtention</p>
  </div>
</body>
</html>`;

      // Sauvegarder dans Supabase
      const supabaseRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/factures`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            numero,
            client,
            montant: parseFloat(montant),
            description,
            date,
            statut: "emise",
            html: factureHtml,
          }),
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: `Facture N°${numero} générée pour ${client} · Montant : ${montant}€`,
        facture_html: factureHtml
      });
    }

    // Action : conversation normale
    const messages = [
      ...(historique || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: agent?.prompt || "Tu es Mr Comptable, expert-comptable senior pour AcadémIA Pro.",
        messages: messages,
      }),
    });

    const data = await res.json();
    const reply = data?.content?.[0]?.text || "Je suis là pour vous conseiller.";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ 
      reply: "Une erreur est survenue. Veuillez réessayer." 
    }, { status: 500 });
  }
}
