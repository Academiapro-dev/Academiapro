import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Les adresses autorisees a ouvrir l administration et la maintenance.
const ADMINS = ['contact@academiapro.fr'];

const CHEMINS_PROTEGES = ['/admin', '/maintenance'];

// Les ecrans clients de Mr. Comptable : ouverts a tout utilisateur connecte
// portant un organisme. Les routes de donnees sont deja cloisonnees par
// organisme et par role, un client ne voit que ses propres dossiers.
const ESPACE_CLIENT = ['/admin/compliance', '/admin/qualiopi'];

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

// MARQUES DE LA MAISON.
//
// Un meme deploiement sert plusieurs domaines : le code est unique, seule la
// vitrine change. Le visiteur qui arrive par mrcomptable.fr voit les pages
// de /comptable sans que l adresse le trahisse.
//
// ATTENTION : un hote absent de cette liste ET de HOTES_CONNUS est traite
// comme un portail de marque blanche d organisme, et sa racine part vers
// /of/@son-domaine. Un domaine de la maison oublie ici tombe donc sur une
// page vide.
const MARQUES: Record<string, string> = {
  'mrcomptable.fr': '/comptable',
  'www.mrcomptable.fr': '/comptable',
};

const NOM_COOKIE_SESSION = 'session_academia';

function correspond(chemin: string, liste: string[]): boolean {
  return liste.some((p) => chemin === p || chemin.startsWith(p + '/'));
}

function hoteNu(hote: string): string {
  return hote.split(':')[0].toLowerCase();
}

function estNotre(hote: string): boolean {
  const h = hoteNu(hote);
  if (HOTES_CONNUS.indexOf(h) >= 0) return true;
  if (MARQUES[h]) return true;
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

// Verification reelle de la signature. Renvoie la charge du jeton ou null.
async function jetonVerifie(jeton: string | undefined): Promise<any> {
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

    return charge;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;
  const session = request.cookies.get(NOM_COOKIE_SESSION)?.value;
  const hote = request.headers.get('host') || '';
  const h = hoteNu(hote);

  // Une marque de la maison : la racine et les pages de vitrine partent vers
  // le dossier du produit. Le reste — connexion, espaces, administration —
  // continue de fonctionner tel quel, sur le meme deploiement.
  const racineMarque = MARQUES[h];
  if (racineMarque) {
    if (chemin === '/') {
      const url = request.nextUrl.clone();
      url.pathname = racineMarque;
      return NextResponse.rewrite(url);
    }
    // Les pages de la vitrine se demandent sans prefixe depuis ce domaine :
    // mrcomptable.fr/inscription sert /comptable/inscription. On ne reecrit
    // que si la page existe cote produit ; les chemins connus de la maison
    // passent leur chemin.
    const RESERVES = ['/admin', '/api', '/connexion', '/comptable', '/of', '/maintenance', '/_next'];
    if (!correspond(chemin, RESERVES)) {
      const url = request.nextUrl.clone();
      url.pathname = racineMarque + chemin;
      return NextResponse.rewrite(url);
    }
  }

  if (hote && !estNotre(hote) && chemin === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/of/@' + h;
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

  const charge = await jetonVerifie(session);

  if (!charge) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const email = String(charge.email).toLowerCase().trim();
  const estAdmin = ADMINS.indexOf(email) >= 0;
  const estEspaceClient = correspond(chemin, ESPACE_CLIENT);

  // Hors espace client, tout /admin reste reserve a l administrateur.
  if (!estAdmin && !estEspaceClient) {
    return new NextResponse('Page introuvable', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (correspond(chemin, EXIGENT_SOCIETE) && !correspond(chemin, EXCEPTIONS)) {
    if (!charge.tid) {
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
