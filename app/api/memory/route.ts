import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = 'Academiapro-dev/Academiapro';

const BRAIN_FILES: Record<string, string> = {
  'mr-cam': 'MERCIER_BRAIN.md',
  'mr-comptable': 'BRAIN_MR_COMPTABLE.md',
  'mr-juridique': 'BRAIN_MR_JURIDIQUE.md',
  'agent-tuteur': 'BRAIN_AGENT_TUTEUR.md',
  'agent-marketing': 'BRAIN_AGENT_MARKETING.md',
  'agent-commercial': 'BRAIN_AGENT_COMMERCIAL.md',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agent') || 'mr-cam';
    
    const brainFile = BRAIN_FILES[agentId] || 'MERCIER_BRAIN.md';
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${brainFile}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mémoire non trouvée' 
      });
    }

    const memory = await response.text();

    return NextResponse.json({ 
      success: true, 
      memory,
      agent: agentId,
      fichier: brainFile
    });

  } catch (error) {
    console.error('Erreur API memory:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, memory } = await req.json();
    
    const brainFile = BRAIN_FILES[agentId] || 'MERCIER_BRAIN.md';
    
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${brainFile}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
        },
      }
    );

    const data: Record<string, string> = {
      message: `Update Brain ${agentId}`,
      content: Buffer.from(memory).toString('base64'),
      branch: 'main',
    };

    if (getResponse.ok) {
      const fileData = await getResponse.json();
      data['sha'] = fileData.sha;
    }

    const putResponse = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${brainFile}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (putResponse.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false });
    }

  } catch (error) {
    console.error('Erreur POST memory:', error);
    return NextResponse.json({ 
      success: false 
    }, { status: 500 });
  }
}