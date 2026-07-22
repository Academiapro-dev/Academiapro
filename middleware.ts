import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages reservees a un utilisateur connecte disposant d'une societe.
// Tout ce qui commence par ces chemins est protege.
const CHEMINS_PROTEGES = ['/admin'];

function estProtege(chemin: string): boolean {
  return CHEMINS_PROTEGES.some((p) => chemin === p || chemin.startsWith(p + '/'));
}

// Lit le cookie de session et en extrait le tenant_id.
function tenantDuCookie(request: NextRequest): string | null {
  try {
    const brut = request.cookies.get('sb_user')?.value;
    if (!brut) return null;
    let texte = brut;
    try {
      texte = decodeURIComponent(brut);
    } catch {
      texte = brut;
    }
    const donnees = JSON.parse(texte);
    return donnees?.tenant_id || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const chemin = request.nextUrl.pathname;

  if (!estProtege(chemin)) {
    return NextResponse.next();
  }

  const tenantId = tenantDuCookie(request);

  if (!tenantId) {
    // Redirection vers la connexion, en memorisant la page demandee
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('retour', chemin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
