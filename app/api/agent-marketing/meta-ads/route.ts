import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Campagne Meta Ads generee',
      plateforme: body?.plateforme || 'facebook',
      statut: 'active'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur Meta Ads' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'Agent Meta Ads AcadémIA Pro',
    plateformes: ['Facebook', 'Instagram'],
    statut: 'actif'
  });
}
