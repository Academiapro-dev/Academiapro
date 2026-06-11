import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DAILY_API_KEY = process.env.DAILY_API_KEY as string;
const DAILY_API_URL = "https://api.daily.co/v1";

interface SeanceAudio {
  id: string;
  titre: string;
  description: string;
  professeur_id: string;
  etudiant_id: string;
  daily_room_url: string;
  daily_room_name: string;
  statut: "planifiee" | "en_cours" | "terminee" | "annulee";
  date_debut: string;
  date_fin: string | null;
  duree_minutes: number;
  created_at: string;
  updated_at: string;
}

interface CreateSeancePayload {
  titre: string;
  description: string;
  professeur_id: string;
  etudiant_id: string;
  date_debut: string;
  duree_minutes: number;
}

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  config: {
    max_participants: number;
    enable_chat: boolean;
    enable_screenshare: boolean;
    start_audio_off: boolean;
    start_video_off: boolean;
    exp: number;
  };
}

async function createDailyRoom(
  roomName: string,
  expirationTime: number
): Promise<DailyRoom> {
  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        max_participants: 2,
        enable_chat: true,
        enable_screenshare: false,
        start_audio_off: false,
        start_video_off: true,
        exp: expirationTime,
        eject_at_room_exp: true,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Erreur Daily.co création room: ${errorData.error || response.statusText}`
    );
  }

  const dailyRoom = await response.json();
  return dailyRoom;
}

async function deleteDailyRoom(roomName: string): Promise<void> {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    console.error(`Impossible de supprimer la room Daily.co: ${roomName}`);
  }
}

async function generateDailyToken(
  roomName: string,
  userId: string,
  isOwner: boolean
): Promise<string> {
  const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        is_owner: isOwner,
        enable_screenshare: false,
        start_audio_off: false,
        start_video_off: true,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Erreur Daily.co génération token: ${errorData.error || response.statusText}`
    );
  }

  const tokenData = await response.json();
  return tokenData.token;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateSeancePayload = await request.json();

    const {
      titre,
      description,
      professeur_id,
      etudiant_id,
      date_debut,
      duree_minutes,
    } = body;

    if (
      !titre ||
      !description ||
      !professeur_id ||
      !etudiant_id ||
      !date_debut ||
      !duree_minutes
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Tous les champs sont requis",
          champs_manquants: {
            titre: !titre,
            description: !description,
            professeur_id: !professeur_id,
            etudiant_id: !etudiant_id,
            date_debut: !date_debut,
            duree_minutes: !duree_minutes,
          },
        },
        { status: 400 }
      );
    }

    if (duree_minutes < 15 || duree_minutes > 240) {
      return NextResponse.json(
        {
          success: false,
          error: "La durée doit être comprise entre 15 et 240 minutes",
        },
        { status: 400 }
      );
    }

    const dateDebutObj = new Date(date_debut);
    const dateExpiration = new Date(
      dateDebutObj.getTime() + duree_minutes * 60 * 1000
    );
    const expirationTimestamp = Math.floor(dateExpiration.getTime() / 1000);

    const roomName = `academia-pro-${professeur_id.slice(0, 8)}-${etudiant_id.slice(0, 8)}-${Date.now()}`;

    let dailyRoom: DailyRoom;
    try {
      dailyRoom = await createDailyRoom(roomName, expirationTimestamp);
    } catch (dailyError) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la création de la session audio Daily.co",
          details:
            dailyError instanceof Error
              ? dailyError.message
              : "Erreur inconnue Daily.co",
        },
        { status: 502 }
      );
    }

    const { data: seance, error: supabaseError } = await supabase
      .from("seances")
      .insert([
        {
          titre,
          description,
          professeur_id,
          etudiant_id,
          daily_room_url: dailyRoom.url,
          daily_room_name: dailyRoom.name,
          statut: "planifiee",
          date_debut: dateDebutObj.toISOString(),
          date_fin: null,
          duree_minutes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (supabaseError) {
      await deleteDailyRoom(dailyRoom.name);

      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la sauvegarde de la séance dans Supabase",
          details: supabaseError.message,
        },
        { status: 500 }
      );
    }

    let tokenProfesseur: string;
    let tokenEtudiant: string;

    try {
      tokenProfesseur = await generateDailyToken(
        dailyRoom.name,
        professeur_id,
        true
      );
      tokenEtudiant = await generateDailyToken(
        dailyRoom.name,
        etudiant_id,
        false
      );
    } catch (tokenError) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la génération des tokens d'accès Daily.co",
          details:
            tokenError instanceof Error
              ? tokenError.message
              : "Erreur inconnue token",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Séance audio créée avec succès dans AcadémIA Pro",
        seance: seance as SeanceAudio,
        daily: {
          room_url: dailyRoom.url,
          room_name: dailyRoom.name,
          token_professeur: tokenProfesseur,
          token_etudiant: tokenEtudiant,
          expiration: dateExpiration.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST séance audio AcadémIA Pro:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        details:
          error instanceof Error ? error.message : "Erreur inconnue serveur",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Le paramètre sessionId est requis",
        },
        { status: 400 }
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format sessionId invalide, UUID attendu",
        },
        { status: 400 }
      );
    }

    const { data: seance, error: supabaseError } = await supabase
      .from("seances")
      .select(
        `
        id,
        titre,
        description,
        professeur_id,
        etudiant_id,
        daily_room_url,
        daily_room_name,
        statut,
        date_debut,
        date_fin,
        duree_minutes,
        created_at,
        updated_at
      `
      )
      .eq("id", sessionId)
      .single();

    if (supabaseError) {
      if (supabaseError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Séance audio introuvable",
            session_id: sessionId,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la récupération de la séance depuis Supabase",
          details: supabaseError.message,
        },
        { status: 500 }
      );
    }

    if (!seance) {
      return NextResponse.json(
        {
          success: false,
          error: "Séance audio introuvable",
          session_id: sessionId,
        },
        { status: 404 }
      );
    }

    const seanceTypee = seance as SeanceAudio;

    if (seanceTypee.statut === "annulee") {
      return NextResponse.json(
        {
          success: false,
          error: "Cette séance audio a été annulée",
          seance: {
            id: seanceTypee.id,
            titre: seanceTypee.titre,
            statut: seanceTypee.statut,
          },
        },
        { status: 410 }
      );
    }

    const maintenant = new Date();
    const dateDebut = new Date(seanceTypee.date_debut);
    const dateFin = new Date(
      dateDebut.getTime() + seanceTypee.duree_minutes * 60 * 1000
    );

    if (maintenant > dateFin && seanceTypee.statut !== "terminee") {
      await supabase
        .from("seances")
        .update({
          statut: "terminee",
          date_fin: dateFin.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      return NextResponse.json(
        {
          success: false,
          error: "Cette séance audio est expirée",
          seance: {
            id: seanceTypee.id,
            titre: seanceTypee.titre,
            statut: "terminee",
            date_debut: seanceTypee.date_debut,
            date_fin: dateFin.toISOString(),
          },
        },
        { status: 410 }
      );
    }

    let tokenAcces: string | null = null;
    let estProfesseur = false;

    if (userId) {
      const estParticipant =
        userId === seanceTypee.professeur_id ||
        userId === seanceTypee.etudiant_id;

      if (!estParticipant) {
        return NextResponse.json(
          {
            success: false,
            error: "Accès non autorisé à cette séance audio",
          },
          { status: 403 }
        );
      }

      estProfesseur = userId === seanceTypee.professeur_id;

      if (seanceTypee.statut !== "terminee") {
        try {
          tokenAcces = await generateDailyToken(
            seanceTypee.daily_room_name,
            userId,
            estProfesseur
          );
        } catch (tokenError) {
          console.error("Erreur génération token GET:", tokenError);
        }
      }
    }

    const minutesRestantes =
      seanceTypee.statut !== "terminee"
        ? Math.max(
            0,
            Math.floor((dateFin.getTime() - maintenant.getTime()) / 60000)
          )
        : 0;

    return NextResponse.json(
      {
        success: true,
        message: "Séance audio chargée avec succès depuis AcadémIA Pro",
        seance: seanceTypee,
        session_info: {
          minutes_restantes: minutesRestantes,
          est_active:
            maintenant >= dateDebut &&
            maintenant <= dateFin &&
            seanceTypee.statut !== "terminee",
          peut_rejoindre:
            maintenant >= new Date(dateDebut.getTime() - 5 * 60 * 1000) &&
            maintenant <= dateFin,
        },
        daily: {
          room_url: seanceTypee.daily_room_url,
          room_name: seanceTypee.daily_room_name,
          token_acces: tokenAcces,
          role: estProfesseur ? "professeur" : userId ? "etudiant" : "inconnu",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur GET séance audio AcadémIA Pro:", error);

    return NextResponse.json(
      {
        success: false,        message: "Erreur interne du serveur",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
