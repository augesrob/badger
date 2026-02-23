import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { email, password, username, displayName, role, requesterId } = await req.json()

    // Verify requester is admin
    const { data: requester } = await supabaseAdmin
      .from('profiles').select('role').eq('id', requesterId).single()
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check username not taken
    const { data: existing } = await supabaseAdmin
      .from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 400 })

    // Create auth user — email_confirm: true skips verification email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName || username },
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Set the role (trigger creates profile as 'driver' by default)
    await supabaseAdmin
      .from('profiles')
      .update({ role, display_name: displayName || username })
      .eq('id', authData.user.id)

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
