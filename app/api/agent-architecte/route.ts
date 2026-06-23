import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

const EXPERTS = {
  "Langues": { nom: "Dr. Sophie Marchand", titre: "Linguiste & Pedagogue", specialite: "linguistique appliquee, didactique des langues, methodologie communicative, phonetique, grammaire contrastive", style: "pedagogique, progressif, axe sur la pratique communicative" },
  "IA": { nom: "Dr. Marc Fontaine", titre: "Expert IA & Data Science", specialite: "machine learning, deep learning, NLP, computer vision, ethique IA, deploiement modeles", style: "technique et rigoureux, ancre dans les applications reelles, references aux dernières recherches" },
  "Bien-etre": { nom: "Dr. Isabelle Morin", titre: "Therapeute & Coach certifiee", specialite: "psychologie positive, mindfulness, gestion du stress, neurosciences du bien-etre, coaching professionnel", style: "bienveillant, scientifique et pratique, approche holistique corps-esprit" },
  "Business": { nom: "Prof. Alain Rousseau", titre: "Expert Management & Strategie", specialite: "management strategique, leadership, gestion de projet, entrepreneuriat, innovation organisationnelle", style: "analytique, base sur des cas reels, references aux grandes ecoles de management" },
  "Tech": { nom: "Lucas Martin", titre: "Ingenieur & Developpeur Senior", specialite: "developpement logiciel, architecture systemes, DevOps, cloud computing, securite informatique", style: "precis, oriente solutions, nombreux exemples de code et cas pratiques" },
  "Marketing": { nom: "Sophie Leblanc", titre: "Expert Marketing Digital", specialite: "SEO, SEA, social media, content marketing, growth hacking, analytics, automation marketing", style: "data-driven, strategies actionnables, focus ROI et metriques" },
  "Finance": { nom: "Prof. Henri Mercier", titre: "Expert Finance & Gestion", specialite: "comptabilite, analyse financiere, fiscalite, gestion de tresorerie, investissement, droit des societes", style: "rigoureux, references reglementaires francaises et internationales, cas pratiques chiffres" },
  "Langues Anciennes": { nom: "Prof. David Cohen", titre: "Hebraiste & Helleniste", specialite: "hebreu biblique et moderne, grec ancien, arameen, langues semitiques, hermeneutique, philologie", style: "erudite, comparatif, passage fluide entre langue ancienne et moderne, references textuelles" },
  "Design": { nom: "Clara Vidal", titre: "Designer & Directrice Artistique", specialite: "UI/UX design, branding, typographie, couleur, design thinking, outils Adobe et Figma", style: "visuel et inspire, references aux grands designers, balance theorie et pratique creative" },
  "Outils": { nom: "Thomas Berger", titre: "Expert Productivite & Outils", specialite: "automatisation, no-code, gestion du temps, outils collaboratifs, optimisation des processus", style: "pragmatique, etapes claires, focus gain de temps et efficacite" },
  "Droit": { nom: "Maitre Pierre Duval", titre: "Avocat & Juriste", specialite: "droit des affaires, droit du travail, propriete intellectuelle, droit numerique, compliance", style: "precis et structure, references aux textes de loi francais et europeens, cas jurisprudentiels" },
};

async function appel_claude(prompt: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: "Tu es un architecte pedagogique expert en ingenierie de formation professionnelle certifiante. Tu respectes les standards RNCP, Qualiopi et les meilleures pratiques e-learning. Tu reponds UNIQUEMENT en JSON valide sans markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  return data.content[0].text || "";
}

export async function POST(req: NextRequest) {
  try {
    const { formation_code, formation_titre, domaine, niveau, duree } = await req.json();

    const expert = EXPERTS[domaine] || EXPERTS["Business"];

    const prompt = "Tu es " + expert.nom + ", " + expert.titre + ". Specialites: " + expert.specialite + ". Style: " + expert.style + ".\n\n" +
      "Cree la structure pedagogique complete pour cette formation professionnelle certifiante :\n" +
      "- Code: " + formation_code + "\n" +
      "- Titre: " + formation_titre + "\n" +
      "- Domaine: " + domaine + "\n" +
      "- Niveau: " + (niveau || "Intermediaire") + "\n" +
      "- Duree: " + (duree || "200h") + "\n\n" +
      "STRUCTURE REQUISE: Exactement 5 chapitres progressifs, chacun avec exactement 4 modules:\n" +
      "- Module 1: Theorie fondamentale\n" +
      "- Module 2: Theorie approfondie\n" +
      "- Module 3: Pratique et exercices\n" +
      "- Module 4: Evaluation et QCM\n\n" +
      "REPONDS UNIQUEMENT avec ce JSON valide:\n" +
      "{\n" +
      "  \"expert\": \"" + expert.nom + "\",\n" +
      "  \"expert_titre\": \"" + expert.titre + "\",\n" +
      "  \"chapitres\": [\n" +
      "    {\n" +
      "      \"numero\": 1,\n" +
      "      \"titre\": \"[Titre du chapitre 1]\",\n" +
      "      \"modules\": [\n" +
      "        {\"numero\": 1, \"titre\": \"[Titre module 1]\", \"type\": \"theorie\"},\n" +
      "        {\"numero\": 2, \"titre\": \"[Titre module 2]\", \"type\": \"theorie\"},\n" +
      "        {\"numero\": 3, \"titre\": \"[Titre module 3]\", \"type\": \"pratique\"},\n" +
      "        {\"numero\": 4, \"titre\": \"[Titre module 4]\", \"type\": \"evaluation\"}\n" +
      "      ]\n" +
      "    }\n" +
      "  ]\n" +
      "}";

    const reponse = await appel_claude(prompt);

    let structure;
    try {
      const clean = reponse.replace(/```json|```/g, "").trim();
      structure = JSON.parse(clean);
    } catch {
      return NextResponse.json({ erreur: "Structure JSON invalide", brut: reponse }, { status: 500 });
    }

    return NextResponse.json({
      succes: true,
      formation_code,
      expert: expert.nom,
      expert_titre: expert.titre,
      domaine,
      structure,
    });

  } catch (err: any) {
    return NextResponse.json({ erreur: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ experts: EXPERTS, status: "Agent Architecte operationnel" });
}
