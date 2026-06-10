# API Route Next.js 14 - Communauté AcadémIA Pro

## Structure des fichiers

```
app/api/communaute/
├── rejoindre/route.ts
├── discord/
│   ├── inviter/route.ts
│   ├── role/route.ts
│   └── notifier/route.ts
├── stats/route.ts
└── _lib/
    ├── discord.ts
    ├── types.ts
    ├── validators.ts
    └── database.ts
```

---

## `/app/api/communaute/_lib/types.ts`

```typescript
export type NiveauMembre = "gratuit" | "premium" | "vip";

export type TypeNotification =
  | "bienvenue"
  | "nouvelle_formation"
  | "prompt_hebdo"
  | "live_mensuel"
  | "annonce";

export interface Membre {
  id: string;
  nom: string;
  email: string;
  niveau: NiveauMembre;
  discordId?: string;
  discordUsername?: string;
  dateInscription: Date;
  dateLastActive?: Date;
  formationsAchetees: string[];
  invitationEnvoyee: boolean;
  invitationAcceptee: boolean;
}

export interface InscriptionPayload {
  nom: string;
  email: string;
  niveau?: NiveauMembre;
  formationId?: string;
  discordUsername?: string;
}

export interface InvitationDiscordPayload {
  membreId: string;
  email: string;
  discordUsername?: string;
}

export interface RoleDiscordPayload {
  membreId: string;
  discordUserId: string;
  niveau: NiveauMembre;
  formationId?: string;
}

export interface NotificationPayload {
  type: TypeNotification;
  titre?: string;
  contenu: string;
  canalId?: string;
  niveauxCibles?: NiveauMembre[];
  mentionEveryone?: boolean;
  embed?: DiscordEmbed;
  programmePour?: string; // ISO date string
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  timestamp?: string;
}

export interface CommunauteStats {
  totalMembres: number;
  membresActifs: number;
  membresParNiveau: Record<NiveauMembre, number>;
  totalMessages: number;
  messagesAujourdhui: number;
  nouveauxMembres7Jours: number;
  tauxEngagement: number;
  formationsPopulaires: { id: string; nom: string; inscrits: number }[];
  croissanceMensuelle: number;
}

export interface DiscordInvitation {
  url: string;
  code: string;
  expiresAt: string | null;
  maxUses: number;
  uses: number;
}

export interface ApiResponse<T = unknown> {
  succes: boolean;
  message: string;
  donnees?: T;
  erreur?: string;
  timestamp: string;
}
```

---

## `/app/api/communaute/_lib/discord.ts`

```typescript
import type {
  NiveauMembre,
  TypeNotification,
  DiscordEmbed,
  DiscordInvitation,
} from "./types";

// ─── Configuration Discord ────────────────────────────────────────────────────

const DISCORD_API_BASE = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

// IDs des rôles Discord (à configurer dans .env)
const ROLES_IDS: Record<NiveauMembre, string> = {
  gratuit: process.env.DISCORD_ROLE_GRATUIT_ID!,
  premium: process.env.DISCORD_ROLE_PREMIUM_ID!,
  vip: process.env.DISCORD_ROLE_VIP_ID!,
};

// IDs des canaux Discord
const CANAUX_IDS = {
  bienvenue: process.env.DISCORD_CANAL_BIENVENUE_ID!,
  general: process.env.DISCORD_CANAL_GENERAL_ID!,
  prompts: process.env.DISCORD_CANAL_PROMPTS_ID!,
  lives: process.env.DISCORD_CANAL_LIVES_ID!,
  formations: process.env.DISCORD_CANAL_FORMATIONS_ID!,
  agentIA: process.env.DISCORD_CANAL_AGENT_IA_ID!,
  annonces: process.env.DISCORD_CANAL_ANNONCES_ID!,
};

// ─── Headers bot Discord ──────────────────────────────────────────────────────

function getBotHeaders(): HeadersInit {
  return {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "AcadémIA-Pro/1.0 (https://academia-pro.fr)",
  };
}

// ─── Création invitation Discord ──────────────────────────────────────────────

export async function creerInvitationDiscord(
  maxUses: number = 1,
  maxAge: number = 604800 // 7 jours en secondes
): Promise<DiscordInvitation> {
  const canalId = CANAUX_IDS.bienvenue || CANAUX_IDS.general;

  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${canalId}/invites`,
    {
      method: "POST",
      headers: getBotHeaders(),
      body: JSON.stringify({
        max_age: maxAge,
        max_uses: maxUses,
        unique: true,
        reason: "Invitation AcadémIA Pro - Nouvelle inscription",
      }),
    }
  );

  if (!response.ok) {
    const erreur = await response.json();
    throw new Error(
      `Erreur création invitation Discord: ${JSON.stringify(erreur)}`
    );
  }

  const data = await response.json();

  return {
    url: `https://discord.gg/${data.code}`,
    code: data.code,
    expiresAt: data.expires_at,
    maxUses: data.max_uses,
    uses: data.uses,
  };
}

