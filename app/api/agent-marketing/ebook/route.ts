import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LeadPayload {
  email: string;
  prenom: string;
  metier: string;
  source?: string;
}

interface Lead {
  id: string;
  email: string;
  prenom: string;
  metier: string;
  source: string;
  nurturing_started: boolean;
  created_at: string;
  downloaded_at: string | null;
}

async function demarrerSequenceNurturing(lead: Lead): Promise<void> {
  const { error } = await supabase
    .from("nurturing_sequences")
    .insert({
      lead_id: lead.id,
      email: lead.email,
      prenom: lead.prenom,
      metier: lead.metier,
      sequence_name: "academia_pro_ebook_onboarding",
      step_actuel: 1,
      statut: "actif",
      prochain_envoi: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error(
      "Erreur démarrage séquence nurturing:",
      error.message
    );
    throw new Error(
      `Impossible de démarrer la séquence nurturing: ${error.message}`
    );
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({ nurturing_started: true })
    .eq("id", lead.id);

  if (updateError) {
    console.error(
      "Erreur mise à jour statut nurturing:",
      updateError.message
    );
  }
}

async function enregistrerTelechargement(leadId: string): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      downloaded_at: new Date().toISOString(),
      download_count: supabase.rpc("increment_download_count", {
        lead_id_param: leadId,
      }),
    })
    .eq("id", leadId);

  if (error) {
    console.error("Erreur enregistrement téléchargement:", error.message);
  }

  await supabase.from("downloads_log").insert({
    lead_id: leadId,
    ebook_name: "AcadémIA Pro Guide Complet",
    downloaded_at: new Date().toISOString(),
    ip_hash: "anonymized",
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as LeadPayload;

    const { email, prenom, metier, source } = body;

    if (!email || !prenom || !metier) {
      return NextResponse.json(
        {
          success: false,
          message: "Champs obligatoires manquants: email, prénom, métier",
          champs_manquants: {
            email: !email,
            prenom: !prenom,
            metier: !metier,
          },
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format email invalide",
        },
        { status: 400 }
      );
    }

    const emailNormalise = email.toLowerCase().trim();
    const prenomNormalise = prenom.trim();
    const metierNormalise = metier.trim();
    const sourceEbook = source || "ebook_academia_pro_landing";

    const { data: leadExistant, error: rechercheError } = await supabase
      .from("leads")
      .select("id, email, nurturing_started")
      .eq("email", emailNormalise)
      .single();

    if (rechercheError && rechercheError.code !== "PGRST116") {
      console.error("Erreur recherche lead:", rechercheError.message);
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la vérification du compte",
        },
        { status: 500 }
      );
    }

    if (leadExistant) {
      await enregistrerTelechargement(leadExistant.id);

      return NextResponse.json(
        {
          success: true,
          message: `Ravi de vous revoir ${prenomNormalise}! Votre ebook est prêt.`,
          lead_id: leadExistant.id,
          nouveau_lead: false,
          ebook_url: process.env.EBOOK_DOWNLOAD_URL,
          deja_inscrit: true,
        },
        { status: 200 }
      );
    }

    const { data: nouveauLead, error: insertionError } = await supabase
      .from("leads")
      .insert({
        email: emailNormalise,
        prenom: prenomNormalise,
        metier: metierNormalise,
        source: sourceEbook,
        nurturing_started: false,
        created_at: new Date().toISOString(),
        downloaded_at: new Date().toISOString(),
        download_count: 1,
        statut: "nouveau",
        tags: ["ebook", "academia_pro", metierNormalise.toLowerCase()],
      })
      .select()
      .single();

    if (insertionError || !nouveauLead) {
      console.error(
        "Erreur insertion lead:",
        insertionError?.message
      );
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de l enregistrement",
          details: insertionError?.message,
        },
        { status: 500 }
      );
    }

    await demarrerSequenceNurturing(nouveauLead as Lead);

    await supabase.from("events_analytics").insert({
      type_event: "ebook_inscription",
      lead_id: nouveauLead.id,
      metier: metierNormalise,
      source: sourceEbook,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Merci ${prenomNormalise}! Votre ebook AcadémIA Pro vous attend.`,
        lead_id: nouveauLead.id,
        nouveau_lead: true,
        nurturing_active: true,
        ebook_url: process.env.EBOOK_DOWNLOAD_URL,
        prochaine_etape: "Vérifiez votre email pour les ressources bonus",
      },
      { status: 201 }
    );
  } catch (erreur) {
    console.error("Erreur POST inscription ebook:", erreur);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur interne",
        details:
          erreur instanceof Error ? erreur.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "30";
    const metierFiltre = searchParams.get("metier");
    const sourceFiltre = searchParams.get("source");

    const joursEnArriere = parseInt(periode, 10);
    const dateDebut = new Date(
      Date.now() - joursEnArriere * 24 * 60 * 60 * 1000
    ).toISOString();

    let queryLeads = supabase
      .from("leads")
      .select("id, metier, source, created_at, downloaded_at, statut")
      .gte("created_at", dateDebut);

    if (metierFiltre) {
      queryLeads = queryLeads.ilike("metier", `%${metierFiltre}%`);
    }

    if (sourceFiltre) {
      queryLeads = queryLeads.eq("source", sourceFiltre);
    }

    const { data: leads, error: leadsError } = await queryLeads;

    if (leadsError) {
      console.error("Erreur récupération leads:", leadsError.message);
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la récupération des statistiques",
        },
        { status: 500 }
      );
    }

    const { count: totalTelechargements, error: countError } = await supabase
      .from("downloads_log")
      .select("*", { count: "exact", head: true })
      .gte("downloaded_at", dateDebut);

    if (countError) {
      console.error(
        "Erreur comptage téléchargements:",
        countError.message
      );
    }

    const { data: nurturingActifs, error: nurturingError } = await supabase
      .from("nurturing_sequences")
      .select("id, statut, step_actuel")
      .eq("statut", "actif")
      .gte("created_at", dateDebut);

    if (nurturingError) {
      console.error(
        "Erreur récupération nurturing:",
        nurturingError.message
      );
    }

    const statsParMetier: Record<string, number> = {};
    const statsParSource: Record<string, number> = {};
    const inscriptionsParJour: Record<string, number> = {};

    (leads || []).forEach((lead) => {
      if (lead.metier) {
        const metierCle = lead.metier.toLowerCase();
        statsParMetier[metierCle] = (statsParMetier[metierCle] || 0) + 1;
      }

      if (lead.source) {
        statsParSource[lead.source] =
          (statsParSource[lead.source] || 0) + 1;
      }

      if (lead.created_at) {
        const jour = lead.created_at.split("T")[0];
        inscriptionsParJour[jour] =
          (inscriptionsParJour[jour] || 0) + 1;
      }
    });

    const topMetiers = Object.entries(statsParMetier)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([metier, count]) => ({ metier, inscriptions: count }));

    const tauxConversion =
      leads && leads.length > 0
        ? ((leads.filter((l) => l.downloaded_at).length / leads.length) *
            100).toFixed(2)
        : "0.00";

    const statsNurturing = {
      sequences_actives: nurturingActifs?.length || 0,
      repartition_etapes: {} as Record<string, number>,
    };

    (nurturingActifs || []).forEach((seq) => {
      const etape = `etape_${seq.step_actuel}`;
      statsNurturing.repartition_etapes[etape] =
        (statsNurturing.repartition_etapes[etape] || 0) + 1;
    });

    return NextResponse.json(
      {
        success: true,
        periode_analysee: `${joursEnArriere} derniers jours`,
        date_debut: dateDebut,
        date_fin: new Date().toISOString(),
        resume: {
          total_inscriptions: leads?.length || 0,
          total_telechargements: totalTelechargements || 0,
          taux_conversion_pourcentage: parseFloat(tauxConversion),
          sequences_nurturing_actives: nurturingActifs?.length || 0,
        },
        inscriptions_par_jour: inscriptionsParJour,
        top_metiers: topMetiers,
        repartition_sources: statsParSource,
        nurturing: statsNurturing,
        filtres_appliques: {
          metier: metierFiltre || null,
          source: sourceFiltre || null,
        },
      },
      { status: 200 }
    );
  } catch (erreur) {
    console.error("Erreur GET stats ebook:", erreur);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des stats",
        details:
          erreur instanceof Error ? erreur.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}