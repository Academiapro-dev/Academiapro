# API Route Next.js 14 - Configuration Webinaire Automatique AcadémIA Pro

## Structure des fichiers

```
app/api/agent-marketing/webinaire/
├── configurer/route.ts
├── generer-script/route.ts
├── rappels/route.ts
├── stats/route.ts
└── _lib/
    ├── types.ts
    ├── email-templates.ts
    ├── slides-generator.ts
    └── webinaire-service.ts
```

---

## 1. Types & Interfaces

```typescript
// app/api/agent-marketing/webinaire/_lib/types.ts

export interface WebinaireConfig {
  id: string;
  titre: string;
  duree: number; // minutes
  animateur: string;
  dateSession: string; // ISO 8601
  plateforme: "daily" | "zoom";
  maxParticipants: number;
  offre: OffreSpeciale;
  statut: WebinaireStatut;
  urls: WebinaireUrls;
  createdAt: string;
  updatedAt: string;
}

export interface WebinaireUrls {
  inscription: string;
  salle: string;
  replay?: string;
  slides?: string;
}

export interface OffreSpeciale {
  produit: string;
  prix: number;
  prixBarré: number;
  dureeValidite: number; // heures
  urlAchat: string;
}

export interface ScriptPresentation {
  webinaireId: string;
  sections: ScriptSection[];
  dureeTotal: number;
  generatedAt: string;
}

export interface ScriptSection {
  id: string;
  titre: string;
  debut: number; // minutes
  fin: number;
  contenu: string[];
  slides: SlideContent[];
  notes: string;
}

export interface SlideContent {
  id: string;
  type: "titre" | "contenu" | "demo" | "offre" | "qa";
  titre: string;
  points: string[];
  style: SlideStyle;
}

export interface SlideStyle {
  background: string;
  couleurTexte: string;
  animation: string;
  emoji?: string;
}

export interface RappelEmail {
  id: string;
  webinaireId: string;
  type: RappelType;
  destinataire: string;
  sujet: string;
  corps: string;
  scheduledAt: string;
  statut: "pending" | "sent" | "failed";
  sentAt?: string;
}

export type RappelType =
  | "inscription_confirmation"
  | "j7"
  | "j1"
  | "h1"
  | "post_h1"
  | "post_h25"
  | "post_j3"
  | "post_j7";

export type WebinaireStatut =
  | "draft"
  | "configured"
  | "live"
  | "ended"
  | "replay_active";

export interface WebinaireStats {
  webinaireId: string;
  inscrits: number;
  presents: number;
  tauxPresence: number;
  replayVues: number;
  conversions: {
    starterPack: number;
    formationComplete: number;
    packIAComplet: number;
    revenuTotal: number;
  };
  emails: {
    envoyes: number;
    ouverts: number;
    cliques: number;
    tauxOuverture: number;
    tauxClic: number;
  };
  updatedAt: string;
}

export interface ConfigurerWebinaireRequest {
  dateSession: string;
  plateforme?: "daily" | "zoom";
  maxParticipants?: number;
  notificationEmail?: string;
}

export interface GenererScriptRequest {
  webinaireId: string;
  style?: "formel" | "dynamique" | "conversationnel";
  inclureDemo?: boolean;
}

export interface ProgrammerRappelsRequest {
  webinaireId: string;
  participants: ParticipantEmail[];
}

export interface ParticipantEmail {
  email: string;
  prenom: string;
  nom: string;
  inscritLe: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
```

---

## 2. Email Templates

