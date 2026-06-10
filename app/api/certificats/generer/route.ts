# API Route Next.js 14 — Génération Certificats AcadémIA Pro

## Structure des fichiers

```
app/api/certificats/
├── generer/route.ts
├── verifier/[numero]/route.ts
├── apprenant/[id]/route.ts
└── linkedin/route.ts

lib/
├── certificats/
│   ├── generator.ts
│   ├── qrcode.ts
│   ├── pdf.ts
│   ├── email.ts
│   └── types.ts
```

---

## `lib/certificats/types.ts`

```typescript
export type NiveauCertification =
  | "attestation_participation"
  | "certificat_academia_pro"
  | "certification_expert"
  | "master_academia_pro";

export type Mention =
  | "Passable"
  | "Mention Bien"
  | "Mention Très Bien"
  | "Mention Félicitations";

export interface ApprenantData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  avatar_url?: string;
}

export interface FormationData {
  id: string;
  titre: string;
  description: string;
  duree_heures: number;
  modules: ModuleData[];
}

export interface ModuleData {
  id: string;
  titre: string;
  complete: boolean;
  emargement: boolean;
}

export interface ProgressionData {
  score_final: number | null;
  test_final_reussi: boolean;
  modules_completes: number;
  total_modules: number;
  emargements_ok: boolean;
  projet_valide: boolean;
  portfolio_valide: boolean;
  pack_complet: boolean;
  date_completion: string;
}

export interface CertificatData {
  id: string;
  numero_serie: string;
  apprenant: ApprenantData;
  formation: FormationData;
  niveau: NiveauCertification;
  mention: Mention | null;
  score: number | null;
  date_emission: string;
  date_expiration: string | null;
  pdf_url: string;
  qr_code_url: string;
  badge_linkedin_url: string;
  signature_hash: string;
  est_valide: boolean;
  metadata: CertificatMetadata;
}

export interface CertificatMetadata {
  ip_generation: string;
  user_agent: string;
  version_template: string;
  conditions_remplies: string[];
}

export interface GenerationRequest {
  apprenant_id: string;
  formation_id: string;
  force_regeneration?: boolean;
}

export interface GenerationResult {
  success: boolean;
  certificat?: CertificatData;
  niveau_atteint?: NiveauCertification;
  message: string;
  errors?: string[];
}

export interface VerificationPublique {
  est_authentique: boolean;
  numero_serie: string;
  titulaire: {
    prenom: string;
    nom: string;
    initiale_email: string;
  };
  formation: string;
  niveau: string;
  mention: string | null;
  date_emission: string;
  emis_par: string;
  qr_valide: boolean;
}

export interface LinkedInShareData {
  certificat_id: string;
  post_texte: string;
  image_url: string;
  hashtags: string[];
  lien_verification: string;
}
```

---

## `lib/certificats/generator.ts`

