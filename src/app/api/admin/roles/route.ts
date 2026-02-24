import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('role_permissions')
    .select('*')
    .order('role_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roles: data })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  // ── CREATE ROLE ──────────────────────────────────────────
  if (action === 'create') {
    const { role_name, display_name, color } = body
    if (!role_name) return NextResponse.json({ error: 'role_name required' }, { status: 400 })

    // Start with empty permissions
    const { error } = await supabaseAdmin.from('role_permissions').insert({
      role_name,
      display_name: display_name || role_name,
      color: color || '#6b7280',
      pages: [],
      features: [],
      is_system: false,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── UPDATE ROLE PERMISSIONS ──────────────────────────────
  if (action === 'update') {
    const { role_name, pages, features, display_name, color } = body
    const updates: Record<string, unknown> = {}
    if (pages !== undefined) updates.pages = pages
    if (features !== undefined) updates.features = features
    if (display_name !== undefined) updates.display_name = display_name
    if (color !== undefined) updates.color = color

    const { error } = await supabaseAdmin
      .from('role_permissions')
      .update(updates)
      .eq('role_name', role_name)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── DELETE ROLE ──────────────────────────────────────────
  if (action === 'delete') {
    const { role_name } = body
    // Protect system roles
    const systemRoles = ['admin', 'print_room', 'truck_mover', 'trainee', 'driver']
    if (systemRoles.includes(role_name)) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('role_permissions').delete().eq('role_name', role_name)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── SEED DEFAULT ROLES (run once on first setup) ─────────
  if (action === 'seed') {
    const entries = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([role_name, perms]) => ({
      role_name,
      display_name: role_name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      color: roleColor(role_name),
      pages: perms.pages,
      features: perms.features,
      is_system: true,
    }))

    for (const entry of entries) {
      await supabaseAdmin.from('role_permissions').upsert(entry, { onConflict: 'role_name' })
    }
    return NextResponse.json({ ok: true, seeded: entries.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

function roleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: '#f59e0b',
    print_room: '#3b82f6',
    truck_mover: '#10b981',
    trainee: '#8b5cf6',
    driver: '#6b7280',
  }
  return colors[role] || '#6b7280'
}
