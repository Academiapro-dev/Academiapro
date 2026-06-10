# API Route Next.js 14 - Gestion URSSAF Automatique AcadémIA Pro

## Structure des fichiers

```
app/api/mr-juridique/urssaf/
├── declarer/route.ts
├── calcul/route.ts
├── historique/route.ts
└── previsionnel/route.ts

lib/
├── urssaf/
│   ├── calculator.ts
│   ├── declarationEngine.ts
│   ├── paymentProcessor.ts
│   ├── acreManager.ts
│   └── types.ts
├── agents/
│   ├── mrComptable.ts
│   └── mrJuridique.ts
└── notifications/
    └── notifyJacques.ts
```

---

## `lib/urssaf/types.ts`

```typescript
// ============================================================
// TYPES URSSAF - AcadémIA Pro
// ============================================================

export type RegimeFiscal = "AUTO_ENTREPRENEUR" | "SAS_FRANCE";
export type StatutDeclaration = 
  | "EN_ATTENTE" 
  | "CALCULEE" 
  | "VALIDEE" 
  | "SOUMISE" 
  | "PAYEE" 
  | "ARCHIVEE" 
  | "ERREUR";

export type TypeActivite = 
  | "PRESTATIONS_SERVICES_BIC"
  | "PRESTATIONS_SERVICES_BNC" 
  | "VENTE_MARCHANDISES"
  | "LIBERAL";

export interface ChiffreAffaires {
  mois: string; // Format: YYYY-MM
  montantBrut: number;
  montantStripe: number;
  montantAutres: number;
  devises: "EUR";
  verifieAvecBanque: boolean;
  ecartBancaire?: number;
}

export interface CotisationsAutoEntrepreneur {
  chiffreAffaires: number;
  tauxCotisation: number; // 22% standard
  montantBrut: number;
  reductionACRE?: ReductionACRE;
  montantNet: number;
  detailCotisations: {
    maladie: number;
    retraiteBase: number;
    retraiteComplementaire: number;
    invaliditeDeces: number;
    allocationsFamiliales: number;
    formationProfessionnelle: number;
    csgCrds: number;
  };
}

export interface ReductionACRE {
  eligible: boolean;
  anneeDebut: string;
  moisRestants: number;
  tauxReduit: number; // 11% au lieu de 22%
  montantEconomise: number;
  dateFinACRE: string;
}

export interface CotisationsSAS {
  salaireBrut: number;
  chargesSalariales: {
    securiteSociale: number;
    retraiteComplementaire: number;
    prevoyance: number;
    csgCrds: number;
    total: number;
    tauxTotal: number; // ~22%
  };
  chargesPatronales: {
    securiteSociale: number;
    retraiteComplementaire: number;
    prevoyance: number;
    allocationsFamiliales: number;
    accidentTravail: number;
    formationProfessionnelle: number;
    total: number;
    tauxTotal: number; // ~45%
  };
  mutuelle?: {
    partSalariale: number;
    partPatronale: number;
  };
  dsn: {
    reference: string;
    dateDepot: string;
    statut: string;
  };
  totalChargeEmployeur: number;
  coutTotalEntreprise: number;
}

export interface DeclarationURSSAF {
  id: string;
  userId: string;
  regime: RegimeFiscal;
  periode: string; // YYYY-MM
  statut: StatutDeclaration;
  chiffreAffaires?: ChiffreAffaires;
  cotisationsAutoEntrepreneur?: CotisationsAutoEntrepreneur;
  cotisationsSAS?: CotisationsSAS;
  validationMrJuridique?: {
    valide: boolean;
    commentaire: string;
    dateValidation: string;
    conformiteLegale: boolean;
    risques: string[];
  };
  paiement?: {
    montant: number;
    dateExecution: string;
    reference: string;
    statut: "EN_ATTENTE" | "EFFECTUE" | "ECHEC";
    preuve?: string;
  };
  archive?: {
    url: string;
    hash: string;
    dateArchivage: string;
  };
  notifications?: {
    jacquesNotifie: boolean;
    dateNotification?: string;
    canal: "EMAIL" | "SMS" | "WHATSAPP";
  };
  createdAt: string;
  updatedAt: string;
  // Agents
  mrComptableLog: AgentLog[];
  mrJuridiqueLog: AgentLog[];
}

export interface AgentLog {
  agent: "MR_COMPTABLE" | "MR_JURIDIQUE";
  action: string;
  timestamp: string;
  succes: boolean;
  details?: Record<string, unknown>;
}

export interface PrevisionnelCotisations {
  periode: string;
  caProjecte: number;
  cotisationsProjectees: number;
  hypotheses: {
    tauxCroissance: number;
    seasonalite: number;
    acreApplicable: boolean;
  };
  alertes: Alerte[];
}

export interface Alerte {
  type: "SEUIL_TVA" | "ACRE_EXPIRATION" | "SEUIL_REGIME" | "ANOMALIE_CA";
  niveau: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  actionRecommandee: string;
  dateDeclenchement: string;
}

export interface HistoriqueURSSAF {
  declarations: DeclarationURSSAF[];
  statistiques: {
    totalCotisationsPaye: number;
    totalCA: number;
    tauxMoyenEffectif: number;
    economiesACRE: number;
    declarationsATemps: number;
    declarationsEnRetard: number;
  };
  previsions12Mois: PrevisionnelCotisations[];
}
```

