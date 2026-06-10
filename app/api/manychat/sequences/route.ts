# API Route Next.js 14 — Séquences Email AcadémIA Pro

## Structure du projet

```
app/
  api/
    email-sequences/
      route.ts
      sequences/
        claude.ts
        ia.ts
        formation.ts
        webinaire.ts
        prompt.ts
      types.ts
      utils.ts
```

---

## types.ts

```typescript
// app/api/email-sequences/types.ts

export type SequenceType = 'claude' | 'ia' | 'formation' | 'webinaire' | 'prompt'

export interface ContactData {
  email: string
  firstName: string
  lastName?: string
  metier?: string
  sequenceType: SequenceType
  emailIndex: number
  // Données spécifiques selon séquence
  pdfUrl?: string
  ebookUrl?: string
  moduleUrl?: string
  replayUrl?: string
  promptsUrl?: string
  webinarDate?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
  dayOffset: number // Jour d'envoi (J0, J1, J3, etc.)
}

export interface SequenceConfig {
  name: string
  emails: EmailTemplate[]
}

export interface SendEmailRequest {
  contactData: ContactData
  manychatWebhookSecret?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  emailIndex: number
  subject: string
}
```

---

## utils.ts

```typescript
// app/api/email-sequences/utils.ts

export function getBaseStyles(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Helvetica Neue', Arial, sans-serif; 
        background-color: #f4f4f5; 
        color: #1a1a2e;
        line-height: 1.6;
      }
      .wrapper {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 32px 40px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
      }
      .header .tagline {
        color: rgba(255,255,255,0.85);
        font-size: 13px;
        margin-top: 4px;
      }
      .badge {
        display: inline-block;
        background: rgba(255,255,255,0.2);
        color: #fff;
        font-size: 11px;
        padding: 4px 12px;
        border-radius: 20px;
        margin-top: 8px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .body {
        padding: 40px 40px 32px;
      }
      .greeting {
        font-size: 16px;
        color: #667eea;
        font-weight: 600;
        margin-bottom: 16px;
      }
      p {
        font-size: 15px;
        color: #374151;
        margin-bottom: 16px;
        line-height: 1.7;
      }
      .highlight-box {
        background: linear-gradient(135deg, #f0f4ff 0%, #faf0ff 100%);
        border-left: 4px solid #667eea;
        border-radius: 0 8px 8px 0;
        padding: 20px 24px;
        margin: 24px 0;
      }
      .highlight-box p {
        margin-bottom: 0;
        color: #1a1a2e;
        font-style: italic;
      }
      .cta-container {
        text-align: center;
        margin: 32px 0;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff !important;
        text-decoration: none;
        padding: 16px 40px;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.3px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      }
      .cta-button.urgent {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
      }
      .cta-button.gold {
        background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
        color: #1a1a2e !important;
        box-shadow: 0 4px 15px rgba(255, 210, 0, 0.4);
      }
      .urgency-banner {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        text-align: center;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .price-tag {
        text-align: center;
        margin: 20px 0;
      }
      .price-current {
        font-size: 48px;
        font-weight: 800;
        color: #667eea;
        line-height: 1;
      }
      .price-original {
        font-size: 18px;
        color: #9ca3af;
        text-decoration: line-through;
        margin-left: 8px;
      }
      .price-savings {
        display: inline-block;
        background: #dcfce7;
        color: #16a34a;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
      }
      .testimonial {
        background: #f9fafb;
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
      }
      .testimonial-text {
        font-size: 15px;
        color: #374151;
        font-style: italic;
        margin-bottom: 12px;
        line-height: 1.7;
      }
      .testimonial-author {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 16px;
      }
      .author-info strong {
        display: block;
        font-size: 14px;
        color: #1a1a2e;
      }
      .author-info span {
        font-size: 12px;
        color: #6b7280;
      }
      .checklist {
        list-style: none;
        padding: 0;
        margin: 16px 0;
      }
      .checklist li {
        padding: 8px 0;
        padding-left: 28px;
        position: relative;
        font-size: 14px;
        color: #374151;
        border-bottom: 1px solid #f3f4f6;
      }
      .checklist li:last-child { border-bottom: none; }
      .checklist li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #667eea;
        font-weight: 700;
      }
      .divider {
        height: 1px;
        background: linear-gradient(to right, transparent, #e5e7eb, transparent);
        margin: 24px 0;
      }
      .ps-section {
        background: #fafafa;
        padding: 20px 24px;
        border-radius: 8px;
        margin-top: 24px;
      }
      .ps-section p {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 0;
      }
      .ps-section strong {
        color: #667eea;
      }
      .footer {
        background: #1a1a2e;
        padding: 32px 40px;
        text-align: center;
      }
      .footer p {
        color: #9ca3af;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .footer a {
        color: #667eea;
        text-decoration: none;
      }
      .social-links {
        margin: 16px 0;
      }
      .social-links a {
        display: inline-block;
        margin: 0 8px;
        color: #9ca3af;
        font-size: 12px;
        text-decoration: none;
      }
      .countdown {
        background: #1a1a2e;
        color: white;
        text-align: center;
        padding: 20px;
        border-radius: 12px;
        margin: 24px 0;
      }
      .countdown-title {
        font-size: 13px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 12px;
      }
      .countdown-numbers {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
      .countdown-item {
        text-align: center;
      }
      .countdown-number {
        display: block;
        font-size: 32px;
        font-weight: 800;
        color: #667eea;
        line-height: 1;
      }
      .countdown-label {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      @media (max-width: 600px) {
        .body { padding: 24px 20px; }
        .header { padding: 24px 20px; }
        .footer { padding: 24px 20px; }
        .cta-button { padding: 14px 32px; font-size: 15px; }
      }
    </style>
  `
}

