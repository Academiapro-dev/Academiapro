# API Gamification AcadémIA Pro - Next.js 14 TypeScript

## Structure des fichiers

```
app/api/gamification/
├── ajouter-xp/route.ts
├── profil/route.ts
├── classement/route.ts
└── verifier-badges/route.ts
lib/
├── gamification.ts
├── supabase.ts
└── notifications.ts
types/
└── gamification.ts
```

---

## `types/gamification.ts`

```typescript
export type Action =
  | "module"
  | "formation"
  | "seance"
  | "connexion"
  | "exercice";

export type BadgeType =
  | "premier_pas"
  | "assidu_7j"
  | "assidu_30j"
  | "assidu_100j"
  | "premier_module"
  | "premiere_formation"
  | "explorateur"
  | "expert"
  | "elite"
  | "centurion"
  | "perfectionniste"
  | "veloce";

export interface XPTransaction {
  id: string;
  apprenant_id: string;
  action: Action;
  points: number;
  created_at: string;
}

export interface Badge {
  id: string;
  apprenant_id: string;
  badge_type: BadgeType;
  obtenu_le: string;
}

export interface Niveau {
  id: string;
  apprenant_id: string;
  niveau: number;
  xp_total: number;
  streak: number;
  derniere_connexion: string | null;
}

export interface AjouterXPRequest {
  apprenant_id: string;
  action: Action;
  metadata?: {
    module_id?: string;
    formation_id?: string;
    seance_id?: string;
    exercice_id?: string;
    score?: number;
  };
}

export interface AjouterXPResponse {
  success: boolean;
  xp_gagnes: number;
  xp_total: number;
  niveau_actuel: number;
  niveau_precedent: number;
  niveau_up: boolean;
  streak: number;
  streak_bonus_xp: number;
  badges_debloques: BadgeType[];
  message: string;
}

export interface ProfilResponse {
  apprenant_id: string;
  niveau: number;
  xp_total: number;
  xp_pour_niveau_suivant: number;
  xp_niveau_actuel: number;
  progression_niveau: number;
  streak: number;
  badges: Badge[];
  transactions_recentes: XPTransaction[];
  statistiques: {
    total_modules: number;
    total_formations: number;
    total_seances: number;
    total_exercices: number;
    total_connexions: number;
  };
}

export interface ClassementEntry {
  rang: number;
  pseudo_anonyme: string;
  niveau: number;
  xp_total: number;
  streak: number;
  badges_count: number;
  est_moi: boolean;
}

export interface ClassementResponse {
  top_10: ClassementEntry[];
  mon_rang: number | null;
  total_apprenants: number;
}

export interface VerifierBadgesRequest {
  apprenant_id: string;
}

export interface VerifierBadgesResponse {
  success: boolean;
  badges_debloques: BadgeType[];
  badges_existants: BadgeType[];
  message: string;
}

export interface NiveauInfo {
  niveau: number;
  xp_requis: number;
  xp_prochain: number;
  titre: string;
}
```

---

## `lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL manquant dans les variables d'environnement");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY manquant dans les variables d'environnement"
  );
}

// Client service role pour les opérations serveur (bypass RLS)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Client public pour les opérations authentifiées
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## `lib/gamification.ts`

