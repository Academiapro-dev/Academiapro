import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Campagne Google Ads generee',
      campagne: body?.type || 'search',
      statut: 'active'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur Google Ads' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'Agent Google Ads AcadémIA Pro',
    campagnes: ['Formations IA', 'Bien-etre', 'Langues', 'Packs'],
    statut: 'actif'
  });
}
