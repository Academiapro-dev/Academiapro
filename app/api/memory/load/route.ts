import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')
    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id requis' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('agent_id', agent_id)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}