import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages reservees a un utilisateur connecte disposant d'une societe.
const CHEMINS_PROTEGES = ['/admin'];

// Exceptions : accessibles a un utilisateur connecte MEME sans societe.
// C'est par la que passe un nouveau client pour enregistrer la sienne.
const EXCEPTIONS = ['/admin/compliance/ma-societe'];

// Pages de contenu reservees aux eleves connectes (verrou 1, couche 1).
const CHEMINS_ELEVE = [
  '/lms',
  '/classe',
  '/classe-virtuelle',
  '/evaluation',
  '/mon-espace',
  '/mes-certificats',
  '/replay',
  '/dashboard',
];

// Routes API qui consomment les credits Claude et n'ont AUCUNE raison
// d'etre appelees par un inconnu. Ne jamais ajouter ici une route
// declenchee par un cron Vercel : un cron n'a pas de cookie de session.
const API_SESSION_REQUISE = [
  '/api/agent-tuteur',
  '/api/mr-cam',
  '/api/mr-comptable',
  '/api/mr-juridique',
];

const NOM_COOKIE_SESSION = 'session_academia';

function correspond(chemin: string, liste: string[]): boolean {
  return liste.some((p) => chemin === p || chemin.startsWith(p + '/'));
}

function estProtege(chemin: string): boolean {
  return correspond(chemin, CHEMINS_PROTEGES);
}

function estException(chemin: string): boolean {
  return correspond(chemin, EXCEPTIONS);
}

function estEspaceEleve(chemin: string): boolean {
  return correspond(chemin, CHEMINS_ELEVE);
}

function estApiSessionRequise(chemin: string): boolean {
  return correspond(chemin, API_SESSION_REQUISE);
}

// Lit le cookie sb_user : il renseigne la societe rattachee au compte.
// Il n'est PAS signe, donc il ne prouve rien : il ne sert plus a authentifier.
function societeDuCookie(request: NextRequest): { id: string | null; tenantId: string | null } {
  try {
    const brut = request.cookies.get('sb_user')?.value;
    if (!brut) return { id: null, tenantId: null };
    let texte = brut;
    try {
      texte = decodeURIComponent(brut);
    } catch {
      texte = brut;
    }
    const donnees = JSON.parse(texte);
    return { id: donnees?.id || null, tenantId: donnees?.tenant_id || null };
  } catch {
    return { id: null, tenantId: null };
  }
}

export function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;

  // Agents IA : refus net, sans redirection (c'est une API, pas une page).
  if (estApiSessionRequise(chemin)) {
    const session = request.cookies.get(NOM_COOKIE_SESSION)?.value;
    if (!session) {
      return NextResponse.json({ success: false, error: 'non connecte' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Espace eleve : il faut un cookie de session. La verification de sa
  // signature et du droit sur la formation se fait dans les pages elles-memes.
  if (estEspaceEleve(chemin)) {
    const session = request.cookies.get(NOM_COOKIE_SESSION)?.value;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!estProtege(chemin)) {
    return NextResponse.next();
  }

  // ADMINISTRATION : le cookie signe est desormais exige. Sans lui,
  // un sb_user fabrique a la main ne donne plus aucun acces.
  const session = request.cookies.get(NOM_COOKIE_SESSION)?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const { id, tenantId } = societeDuCookie(request);

  // Aucune societe connue : direction la connexion classique
  if (!id) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('retour', chemin);
    return NextResponse.redirect(url);
  }

  // Connecte mais sans societe : seule la page d'enregistrement est ouverte
  if (!tenantId) {
    if (estException(chemin)) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin/compliance/ma-societe';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/agent-tuteur/:path*',
    '/api/agent-tuteur',
    '/api/mr-cam/:path*',
    '/api/mr-cam',
    '/api/mr-comptable/:path*',
    '/api/mr-comptable',
    '/api/mr-juridique/:path*',
    '/api/mr-juridique',
  ],
};
