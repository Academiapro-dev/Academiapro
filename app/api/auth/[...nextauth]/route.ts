```typescript
// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";

// ============================================================
// Types étendus AcadémIA Pro
// ============================================================

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "student" | "teacher" | "admin";
      plan: "free" | "pro" | "enterprise";
      provider: string;
      accessToken?: string;
    };
    expires: string;
    iat: number;
    exp: number;
  }

  interface User {
    id: string;
    role?: "student" | "teacher" | "admin";
    plan?: "free" | "pro" | "enterprise";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "student" | "teacher" | "admin";
    plan: "free" | "pro" | "enterprise";
    provider: string;
    accessToken?: string;
    iat: number;
    exp: number;
  }
}

// ============================================================
// Validation des variables d'environnement
// ============================================================

const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  APPLE_ID: process.env.APPLE_ID,
  APPLE_SECRET: process.env.APPLE_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
} as const;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `[AcadémIA Pro] Variable d'environnement manquante : ${key}`
    );
  }
});

// ============================================================
// Durée de session : 30 jours
// ============================================================

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 jours en secondes

// ============================================================
// Configuration NextAuth
// ============================================================

export const authOptions: NextAuthOptions = {
  // ----------------------------------------------------------
  // Secret de chiffrement JWT
  // ----------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,

  // ----------------------------------------------------------
  // Stratégie JWT (stateless, pas de base de données requise)
  // ----------------------------------------------------------
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // Renouvellement toutes les 24h
  },

  // ----------------------------------------------------------
  // Configuration JWT
  // ----------------------------------------------------------
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },

  // ----------------------------------------------------------
  // Providers d'authentification
  // ----------------------------------------------------------
  providers: [
    // --- Google OAuth 2.0 ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "student" as const,
          plan: "free" as const,
        };
      },
    }),

    // --- Apple Sign In ---
    AppleProvider({
      clientId: process.env.APPLE_ID as string,
      clientSecret: process.env.APPLE_SECRET as string,
      authorization: {
        params: {
          scope: "name email",
          response_mode: "form_post",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name
            ? `${profile.name.firstName ?? ""} ${profile.name.lastName ?? ""}`.trim()
            : profile.email?.split("@")[0] ?? "Utilisateur Apple",
          email: profile.email,
          image: null,
          role: "student" as const,
          plan: "free" as const,
        };
      },
    }),

    // --- Email / Magic Link ---
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? "smtp.gmail.com",
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? "noreply@academiaipro.com",
      maxAge: 24 * 60 * 60, // Lien valide 24h
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        // Personnalisation de l'email de vérification AcadémIA Pro
        const { createTransport } = await import("nodemailer");

        const transport = createTransport(provider.server);

        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "🎓 Connexion à AcadémIA Pro",
          html: `
            <!DOCTYPE html>
            <html lang="fr">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
                <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin: 0;">
                      🎓 AcadémIA <span style="color: #6366f1;">Pro</span>
                    </h1>
                    <p style="color: #64748b; margin-top: 8px; font-size: 15px;">
                      Votre plateforme d'apprentissage intelligente
                    </p>
                  </div>

                  <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
                    Bonjour 👋
                  </p>
                  <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                    Cliquez sur le bouton ci-dessous pour vous connecter à votre espace AcadémIA Pro.
                    Ce lien est valide pendant <strong>24 heures</strong>.
                  </p>

                  <div style="text-align: center; margin: 32px 0;">
                    <a
                      href="${url}"
                      style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;"
                    >
                      Se connecter maintenant →
                    </a>
                  </div>

                  <p style="color: #94a3b8; font-size: 13px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
                    Si vous n'avez pas demandé cet email, ignorez-le en toute sécurité.<br />
                    Ce lien ne peut être utilisé qu'une seule fois.
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `Connexion à AcadémIA Pro\n\nCliquez sur ce lien pour vous connecter :\n${url}\n\nCe lien expire dans 24 heures.`,
        });
      },
    }),
  ],

  // ----------------------------------------------------------
  // Pages personnalisées
  // ----------------------------------------------------------
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/onboarding",
  },

  // ----------------------------------------------------------
  // Callbacks
  // ----------------------------------------------------------
  callbacks: {
    // --- Callback JWT ---
    // Appelé lors de la création / mise à jour du token
    async jwt({ token, user, account, trigger, session }): Promise<JWT> {
      // Première connexion : hydratation du token avec les données user
      if (user && account) {
        token.id = user.id;
        token.role = (user as User & { role: JWT["role"] }).role ?? "student";
        token.plan = (user as User & { plan: JWT["plan"] }).plan ?? "free";
        token.provider = account.provider;
        token.accessToken = account.access_token ?? undefined;
      }

      // Mise à jour manuelle via `update()` côté client
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.plan) token.plan = session.plan;
      }

      return token;
    },

    // --- Callback Session ---
    // Appelé chaque fois que la session est lue côté client
    async session({ session, token }): Promise<Session> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          plan: token.plan,
          provider: token.provider,
          accessToken: token.accessToken,
        },
        iat: token.iat,
        exp: token.exp,
      };
    },

    // --- Callback SignIn ---
    // Contrôle d'accès à la connexion
    async signIn({ user, account, profile }) {
      // Bloquer les connexions sans email
      if (!user.email) {
        console.error("[AcadémIA Pro] Tentative de connexion sans email :", {
          provider: account?.provider,
          userId: user.id,
        });
        return false;
      }

      // Exemple : bloquer les domaines non autorisés (optionnel)
      // const blockedDomains = ["spam.com", "tempmail.com"];
      // const domain = user.email.split("@")[1];
      // if (blockedDomains.includes(domain)) return false;

      console.info(
        `[AcadémIA Pro] Connexion réussie — ${user.email} via ${account?.provider}`
      );

      return true;
    },

    // --- Callback Redirect ---
    // Redirection après connexion / déconnexion
    async redirect({ url, baseUrl }) {