// ─── Attribution rôle membre ──────────────────────────────────────────────────

export async function attribuerRoleDiscord(
  discordUserId: string,
  niveau: NiveauMembre
): Promise<void> {
  const roleId = ROLES_IDS[niveau];

  if (!roleId) {
    throw new Error(`Rôle introuvable pour le niveau: ${niveau}`);
  }

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: getBotHeaders(),
    }
  );

  if (!response.ok && response.status !== 204) {
    const erreur = await response.json().catch(() => ({}));
    throw new Error(
      `Erreur attribution rôle Discord: ${JSON.stringify(erreur)}`
    );
  }
}

// ─── Suppression ancien rôle (upgrade) ───────────────────────────────────────

export async function supprimerRoleDiscord(
  discordUserId: string,
  niveau: NiveauMembre
): Promise<void> {
  const roleId = ROLES_IDS[niveau];
  if (!roleId) return;

  await fetch(
    `${DISCORD_API_BASE}/guilds/${GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: getBotHeaders(),
    }
  );
}

// ─── Message de bienvenue personnalisé ───────────────────────────────────────

export async function envoyerMessageBienvenue(
  discordUserId: string,
  nomMembre: string,
  niveau: NiveauMembre
): Promise<void> {
  const emojisNiveau: Record<NiveauMembre, string> = {
    gratuit: "🎓",
    premium: "⭐",
    vip: "👑",
  };

  const avantagesNiveau: Record<NiveauMembre, string[]> = {
    gratuit: [
      "Accès aux ressources gratuites",
      "Canal communauté général",
      "Newsletter hebdomadaire",
    ],
    premium: [
      "Toutes les ressources Premium",
      "Prompts exclusifs chaque semaine",
      "Accès aux replays de lives",
      "Support prioritaire",
    ],
    vip: [
      "Accès VIP illimité",
      "Sessions 1-on-1 mensuelles",
      "Prompts VIP ultra-exclusifs",
      "Early access nouvelles formations",
      "Canal VIP privé",
    ],
  };

  const embed: DiscordEmbed = {
    title: `${emojisNiveau[niveau]} Bienvenue dans AcadémIA Pro, ${nomMembre} !`,
    description: `Tu rejoins une communauté de passionnés de l'IA. Voici ce qui t'attend avec ton accès **${niveau.toUpperCase()}** :`,
    color:
      niveau === "vip"
        ? 0xffd700
        : niveau === "premium"
          ? 0x7c3aed
          : 0x3b82f6,
    fields: [
      {
        name: "🎁 Tes avantages",
        value: avantagesNiveau[niveau].map((a) => `• ${a}`).join("\n"),
        inline: false,
      },
      {
        name: "📌 Premiers pas",
        value:
          "• Présente-toi dans <#" +
          CANAUX_IDS.general +
          ">\n" +
          "• Consulte les ressources disponibles\n" +
          "• Active les notifications des canaux importants",
        inline: false,
      },
      {
        name: "🤖 Agent IA",
        value: `Pose tes questions dans <#${CANAUX_IDS.agentIA}> et notre IA te répondra instantanément !`,
        inline: false,
      },
    ],
    thumbnail: {
      url: "https://academia-pro.fr/logo-discord.png",
    },
    footer: {
      text: "AcadémIA Pro • La communauté IA de référence",
      icon_url: "https://academia-pro.fr/favicon.png",
    },
    timestamp: new Date().toISOString(),
  };

  await envoyerMessageCanal(CANAUX_IDS.bienvenue, {
    content: `<@${discordUserId}>`,
    embeds: [embed],
  });
}

