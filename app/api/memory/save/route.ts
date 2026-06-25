import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { agent_id, session_id, session_label, conversation, context_summary, key_decisions } = await req.json()
    if (!agent_id || !session_id) {
      return NextResponse.json({ error: 'agent_id et session_id requis' }, { status: 400 })
    }
    const { data: existing } = await supabase
      .from('agent_memories')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('session_id', session_id)
      .single()
    if (existing) {
      const { data, error } = await supabase
        .from('agent_memories')
        .update({ conversation, context_summary, key_decisions, session_label })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, data, action: 'updated' })
    }
    const { data, error } = await supabase
      .from('agent_memories')
      .insert({ agent_id, session_id, session_label, conversation, context_summary, key_decisions })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, data, action: 'created' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}