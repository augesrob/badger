import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tables to skip — Supabase internal or non-restorable
const SKIP_TABLES = ['schema_migrations', 'backup_log']

async function verifyAdmin(token: string): Promise<boolean> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return false
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyAdmin(token))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { webhook_url } = await req.json()
  if (!webhook_url) return NextResponse.json({ error: 'Missing webhook_url' }, { status: 400 })

  try {
    // ── 1. Discover all public tables dynamically ──────────────────────────
    const { data: tableRows, error: tableErr } = await supabaseAdmin.rpc('list_public_tables')
    if (tableErr || !Array.isArray(tableRows)) {
      return NextResponse.json({ error: 'Could not discover tables: ' + tableErr?.message }, { status: 500 })
    }
    const tables: string[] = (tableRows as { tablename: string }[])
      .map(r => r.tablename)
      .filter(t => !SKIP_TABLES.includes(t))
      .sort()

    // ── 2. Fetch all data from each table ──────────────────────────────────
    const backup: Record<string, unknown[]> = {}
    const meta: Record<string, { count: number; error?: string }> = {}

    for (const table of tables) {
      try {
        // Try with id ordering first, fall back to created_at, then unordered
        let data = null
        let fetchError = null

        const attempt1 = await supabaseAdmin.from(table).select('*').order('id' as never, { ascending: true }).limit(50000)
        if (!attempt1.error) {
          data = attempt1.data
        } else {
          const attempt2 = await supabaseAdmin.from(table).select('*').limit(50000)
          data = attempt2.data
          fetchError = attempt2.error
        }

        if (fetchError) {
          meta[table] = { count: 0, error: fetchError.message }
          backup[table] = []
        } else {
          backup[table] = data ?? []
          meta[table] = { count: (data ?? []).length }
        }
      } catch (e) {
        meta[table] = { count: 0, error: String(e) }
        backup[table] = []
      }
    }

    // ── 3. Build the backup JSON ───────────────────────────────────────────
    const date = new Date()
    const dateStr = date.toISOString().replace('T', '_').slice(0, 16).replace(':', '-')
    const filename = `badger_backup_${dateStr}.json`

    const totalRows = Object.values(meta).reduce((sum, m) => sum + m.count, 0)
    const failedTables = Object.entries(meta).filter(([, m]) => m.error).map(([t]) => t)

    const payload = {
      backup_date: date.toISOString(),
      version: '1.0',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tables_backed_up: tables.length,
      total_rows: totalRows,
      meta,
      data: backup,
    }

    const jsonStr = JSON.stringify(payload, null, 2)
    const jsonBytes = Buffer.from(jsonStr, 'utf-8')
    const sizeKb = (jsonBytes.length / 1024).toFixed(1)

    // ── 4. Send to Discord ─────────────────────────────────────────────────
    const formData = new FormData()
    const warnings = failedTables.length > 0 ? `\n⚠️ Failed tables: ${failedTables.join(', ')}` : ''

    formData.append('payload_json', JSON.stringify({
      content: [
        `📦 **Badger Backup** — \`${dateStr}\``,
        `📊 ${tables.length} tables · ${totalRows.toLocaleString()} rows · ${sizeKb} KB${warnings}`,
        `\`\`\`To restore: send this file to Claude or Gemini and say "convert this Badger backup to SQL"\`\`\``,
      ].join('\n'),
    }))
    formData.append('files[0]', new Blob([jsonBytes], { type: 'application/json' }), filename)

    const discordRes = await fetch(webhook_url, { method: 'POST', body: formData })
    if (!discordRes.ok) {
      const discordErr = await discordRes.text()
      return NextResponse.json({ error: `Discord upload failed: ${discordErr}` }, { status: 500 })
    }

    // ── 5. Log to backup_log table ─────────────────────────────────────────
    await supabaseAdmin.from('backup_log').upsert({
      id: 1,
      last_backup_at: date.toISOString(),
      last_backup_filename: filename,
      last_backup_tables: tables.length,
      last_backup_rows: totalRows,
      last_backup_size_kb: parseFloat(sizeKb),
      last_backup_status: failedTables.length === 0 ? 'success' : 'partial',
      failed_tables: failedTables,
    })

    return NextResponse.json({ ok: true, filename, tables: tables.length, rows: totalRows, size_kb: sizeKb, failed_tables: failedTables })

  } catch (err) {
    console.error('Backup error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET — return last backup info
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyAdmin(token))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabaseAdmin.from('backup_log').select('*').eq('id', 1).single()
  return NextResponse.json(data ?? { last_backup_at: null })
}
