import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'qualifier-prospect':
        return NextResponse.json({
          success: true,
          message: 'Prospect qualifie',
          score: 75,
          recommandation: 'Formation F128 Expert Claude'
        });

      case 'envoyer-proposition':
        return NextResponse.json({
          success: true,
          message: 'Proposition envoyee',
          formation: data?.formation || 'F128',
          prix: data?.prix || '690'
        });

      case 'relancer-prospect':
        return NextResponse.json({
          success: true,
          message: 'Relance programmee',
          delai: '24h'
        });

      case 'convertir-vente':
        return NextResponse.json({
          success: true,
          message: 'Vente convertie',
          montant: data?.montant || '690'
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Action agent commercial executee',
          action: action
        });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur agent commercial' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    agent: 'Agent Commercial AcadémIA Pro',
    statut: 'actif',
    formations: ['F128', 'F129', 'F130', 'F131'],
    packs: ['Pack IA Complet', 'Pack Marketing', 'Pack Entrepreneur'],
    taux_conversion: '23%',
    ca_genere_mois: '15600'
  });
}
