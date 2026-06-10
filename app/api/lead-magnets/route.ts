# API Route Next.js 14 - Lead Magnets AcadémIA Pro

## Structure des fichiers

```
app/api/lead-magnets/
├── inscription/route.ts
├── envoyer-sequence/route.ts
├── stats/route.ts
└── _lib/
    ├── types.ts
    ├── supabase.ts
    ├── resend.ts
    ├── emails/
    │   ├── ebook-emails.ts
    │   ├── webinaire-emails.ts
    │   └── mini-cours-emails.ts
    ├── sequences.ts
    └── crm.ts
```

---

## 1. Types — `_lib/types.ts`

```typescript
export type SourceType = "ebook" | "webinaire" | "mini-cours";

export type LeadStatus =
  | "nouveau"
  | "nurturing"
  | "qualifie"
  | "client"
  | "inactif";

export interface Lead {
  id?: string;
  email: string;
  prenom: string;
  metier: string;
  source: SourceType;
  score: number;
  status: LeadStatus;
  webinaire_date?: string | null;
  sequence_step: number;
  sequence_started_at?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

export interface SequenceEmail {
  jour: number;         // relatif à l'inscription (négatif = avant événement)
  sujet: string;
  templateId: string;
  delayHours?: number;  // override précis en heures
  tags?: string[];
}

export interface InscriptionPayload {
  email: string;
  prenom: string;
  metier: string;
  source: SourceType;
  webinaire_date?: string;  // ISO8601 — requis si source = webinaire
  metadata?: Record<string, unknown>;
}

export interface SequencePayload {
  lead_id: string;
  step?: number;        // forcer un step particulier
  force?: boolean;      // ignorer la vérification de délai
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LeadStats {
  total: number;
  par_source: Record<SourceType, number>;
  par_status: Record<LeadStatus, number>;
  score_moyen: number;
  taux_conversion: number;
  inscriptions_7j: number;
  inscriptions_30j: number;
}
```

---

## 2. Client Supabase — `_lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client avec service role pour les routes API (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function insertLead(
  lead: Omit<Lead, "id" | "created_at" | "updated_at">
): Promise<Lead> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      ...lead,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase insertLead: ${error.message}`);
  return data as Lead;
}

export async function getLeadByEmail(email: string): Promise<Lead | null> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw new Error(`Supabase getLeadByEmail: ${error.message}`);
  return data as Lead | null;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Supabase getLeadById: ${error.message}`);
  return data as Lead | null;
}

export async function updateLead(
  id: string,
  updates: Partial<Lead>
): Promise<Lead> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Supabase updateLead: ${error.message}`);
  return data as Lead;
}

export async function upsertLead(
  lead: Omit<Lead, "id" | "created_at" | "updated_at">
): Promise<{ lead: Lead; isNew: boolean }> {
  const existing = await getLeadByEmail(lead.email);

  if (existing) {
    // Mise à jour si la source change ou si données enrichies
    const updated = await updateLead(existing.id!, {
      prenom: lead.prenom,
      metier: lead.metier,
      score: Math.max(existing.score, lead.score),
      updated_at: new Date().toISOString(),
    });
    return { lead: updated, isNew: false };
  }

  const inserted = await insertLead(lead);
  return { lead: inserted, isNew: true };
}

// ─── Sequence Logs ────────────────────────────────────────────────────────────

export async function logSequenceEmail(params: {
  lead_id: string;
  source: SourceType;
  step: number;
  sujet: string;
  sent_at: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("sequence_logs")
    .insert(params);

  if (error) console.error(`Supabase logSequenceEmail: ${error.message}`);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getLeadsStats(): Promise<LeadStats> {
  const now = new Date();
  const il7j = new Date(now.getTime() - 7 * 86400000).toISOString();
  const il30j = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    { count: total },
    { data: parSource },
    { data: parStatus },
    { data: scores },
    { count: inscrits7j },
    { count: inscrits30j },
    { count: clients },
  ] = await Promise.all([
    supabaseAdmin.from("leads").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("leads").select("source"),
    supabaseAdmin.from("leads").select("status"),
    supabaseAdmin.from("leads").select("score"),
    supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", il7j),
    supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", il30j),
    supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "client"),
  ]);

  const sourceCount = (parSource ?? []).reduce(
    (acc, row) => {
      acc[row.source as SourceType] = (acc[row.source as SourceType] || 0) + 1;
      return acc;
    },
    {} as Record<SourceType, number>
  );

  const statusCount = (parStatus ?? []).reduce(
    (acc, row) => {
      acc[row.status as LeadStatus] =
        (acc[row.status as LeadStatus] || 0) + 1;
      return acc;
    },
    {} as Record<LeadStatus, number>
  );

  const scoreMoyen =
    scores && scores.length > 0
      ? Math.round(
          scores.reduce((sum, r) => sum + (r.score || 0), 0) / scores.length
        )
      : 0;

  const tauxConversion =
    total && total > 0
      ? Math.round(((clients ?? 0) / total) * 100 * 10) / 10
      : 0;

  return {
    total: total ?? 0,
    par_source: sourceCount,
    par_status: statusCount,
    score_moyen: scoreMoyen,
    taux_conversion: tauxConversion,
    inscriptions_7j: inscrits7j ?? 0,
    inscriptions_30j: inscrits30j ?? 0,
  };
}

import type { Lead, LeadStatus, SourceType } from "./types";
```

