import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SKIP_TABLES = ['schema_migrations', 'backup_log']

export async function GET(req: NextRequest) {
  // Vercel cron authenticates with CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.DISCORD_BACKUP_WEBHOOK
  if (!webhookUrl) {
    return NextResponse.json({ error: 'DISCORD_BACKUP_WEBHOOK not set' }, { status: 500 })
  }

  try {
    // Discover tables
    const pgRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({ query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename" }),
    })
    const pgData = await pgRes.json() as { tablename: string }[]
    const tables = pgData.map(r => r.tablename).filter(t => !SKIP_TABLES.includes(t))

    // Fetch all data
    const backup: Record<string, unknown[]> = {}
    const meta: Record<string, { count: number; error?: string }> = {}

    for (const table of tables) {
      try {
        const attempt1 = await supabaseAdmin.from(table).select('*').order('id' as never, { ascending: true }).limit(50000)
        if (!attempt1.error) {
          backup[table] = attempt1.data ?? []
          meta[table] = { count: (attempt1.data ?? []).length }
        } else {
          const attempt2 = await supabaseAdmin.from(table).select('*').limit(50000)
          backup[table] = attempt2.data ?? []
          meta[table] = attempt2.error
            ? { count: 0, error: attempt2.error.message }
            : { count: (attempt2.data ?? []).length }
        }
      } catch (e) {
        backup[table] = []
        meta[table] = { count: 0, error: String(e) }
      }
    }

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

    const jsonBytes = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8')
    const sizeKb = (jsonBytes.length / 1024).toFixed(1)
    const warnings = failedTables.length > 0 ? `\n⚠️ Failed tables: ${failedTables.join(', ')}` : ''

    const formData = new FormData()
    formData.append('payload_json', JSON.stringify({
      content: [
        `📦 **Badger Weekly Backup** — \`${dateStr}\``,
        `📊 ${tables.length} tables · ${totalRows.toLocaleString()} rows · ${sizeKb} KB${warnings}`,
        `\`\`\`To restore: send this file to Claude or Gemini and say "convert this Badger backup to SQL"\`\`\``,
      ].join('\n'),
    }))
    formData.append('files[0]', new Blob([jsonBytes], { type: 'application/json' }), filename)

    const discordRes = await fetch(webhookUrl, { method: 'POST', body: formData })
    if (!discordRes.ok) {
      const err = await discordRes.text()
      return NextResponse.json({ error: `Discord failed: ${err}` }, { status: 500 })
    }

    // Update backup_log
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

    return NextResponse.json({ ok: true, filename, tables: tables.length, rows: totalRows, size_kb: sizeKb })

  } catch (err) {
    console.error('Cron backup error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
