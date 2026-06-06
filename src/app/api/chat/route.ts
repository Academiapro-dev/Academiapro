import { NextRequest, NextResponse } from 'next/server'
import { AGENTS } from '../../../data'

const MOTS_CLES_PDF = [
  'support de cours', 'pdf', 'cours en pdf', 'documents', 'supports',
  'télécharger', 'telecharger', 'envoie-moi', 'envoyer', 'ma formation',
  'mon cours', 'les documents', 'le programme', 'cours complet'
]

export async function POST(req: NextRequest) {
  const { agentId, messages, userEmail, formationCode } = await req.json()

  const agent = AGENTS.find((a: any) => a.id === agentId) || AGENTS[0]

  // Détecter si le stagiaire demande son support de cours
  const dernierMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
  const demandePDF = MOTS_CLES_PDF.some(mot => dernierMessage.includes(mot))

  if (demandePDF && userEmail && formationCode) {
    try {
      const sendRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://academiapro.vercel.app'}/api/send-formation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, formation_code: formationCode })
      })
      const sendData = await sendRes.json()

      if (sendData.success) {
        return NextResponse.json({ 
          content: `✅ Parfait ! Je viens d'envoyer votre support de cours complet de la formation F01 à l'adresse ${userEmail}. Vérifiez votre boîte mail dans quelques instants. 📚` 
        })
      } else {
        return NextResponse.json({ 
          content: `Je n'ai pas pu envoyer votre support de cours. ${sendData.error || 'Veuillez contacter notre équipe.'}` 
        })
      }
    } catch (e) {
      return NextResponse.json({ 
        content: `Une erreur est survenue lors de l'envoi. Veuillez réessayer.` 
      })
    }
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: agent.system,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })
  })

  const data = await res.json()
  const content = data.content?.[0]?.text || 'Désolé, une erreur est survenue.'

  return NextResponse.json({ content })
}
