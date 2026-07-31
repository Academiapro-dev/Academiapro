import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages reservees a un utilisateur connecte.
const CHEMINS_PROTEGES = ['/admin'];

// Pages qui exigent EN PLUS une societe rattachee au compte.
const EXIGENT_SOCIETE = ['/admin/compliance', '/admin/qualiopi'];

// Exception : c'est par la qu'un nouveau client enregistre sa societe.
const EXCEPTIONS = ['/admin/compliance/ma-societe'];

// Pages de contenu reservees aux eleves connectes.
const CHEMINS_ELEVE = [
  '/lms',
  '/classe',
  '/classe-virtuelle',
  '/evaluation',
  '/mon-espace',
  '/mes-certificats',
  '/replay',
  '/dashboard',
  '/organisme',
];

// Routes API qui consomment les credits Claude et n'ont AUCUNE raison
// d'etre appelees par un inconnu.
const API_SESSION_REQUISE = [
  '/api/agent-tuteur',
  '/api/mr-cam',
  '/api/mr-comptable',
  '/api/mr-juridique',
];

// Nos propres adresses. Tout autre hote est le domaine d'un organisme
// client, et sa racine mene a sa vitrine.
const HOTES_CONNUS = [
  'academiapro.fr',
  'www.academiapro.fr',
  'localhost',
];

const NOM_COOKIE_SESSION = 'session_academia';

function correspond(chemin: string, liste: string[]): boolean {
  return liste.some((p) => chemin === p || chemin.startsWith(p + '/'));
}

function estNotre(hote: string): boolean {
  const h = hote.split(':')[0].toLowerCase();
  if (HOTES_CONNUS.indexOf(h) >= 0) return true;
  if (h.endsWith('.vercel.app')) return true;
  return false;
}

function societeDuJeton(jeton: string | undefined): string | null {
  if (!jeton) return null;
  try {
    const corps = jeton.split('.')[0];
    if (!corps) return null;
    const texte = Buffer.from(corps, 'base64url').toString('utf8');
    const charge = JSON.parse(texte);
    return charge && charge.tid ? String(charge.tid) : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;
  const session = request.cookies.get(NOM_COOKIE_SESSION)?.value;
  const hote = request.headers.get('host') || '';

  // DOMAINE PROPRE D'UN ORGANISME. On ne consulte PAS la base ici : ce serait
  // une requete a chaque page chargee. On se contente de reecrire vers la
  // vitrine, et c'est la route du portail qui reconnaitra l'hote.
  if (hote && !estNotre(hote) && chemin === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/of/@' + hote.split(':')[0].toLowerCase();
    return NextResponse.rewrite(url);
  }

  // Agents IA : refus net, sans redirection.
  if (correspond(chemin, API_SESSION_REQUISE)) {
    if (!session) {
      return NextResponse.json({ success: false, error: 'non connecte' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Espace eleve : il faut un cookie de session.
  if (correspond(chemin, CHEMINS_ELEVE)) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!correspond(chemin, CHEMINS_PROTEGES)) {
    return NextResponse.next();
  }

  // ADMINISTRATION : le cookie signe est exige.
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Seuls Compliance et Qualiopi exigent une societe rattachee.
  if (correspond(chemin, EXIGENT_SOCIETE) && !correspond(chemin, EXCEPTIONS)) {
    const societe = societeDuJeton(session);
    if (!societe) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/compliance/ma-societe';
      url.search = '';
      return NextResponse.redirect(url);
    }
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
