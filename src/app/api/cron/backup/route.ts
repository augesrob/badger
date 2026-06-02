import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tables that should never be backed up
const SKIP_TABLES = ['schema_migrations', 'backup_log', 'backup_config']

// Friendly display names for known tables
export const TABLE_LABELS: Record<string, { label: string; description: string; emoji: string }> = {
  tractors:               { emoji: '🚛', label: 'Tractor Trailers',   description: 'Tractor assignments and driver info' },
  trailer_list:           { emoji: '🔗', label: 'Trailer List',        description: 'All trailer numbers' },
  trucks:                 { emoji: '🚚', label: 'Truck Database',      description: 'Box trucks, vans, tandems, semis' },
  trailers:               { emoji: '📦', label: 'Trailers (semi)',      description: 'Trailer assignments on semi trucks' },
  fleet_inventory:        { emoji: '🏭', label: 'Fleet Inventory',     description: 'Full fleet inventory records' },
  profiles:               { emoji: '👤', label: 'Role Accounts',       description: 'User profiles and roles' },
  status_values:          { emoji: '🏷️', label: 'Truck Statuses',      description: 'Truck status values and colors' },
  door_status_values:     { emoji: '🚪', label: 'Door Statuses',       description: 'Door status values and colors' },
  dock_lock_status_values:{ emoji: '🔒', label: 'Dock Lock Statuses',  description: 'Dock lock status values' },
  routes:                 { emoji: '🗺️', label: 'Routes',              description: 'Delivery route definitions' },
  automation_rules:       { emoji: '⚡', label: 'Automation Rules',    description: 'Print room / preshift automation' },
  weather_rules:          { emoji: '🌤️', label: 'Weather Rules',       description: 'Door open/close weather thresholds' },
  weather_config:         { emoji: '📍', label: 'Weather Config',      description: 'Location and weather settings' },
  loading_doors:          { emoji: '🏗️', label: 'Loading Doors',       description: 'Door definitions and config' },
  staging_doors:          { emoji: '📋', label: 'Staging Doors',       description: 'PreShift staging door config' },
  live_movement:          { emoji: '🔴', label: 'Live Movement',       description: 'Current truck movement (live data)' },
  movement_log:           { emoji: '📜', label: 'Movement Log',        description: 'Historical movement change log' },
  printroom_entries:      { emoji: '🖨️', label: 'Print Room Entries',  description: 'Current print room queue' },
  messages:               { emoji: '💬', label: 'Chat Messages',       description: 'All chat room messages' },
  chat_rooms:             { emoji: '🗨️', label: 'Chat Rooms',          description: 'Chat room definitions' },
  driver_routes:          { emoji: '🧑‍✈️', label: 'Driver Routes',       description: 'Uploaded driver/route report data' },
  reset_log:              { emoji: '⚠️', label: 'Reset Log',           description: 'History of data resets' },
  notification_prefs:     { emoji: '🔔', label: 'Notification Prefs',  description: 'Per-user notification settings' },
}

async function getAllTables(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('information_schema.tables' as never)
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')

  if (error || !data) {
    // Fallback: use pg_tables via rpc if information_schema is blocked
    return Object.keys(TABLE_LABELS)
  }
  return (data as { table_name: string }[])
    .map(r => r.table_name)
    .filter(t => !SKIP_TABLES.includes(t))
    .sort()
}

async function getSelectedTables(): Promise<string[] | null> {
  const { data } = await supabaseAdmin
    .from('backup_config')
    .select('selected_tables')
    .eq('id', 1)
    .single()
  return data?.selected_tables ?? null
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.DISCORD_BACKUP_WEBHOOK
  if (!webhookUrl) {
    return NextResponse.json({ error: 'DISCORD_BACKUP_WEBHOOK not set' }, { status: 500 })
  }

  return runBackup(webhookUrl)
}

// Also allow POST from admin UI for manual trigger
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  if (body.action === 'get_tables') {
    const all = await getAllTables()
    const selected = await getSelectedTables()
    return NextResponse.json({ tables: all, selected: selected ?? all, labels: TABLE_LABELS })
  }

  if (body.action === 'save_config') {
    const { selected_tables } = body
    await supabaseAdmin.from('backup_config').upsert({ id: 1, selected_tables, updated_at: new Date().toISOString() })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'run_now') {
    const webhookUrl = process.env.DISCORD_BACKUP_WEBHOOK
    if (!webhookUrl) return NextResponse.json({ error: 'DISCORD_BACKUP_WEBHOOK not set' }, { status: 500 })
    return runBackup(webhookUrl, body.selected_tables)
  }

  if (body.action === 'get_last') {
    const { data } = await supabaseAdmin.from('backup_log').select('*').eq('id', 1).single()
    return NextResponse.json({ log: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function runBackup(webhookUrl: string, overrideTables?: string[]) {
  try {
    const allTables = await getAllTables()
    const savedSelected = overrideTables ?? await getSelectedTables()
    // If no config saved, back up everything
    const tables = savedSelected
      ? allTables.filter(t => savedSelected.includes(t))
      : allTables

    const backup: Record<string, unknown[]> = {}
    const meta: Record<string, { count: number; error?: string }> = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.from(table).select('*').limit(50000)
        if (!error) {
          backup[table] = data ?? []
          meta[table] = { count: (data ?? []).length }
        } else {
          backup[table] = []
          meta[table] = { count: 0, error: error.message }
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

    // Build friendly table list for the Discord message
    const tableLines = tables.map(t => {
      const info = TABLE_LABELS[t]
      const count = meta[t]?.count ?? 0
      const err = meta[t]?.error
      const label = info ? `${info.emoji} ${info.label}` : t
      return err ? `  ❌ ${label}` : `  ✅ ${label} (${count} rows)`
    }).join('\n')

    const payload = {
      backup_date: date.toISOString(),
      version: '2.0',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tables_backed_up: tables.length,
      total_rows: totalRows,
      meta,
      data: backup,
    }

    const jsonBytes = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8')
    const sizeKb = (jsonBytes.length / 1024).toFixed(1)
    const warnings = failedTables.length > 0 ? `\n⚠️ Failed: ${failedTables.join(', ')}` : ''

    const formData = new FormData()
    formData.append('payload_json', JSON.stringify({
      content: [
        `📦 **Badger Weekly Backup** — \`${dateStr}\``,
        `📊 ${tables.length} tables · ${totalRows.toLocaleString()} rows · ${sizeKb} KB${warnings}`,
        `\`\`\``,
        tableLines,
        `\`\`\``,
        `*To restore: send this file to Claude and say "restore this Badger backup to SQL"*`,
      ].join('\n'),
    }))
    formData.append('files[0]', new Blob([jsonBytes], { type: 'application/json' }), filename)

    const discordRes = await fetch(webhookUrl, { method: 'POST', body: formData })
    if (!discordRes.ok) {
      const err = await discordRes.text()
      return NextResponse.json({ error: `Discord failed: ${err}` }, { status: 500 })
    }

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
    console.error('Backup error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
