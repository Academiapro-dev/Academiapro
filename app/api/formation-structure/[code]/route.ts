import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHAPITRES_DEFAUT = [
  { numero: 1, titre: "Fondements et Introduction", modules: [
    { numero: 1, titre: "Histoire et contexte", type: "theorie" },
    { numero: 2, titre: "Concepts fondamentaux", type: "theorie" },
    { numero: 3, titre: "Premiers exercices pratiques", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 1", type: "evaluation" },
  ]},
  { numero: 2, titre: "Approfondissement Theorique", modules: [
    { numero: 1, titre: "Theories avancees", type: "theorie" },
    { numero: 2, titre: "Methodes et approches", type: "theorie" },
    { numero: 3, titre: "Applications pratiques", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 2", type: "evaluation" },
  ]},
  { numero: 3, titre: "Pratique Professionnelle", modules: [
    { numero: 1, titre: "Cas concrets et exemples", type: "theorie" },
    { numero: 2, titre: "Outils et techniques", type: "theorie" },
    { numero: 3, titre: "Mise en situation", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 3", type: "evaluation" },
  ]},
  { numero: 4, titre: "Specialisation et Expertise", modules: [
    { numero: 1, titre: "Sujets avances", type: "theorie" },
    { numero: 2, titre: "Recherche et innovation", type: "theorie" },
    { numero: 3, titre: "Projet professionnel", type: "pratique" },
    { numero: 4, titre: "Evaluation Chapitre 4", type: "evaluation" },
  ]},
  { numero: 5, titre: "Certification et Bilan", modules: [
    { numero: 1, titre: "Synthese des acquis", type: "theorie" },
    { numero: 2, titre: "Ethique et deontologie", type: "theorie" },
    { numero: 3, titre: "Memoire et soutenance", type: "pratique" },
    { numero: 4, titre: "Examen blanc final", type: "evaluation" },
  ]},
];

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();

  const { data } = await supabase
    .from("formations_structure")
    .select("chapitres, expert, expert_titre, domaine")
    .eq("formation_code", code)
    .limit(1);

  if (data && data.length > 0) {
    const chapitres = data[0].chapitres;
    return NextResponse.json({
      chapitres: Array.isArray(chapitres) ? chapitres : JSON.parse(chapitres as string),
      expert: data[0].expert,
      expert_titre: data[0].expert_titre,
      domaine: data[0].domaine,
    });
  }

  return NextResponse.json({
    chapitres: CHAPITRES_DEFAUT,
    expert: "Claire Beaumont",
    expert_titre: "Formatrice Expert AcadeMIA Pro",
    domaine: "General",
  });
}
