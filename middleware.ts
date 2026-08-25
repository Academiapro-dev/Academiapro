import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Les adresses autorisees a ouvrir l administration et la maintenance.
const ADMINS = ['contact@academiapro.fr'];

const CHEMINS_PROTEGES = ['/admin', '/maintenance'];

// 🚨 L ESPACE COMPTABLE S APPELLE /admin/comptable — 25/08.
//
// LE DEFAUT. Les trente ecrans de Mr. Comptable vivent dans
// app/admin/compliance/. Un cabinet qui utilise le logiciel lit donc
// « compliance » dans sa barre d adresse, sur un espace comptable. Ca fait
// bricolage, et ces cabinets sont des prospects avant d etre des clients.
//
// POURQUOI PAS UN RENOMMAGE DE DOSSIERS. Renommer les trente dossiers
// imposerait de rouvrir chaque fichier pour corriger ses liens internes,
// sur iPad, un par un — et le premier oubli casse un ecran sans prevenir.
//
// LE MECANISME TIENT EN DEUX PIECES, ET L ORDRE COMPTE :
//
//   1. UNE REDIRECTION 308 de /admin/compliance vers /admin/comptable.
//      Elle rattrape les liens internes des trente pages, ceux d un
//      favori, ceux d un courriel deja envoye. Aucun fichier de page n a
//      donc besoin d etre modifie.
//
//   2. UNE REECRITURE de /admin/comptable vers le dossier reel, a la
//      SORTIE de cette fonction.
//
// 🚨🚨 LE PIEGE DE LA BOUCLE. Rediriger vers /admin/comptable puis
// reecrire vers /admin/compliance ne boucle PAS, parce que la reecriture
// est INTERNE : le navigateur ne redemande rien, il ne voit jamais
// /admin/compliance. Une REDIRECTION a la place de la reecriture, elle,
// bouclerait a l infini. NE JAMAIS transformer sortie() en redirect.
//
// 🚨🚨 LE SECOND PIEGE, PLUS GRAVE. Une reecriture posee en TETE de cette
// fonction rendrait la page AVANT les controles de session : n importe qui
// atteindrait /admin/comptable/crm sans etre connecte. Un rewrite retourne
// immediatement, il ne « continue » pas. D ou cheminEffectif, calcule des
// la premiere ligne et utilise par TOUS les tests correspond() ci-dessous.
//
// ⚠️ NE JAMAIS REMPLACER cheminEffectif PAR chemin dans ces tests.
const ALIAS_COMPTABLE = '/admin/comptable';
const REEL_COMPTABLE = '/admin/compliance';

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

  // ---- PIECE 1 : L ANCIENNE ADRESSE PART VERS LA NOUVELLE ----------------
  //
  // 308 ET NON 302 : le 308 est PERMANENT, il conserve la methode, et un
  // navigateur le met en cache. Un favori pointant sur l ancienne adresse
  // finit par ne plus jamais la demander.
  //
  // PLACEE TOUT EN TETE : rien ne sert de controler une session sur une
  // adresse qui va etre abandonnee. Les controles se feront au tour
  // suivant, sur la nouvelle adresse.
  //
  // LA CHAINE DE REQUETE EST CONSERVEE — clone() la garde par defaut.
  if (chemin === REEL_COMPTABLE || chemin.startsWith(REEL_COMPTABLE + '/')) {
    const url = request.nextUrl.clone();
    url.pathname = ALIAS_COMPTABLE + chemin.slice(REEL_COMPTABLE.length);
    return NextResponse.redirect(url, 308);
  }

  // ---- PIECE 2 : LA NOUVELLE ADRESSE SERT LE DOSSIER REEL ---------------
  //
  // cheminEffectif est ce que le code doit VOIR. chemin reste ce que le
  // navigateur AFFICHE. Les deux ne different que sous /admin/comptable.
  const estAliasComptable = chemin === ALIAS_COMPTABLE
    || chemin.startsWith(ALIAS_COMPTABLE + '/');
  const cheminEffectif = estAliasComptable
    ? REEL_COMPTABLE + chemin.slice(ALIAS_COMPTABLE.length)
    : chemin;

  // LA SORTIE NORMALE. Sous l alias, elle reecrit vers le dossier reel ;
  // partout ailleurs, elle laisse passer. Toute sortie « tout va bien » de
  // cette fonction doit passer par ici, sans quoi l alias rendrait une
  // page introuvable.
  //
  // ⚠️ C EST UNE REECRITURE, PAS UNE REDIRECTION. Une redirection ici
  // bouclerait avec la piece 1.
  function sortie() {
    if (!estAliasComptable) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = cheminEffectif;
    return NextResponse.rewrite(url);
  }

  // LE SITEMAP DE MR. COMPTABLE, AVANT TOUTE REECRITURE DE MARQUE.
  //
  // Ce fichier doit etre servi sur mrcomptable.fr lui-meme : Search Console
  // refuse un sitemap heberge sur un autre domaine que la propriete. Sans
  // cette regle, l adresse partait vers /comptable/sitemap-comptable.xml —
  // qui n existe pas — et Google repondait « impossible de recuperer le
  // sitemap ». La route vit sous /api parce qu un dossier portant un point
  // dans son nom n est pas servi par Next.js.
  if (chemin === '/sitemap-comptable.xml') {
    const url = request.nextUrl.clone();
    url.pathname = '/api/sitemap-comptable';
    return NextResponse.rewrite(url);
  }

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
    //
    // TOUT CE QUI PORTE UNE EXTENSION EST LAISSE TEL QUEL. Le logo depose
    // dans public/ partait vers /comptable/IMG_4100.jpeg, qui n existe pas :
    // la barre de Mr. Comptable affichait une image cassee. Un fichier n est
    // jamais une page de vitrine.
    //
    // ⚠️ '/admin' COUVRE AUSSI '/admin/comptable' : l alias n est donc pas
    // avale par cette reecriture de marque, et un cabinet connecte sur
    // mrcomptable.fr reste bien sur son espace.
    const RESERVES = ['/admin', '/api', '/connexion', '/comptable', '/of', '/maintenance', '/_next'];
    const estFichier = chemin.lastIndexOf('.') > chemin.lastIndexOf('/');
    if (!estFichier && !correspond(chemin, RESERVES)) {
      const url = request.nextUrl.clone();
      url.pathname = racineMarque + chemin;
      return NextResponse.rewrite(url);
    }
  }

  // 🚨 UNE FICHE DE FORMATION N A QU UNE SEULE ADRESSE — 17/08.
  //
  // LE DEFAUT. Le catalogue construisait ses liens en minuscules avec
  // toLowerCase(), donc /formation/f005, tandis que LE SITEMAP ET LA
  // CANONIQUE declarent le code tel qu il est en base : /formation/F005.
  // Les deux adresses servaient exactement la meme page — la route et le
  // layout normalisent le code avant de chercher en base.
  //
  // CE QUE GOOGLE EN A FAIT. Search Console a signale « Page en double :
  // Google n a pas choisi la meme URL canonique que l utilisateur », et
  // dix-neuf pages en double sans canonique retenue. Le moteur suivait des
  // liens internes vers une adresse dont la canonique pointait ailleurs.
  //
  // POURQUOI UNE REDIRECTION ET NON UN SIMPLE ALIGNEMENT DES LIENS. Jacques
  // a repris ma premiere solution, qui se contentait de corriger les liens
  // du catalogue : « pourquoi laisser deux adresses identiques ? ». Il a
  // raison — les liens deja partages, ceux du blog, ceux d un courriel
  // envoye la semaine derniere resteraient en minuscules. Une redirection
  // permanente les ramene tous vers l adresse unique ET transmet leur
  // valeur de referencement, ce qu un simple changement de lien ne fait pas.
  //
  // 308 ET NON 302 : le 308 est PERMANENT, Google remplace l ancienne
  // adresse par la nouvelle dans son index. Un 302 laisserait les deux.
  //
  // PLACEE APRES LE BLOC DES MARQUES, pour ne rien changer sur
  // mrcomptable.fr. La chaine de requete est conservee : /formation/f005?lang=en
  // arrive bien sur /formation/F005?lang=en.
  if (chemin.startsWith('/formation/')) {
    const morceaux = chemin.split('/');
    const code = morceaux[2] || '';
    if (code && code !== code.toUpperCase()) {
      morceaux[2] = code.toUpperCase();
      const url = request.nextUrl.clone();
      url.pathname = morceaux.join('/');
      return NextResponse.redirect(url, 308);
    }
  }

  if (hote && !estNotre(hote) && chemin === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/of/@' + h;
    return NextResponse.rewrite(url);
  }

  if (correspond(cheminEffectif, API_SESSION_REQUISE)) {
    if (!session) {
      return NextResponse.json({ success: false, error: 'non connecte' }, { status: 401 });
    }
    return sortie();
  }

  if (correspond(cheminEffectif, CHEMINS_ELEVE)) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return sortie();
  }

  if (!correspond(cheminEffectif, CHEMINS_PROTEGES)) return sortie();

  const charge = await jetonVerifie(session);

  if (!charge) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const email = String(charge.email).toLowerCase().trim();
  const estAdmin = ADMINS.indexOf(email) >= 0;
  const estEspaceClient = correspond(cheminEffectif, ESPACE_CLIENT);

  // Hors espace client, tout /admin reste reserve a l administrateur.
  if (!estAdmin && !estEspaceClient) {
    return new NextResponse('Page introuvable', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (correspond(cheminEffectif, EXIGENT_SOCIETE) && !correspond(cheminEffectif, EXCEPTIONS)) {
    if (!charge.tid) {
      const url = request.nextUrl.clone();
      url.pathname = ALIAS_COMPTABLE + '/ma-societe';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return sortie();
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
