import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages reservees a un utilisateur connecte disposant d'une societe.
const CHEMINS_PROTEGES = ['/admin'];

// Exceptions : accessibles a un utilisateur connecte MEME sans societe.
// C'est par la que passe un nouveau client pour enregistrer la sienne.
const EXCEPTIONS = ['/admin/compliance/ma-societe'];

function estProtege(chemin: string): boolean {
  return CHEMINS_PROTEGES.some((p) => chemin === p || chemin.startsWith(p + '/'));
}

function estException(chemin: string): boolean {
  return EXCEPTIONS.some((p) => chemin === p || chemin.startsWith(p + '/'));
}

// Lit le cookie de session : identifiant du compte et societe rattachee.
function sessionDuCookie(request: NextRequest): { id: string | null; tenantId: string | null } {
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

  if (!estProtege(chemin)) {
    return NextResponse.next();
  }

  const { id, tenantId } = sessionDuCookie(request);

  // Aucun compte connecte : direction la connexion, quelle que soit la page
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
