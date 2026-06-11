import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

type ActionType = "qualifier-prospect" | "envoyer-proposition" | "relancer" | "convertir-vente";

type StatutProspect = "nouveau" | "qualifie" | "proposition_envoyee" | "relance" | "converti" | "perdu";

interface Interaction {
  date: string;
  action: ActionType;
  details: string;
  resultat: string;
}

interface Prospect {
  id?: string;
  nom: string;
  email: string;
  entreprise: string;
  telephone?: string;
  score: number;
  statut: StatutProspect;
  historique_interactions: Interaction[];
  budget_estime?: number;
  besoin_identifie?: string;
  created_at?: string;
  updated_at?: string;
}

interface RequestBody {
  action: ActionType;
  prospect_id?: string;
  nom?: string;
  email?: string;
  entreprise?: string;
  telephone?: string;
  budget_estime?: number;
  besoin_identifie?: string;
  details_proposition?: string;
  motif_relance?: string;
  montant_vente?: number;
}

function calculerScore(prospect: Partial<Prospect>): number {
  let score = 0;

  if (prospect.email) score += 20;
  if (prospect.telephone) score += 10;
  if (prospect.entreprise) score += 15;
  if (prospect.budget_estime) {
    if (prospect.budget_estime >= 10000) score += 30;
    else if (prospect.budget_estime >= 5000) score += 20;
    else if (prospect.budget_estime >= 1000) score += 10;
  }
  if (prospect.besoin_identifie) score += 25;

  return Math.min(score, 100);
}

function creerInteraction(action: ActionType, details: string, resultat: string): Interaction {
  return {
    date: new Date().toISOString(),
    action,
    details,
    resultat,
  };
}

async function qualifierProspect(body: RequestBody): Promise<NextResponse> {
  const { nom, email, entreprise, telephone, budget_estime, besoin_identifie } = body;

  if (!nom || !email || !entreprise) {
    return NextResponse.json(
      { success: false, error: "Champs obligatoires manquants: nom, email, entreprise" },
      { status: 400 }
    );
  }

  const { data: existingProspect } = await supabase
    .from("prospects")
    .select("*")
    .eq("email", email)
    .single();

  if (existingProspect) {
    return NextResponse.json(
      { success: false, error: "Un prospect avec cet email existe déjà", prospect_id: existingProspect.id },
      { status: 409 }
    );
  }

  const scoreInitial = calculerScore({ email, telephone, entreprise, budget_estime, besoin_identifie });

  const premiereInteraction = creerInteraction(
    "qualifier-prospect",
    `Qualification initiale du prospect ${nom} de ${entreprise}`,
    `Score attribué: ${scoreInitial}/100 - Statut: qualifié`
  );

  const nouveauProspect: Omit<Prospect, "id" | "created_at" | "updated_at"> = {
    nom,
    email,
    entreprise,
    telephone: telephone || "",
    score: scoreInitial,
    statut: "qualifie",
    historique_interactions: [premiereInteraction],
    budget_estime: budget_estime || 0,
    besoin_identifie: besoin_identifie || "",
  };

  const { data, error } = await supabase
    .from("prospects")
    .insert([nouveauProspect])
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase insertion prospect:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du prospect", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Prospect ${nom} qualifié avec succès`,
    action: "qualifier-prospect",
    prospect: data,
    score: scoreInitial,
    recommandation: scoreInitial >= 70
      ? "Prospect chaud - Envoyer proposition immédiatement"
      : scoreInitial >= 40
      ? "Prospect tiède - Approfondir la qualification"
      : "Prospect froid - Nourrir avec du contenu",
  });
}

async function envoyerProposition(body: RequestBody): Promise<NextResponse> {
  const { prospect_id, details_proposition } = body;

  if (!prospect_id) {
    return NextResponse.json(
      { success: false, error: "prospect_id obligatoire pour envoyer une proposition" },
      { status: 400 }
    );
  }

  const { data: prospect, error: fetchError } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospect_id)
    .single();

  if (fetchError || !prospect) {
    return NextResponse.json(
      { success: false, error: "Prospect introuvable" },
      { status: 404 }
    );
  }

  if (prospect.statut === "converti") {
    return NextResponse.json(
      { success: false, error: "Ce prospect est déjà converti en client" },
      { status: 400 }
    );
  }

  const nouvelleInteraction = creerInteraction(
    "envoyer-proposition",
    details_proposition || `Proposition commerciale AcadémIA Pro envoyée à ${prospect.email}`,
    "Proposition envoyée avec succès - En attente de réponse client"
  );

  const historiqueMAJ = [...(prospect.historique_interactions || []), nouvelleInteraction];
  const nouveauScore = Math.min(prospect.score + 15, 100);

  const { data, error } = await supabase
    .from("prospects")
    .update({
      statut: "proposition_envoyee",
      score: nouveauScore,
      historique_interactions: historiqueMAJ,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospect_id)
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase mise à jour prospect:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Proposition envoyée avec succès à ${prospect.nom}`,
    action: "envoyer-proposition",
    prospect: data,
    score_precedent: prospect.score,
    score_actuel: nouveauScore,
    prochaine_etape: "Relancer dans 3-5 jours si pas de réponse",
  });
}

async function relancerProspect(body: RequestBody): Promise<NextResponse> {
  const { prospect_id, motif_relance } = body;

  if (!prospect_id) {
    return NextResponse.json(
      { success: false, error: "prospect_id obligatoire pour une relance" },
      { status: 400 }
    );
  }

  const { data: prospect, error: fetchError } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospect_id)
    .single();

  if (fetchError || !prospect) {
    return NextResponse.json(
      { success: false, error: "Prospect introuvable" },
      { status: 404 }
    );
  }

  const nombreRelances = (prospect.historique_interactions || []).filter(
    (i: Interaction) => i.action === "relancer"
  ).length;

  if (nombreRelances >= 3) {
    await supabase
      .from("prospects")
      .update({
        statut: "perdu",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prospect_id);

    return NextResponse.json({
      success: false,
      message: "Nombre maximum de relances atteint (3). Prospect marqué comme perdu.",
      action: "relancer",
      prospect_id,
      nombre_relances: nombreRelances,
      statut: "perdu",
    });
  }

  const nouvelleInteraction = creerInteraction(
    "relancer",
    motif_relance || `Relance numéro ${nombreRelances + 1} - Suite à l'absence de réponse`,
    `Relance ${nombreRelances + 1}/3 effectuée`
  );

  const historiqueMAJ = [...(prospect.historique_interactions || []), nouvelleInteraction];
  const ajustementScore = nombreRelances === 0 ? 5 : nombreRelances === 1 ? 0 : -10;
  const nouveauScore = Math.max(Math.min(prospect.score + ajustementScore, 100), 0);

  const { data, error } = await supabase
    .from("prospects")
    .update({
      statut: "relance",
      score: nouveauScore,
      historique_interactions: historiqueMAJ,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospect_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la relance", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Relance ${nombreRelances + 1}/3 effectuée pour ${prospect.nom}`,
    action: "relancer",
    prospect: data,
    relances_restantes: 2 - nombreRelances,
    score_actuel: nouveauScore,
    alerte: nombreRelances >= 2 ? "Dernière relance possible - Décision imminente requise" : null,
  });
}

async function convertirVente(body: RequestBody): Promise<NextResponse> {
  const { prospect_id, montant_vente } = body;

  if (!prospect_id) {
    return NextResponse.json(
      { success: false, error: "prospect_id obligatoire pour convertir une vente" },
      { status: 400 }
    );
  }

  const { data: prospect, error: fetchError } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospect_id)
    .single();

  if (fetchError || !prospect) {
    return NextResponse.json(
      { success: false, error: "Prospect introuvable" },
      { status: 404 }
    );
  }

  if (prospect.statut === "converti") {
    return NextResponse.json(
      { success: false, error: "Ce prospect est déjà converti en client" },
      { status: 400 }
    );
  }

  const nouvelleInteraction = creerInteraction(
    "convertir-vente",
    `Conversion réussie - Vente conclue${montant_vente ? ` pour ${montant_vente}€` : ""} - AcadémIA Pro`,
    "CONVERTI - Client AcadémIA Pro actif"
  );

  const historiqueMAJ = [...(prospect.historique_interactions || []), nouvelleInteraction];

  const { data, error } = await supabase
    .from("prospects")
    .update({
      statut: "converti",
      score: 100,
      historique_interactions: historiqueMAJ,
      budget_estime: montant_vente || prospect.budget_estime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospect_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la conversion", details: error.message },
      { status: 500 }
    );
  }

  const dateCreation = new Date(prospect.created_at);
  const dateConversion = new Date();
  const dureeConversionJours = Math.floor(
    (dateConversion.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24)
  );

  return NextResponse.json({
    success: true,
    message: `Félicitations ! ${prospect.nom} converti en client AcadémIA Pro !`,
    action: "convertir-vente",
    prospect: data,
    montant_vente: montant_vente || null,
    duree_conversion_jours: dureeConversionJours,
    total_interactions: historiqueMAJ.length,
    score_final: 100,
    celebration: "Nouvelle vente AcadémIA Pro enregistrée avec succès !",
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: "Action requise",
          actions_disponibles: ["qualifier-prospect", "envoyer-proposition", "relancer", "convertir-vente"],
        },
        { status: 400 }
      );
    }

    switch (action) {
      case "qualifier-prospect":
        return await qualifierProspect(body);
      case "envoyer-proposition":
        return await envoyerProposition(body);
      case "relancer":
        return await relancerProspect(body);
      case "convertir-vente":
        return await convertirVente(body);
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Action "${action}" non reconnue`,
            actions_disponibles: ["qualifier-prospect", "envoyer-proposition", "relancer", "convertir-vente"],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur agent commercial AcadémIA Pro:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut") as StatutProspect | null;
    const scoreMin = searchParams.get("score_min");