```typescript
// app/api/reservations/route.ts

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface ReservationRequest {
  specialite: string;
  date: string; // ISO format: "2024-01-15"
  heure: string; // "14:00"
  tarif: number;
  apprenant_id: string;
}

interface Session {
  id: string;
  specialite: string;
  date_session: string;
  heure_debut: string;
  heure_fin: string;
  tarif: number;
  apprenant_id: string;
  statut: "confirmee" | "annulee" | "terminee" | "en_attente";
  daily_room_url: string;
  daily_room_name: string;
  created_at: string;
}

interface Apprenant {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  crm_contact_id?: string;
}

interface DailyRoom {
  url: string;
  name: string;
  privacy: string;
  created_at: string;
}

interface SMSReminder {
  id: string;
  session_id: string;
  telephone: string;
  message: string;
  scheduled_at: string;
  statut: "planifie" | "envoye" | "echec";
}

// ============================================================
// CONFIGURATION CLIENTS
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

// ============================================================
// HELPERS - DAILY.CO
// ============================================================

async function createDailyRoom(
  sessionId: string,
  specialite: string,
  expirationDate: Date
): Promise<DailyRoom> {
  const roomName = `academia-${specialite
    .toLowerCase()
    .replace(/\s+/g, "-")}-${sessionId.slice(0, 8)}`;

  const expirationTimestamp = Math.floor(expirationDate.getTime() / 1000);

  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DAILY_CO_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp: expirationTimestamp,
        max_participants: 2,
        enable_screenshare: true,
        enable_chat: true,
        enable_knocking: true,
        start_video_off: false,
        start_audio_off: false,
        lang: "fr",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Daily.co room creation failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function generateDailyToken(
  roomName: string,
  userName: string,
  isOwner: boolean = false
): Promise<string> {
  const response = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DAILY_CO_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Daily.co token generation failed");
  }

  const data = await response.json();
  return data.token;
}

// ============================================================
// HELPERS - DISPONIBILITÉ
// ============================================================

async function verifierDisponibilite(
  date: string,
  heure: string
): Promise<{ disponible: boolean; message?: string }> {
  const heureDebut = `${date}T${heure}:00`;
  const [hours, minutes] = heure.split(":").map(Number);
  const heureFin = new Date(heureDebut);
  heureFin.setHours(hours + 1, minutes); // Séance de 1h

  const heureFinStr = `${date}T${heureFin.getHours().toString().padStart(2, "0")}:${heureFin.getMinutes().toString().padStart(2, "0")}:00`;

  // Vérifier les conflits dans la DB
  const { data: conflits, error } = await supabase
    .from("sessions")
    .select("id, heure_debut, heure_fin, statut")
    .neq("statut", "annulee")
    .or(
      `and(heure_debut.lt.${heureFinStr},heure_fin.gt.${heureDebut}),` +
        `and(heure_debut.gte.${heureDebut},heure_debut.lt.${heureFinStr})`
    );

  if (error) {
    throw new Error(`Erreur vérification disponibilité: ${error.message}`);
  }

  if (conflits && conflits.length > 0) {
    return {
      disponible: false,
      message: `Ce créneau est déjà réservé. ${conflits.length} conflit(s) détecté(s).`,
    };
  }

  // Vérifier les horaires valides (9h-20h)
  const heureParsed = parseInt(heure.split(":")[0]);
  if (heureParsed < 9 || heureParsed >= 20) {
    return {
      disponible: false,
      message: "Les séances sont disponibles entre 9h00 et 20h00.",
    };
  }

  // Vérifier que la date n'est pas dans le passé
  const maintenant = new Date();
  const dateSession = new Date(`${date}T${heure}:00`);
  if (dateSession <= maintenant) {
    return {
      disponible: false,
      message: "Impossible de réserver une séance dans le passé.",
    };
  }

  // Vérifier délai minimum (2h à l'avance)
  const deuxHeuresAvant = new Date(dateSession.getTime() - 2 * 60 * 60 * 1000);
  if (maintenant > deuxHeuresAvant) {
    return {
      disponible: false,
      message: "Réservez au moins 2 heures avant la séance.",
    };
  }

  return { disponible: true };
}

// ============================================================
// HELPERS - EMAIL
// ============================================================

function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function envoyerEmailConfirmation(
  apprenant: Apprenant,
  session: Session,
  lienSeance: string
): Promise<void> {
  const dateFR = formatDateFR(session.date_session);

  const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de séance - AcadémIA Pro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: white; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 16px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; margin-top: 12px; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 18px; color: #1e293b; margin-bottom: 24px; }
    .info-card { background: #f8faff; border: 1px solid #e0e7ff; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e8edf5; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-size: 14px; font-weight: 500; }
    .info-value { color: #1e293b; font-size: 14px; font-weight: 600; }
    .price-row { background: #ede9fe; border-radius: 8px; padding: 14px 16px; margin-top: 8px; }
    .price-label { color: #7c3aed; font-weight: 600; }
    .price-value { color: #7c3aed; font-size: 18px; font-weight: 700; }
    .cta-section { text-align: center; margin: 32px 0; }
    .btn-primary { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
    .reminder-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .reminder-box p { color: #92400e; font-size: 14px; }
    .tips { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .tips h3 { color: #166534; font-size: 15px; margin-bottom: 12px; }
    .tips ul { list-style: none; }
    .tips