```typescript
// app/api/agent-marketing/webinaire/_lib/email-templates.ts

import { RappelType, WebinaireConfig } from "./types";

export interface EmailTemplate {
  sujet: string;
  corps: string;
  preheader: string;
}

export function genererEmailTemplate(
  type: RappelType,
  config: WebinaireConfig,
  participant: { prenom: string; email: string }
): EmailTemplate {
  const templates: Record<RappelType, EmailTemplate> = {
    inscription_confirmation: {
      sujet: `✅ Inscription confirmée - ${config.titre}`,
      preheader: "Votre place est réservée ! Voici tout ce qu'il faut savoir.",
      corps: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscription confirmée</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; border-radius: 16px 16px 0 0; text-align: center; }
    .body { background: #1a1a2e; padding: 40px; border-radius: 0 0 16px 16px; }
    .badge { background: #10b981; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; display: inline-block; margin-bottom: 20px; }
    .info-box { background: #16213e; border: 1px solid #6366f1; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2d3748; }
    .btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 700; margin: 20px 0; }
    .timeline { margin: 24px 0; }
    .timeline-item { display: flex; align-items: flex-start; padding: 12px 0; border-left: 2px solid #6366f1; margin-left: 12px; padding-left: 20px; }
    .timeline-dot { width: 12px; height: 12px; background: #6366f1; border-radius: 50%; margin-left: -27px; margin-right: 12px; flex-shrink: 0; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 48px;">🎓</div>
      <h1 style="color: white; margin: 16px 0 8px;">AcadémIA Pro</h1>
      <p style="color: #c4b5fd; margin: 0;">Webinaire Mensuel Gratuit</p>
    </div>
    <div class="body">
      <span class="badge">✅ Inscription Confirmée</span>
      <h2>Bonjour ${participant.prenom} !</h2>
      <p>Votre place est <strong>officiellement réservée</strong> pour notre webinaire exclusif. Préparez-vous à transformer votre façon de travailler grâce à l'IA.</p>
      
      <div class="info-box">
        <h3 style="color: #6366f1; margin-top: 0;">📅 Détails de votre webinaire</h3>
        <div class="info-row">
          <span style="color: #94a3b8;">Sujet</span>
          <strong>${config.titre}</strong>
        </div>
        <div class="info-row">
          <span style="color: #94a3b8;">Date & Heure</span>
          <strong>${formatDate(config.dateSession)}</strong>
        </div>
        <div class="info-row">
          <span style="color: #94a3b8;">Durée</span>
          <strong>60 min live + 30 min Q&A</strong>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span style="color: #94a3b8;">Animateur</span>
          <strong>🤖 ${config.animateur}</strong>
        </div>
      </div>

      <div class="timeline">
        <h3>🗓️ Ce qui vous attend :</h3>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div><strong>0-5 min</strong> : Accueil & présentation du programme</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div><strong>5-15 min</strong> : Pourquoi l'IA change tout en 2026</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div><strong>15-30 min</strong> : Démonstration live Claude en action</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div><strong>30-45 min</strong> : 3 automatisations qui changent tout</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div><strong>45-55 min</strong> : Comment démarrer cette semaine</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div><strong>55-60 min</strong> : 🎁 Offre spéciale participants</div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${config.urls.inscription}" class="btn">🔗 Accéder au webinaire le jour J</a>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; text-align: center;">
        Vous recevrez des rappels 7 jours, 1 jour et 1 heure avant le début.
      </p>
    </div>
  </div>
</body>
</html>`,
    },

    j7: {
      sujet: `🚀 J-7 : "${config.titre}" - Êtes-vous prêt(e) ?`,
      preheader: "Dans 7 jours, tout va changer pour votre business.",
      corps: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 40px; border-radius: 16px; text-align: center; border: 1px solid #6366f1; }
    .countdown { font-size: 72px; font-weight: 900; color: #818cf8; text-align: center; margin: 20px 0; }
    .card { background: #1a1a2e; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin: 16px 0; }
    .btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 700; }
    .benefit { display: flex; align-items: flex-start; padding: 12px 0; gap: 12px; }
    .benefit-icon { font-size: 24px; flex-shrink: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p style="color: #818cf8; text-transform: uppercase; letter-spacing: 3px; font-size: 12px;">COMPTE À REBOURS</p>
      <div class="countdown">J-7</div>
      <h2 style="color: white; margin: 0;">Votre webinaire approche !</h2>
    </div>

    <div style="padding: 32px 0;">
      <p>Bonjour ${participant.prenom},</p>
      <p>Dans <strong>exactement 7 jours</strong>, vous allez découvrir comment utiliser l'IA pour automatiser votre business et récupérer des dizaines d'heures par semaine.</p>

      <h3>🎯 Ce que vous allez apprendre :</h3>
      
      <div class="card">
        <div class="benefit">
          <span class="benefit-icon">⚡</span>
          <div><strong>Automatisation #1</strong> : Générer du contenu marketing en 5 minutes au lieu de 5 heures</div>
        </div>
        <div class="benefit">
          <span class="benefit-icon">🤖</span>
          <div><strong>Automatisation #2</strong> : Un agent IA qui répond à vos clients 24h/24</div>
        </div>
        <div class="benefit">
          <span class="benefit-icon">📈</span>
          <div><strong>Automatisation #3</strong> : Analyser vos données et prendre les bonnes décisions</div>
        </div>
      </div>

      <div class="card" style="border-color: #f59e0b; background: #1a1500;">
        <p style="color: #f59e0b; font-weight: 700; margin-top: 0;">💡 PRÉPARATION RECOMMANDÉE</p>
        <p>Notez <strong>3 tâches répétitives</strong> dans votre business que vous aimeriez automatiser. Nous en parlerons en live !</p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #94a3b8