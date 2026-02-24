import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function verifyAdmin(requesterId: string) {
  const { data } = await admin.from('profiles').select('role').eq('id', requesterId).single()
  return data?.role === 'admin'
}

// POST: update a user's profile and/or auth account
export async function POST(req: Request) {
  try {
    const { requesterId, targetId, updates } = await req.json()
    if (!await verifyAdmin(requesterId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const profileUpdates: Record<string, unknown> = {}
    const authUpdates:    Record<string, unknown> = {}
    const errors: string[] = []

    if (updates.displayName !== undefined) profileUpdates.display_name = updates.displayName || null
    if (updates.role        !== undefined) profileUpdates.role         = updates.role
    if (updates.phone       !== undefined) profileUpdates.phone        = updates.phone || null
    if (updates.smsEnabled  !== undefined) profileUpdates.sms_enabled  = updates.smsEnabled

    if (updates.username !== undefined) {
      const uname = updates.username.trim().toLowerCase()
      const { data: existing } = await admin.from('profiles')
        .select('id').eq('username', uname).neq('id', targetId).maybeSingle()
      if (existing) errors.push('Username already taken')
      else profileUpdates.username = uname
    }

    if (updates.email) {
      authUpdates.email         = updates.email
      authUpdates.email_confirm = true
    }

    if (updates.newPassword) {
      if (updates.newPassword.length < 6) errors.push('Password must be at least 6 characters')
      else authUpdates.password = updates.newPassword
    }

    if (errors.length > 0) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })

    if (Object.keys(authUpdates).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(targetId, authUpdates)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await admin.from('profiles').update(profileUpdates).eq('id', targetId)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE: remove a user entirely
export async function DELETE(req: Request) {
  try {
    const { requesterId, targetId } = await req.json()
    if (!await verifyAdmin(requesterId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete auth user (cascade deletes profile via DB trigger)
    const { error } = await admin.auth.admin.deleteUser(targetId)
    if (error) {
      // Fallback: just delete profile row
      await admin.from('profiles').delete().eq('id', targetId)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
