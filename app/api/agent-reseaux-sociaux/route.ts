import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Publication reseaux sociaux generee',
      plateforme: body?.plateforme || 'linkedin',
      statut: 'planifie'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur reseaux sociaux' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'Agent Reseaux Sociaux AcadémIA Pro',
    plateformes: ['LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube'],
    statut: 'actif'
  });
}
