'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DebugLog {
  id: number
  device_id: string
  device_name: string | null
  level: string
  tag: string | null
  message: string
  created_at: string
}

const LEVEL_COLORS: Record<string, string> = {
  INFO:  'text-blue-400',
  OK:    'text-green-400',
  ERROR: 'text-red-400',
  WARN:  'text-yellow-400',
  DEBUG: 'text-purple-400',
}

const LEVEL_DOT: Record<string, string> = {
  INFO:  'bg-blue-400',
  OK:    'bg-green-400',
  ERROR: 'bg-red-400',
  WARN:  'bg-yellow-400',
  DEBUG: 'bg-purple-400',
}

const LEVEL_ROW: Record<string, string> = {
  ERROR: 'bg-red-950/30 border-l-2 border-red-500/50',
  WARN:  'bg-yellow-950/20 border-l-2 border-yellow-500/30',
}

export default function DebugLogsPage() {
  const { profile, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [logs, setLogs] = useState<DebugLog[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceFilter, setDeviceFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [devices, setDevices] = useState<{ device_id: string; device_name: string | null }[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!profile) { router.push('/login'); return }
      if (!isAdmin)  { router.push('/');      return }
    }
  }, [authLoading, profile, isAdmin, router])

  const fetchLogs = useCallback(async () => {
    let query = supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)

    if (deviceFilter) query = query.eq('device_id', deviceFilter)
    if (levelFilter)  query = query.eq('level', levelFilter)
    if (tagFilter)    query = query.ilike('tag', `%${tagFilter}%`)

    const { data, error } = await query
    if (error) console.error('debug_logs fetch error:', error)
    if (data)  setLogs(data)
    setLoading(false)
    setLastRefresh(new Date())
  }, [deviceFilter, levelFilter, tagFilter])

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase
      .from('debug_logs')
      .select('device_id, device_name')
      .order('created_at', { ascending: false })
      .limit(500)

    if (data) {
      const unique = Array.from(new Map(data.map(d => [d.device_id, d])).values())
      setDevices(unique)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && profile && isAdmin) {
      fetchLogs()
      fetchDevices()
    }
  }, [fetchLogs, fetchDevices, authLoading, profile, isAdmin])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoRefresh) {
      intervalRef.current = setInterval(() => { fetchLogs(); fetchDevices() }, 4000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchLogs, fetchDevices])

  const clearLogs = async () => {
    if (!confirm('Clear ALL debug logs? This cannot be undone.')) return
    await supabase.from('debug_logs').delete().gte('id', 0)
    setLogs([])
  }

  const clearDevice = async (deviceId: string) => {
    if (!confirm(`Clear logs for this device?`)) return
    await supabase.from('debug_logs').delete().eq('device_id', deviceId)
    fetchLogs()
    fetchDevices()
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const errorCount = logs.filter(l => l.level === 'ERROR').length
  const warnCount  = logs.filter(l => l.level === 'WARN').length

  if (authLoading) return <div className="text-center py-20 text-muted">Loading...</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">📱 Mobile Debug Logs</h1>
          <p className="text-xs text-muted mt-1">
            Real-time logs from Android devices
            {lastRefresh && <span className="ml-2 opacity-60">· updated {lastRefresh.toLocaleTimeString('en-US', { hour12: false })}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {errorCount > 0 && (
            <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">
              ⚠️ {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-2.5 py-1 rounded-full">
              {warnCount} warn{warnCount !== 1 ? 's' : ''}
            </span>
          )}

          <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none ml-2">
            <div
              onClick={() => setAutoRefresh(v => !v)}
              className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${autoRefresh ? 'bg-amber-500' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            Live
          </label>

          <button onClick={fetchLogs}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] hover:border-amber-500/50 rounded-lg text-sm transition-colors">
            🔄
          </button>
          <button onClick={clearLogs}
            className="px-3 py-1.5 bg-red-900/20 border border-red-500/30 hover:border-red-500/60 rounded-lg text-sm text-red-400 transition-colors">
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Device cards */}
      {devices.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {devices.map(d => {
            const devLogs = logs.filter(l => l.device_id === d.device_id)
            const devErrors = devLogs.filter(l => l.level === 'ERROR').length
            const isSelected = deviceFilter === d.device_id
            return (
              <button
                key={d.device_id}
                onClick={() => setDeviceFilter(isSelected ? '' : d.device_id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-[#111] border-[#333] hover:border-[#555] text-muted'
                }`}
              >
                <span>📱</span>
                <div className="text-left">
                  <div className="text-xs font-medium leading-none">{d.device_name || 'Unknown'}</div>
                  <div className="text-[10px] opacity-50 mt-0.5">{d.device_id.slice(0, 12)}…</div>
                </div>
                {devErrors > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{devErrors}</span>
                )}
                {isSelected && (
                  <button
                    onClick={e => { e.stopPropagation(); clearDevice(d.device_id) }}
                    className="ml-1 text-[10px] text-red-400 hover:text-red-300"
                    title="Clear device logs"
                  >🗑️</button>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-[#111] border border-[#333] rounded-xl px-4 py-3">
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-amber-500 outline-none"
        >
          <option value="">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="OK">OK</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        <input
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          placeholder="Filter by tag..."
          className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-amber-500 outline-none w-40"
        />

        {(levelFilter || tagFilter || deviceFilter) && (
          <button
            onClick={() => { setLevelFilter(''); setTagFilter(''); setDeviceFilter('') }}
            className="text-xs text-muted hover:text-white transition-colors"
          >✕ Clear filters</button>
        )}

        <span className="text-xs text-muted ml-auto">{logs.length} entries</span>
      </div>

      {/* Log table */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted text-sm">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted gap-3">
            <span className="text-4xl">📭</span>
            <span className="text-sm">No logs yet — open the app on a device</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-[#111] border-b border-[#222]">
                <tr className="text-[10px] text-muted uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left w-20">Time</th>
                  <th className="px-4 py-2.5 text-left w-14">Date</th>
                  <th className="px-4 py-2.5 text-left w-14">Level</th>
                  <th className="px-4 py-2.5 text-left w-36">Device</th>
                  <th className="px-4 py-2.5 text-left w-28">Tag</th>
                  <th className="px-4 py-2.5 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-b border-[#1a1a1a] hover:bg-[#111] transition-colors ${LEVEL_ROW[log.level] || ''}`}
                  >
                    <td className="px-4 py-2 text-[#555] whitespace-nowrap">{formatTime(log.created_at)}</td>
                    <td className="px-4 py-2 text-[#444] whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-2">
                      <span className={`flex items-center gap-1.5 font-bold text-[10px] ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_DOT[log.level] || 'bg-gray-400'}`} />
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-[#888] truncate max-w-[144px]" title={`${log.device_name ?? ''} (${log.device_id})`}>
                        {log.device_name || log.device_id.slice(0, 14) + '…'}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-purple-400/80">{log.tag || '—'}</td>
                    <td className="px-4 py-2 text-[#ccc] break-all max-w-[400px]">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