```typescript
import { supabaseAdmin } from "./supabase";
import {
  Action,
  BadgeType,
  Niveau,
  NiveauInfo,
  XPTransaction,
} from "@/types/gamification";

// ============================================================
// CONFIGURATION XP PAR ACTION
// ============================================================

export const XP_PAR_ACTION: Record<Action, number> = {
  connexion: 5,
  exercice: 15,
  seance: 25,
  module: 50,
  formation: 150,
};

// ============================================================
// CONFIGURATION DES NIVEAUX
// Formule progressive : XP requis = 100 * niveau^1.5
// ============================================================

export function calculerXPRequis(niveau: number): number {
  if (niveau <= 1) return 0;
  return Math.floor(100 * Math.pow(niveau - 1, 1.5));
}

export function calculerXPCumulatif(niveau: number): number {
  let total = 0;
  for (let i = 2; i <= niveau; i++) {
    total += calculerXPRequis(i);
  }
  return total;
}

export function calculerNiveauDepuisXP(xpTotal: number): number {
  let niveau = 1;
  while (true) {
    const xpProchain = calculerXPCumulatif(niveau + 1);
    if (xpTotal < xpProchain) break;
    niveau++;
    if (niveau >= 100) break; // Cap niveau 100
  }
  return niveau;
}

export function getTitreNiveau(niveau: number): string {
  const titres: Record<number, string> = {
    1: "Novice",
    5: "Apprenti",
    10: "Élève",
    15: "Étudiant",
    20: "Praticien",
    25: "Confirmé",
    30: "Expert",
    40: "Maître",
    50: "Grand Maître",
    60: "Sage",
    75: "Légende",
    100: "Transcendant",
  };

  const paliers = Object.keys(titres)
    .map(Number)
    .sort((a, b) => b - a);

  for (const palier of paliers) {
    if (niveau >= palier) return titres[palier];
  }
  return "Novice";
}

export function getNiveauInfo(xpTotal: number): NiveauInfo {
  const niveau = calculerNiveauDepuisXP(xpTotal);
  const xp_requis = calculerXPCumulatif(niveau);
  const xp_prochain = calculerXPCumulatif(niveau + 1);

  return {
    niveau,
    xp_requis,
    xp_prochain,
    titre: getTitreNiveau(niveau),
  };
}

// ============================================================
// GESTION DU STREAK
// ============================================================

export interface StreakResult {
  nouveau_streak: number;
  streak_maintenu: boolean;
  streak_reinitialise: boolean;
  bonus_xp: number;
}

export function calculerBonusStreakXP(streak: number): number {
  if (streak >= 100) return 50; // Bonus 100 jours
  if (streak >= 30) return 25;  // Bonus 30 jours
  if (streak >= 7) return 10;   // Bonus 7 jours
  return 0;
}

export async function mettreAJourStreak(
  apprenantId: string,
  niveauActuel: Niveau
): Promise<StreakResult> {
  const maintenant = new Date();
  const aujourdhui = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate()
  );

  let nouveau_streak = niveauActuel.streak;
  let streak_maintenu = false;
  let streak_reinitialise = false;
  let bonus_xp = 0;

  if (!niveauActuel.derniere_connexion) {
    // Première connexion
    nouveau_streak = 1;
    streak_maintenu = true;
  } else {
    const derniereConnexion = new Date(niveauActuel.derniere_connexion);
    const dernierJour = new Date(
      derniereConnexion.getFullYear(),
      derniereConnexion.getMonth(),
      derniereConnexion.getDate()
    );

    const diffMs = aujourdhui.getTime() - dernierJour.getTime();
    const diffJours = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffJours === 0) {
      // Déjà connecté aujourd'hui → streak inchangé
      streak_maintenu = true;
    } else if (diffJours === 1) {
      // Connexion consécutive → streak +1
      nouveau_streak = niveauActuel.streak + 1;
      streak_maintenu = true;
      bonus_xp = calculerBonusStreakXP(nouveau_streak);
    } else {
      // Connexion manquée → réinitialisation
      nouveau_streak = 1;
      streak_reinitialise = true;
    }
  }

  // Mise à jour en BDD
  await supabaseAdmin
    .from("niveaux")
    .update({
      streak: nouveau_streak,
      derniere_connexion: maintenant.toISOString(),
    })
    .eq("apprenant_id", apprenantId);

  return {
    nouveau_streak,
    streak_maintenu,
    streak_reinitialise,
    bonus_xp,
  };
}

// ============================================================
// CONDITIONS DES BADGES
// ============================================================

export interface BadgeCondition {
  type: BadgeType;
  label: string;
  description: string;
  verifier: (
    apprenantId: string,
    niveau: Niveau,
    transactions: XPTransaction[]
  ) => Promise<boolean>;
}

export const BADGE_CONDITIONS: BadgeCondition[] = [
  // ── Badges Streak ──────────────────────────────────────────
  {
    type: "assidu_7j",
    label: "Assidu 7 jours",
    description: "Connecté 7 jours consécutifs",
    verifier: async (_id, niveau) => niveau.streak >= 7,
  },
  {
    type: "assidu_30j",
    label: "Assidu 30 jours",
    description: "Connecté 30 jours consécutifs",
    verifier: async (_id, niveau) => niveau.streak >= 30,
  },
  {
    type: "