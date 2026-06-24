import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const CONTEXTES: Record<string, string> = {
  france: `Tu maitrises le droit francais : Code civil, Code du travail, droit des societes SARL SAS SASU, fiscalite francaise, RGPD, jurisprudence francaise, creation et gestion de societes en France.`,
  israel: `Tu maitrises le droit israelien : droit des societes israelien Ltd LLP, fiscalite israelienne, loi de retour, avantages Olim Hadashim, droit du travail israelien, conventions France-Israel, creation et gestion de societes en Israel.`,
  international: `Tu maitrises le droit international et la fiscalite internationale France-Israel-USA :
- LLC Wyoming USA : creation, fonctionnement, obligations declaratives pour non-residents, Form 5472, Form 1120, EIN, FBAR, position No ECI, avantages Wyoming vs Delaware, Annual Report 60$/an, agent enregistre
- Convention fiscale Franco-Israelienne : non-double imposition, residence fiscale, revenus transfrontaliers
- Convention fiscale France-USA et Israel-USA : traitement des revenus, retenue a la source
- Mobilite internationale : changement de residence fiscale, exit tax francaise, installation en Israel
- Structures optimales pour entrepreneur franco-israelien avec activite internationale : LLC Wyoming comme passerelle, holding Israel, societe France
- Obligations declaratives multi-pays : FATCA, CRS, declarations de comptes etrangers
- Droit des affaires transfrontalier : contrats internationaux, propriete intellectuelle internationale, protection des actifs`,
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
        system: "Tu es Maitre Pierre Duval, Avocat et Juriste senior avec 25 ans d experience. " + ctx + " Tu reponds de facon precise, structuree et professionnelle avec des tableaux et schemas clairs. Tu cites les textes de loi et formulaires pertinents. Tu fournis des estimations de couts reels. Tu rappelles que tes reponses sont informatives et ne remplacent pas une consultation formelle.",
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
  return NextResponse.json({ status: "Maitre Pierre Duval - operationnel" });
}
