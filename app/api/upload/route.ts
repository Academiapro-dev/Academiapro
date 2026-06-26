import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agent_id')
  const search = searchParams.get('search')

  let query = supabase
    .from('agent_documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (agentId) {
    query = query.eq('agent_id', agentId)
  }

  if (search) {
    query = query.or(
      `file_name.ilike.%${search}%,description.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents: data })
}

export async function DELETE(request: NextRequest) {
  const { id, storage_path } = await request.json()

  if (!id || !storage_path) {
    return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 })
  }

  await supabase.storage
    .from('agent_documents')
    .remove([storage_path])

  const { error } = await supabase
    .from('agent_documents')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
