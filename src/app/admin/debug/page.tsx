'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
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

const LEVEL_BG: Record<string, string> = {
  INFO:  'bg-blue-900/20',
  OK:    'bg-green-900/20',
  ERROR: 'bg-red-900/30',
  WARN:  'bg-yellow-900/20',
  DEBUG: 'bg-purple-900/20',
}

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceFilter, setDeviceFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [devices, setDevices] = useState<{ device_id: string; device_name: string | null }[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchLogs = useCallback(async () => {
    let query = supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (deviceFilter) query = query.eq('device_id', deviceFilter)
    if (levelFilter)  query = query.eq('level', levelFilter)
    if (tagFilter)    query = query.ilike('tag', `%${tagFilter}%`)

    const { data } = await query
    if (data) setLogs(data)
    setLoading(false)
  }, [deviceFilter, levelFilter, tagFilter])

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase
      .from('debug_logs')
      .select('device_id, device_name')
      .order('created_at', { ascending: false })

    if (data) {
      const unique = Array.from(new Map(data.map(d => [d.device_id, d])).values())
      setDevices(unique)
    }
  }, [])

  const clearLogs = async () => {
    if (!confirm('Clear all debug logs? This cannot be undone.')) return
    await supabase.from('debug_logs').delete().gte('id', 0)
    setLogs([])
  }

  useEffect(() => {
    fetchLogs()
    fetchDevices()
  }, [fetchLogs, fetchDevices])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 3000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchLogs])

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
  }

  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const errorCount = logs.filter(l => l.level === 'ERROR').length

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
          <h1 className="text-lg font-bold text-amber-400">📱 Mobile Debug Logs</h1>
          {errorCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {errorCount} errors
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 rounded text-sm text-red-300"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-4 flex-wrap bg-gray-900/50">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Device</label>
          <select
            value={deviceFilter}
            onChange={e => setDeviceFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 min-w-[200px]"
          >
            <option value="">All Devices</option>
            {devices.map(d => (
              <option key={d.device_id} value={d.device_id}>
                {d.device_name || d.device_id} ({d.device_id.slice(0, 8)}...)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Level</label>
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="OK">OK</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Tag</label>
          <input
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            placeholder="Filter by tag..."
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 w-36"
          />
        </div>

        <span className="text-xs text-gray-600 ml-auto">{logs.length} entries</span>
      </div>

      {/* Log Table */}
      <div className="overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
            <span className="text-4xl">📭</span>
            <span>No logs yet — install the new APK and open the app</span>
          </div>
        ) : (
          <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-2 text-left w-24">Time</th>
                <th className="px-4 py-2 text-left w-12">Date</th>
                <th className="px-4 py-2 text-left w-16">Level</th>
                <th className="px-4 py-2 text-left w-32">Device</th>
                <th className="px-4 py-2 text-left w-28">Tag</th>
                <th className="px-4 py-2 text-left">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr
                  key={log.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${LEVEL_BG[log.level] || ''}`}
                >
                  <td className="px-4 py-1.5 text-gray-500 text-xs whitespace-nowrap">{formatTime(log.created_at)}</td>
                  <td className="px-4 py-1.5 text-gray-600 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-1.5">
                    <span className={`font-bold text-xs ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-gray-400 text-xs truncate max-w-[128px]" title={`${log.device_name ?? ''}\n${log.device_id}`}>
                    {log.device_name || log.device_id.slice(0, 10) + '...'}
                  </td>
                  <td className="px-4 py-1.5 text-purple-300 text-xs">{log.tag || '—'}</td>
                  <td className="px-4 py-1.5 text-gray-200 break-all">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