export function getHeader(badgeText: string = 'AcadémIA Pro'): string {
  return `
    <div class="header">
      <h1>🎓 AcadémIA Pro</h1>
      <p class="tagline">Maîtrisez l'IA, transformez votre activité</p>
      <span class="badge">${badgeText}</span>
    </div>
  `
}

export function getFooter(email: string): string {
  return `
    <div class="footer">
      <div class="social-links">
        <a href="https://academia-pro.fr">Site web</a>
        <a href="https://twitter.com/academiapro">Twitter</a>
        <a href="https://linkedin.com/company/academiapro">LinkedIn</a>
      </div>
      <p>© 2024 AcadémIA Pro — Tous droits réservés</p>
      <p>
        <a href="https://academia-pro.fr/unsubscribe?email=${encodeURIComponent(email)}">
          Se désabonner
        </a> · 
        <a href="https://academia-pro.fr/privacy">Confidentialité</a>
      </p>
      <p style="margin-top: 12px; font-size: 11px; color: #4b5563;">
        AcadémIA Pro · 12 rue de l'Innovation · 75001 Paris
      </p>
    </div>
  `
}

export function wrapEmail(content: string, contact: ContactData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="wrapper">
        ${content}
        ${getFooter(contact.email)}
      </div>
    </body>
    </html>
  `
}

export function getMétierLabel(metier?: string): string {
  const labels: Record<string, string> = {
    consultant: 'consultant(e)',
    coach: 'coach',
    avocat: 'avocat(e)',
    medecin: 'médecin',
    entrepreneur: 'entrepreneur(se)',
    freelance: 'freelance',
    formateur: 'formateur/formatrice',
    marketeur: 'marketeur/marketeuse',
    default: 'professionnel(le)',
  }
  return labels[metier?.toLowerCase() ?? 'default'] ?? labels['default']
}

// Types import needed in utils
import type { ContactData } from './types'
```

---

## sequences/claude.ts

```typescript
// app/api/email-sequences/sequences/claude.ts

import type { ContactData, EmailTemplate } from '../types'
import { wrapEmail, getHeader, getMétierLabel } from '../utils'

export function getClaudeSequence(contact: ContactData): EmailTemplate[] {
  const { firstName, metier, pdfUrl } = contact
  const métier = getMétierLabel(metier)
  const prenom = firstName || 'toi'

  return [
    // ─── J0 : Bienvenue + PDF ──────────────────────────────────────────
    {
      dayOffset: 0,
      subject: `🎁 Tes 10 prompts Claude sont là, ${prenom}`,
      text: `Bonjour ${prenom}, tes 10 prompts Claude sont prêts. Télécharge ton PDF maintenant.`,
      html: wrapEmail(`
        ${getHeader('Séquence Claude')}
        <div class="body">
          <p class="greeting">Bonjour ${prenom} ! 👋</p>
          
          <p>
            C'est officiel : tu fais maintenant partie de la communauté 
            <strong>AcadémIA Pro</strong>. Et je suis vraiment content(e) de t'accueillir.
          </p>

          <p>
            Comme promis, voici tes <strong>10 prompts Claude 
            spécialement sélectionnés pour les ${métier}s</strong>. 
            Ces prompts m'ont personnellement fait économiser des heures 
            de travail