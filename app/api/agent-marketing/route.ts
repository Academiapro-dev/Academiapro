import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Action marketing executee',
      action: body?.action || 'generer-contenu',
      statut: 'actif'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur agent marketing' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'Agent Marketing AcadémIA Pro',
    modules: ['contenu', 'google-ads', 'meta-ads', 'reseaux-sociaux', 'ebook', 'webinaire'],
    statut: 'actif'
  });
}