// ─── Envoi message dans un canal ─────────────────────────────────────────────

export async function envoyerMessageCanal(
  canalId: string,
  payload: {
    content?: string;
    embeds?: DiscordEmbed[];
    components?: unknown[];
  }
): Promise<void> {
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${canalId}/messages`,
    {
      method: "POST",
      headers: getBotHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const erreur = await response.json().catch(() => ({}));
    throw new Error(`Erreur envoi message Discord: ${JSON.stringify(erreur)}`);
  }
}

// ─── Notification nouvelle formation ─────────────────────────────────────────

export async function notifierNouvelleFormation(
  titreFormation: string,
  descriptionFormation: string,
  lienFormation: string,
  niveauxCibles: NiveauMembre[]
): Promise<void> {
  const mentionsRoles = niveauxCibles
    .map((n) => ROLES_IDS[n])
    .filter(Boolean)
    .map((id) => `<@&${id}>`)
    .join(" ");

  const embed: DiscordEmbed = {
    title: `🚀 Nouvelle Formation Disponible : ${titreFormation}`,
    description: descriptionFormation,
    color: 0x10b981,
    fields: [
      {
        name: "🎯 Pour qui ?",
        value: niveauxCibles.map((n) => `• Membres ${n}`).join("\n"),
        inline: true,
      },
      {
        name: "🔗 Accès",
        value: `[Accéder à la formation](${lienFormation})`,
        inline: true,
      },
    ],
    footer: {
      text: "AcadémIA Pro • Formations IA",
    },
    timestamp: new Date().toISOString(),
  };

  await envoyerMessageCanal(CANAUX_IDS.formations, {
    content: `${mentionsRoles} 📣 Une nouvelle formation vient d'être publiée !`,
    embeds: [embed],
  });
}

// ─── Partage prompts hebdomadaires ───────────────────────────────────────────

export async function partagerPromptsHebdo(
  semaine: string,
  prompts: { titre: string; contenu: string; niveau: NiveauMembre }[]
): Promise<void> {
  const promptsParNiveau = prompts.reduce(
    (acc, p) => {
      if (!acc[p.niveau]) acc[p.niveau] = [];
      acc[p.niveau].push(p);
      return acc;
    },
    {} as Record<NiveauMembre, typeof prompts>
  );

  const fields: DiscordEmbed["fields"] = [];

  Object.entries(promptsParNiveau).forEach(([niveau, niveauPrompts]) => {
    const emojis: Record<string, string> = {
      gratuit: "🎓",
      premium: "⭐",
      vip: "👑",
    };
    fields.push({
      name: `${emojis[niveau] || "📝"} Prompts ${niveau.toUpperCase()} (${niveauPrompts.length})`,
      value: niveauPrompts.map((p) => `**${p.titre}**\n\`${p.contenu}\``).join("\n\n"),
      inline: false,
    });
  });

  const embed: DiscordEmbed = {
    title: `✨ Prompts Exclusifs - Semaine ${semaine}`,
    description:
      "Voici vos prompts exclusifs de la semaine pour booster votre productivité avec l'IA !",
    color: 0x8b5cf6,
    fields,
    footer: {
      text: "AcadémIA Pro • Prompts Hebdomadaires",
    