```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ============================================================
// CONFIGURATION DES ROUTES
// ============================================================

const ROUTE_CONFIG = {
  // Routes protégées par authentification simple
  protected: [
    "/dashboard",
    "/formation",
    "/seances",
    "/crm",
    "/profile",
    "/settings",
  ],

  // Routes nécessitant un rôle admin
  adminOnly: [
    "/admin",
    "/admin/users",
    "/admin/settings",
    "/admin/analytics",
    "/admin/billing",
  ],

  // Routes nécessitant un rôle formateur ou admin
  formateur: [
    "/formation/create",
    "/formation/edit",
    "/seances/create",
    "/seances/manage",
    "/crm/export",
  ],

  // Routes publiques (catalogue, inscription, etc.)
  public: [
    "/",
    "/catalogue",
    "/catalogue/[id]",
    "/inscription",
    "/inscription/success",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/about",
    "/contact",
    "/pricing",
  ],

  // Routes API publiques
  publicApi: [
    "/api/auth",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/catalogue",
    "/api/formations/public",
    "/api/inscription",
    "/api/webhook",
    "/api/health",
  ],

  // Routes API protégées
  protectedApi: [
    "/api/dashboard",
    "/api/formations",
    "/api/seances",
    "/api/crm",
    "/api/profile",
    "/api/settings",
  ],

  // Routes API admin uniquement
  adminApi: [
    "/api/admin",
    "/api/users",
    "/api/analytics",
    "/api/billing",
  ],
};

// ============================================================
// TYPES
// ============================================================

interface JWTPayload {
  sub: string;
  email: string;
  role: "admin" | "formateur" | "apprenant" | "entreprise";
  sessionId: string;
  iat: number;
  exp: number;
}

type AuthResult =
  | { authenticated: false; payload: null }
  | { authenticated: true; payload: JWTPayload };

// ============================================================
// CONSTANTES
// ============================================================

const LOGIN_URL = "/login";
const UNAUTHORIZED_URL = "/unauthorized";
const API_UNAUTHORIZED_RESPONSE = {
  error: "Non autorisé",
  message: "Authentification requise",
  code: "UNAUTHORIZED",
};
const API_FORBIDDEN_RESPONSE = {
  error: "Accès refusé",
  message: "Vous n'avez pas les permissions nécessaires",
  code: "FORBIDDEN",
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "academiapro-secret-key-change-in-production"
);

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "academiapro_token";
const REFRESH_COOKIE_NAME =
  process.env.REFRESH_COOKIE_NAME || "academiapro_refresh";

// ============================================================
// HELPERS - VÉRIFICATION DES ROUTES
// ============================================================

/**
 * Vérifie si un chemin correspond à un pattern (supporte les wildcards)
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  // Correspondance exacte
  if (pathname === pattern) return true;

  // Correspondance avec préfixe (sous-routes)
  if (pathname.startsWith(pattern + "/")) return true;

  // Pattern avec wildcard [id] -> convertit en regex
  if (pattern.includes("[")) {
    const regexPattern = pattern
      .replace(/\[.*?\]/g, "[^/]+")
      .replace(/\//g, "\\/");
    const regex = new RegExp(`^${regexPattern}(\\/.*)?$`);
    return regex.test(pathname);
  }

  return false;
}

/**
 * Vérifie si une route correspond à une liste de patterns
 */
function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some((route) => matchesPattern(pathname, route));
}

/**
 * Détermine le type de route
 */
function getRouteType(pathname: string): {
  isPublic: boolean;
  isPublicApi: boolean;
  isProtected: boolean;
  isProtectedApi: boolean;
  isAdmin: boolean;
  isAdminApi: boolean;
  isFormateur: boolean;
  isApi: boolean;
  isAuthRoute: boolean;
  isStaticAsset: boolean;
} {
  const isApi = pathname.startsWith("/api/");
  const isStaticAsset =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon");

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  return {
    isApi,
    isStaticAsset,
    isAuthRoute,
    isPublic: matchesRoutes(pathname, ROUTE_CONFIG.public),
    isPublicApi: matchesRoutes(pathname, ROUTE_CONFIG.publicApi),
    isProtected: matchesRoutes(pathname, ROUTE_CONFIG.protected),
    isProtectedApi: matchesRoutes(pathname, ROUTE_CONFIG.protectedApi),
    isAdmin: matchesRoutes(pathname, ROUTE_CONFIG.adminOnly),
    isAdminApi: matchesRoutes(pathname, ROUTE_CONFIG.adminApi),
    isFormateur: matchesRoutes(pathname, ROUTE_CONFIG.formateur),
  };
}

// ============================================================
// AUTHENTIFICATION
// ============================================================

/**
 * Extrait et vérifie le JWT depuis les cookies ou headers
 */
async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // 1. Récupération du token depuis les cookies
    let token = request.cookies.get(COOKIE_NAME)?.value;

    // 2. Fallback sur le header Authorization (Bearer token)
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 3. Fallback sur le cookie de session Next.js
    if (!token) {
      token = request.cookies.get("__Secure-next-auth.session-token")?.value;
      token =
        token ||
        request.cookies.get("next-auth.session-token")?.value;
    }

    if (!token) {
      return { authenticated: false, payload: null };
    }

    // 4. Vérification du JWT
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // 5. Validation des champs requis
    if (
      !payload.sub ||
      !payload.email ||
      !payload.role ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      return { authenticated: false, payload: null };
    }

    return {
      authenticated: true,
      payload: payload as unknown as JWTPayload,
    };
  } catch (error) {
    // Token expiré, invalide ou malformé
    if (process.env.NODE_ENV === "development") {
      console.error("[Middleware] Erreur JWT:", error);
    }
    return { authenticated: false, payload: null };
  }
}

/**
 * Vérifie si l'utilisateur a le rôle requis
 */
function hasRequiredRole(
  userRole: JWTPayload["role"],
  requiredRoles: JWTPayload["role"][]
): boolean {
  // Admin a accès à tout
  if (userRole === "admin") return true;
  return requiredRoles.includes(userRole);
}

// ============================================================
// CONSTRUCTEURS DE RÉPONSES
// ============================================================

/**
 * Crée une réponse de redirection vers le login
 */
function redirectToLogin(
  request: NextRequest,
  reason?: string
): NextResponse {
  const loginUrl = new URL(LOGIN_URL, request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  if (reason) {
    loginUrl.searchParams.set("reason", reason);
  }

  const response = NextResponse.redirect(loginUrl);

  // Suppression des cookies invalides
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);

  return response;
}

/**
 * Crée une réponse de redirection vers la page non autorisée
 */
function redirectToUnauthorized(request: NextRequest): NextResponse {
  const unauthorizedUrl = new URL(UNAUTHORIZED_URL, request.url);
  unauthorizedUrl.searchParams.set(
    "from",
    request.nextUrl.pathname
  );
  return NextResponse.redirect(unauthorizedUrl);
}

/**
 * Crée une réponse API d'erreur
 */
function apiErrorResponse(
  status: 401 | 403,
  body: typeof API_UNAUTHORIZED_RESPONSE | typeof API_FORBIDDEN_RESPONSE
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-AcadémIA-Error": body.code,
    },
  });
}

/**
 * Crée une réponse avec les headers d'identité utilisateur
 */
function createAuthenticatedResponse(
  request: NextRequest,
  payload: JWTPayload
): NextResponse {
  const response = NextResponse.next();

  // Injection des informations utilisateur dans les headers
  // (accessible côté serveur dans les Server Components)
  response.headers.set("x-user-id", payload.sub);
  response.headers.set("x-user-email", payload.email);
  response.headers.set("x-user-role", payload.role);
  response.headers.set("x-session-id", payload.sessionId || "");

  // Headers de sécurité
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

// ============================================================
// LOGIQUE PRINCIPALE DU MIDDLEWARE
// ============================================================

/**
 * Traitement des routes API
 */
async function handleApiRoute(
  request: NextRequest,
  pathname: string,
  routeType: ReturnType<typeof getRouteType>
): Promise<NextResponse> {
  // Routes API publiques -> passage direct
  if (routeType.isPublicApi) {
    return NextResponse.next();
  }

  // Vérification de l'authentification pour les routes API protégées
  const authResult = await verifyAuth(request);

  if (!authResult.authenticated) {
    return apiErrorResponse