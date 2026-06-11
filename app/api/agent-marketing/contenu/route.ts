import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, domaine, formation } = body;

    return NextResponse.json({
      success: true,
      type: type || 'article-blog',
      domaine: domaine || 'IA',
      contenu: 'Contenu genere par Agent Marketing AcadémIA Pro',
      titre: 'Article sur ' + (formation || 'AcadémIA Pro'),
      mots_cles: ['formation IA', 'AcadémIA Pro', 'certification'],
      message: 'Contenu marketing genere avec succes'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur generation contenu' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'Agent Marketing Contenu AcadémIA Pro',
    types: ['article-blog', 'newsletter', 'temoignage', 'script-video'],
    statut: 'actif'
  });
}