```typescript
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  NiveauCertification,
  Mention,
  ApprenantData,
  FormationData,
  ProgressionData,
  CertificatData,
} from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Numéro de série unique ───────────────────────────────────────────────────

export function genererNumeroSerie(): string {
  const annee = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const sequence = Math.floor(Math.random() * 9000) + 1000;
  return `AP-${sequence}-${annee}-${random}`;
}

// ─── Hash de signature ────────────────────────────────────────────────────────

export function genererSignatureHash(
  numeroSerie: string,
  apprenantId: string,
  formationId: string,
  dateEmission: string
): string {
  const payload = `${numeroSerie}|${apprenantId}|${formationId}|${dateEmission}`;
  return crypto
    .createHmac("sha256", process.env.CERTIFICAT_SECRET_KEY!)
    .update(payload)
    .digest("hex");
}

// ─── Détermination du niveau ──────────────────────────────────────────────────

export function determinerNiveau(
  progression: ProgressionData
): NiveauCertification | null {
  const {
    score_final,
    test_final_reussi,
    modules_completes,
    total_modules,
    emargements_ok,
    projet_valide,
    portfolio_valide,
    pack_complet,
  } = progression;

  const tousModulesCompletes = modules_completes === total_modules;

  // Niveau 4 — Master AcadémIA Pro (priorité max)
  if (
    pack_complet &&
    portfolio_valide &&
    score_final !== null &&
    score_final > 85
  ) {
    return "master_academia_pro";
  }

  // Niveau 3 — Certification Expert
  if (
    score_final !== null &&
    score_final > 85 &&
    test_final_reussi &&
    projet_valide
  ) {
    return "certification_expert";
  }

  // Niveau 2 — Certificat AcadémIA Pro
  if (
    score_final !== null &&
    score_final > 70 &&
    test_final_reussi
  ) {
    return "certificat_academia_pro";
  }

  // Niveau 1 — Attestation de participation
  if (tousModulesCompletes && emargements_ok) {
    return "attestation_participation";
  }

  return null; // Conditions non remplies
}

// ─── Mention selon score ──────────────────────────────────────────────────────

export function determinerMention(score: number | null): Mention | null {
  if (score === null) return null;
  if (score >= 90) return "Mention Félicitations";
  if (score >= 80) return "Mention Très Bien";
  if (score >= 70) return "Mention Bien";
  return "Passable";
}

// ─── Libellés affichage ───────────────────────────────────────────────────────

export function getNiveauLibelle(niveau: NiveauCertification): string {
  const libelles: Record<NiveauCertification, string> = {
    attestation_participation: "Attestation de Participation",
    certificat_academia_pro: "Certificat AcadémIA Pro",
    certification_expert: "Certification Expert AcadémIA",
    master_academia_pro: "Master AcadémIA Pro",
  };
  return libelles[niveau];
}

export function getConditionsRemplies(
  niveau: NiveauCertification,
  progression: ProgressionData
): string[] {
  const conditions: string[] = [];

  switch (niveau) {
    case "attestation_participation":
      conditions.push(
        `${progression.modules_completes}/${progression.total_modules} modules complétés`
      );
      conditions.push("Émargements validés");
      break;

    case "certificat_academia_pro":
      conditions.push(`Score final : ${progression.score_final}%`);
      conditions.push("Test final réussi");
      conditions.push(
        `${progression.modules_completes}/${progression.total_modules} modules complétés`
      );
      break;

    case "certification_expert":
      conditions.push(`Score final : ${progression.score_final}%`);
      conditions.push("Test final réussi");
      conditions.push("Projet validé par l'équipe pédagogique");
      break;

    case "master_academia_pro":
      conditions.push("Pack complet validé");
      conditions.push("Portfolio professionnel validé");
      conditions.push(`Score final : ${progression.score_final}%`);
      conditions.push("Tous critères Master remplis");
      break;
  }

  return conditions;
}

// ─── Vérification doublon ─────────────────────────────────────────────────────

export async function certificatExisteDeja(
  apprenantId: string,
  formationId: string,
  niveau: NiveauCertification
): Promise<CertificatData | null> {
  const { data } = await supabase
    .from("certificats")
    .select("*")
    .eq("apprenant_id", apprenantId)
    .eq("formation_id", formationId)
    .eq("niveau", niveau)
    .eq("est_valide", true)
    .single();

  return data as CertificatData | null;
}

// ─── Sauvegarde BDD ───────────────────────────────────────────────────────────

export async function sauvegarderCertificat(
  certificat: Omit<CertificatData, "id"> & { apprenant_id: string; formation_id: string }
): Promise<CertificatData> {
  const { data, error } = await supabase
    .from("certificats")
    .insert(certificat)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur sauvegarde certificat : ${error.message}`);
  }

  return data as CertificatData;
}
```

---

## `lib/certificats/pdf.ts`

```typescript
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { CertificatData, NiveauCertification } from "./types";
import { getNiveauLibelle } from "./generator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Templates HTML par niveau ────────────────────────────────────────────────

function getCouleurNiveau(niveau: NiveauCertification): {
  primaire: string;
  secondaire: string;
  gradient: string;
} {
  const couleurs = {
    attestation_participation: {
      primaire: "#6B7280",
      secondaire: "#9CA3AF",
      gradient: "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
    },
    certificat_academia_pro: {
      primaire: "#3B82F6",
      secondaire: "#60A5FA",
      gradient: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
    },
    certification_expert: {
      primaire: "#8B5CF6",
      secondaire: "#A78BFA",
      gradient: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
    },
    master_academia_pro: {
      primaire: "#F59E0B",
      secondaire: "#FCD34D",
      gradient: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",
    },
  };
  return couleurs[niveau];
}

function genererHTMLCertificat(
  certificat: CertificatData,
  qrCodeDataUrl: string
): string {
  const couleurs = getCouleurNiveau(certificat.niveau);
  const niveauLibelle = getNiveauLibelle(certificat.niveau);
  const dateFormatee = new Date(certificat.date_emission).toLocaleDateString(
    "fr-FR",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const mentionHTML = certificat.mention
    ? `
    <div class="mention-badge" style="background: ${couleurs.gradient};">
      ${certificat.mention}
    </div>`
    : "";

  const scoreHTML = certificat.score
    ? `<div class="score">Score obtenu : <strong>${certificat.score}%</strong></div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Certificat ${certificat.numero_serie}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #f8f9fa;
      width: 1122px;
      height: 794px;
      overflow: hidden;
    }

    .certificat-wrapper {
      width: 1122px;
      height: 794px;
      background: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* Bordure décorative */
    .border-top {
      height: 8px;
      background: ${couleurs.gradient};
    }

    .border-bottom {
      height: 8px;
      background: ${couleurs.gradient};
      margin-top: auto;
    }

    /* Coins décoratifs */
    .corner {
      position: absolute;
      width: 80px;
      height: 80px;
    }
    .corner-tl { top: 16px; left: 16px; border-top: 3px solid ${couleurs.primaire}; border-left: 3px solid ${couleurs.primaire}; }
    .corner-tr { top: 16px; right: 16px; border-top: 3px solid ${couleurs.primaire}; border-right: 3px solid ${couleurs.primaire}; }
    .corner-bl { bottom: 16px; left: 16px; border-bottom: 3px solid ${couleurs.primaire}; border-left: 3px solid ${couleurs.primaire}; }
    .corner-br { bottom: 16px; right: 16px; border-bottom: 3px solid ${couleurs.primaire}; border-right: 3px solid ${couleurs.primaire}; }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 120px;
      font-weight: 900;
      color: