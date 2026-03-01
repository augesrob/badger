'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface BackupLog {
  last_backup_at: string | null
  last_backup_filename: string | null
  last_backup_tables: number | null
  last_backup_rows: number | null
  last_backup_size_kb: number | null
  last_backup_status: 'success' | 'partial' | null
  failed_tables: string[] | null
}

interface BackupResult {
  ok: boolean
  filename: string
  tables: number
  rows: number
  size_kb: string
  failed_tables: string[]
}

export default function BackupPage() {
  const { profile, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [webhookUrl, setWebhookUrl]     = useState('')
  const [savedWebhook, setSavedWebhook] = useState('')
  const [lastBackup, setLastBackup]     = useState<BackupLog | null>(null)
  const [running, setRunning]           = useState(false)
  const [result, setResult]             = useState<BackupResult | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [showWebhook, setShowWebhook]   = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!profile) { router.push('/login'); return }
      if (!isAdmin)  { router.push('/');      return }
    }
  }, [authLoading, profile, isAdmin, router])

  // Load saved webhook from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('badger_discord_webhook')
    if (saved) { setSavedWebhook(saved); setWebhookUrl(saved) }
  }, [])

  const fetchLastBackup = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/backup', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (res.ok) setLastBackup(await res.json())
  }, [])

  useEffect(() => {
    if (!authLoading && profile && isAdmin) fetchLastBackup()
  }, [authLoading, profile, isAdmin, fetchLastBackup])

  const saveWebhook = () => {
    localStorage.setItem('badger_discord_webhook', webhookUrl)
    setSavedWebhook(webhookUrl)
  }

  const runBackup = async () => {
    const url = savedWebhook || webhookUrl
    if (!url) { setError('Enter a Discord webhook URL first'); return }

    setRunning(true)
    setResult(null)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); setRunning(false); return }

      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ webhook_url: url }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Backup failed'); setRunning(false); return }

      setResult(data)
      fetchLastBackup()
    } catch (e) {
      setError(String(e))
    }
    setRunning(false)
  }

  const fmt = (ts: string) => new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })

  const timeSince = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h > 24) return `${Math.floor(h / 24)}d ago`
    if (h > 0) return `${h}h ${m}m ago`
    return `${m}m ago`
  }

  if (authLoading) return <div className="text-center py-20 text-muted">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">💾 Database Backup</h1>
        <p className="text-xs text-muted mt-1">
          Exports all tables as JSON and sends directly to Discord. New tables are picked up automatically.
        </p>
      </div>

      {/* Last backup status */}
      <div className={`rounded-2xl border p-5 ${
        lastBackup?.last_backup_at
          ? lastBackup.last_backup_status === 'success'
            ? 'bg-green-950/20 border-green-500/30'
            : 'bg-yellow-950/20 border-yellow-500/30'
          : 'bg-[#111] border-[#333]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {lastBackup?.last_backup_at
                ? lastBackup.last_backup_status === 'success' ? '✅' : '⚠️'
                : '📭'}
            </span>
            <div>
              <div className="font-semibold text-sm">
                {lastBackup?.last_backup_at ? 'Last Backup' : 'No backups yet'}
              </div>
              {lastBackup?.last_backup_at && (
                <div className="text-xs text-muted mt-0.5">
                  {fmt(lastBackup.last_backup_at)} · {timeSince(lastBackup.last_backup_at)}
                </div>
              )}
            </div>
          </div>
          {lastBackup?.last_backup_at && (
            <div className="text-right text-xs text-muted space-y-0.5">
              <div>{lastBackup.last_backup_tables} tables</div>
              <div>{lastBackup.last_backup_rows?.toLocaleString()} rows</div>
              <div>{lastBackup.last_backup_size_kb} KB</div>
            </div>
          )}
        </div>
        {lastBackup?.last_backup_filename && (
          <div className="mt-3 font-mono text-[11px] text-muted bg-black/30 rounded px-3 py-1.5">
            {lastBackup.last_backup_filename}
          </div>
        )}
        {lastBackup?.failed_tables && lastBackup.failed_tables.length > 0 && (
          <div className="mt-2 text-xs text-yellow-400">
            ⚠️ Failed tables: {lastBackup.failed_tables.join(', ')}
          </div>
        )}
      </div>

      {/* Discord webhook config */}
      <div className="bg-[#111] border border-[#333] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Discord Webhook</div>
            <div className="text-xs text-muted mt-0.5">
              {savedWebhook ? '✅ Webhook saved' : 'Not configured'}
            </div>
          </div>
          <button onClick={() => setShowWebhook(v => !v)}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
            {showWebhook ? 'Hide' : 'Edit'}
          </button>
        </div>

        {showWebhook && (
          <div className="space-y-2">
            <input
              type="text"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-amber-500 outline-none font-mono"
            />
            <div className="flex gap-2">
              <button onClick={saveWebhook}
                disabled={!webhookUrl}
                className="px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 hover:border-amber-500/70 rounded-lg text-sm text-amber-400 transition-colors disabled:opacity-40">
                💾 Save Webhook
              </button>
              <p className="text-xs text-muted self-center">Saved in browser only — not stored on server</p>
            </div>
          </div>
        )}
      </div>

      {/* Run backup */}
      <div className="bg-[#111] border border-[#333] rounded-2xl p-5 space-y-4">
        <div>
          <div className="font-semibold text-sm">Manual Backup</div>
          <div className="text-xs text-muted mt-0.5">
            Fetches all tables dynamically — any new tables added to the database are included automatically
          </div>
        </div>

        <button
          onClick={runBackup}
          disabled={running || !savedWebhook}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 rounded-xl font-bold text-black text-sm transition-colors flex items-center justify-center gap-2"
        >
          {running ? (
            <>
              <span className="animate-spin">⏳</span>
              Running backup...
            </>
          ) : (
            <>💾 Run Backup Now</>
          )}
        </button>

        {!savedWebhook && (
          <p className="text-xs text-muted text-center">Configure Discord webhook above first</p>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-4 space-y-1">
            <div className="text-green-400 font-bold text-sm">✅ Backup sent to Discord</div>
            <div className="font-mono text-[11px] text-muted">{result.filename}</div>
            <div className="text-xs text-muted">
              {result.tables} tables · {result.rows.toLocaleString()} rows · {result.size_kb} KB
            </div>
            {result.failed_tables?.length > 0 && (
              <div className="text-xs text-yellow-400">⚠️ Failed: {result.failed_tables.join(', ')}</div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
            <div className="text-red-400 font-bold text-sm">❌ Backup failed</div>
            <div className="text-xs text-muted mt-1">{error}</div>
          </div>
        )}
      </div>

      {/* How to restore */}
      <div className="bg-[#111] border border-[#333] rounded-2xl p-5 space-y-2">
        <div className="font-semibold text-sm">📋 How to Restore</div>
        <ol className="text-xs text-muted space-y-1.5 list-decimal list-inside">
          <li>Download the <code className="bg-black/40 px-1 rounded">.json</code> file from Discord</li>
          <li>Send it to Claude or Gemini and say <span className="text-amber-400/80 italic">&quot;Convert this Badger backup to SQL INSERT statements&quot;</span></li>
          <li>Run the generated SQL in your Supabase SQL editor</li>
        </ol>
        <div className="text-xs text-muted mt-2 pt-2 border-t border-[#222]">
          ⚠️ Auth user accounts are not included — those are managed by Supabase internally and need to be recreated manually
        </div>
      </div>
    </div>
  )
}