---

## `lib/urssaf/calculator.ts`

```typescript
// ============================================================
// CALCULATEUR COTISATIONS URSSAF
// ============================================================

import type {
  CotisationsAutoEntrepreneur,
  CotisationsSAS,
  ReductionACRE,
  PrevisionnelCotisations,
  Alerte,
  TypeActivite,
} from "./types";

// ──────────────────────────────────────────────────────────
// TAUX 2024 AUTO-ENTREPRENEUR
// ──────────────────────────────────────────────────────────
const TAUX_AE_2024 = {
  PRESTATIONS_SERVICES_BIC: {
    total: 0.22,
    detail: {
      maladie: 0.0135,
      retraiteBase: 0.1545,
      retraiteComplementaire: 0.021,
      invaliditeDeces: 0.004,
      allocationsFamiliales: 0.022,
      formationProfessionnelle: 0.002,
      csgCrds: 0.097,
    },
  },
  PRESTATIONS_SERVICES_BNC: {
    total: 0.2275,
    detail: {
      maladie: 0.0135,
      retraiteBase: 0.1545,
      retraiteComplementaire: 0.021,
      invaliditeDeces: 0.004,
      allocationsFamiliales: 0.022,
      formationProfessionnelle: 0.0025,
      csgCrds: 0.097,
    },
  },
  VENTE_MARCHANDISES: {
    total: 0.1275,
    detail: {
      maladie: 0.0135,
      retraiteBase: 0.1545,
      retraiteComplementaire: 0.021,
      invaliditeDeces: 0.004,
      allocationsFamiliales: 0.022,
      formationProfessionnelle: 0.001,
      csgCrds: 0.097,
    },
  },
  LIBERAL: {
    total: 0.2275,
    detail: {
      maladie: 0.0135,
      retraiteBase: 0.1545,
      retraiteComplementaire: 0.021,
      invaliditeDeces: 0.004,
      allocationsFamiliales: 0.022,
      formationProfessionnelle: 0.0025,
      csgCrds: 0.097,
    },
  },
};

// Seuils 2024
export const SEUILS_2024 = {
  FRANCHISE_TVA_SERVICES: 36800,
  FRANCHISE_TVA_COMMERCE: 91900,
  PLAFOND_AE_SERVICES: 77700,
  PLAFOND_AE_COMMERCE: 188700,
  SEUIL_ALERTE_TVA: 0.9, // Alerte à 90% du seuil
};

// ACRE : taux réduit 50% pendant 12 mois
const TAUX_ACRE_REDUCTION = 0.5;

// ──────────────────────────────────────────────────────────
// CALCULATEUR AUTO-ENTREPRENEUR
// ──────────────────────────────────────────────────────────
export function calculerCotisationsAE(
  chiffreAffaires: number,
  typeActivite: TypeActivite = "PRESTATIONS_SERVICES_BIC",
  acreInfo?: ReductionACRE
): CotisationsAutoEntrepreneur {
  const taux = TAUX_AE_2024[typeActivite];
  const tauxApplique = acreInfo?.eligible
    ? taux.total * (1 - TAUX_ACRE_REDUCTION)
    : taux.total;

  const montantBrut = chiffreAffaires * taux.total;
  const montantNet = chiffreAffaires * tauxApplique;

  // Calcul détaillé proportionnel au taux appliqué
  const facteurACRE = acreInfo?.eligible ? (1 - TAUX_ACRE_REDUCTION) : 1;

  const detailCotisations = {
    maladie: parseFloat(
      (chiffreAffaires * taux.detail.maladie * facteurACRE).toFixed(2)
    ),
    retraiteBase: parseFloat(
      (chiffreAffaires * taux.detail.retraiteBase * facteurACRE).toFixed(2)
    ),
    retraiteComplementaire: parseFloat(
      (chiffreAffaires * taux.detail.retraiteComplementaire * facteurACRE).toFixed(2)
    ),
    invaliditeDeces: parseFloat(
      (chiffreAffaires * taux.detail.invaliditeDeces * facteurACRE).toFixed(2)
    ),
    allocationsFamiliales: parseFloat(
      (chiffreAffaires * taux.detail.allocationsFamiliales * facteurACRE).toFixed(2)
    ),
    formationProfessionnelle: parseFloat(
      (chiffreAffaires * taux.detail.formationProfessionnelle * facteurACRE).toFixed(2)
    ),
    csgCrds: parseFloat(
      (chiffreAffaires * taux.detail.csgCrds * facteurACRE).toFixed(2)
    ),
  };

  const reductionACRE: ReductionACRE | undefined = acreInfo?.eligible
    ? {
        ...acreInfo,
        montantEconomise: parseFloat((montantBrut - montantNet).toFixed(2)),
      }
    : undefined;

  return {
    chiffreAffaires,
    tauxCotisation: tauxApplique,
    montantBrut: parseFloat(montantBrut.toFixed(2)),
    reductionACRE,
    montantNet: parseFloat(montantNet.toFixed(2)),
    detailCotisations,
  };
}

// ──────────────────────────────────────────────────────────
// CALCULATEUR SAS FRANCE
// ──────────────────────────────────────────────────────────
export function calculerCotisationsSAS(
  salaireBrut: number,
  avecMutuelle: boolean = false,
  tauxAT: number = 0.01 // Taux accidents travail variable par secteur
): CotisationsSAS {
  // Charges salariales ~22%
  const chargesSalariales = {
    securiteSociale: parseFloat((salaireBrut * 0.1315).toFixed(2)),
    retraiteComplementaire: parseFloat((salaireBrut * 0.0386).toFixed(2)),
    prevoyance: parseFloat((salaireBrut * 0.0031).toFixed(2)),
    csgCrds: parseFloat((salaireBrut * 0.0798).toFixed(2)),
    total: 0,
    tauxTotal: 0,
  };
  chargesSalariales.total = parseFloat(
    Object.values(chargesSalariales)
      .slice(0, 4)
      .reduce((a, b) => a + b, 0)
      .toFixed(2)
  );
  chargesSalariales.tauxTotal = parseFloat(
    (chargesSalariales.total / salaireBrut).toFixed(4)
  );

  // Charges patronales ~45%
  const chargesPatronales = {
    securiteSociale: parseFloat((salaireBrut * 0.2535).toFixed(2)),
    retraiteComplementaire: parseFloat((salaireBrut * 0.0601).toFixed(2)),
    prevoyance: parseFloat((salaireBrut * 0.0155).toFixed(2)),
    allocationsFamiliales: parseFloat((salaireBrut * 0.0525).toFixed(2)),
    accidentTravail: parseFloat((salaireBrut * tauxAT).toFixed(2)),
    formationProfessionnelle: parseFloat((salaireBrut * 0.01).toFixed(2)),
    total: 0,
    tauxTotal: 0,
  };
  chargesPatronales.total = parseFloat(
    Object.values(chargesPatronales)
      .slice(0, 6)
      .reduce((a, b) => a + b, 0)
      .toFixed(2)
  );
  chargesPatronales.tauxTotal = parseFloat(
    (chargesPatronales.total / salaireBrut).toFixed(4)
  );

  const mutuelle = avecMutuelle
    ? {
        partSalariale: parseFloat((salaireBrut * 0.005).toFixed(2)),
        partPatronale: parseFloat((salaireBrut * 0.01).toFixed(2)),
      }
    : undefined;