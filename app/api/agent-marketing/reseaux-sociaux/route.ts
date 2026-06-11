import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Post reseaux sociaux genere',
      plateforme: body?.plateforme || 'linkedin',
      contenu: 'Contenu genere par Agent AcadémIA Pro',
      statut: 'planifie'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'Agent Reseaux Sociaux Marketing AcadémIA Pro',
    plateformes: ['LinkedIn', 'Instagram', 'Facebook', 'TikTok'],
    statut: 'actif'
  });
}
