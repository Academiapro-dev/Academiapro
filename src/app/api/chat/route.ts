import { NextRequest, NextResponse } from 'next/server'
import { AGENTS } from '../../../../data'

export async function POST(req: NextRequest) {
  const { agentId, messages } = await req.json()

  const agent = AGENTS.find((a: any) => a.id === agentId) || AGENTS[0]

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
    }),
  })

  const data = await res.json()
  const content = data.content?.[0]?.text || 'Désolé, une erreur est survenue.'

  return NextResponse.json({ content })
}

