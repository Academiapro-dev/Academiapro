import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)
  
  if (!limit || now > limit.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60000 })
    return true
  }
  
  if (limit.count >= 20) return false
  
  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter une minute.' },
        { status: 429 }
      )
    }

    const { messages, systemPrompt, agentId } = await request.json()

    if (!messages || !systemPrompt) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Validate messages
    if (!Array.isArray(messages) || messages.length > 50) {
      return NextResponse.json(
        { error: 'Format de messages invalide' },
        { status: 400 }
      )
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).substring(0, 2000),
      })),
    })

    return NextResponse.json({
      text: response.content[0].type === 'text' ? response.content[0].text : '',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      agentId,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur. Réessayez dans un instant.' },
      { status: 500 }
    )
  }
}
