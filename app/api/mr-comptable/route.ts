import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const CONTEXTES: Record<string, string> = {
  france: `Tu maitrises la comptabilite et fiscalite francaise :
- Plan Comptable General PCG, normes comptables francaises
- TVA francaise : regimes, declarations CA3 CA12
- Impot sur les societes IS : calcul, liasse fiscale 2050, acomptes
- Charges sociales URSSAF, DSN, cotisations TNS
- Statuts SASU SAS SARL : implications comptables et fiscales
- Regime micro-entrepreneur : plafonds, abattements
- Dividendes, remuneration dirigeant : optimisation France
- Exit tax : calcul et obligations au depart de France
- CFE, CVAE, CET : taxes locales entreprises`,
  israel: `Tu maitrises la comptabilite et fiscalite israelienne :
- Normes comptables israeliennes et IFRS adaptees
- TVA israelienne Maam 17% : declarations mensuelles bimestrielles
- Impot sur les societes israelien Mas Hachnasa : taux 23%, acomptes
- Bituach Leumi securite sociale israelienne : cotisations independants et salaries
- Avantages Olim Hadashim : exemption fiscale 10 ans sur revenus etrangers, details et conditions
- Declaration annuelle Doch Shanti : obligations, delais
- Dividendes en Israel : taux retenue source 25-30%
- Societes israeliennes Ltd : obligations comptables, audit obligatoire
- Incentives investissement : loi encouragement capital, zones prioritaires`,
  international: `Tu maitrises la comptabilite et fiscalite internationale France-Israel-USA :
- LLC Wyoming pour non-residents :
  * Form 5472 : transactions entre associe etranger et LLC, sanctions 25000$
  * Form 1120 : declaration annuelle LLC, position No ECI revenus hors USA
  * EIN : obtention numero fiscal federal
  * FBAR FinCEN 114 : declaration comptes etrangers si solde depasse 10000$
  * FATCA Form 8938 : actifs etrangers contribuables US
  * Annual Report Wyoming : 60$/an obligatoire
  * Agent enregistre Wyoming : 50-150$/an
  * Absence impot federal si revenus hors USA et pas presence physique USA
  * Absence State Tax Wyoming : avantage majeur vs Delaware California
- Convention fiscale Franco-Israelienne 1995 :
  * Non-double imposition sur revenus d activite, dividendes, interets, redevances
  * Credit d impot : mecanismes d elimination double imposition
  * Residence fiscale : criteres, tie-breaker rules
- Comptabilite multi-devises : EUR ILS USD, conversion, ecarts de change
- Prix de transfert : documentation obligatoire transactions intragroupe
- Structure optimale entrepreneur franco-israelien avec LLC Wyoming :
  * LLC Wyoming comme entite de facturation internationale
  * Remuneration optimale entre LLC, societe francaise, societe israelienne
  * Flux financiers : dividendes, management fees, royalties
  * Cout annuel reel LLC Wyoming clients hors USA : 400-800$/an
- CRS Common Reporting Standard : echange automatique informations fiscales
- Planification fiscale legale : optimisation charges entre trois pays`,
};

export async function POST(req: NextRequest) {
  try {
    const { message, contexte = "france", historique = [] } = await req.json();
    const ctx = CONTEXTES[contexte] || CONTEXTES.france;
    const messages = [
      ...historique.map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      })),
      { role: "user", content: message },
    ];
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: "Tu es le Professeur Henri Mercier, Expert Comptable et Fiscaliste senior avec 25 ans d experience France-Israel-USA. " + ctx + " Tu reponds de facon precise, structuree avec des tableaux chiffres et schemas clairs. Tu cites les textes fiscaux, formulaires et montants exacts. Tu fournis des simulations chiffrees. Tu rappelles que tes reponses sont informatives et ne remplacent pas une consultation avec un expert comptable agree.",
        messages,
      }),
    });
    if (!r.ok) return NextResponse.json({ erreur: "Erreur API" }, { status: 500 });
    const data = await r.json();
    return NextResponse.json({ succes: true, reply: data.content[0]?.text || "" });
  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Prof. Henri Mercier - operationnel" });
}