---

## 3. Templates Emails — `_lib/emails/ebook-emails.ts`

```typescript
export interface EmailTemplate {
  sujet: string;
  html: string;
  text: string;
}

interface EbookEmailParams {
  prenom: string;
  metier: string;
  ebookUrl: string;
  offreUrl?: string;
  workflowUrl?: string;
  unsubscribeUrl: string;
}

export function ebookJ0({ prenom, metier, ebookUrl, unsubscribeUrl }: EbookEmailParams): EmailTemplate {
  return {
    sujet: `${prenom}, votre e-book IA est prêt 📘`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
    
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">AcadémIA Pro</h1>
      <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px">Votre accélérateur IA professionnel</p>
    </div>

    <div style="padding:40px 32px">
      <h2 style="color:#1e1b4b;font-size:22px;margin:0 0 16px">
        Bonjour ${prenom} 👋
      </h2>
      <p style="color:#475569;line-height:1.7;margin:0 0 16px">
        Merci de rejoindre la communauté <strong>AcadémIA Pro</strong> ! En tant que <strong>${metier}</strong>, 
        vous êtes exactement au bon endroit pour transformer votre pratique avec l'IA.
      </p>
      <p style="color:#475569;line-height:1.7;margin:0 0 32px">
        Votre e-book <em>"Maîtriser Claude & ChatGPT pour les professionnels"</em> vous attend :
      </p>

      <div style="text-align:center;margin:0 0 32px">
        <a href="${ebookUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                  text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:700;
                  font-size:16px;box-shadow:0 4px 15px rgba(99,102,241,.4)">
          📥 Télécharger mon e-book gratuit
        </a>
      </div>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:0 0 32px">
        <p style="color:#64748b;font-size:14px;margin:0 0 12px;font-weight:600">
          📚 Ce que vous allez découvrir :
        </p>
        <ul style="color:#475569;font-size:14px;line-height:2;margin:0;padding-left:20px">
          <li>Les 10 prompts essentiels pour votre métier</li>
          <li>Comment économiser 2h/jour avec Claude</li>
          <li>Cas pratiques pour ${metier}</li>
          <li>Les erreurs à éviter absolument</li>
        </ul>
      </div>

      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0">
        Dès demain, je vous envoie <strong>l'astuce Claude du jour</strong> qui change tout. 
        Gardez un œil sur votre boîte !
      </p>
    </div>

    <div style="background:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center">
      <p style="color:#94a3b8;font-size:12px;margin:0">
        AcadémIA Pro · Paris, France<br>
        <a href="${unsubscribeUrl}" style="color:#6366f1;text-decoration:none">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    text: `Bonjour ${prenom},\n\nVotre e-book est disponible ici : ${ebookUrl}\n\nÀ demain,\nL'équipe AcadémIA Pro\n\nSe désabonner : ${unsubscribeUrl}`,
  };
}

export function ebookJ1({ prenom, unsubscribeUrl }: EbookEmailParams): EmailTemplate {
  return {
    sujet: `💡 Astuce Claude du jour — Pour les ${prenom} qui veulent aller vite`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
    
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32