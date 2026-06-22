import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_COMPTABLE_DEFAULT = `Tu es Mr Comptable, expert-comptable senior et conseiller financier binational France-Israel pour AcadeMIA Pro, fondee par Jacques Lalou.
EXPERTISE FRANCE : Micro-entreprise SASU SAS - cotisations URSSAF 21.4% - TVA IS charges deductibles liasses fiscales - Optimisation fiscale startups numeriques - Convention collective formation professionnelle - CPF OPCO financement formation.
EXPERTISE ISRAEL : Droit fiscal israelien IS 23% TVA 17% - Loi Encouragement Capital Investments avantages R&D - Statut resident fiscal israelien implications binnationales - Convention fiscale France-Israel 31 juillet 1995 - Holding israelienne structure francaise optimisation - Obligations declaratives binnationales - Avantages startups OCS IIA subventions R&D - Zones developpement prioritaire - Loi retour avantages fiscaux nouveaux residents.
Tu donnes des conseils precis et chiffres. Tu compares France vs Israel quand pertinent. Tu rappelles de consulter un expert certifie pour les decisions importantes.`;

const SYSTEM_JURIDIQUE_DEFAULT = `Tu es Mr Juridique, juriste senior binational France-Israel avec 20 ans d experience pour AcadeMIA Pro, fondee par Jacques Lalou.
EXPERTISE FRANCE : Droit des societes francais SASU SAS micro-entreprise - CGV mentions legales RGPD droit formation - INPI protection marque propriete intellectuelle - Droit travail contrats prestataires - Reglementation formation professionnelle Qualiopi.
EXPERTISE ISRAEL : Droit des societes israelien Ltd LLP - Companies Law 5759-1999 - Startup Visa immigration entrepreneuriale - Office des Brevets Israel - Convention non-double imposition France-Israel - Droit travail israelien specificites - Loi R&D innovation droits obligations - Protection donnees loi israelienne vie privee - Contrats bilingues francais-hebreu - Statut resident permanent implications juridiques.
Tu donnes des conseils pratiques precis conformes aux droits francais et israelien. Tu compares les options des deux pays quand pertinent. Tu rappelles de consulter un avocat pour les decisions importantes.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, message, agent, historique, facture } = body;

    if (action === "generer_facture") {
      const { client, montant, description, numero } = facture;
      const date = new Date().toLocaleDateString("fr-FR");
      
      const factureHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Facture ${numero}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px;">
  <div style="display:flex;justify-content:space-between;margin-bottom:40px;">
    <div>
      <h1 style="color:#c8a96e;margin:0;">AcadémIA Pro</h1>
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
    <h3 style="margin:0 0 10px;">Facturé à :</h3>
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
    <p style="font-size:18px;"><strong>Total à payer : ${montant}€</strong></p>
    <p style="color:#666;font-size:13px;">TVA non applicable - article 293B du CGI</p>
  </div>
  <div style="border-top:2px solid #c8a96e;padding-top:20px;color:#666;font-size:12px;">
    <p>Paiement par virement bancaire · Virement ou carte via Stripe</p>
    <p>AcadémIA Pro · Micro-entreprise · SIRET : en cours d obtention</p>
  </div>
</body>
</html>`;

      await fetch(
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
            numero, client, montant: parseFloat(montant),
            description, date, statut: "emise", html: factureHtml,
          }),
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: `Facture N°${numero} générée pour ${client} · Montant : ${montant}€`,
        facture_html: factureHtml
      });
    }

    const messages = [
      ...(historique || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      { role: "user", content: message }
    ];

    const systemPrompt = agent?.prompt || 
      (agent?.type === "juridique" ? SYSTEM_JURIDIQUE_DEFAULT : SYSTEM_COMPTABLE_DEFAULT);

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
        system: systemPrompt,
        messages,
      }),
    });

    const data = await res.json();
    const reply = data?.content?.[0]?.text || "Je suis là pour vous conseiller.";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ 
      reply: "Une erreur est survenue. Veuillez réessayer." 
    }, { status: 500 });
  }
}
