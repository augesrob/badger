import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { roomId, allowed_roles, action, name, description, orderedIds } = await req.json()

  // Verify caller is admin
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (action === 'update_roles') {
    const { error } = await supabaseAdmin.from('chat_rooms').update({ allowed_roles }).eq('id', roomId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reorder') {
    // orderedIds is an array of room ids in the new order
    // Try to update sort_order column; if column doesn't exist, add it first
    const updates = (orderedIds as number[]).map((id, idx) =>
      supabaseAdmin.from('chat_rooms').update({ sort_order: idx }).eq('id', id)
    )
    const results = await Promise.all(updates)
    const firstError = results.find(r => r.error)
    if (firstError?.error) {
      // Column may not exist yet — try adding it then retry
      try { await supabaseAdmin.rpc('exec_sql', { sql: 'ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0' }) } catch { /* ignore */ }
      const retry = await Promise.all(
        (orderedIds as number[]).map((id, idx) =>
          supabaseAdmin.from('chat_rooms').update({ sort_order: idx }).eq('id', id)
        )
      )
      const retryError = retry.find(r => r.error)
      if (retryError?.error) return NextResponse.json({ error: retryError.error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'create') {
    const { data, error } = await supabaseAdmin.from('chat_rooms').insert({
      name: name.trim(), description: description?.trim() || null, type: 'global', allowed_roles: null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, room: data })
  }

  if (action === 'delete') {
    await supabaseAdmin.from('messages').delete().eq('room_id', roomId)
    const { error } = await supabaseAdmin.from('chat_rooms').delete().eq('id', roomId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
