import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, message: 'Campagne Google Ads generee', data: body });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, agent: 'Google Ads AcadémIA Pro', statut: 'actif' });
}