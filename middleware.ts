import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Les adresses autorisees a ouvrir l administration et la maintenance.
const ADMINS = ['contact@academiapro.fr'];

const CHEMINS_PROTEGES = ['/admin', '/maintenance'];
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
  '/admin/compliance/das2',
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
  '/admin/compliance/annexes',
  '/admin/compliance/liasse-2033',
  '/admin/compliance/liasse-2050',
  '/admin/compliance/liasse-2065',
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

// Ce fichier tourne sur le runtime Edge : ni Buffer ni le module crypto de
// Node n y sont disponibles. On decode donc en base64url a la main.
function base64urlVersTexte(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const reste = b64.length % 4;
  return atob(b64 + (reste === 0 ? '' : '='.repeat(4 - reste)));
}

function octetsVersBase64url(buffer: ArrayBuffer): string {
  const octets = new Uint8Array(buffer);
  let binaire = '';
  for (let i = 0; i < octets.length; i++) binaire += String.fromCharCode(octets[i]);
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function chargeDuJeton(jeton: string | undefined): any {
  if (!jeton) return null;
  try {
    const corps = jeton.split('.')[0];
    if (!corps) return null;
    return JSON.parse(base64urlVersTexte(corps));
  } catch {
    return null;
  }
}

function societeDuJeton(jeton: string | undefined): string | null {
  const charge = chargeDuJeton(jeton);
  return charge && charge.tid ? String(charge.tid) : null;
}

// VERIFICATION REELLE DE LA SIGNATURE. Sans elle, un cookie fabrique a la
// main ouvrait l administration : la presence du cookie ne prouve rien.
async function emailVerifie(jeton: string | undefined): Promise<string | null> {
  if (!jeton) return null;

  const secret = process.env.SESSION_SECRET || '';
  if (!secret) return null;

  const morceaux = jeton.split('.');
  if (morceaux.length !== 2) return null;

  try {
    const cle = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const calculee = await crypto.subtle.sign(
      'HMAC',
      cle,
      new TextEncoder().encode(morceaux[0])
    );

    if (octetsVersBase64url(calculee) !== morceaux[1]) return null;

    const charge = JSON.parse(base64urlVersTexte(morceaux[0]));
    if (!charge || !charge.email) return null;
    if (typeof charge.exp !== 'number') return null;
    if (Date.now() > charge.exp) return null;

    return String(charge.email).toLowerCase().trim();
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
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

  // ---- ADMINISTRATION ET MAINTENANCE : signature verifiee, adresse verifiee ----
  const email = await emailVerifie(session);

  if (!email) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (ADMINS.indexOf(email) < 0) {
    // Un refus explicite confirmerait que la page existe. On repond comme
    // si elle n existait pas.
    return new NextResponse('Page introuvable', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
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
