import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CHEMINS_PROTEGES = ['/admin'];
const EXIGENT_SOCIETE = ['/admin/compliance', '/admin/qualiopi'];

// Tous les ecrans comptables : les exiger rattaches a une societe les
// rendrait inatteignables.
const EXCEPTIONS = [
  '/admin/compliance/ma-societe',
  '/admin/compliance/tableau-de-bord',
  '/admin/compliance/societes',
  '/admin/compliance/comptes',
  '/admin/compliance/saisie',
  '/admin/compliance/reprise',
  '/admin/compliance/tva',
  '/admin/compliance/balance',
  '/admin/compliance/releve',
  '/admin/compliance/rapprochement',
  '/admin/compliance/lettrage',
  '/admin/compliance/immobilisations',
  '/admin/compliance/provisions',
  '/admin/compliance/paie',
  '/admin/compliance/cloture',
  '/admin/compliance/verrouillage',
  '/admin/compliance/revision',
  '/admin/compliance/liasse-2033',
  '/admin/compliance/liasse-2050',
  '/admin/compliance/pieces',
  '/admin/compliance/collaborateurs',
];

const CHEMINS_ELEVE = [
  '/lms', '/classe', '/classe-virtuelle', '/evaluation', '/mon-espace',
  '/mes-certificats', '/replay', '/dashboard', '/organisme',
];

const API_SESSION_REQUISE = [
  '/api/agent-tuteur', '/api/mr-cam', '/api/mr-comptable', '/api/mr-juridique',
];

const HOTES_CONNUS = ['academiapro.fr', 'www.academiapro.fr', 'localhost'];

const NOM_COOKIE_SESSION = 'session_academia';

function correspond(chemin: string, liste: string[]): boolean {
  return liste.some((p) => chemin === p || chemin.startsWith(p + '/'));
}

function estNotre(hote: string): boolean {
  const h = hote.split(':')[0].toLowerCase();
  if (HOTES_CONNUS.indexOf(h) >= 0) return true;
  return h.endsWith('.vercel.app');
}

function societeDuJeton(jeton: string | undefined): string | null {
  if (!jeton) return null;
  try {
    const corps = jeton.split('.')[0];
    if (!corps) return null;
    const charge = JSON.parse(Buffer.from(corps, 'base64url').toString('utf8'));
    return charge && charge.tid ? String(charge.tid) : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;
  const session = request.cookies.get(NOM_COOKIE_SESSION)?.value;
  const hote = request.headers.get('host') || '';

  if (hote && !estNotre(hote) && chemin === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/of/@' + hote.split(':')[0].toLowerCase();
    return NextResponse.rewrite(url);
  }

  if (correspond(chemin, API_SESSION_REQUISE)) {
    if (!session) {
      return NextResponse.json({ success: false, error: 'non connecte' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (correspond(chemin, CHEMINS_ELEVE)) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!correspond(chemin, CHEMINS_PROTEGES)) return NextResponse.next();

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (correspond(chemin, EXIGENT_SOCIETE) && !correspond(chemin, EXCEPTIONS)) {
    if (!societeDuJeton(session)) {
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
