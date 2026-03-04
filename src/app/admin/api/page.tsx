'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

const TABLES = [
  { name: 'debug_logs',               icon: '📱', group: 'Monitoring',  desc: 'Android app logs — errors, warnings, debug from mobile devices' },
  { name: 'live_movement',            icon: '🚚', group: 'Operations',  desc: 'Current truck locations and statuses' },
  { name: 'printroom_entries',        icon: '🖨️', group: 'Operations',  desc: 'Print room door assignments and truck order' },
  { name: 'loading_doors',            icon: '🚪', group: 'Operations',  desc: 'Loading door status and dock lock state' },
  { name: 'staging_doors',            icon: '📋', group: 'Operations',  desc: 'PreShift staging door assignments (in front / in back)' },
  { name: 'trucks',                   icon: '🚛', group: 'Fleet',       desc: 'Truck database — all registered box trucks, semis, vans' },
  { name: 'tractors',                 icon: '🚛', group: 'Fleet',       desc: 'Tractor/semi assignments with trailer slots' },
  { name: 'trailer_list',             icon: '📦', group: 'Fleet',       desc: 'Trailer inventory list' },
  { name: 'status_values',            icon: '🏷️', group: 'Config',      desc: 'Truck status options (In Door, Out, etc.)' },
  { name: 'door_status_values',       icon: '🏷️', group: 'Config',      desc: 'Loading door status options' },
  { name: 'dock_lock_status_values',  icon: '🔒', group: 'Config',      desc: 'Dock lock status options (Working, Not Working)' },
  { name: 'automation_rules',         icon: '⚡', group: 'Config',      desc: 'IF/THEN automation rules triggered by print room changes' },
  { name: 'routes',                   icon: '🗺️', group: 'Config',      desc: 'Route definitions (FDL, MIL, etc.)' },
  { name: 'profiles',                 icon: '👤', group: 'Users',       desc: 'User profiles, roles, avatar colors' },
  { name: 'role_permissions',         icon: '🛡️', group: 'Users',       desc: 'Role definitions and page access permissions' },
  { name: 'notifications',            icon: '🔔', group: 'Users',       desc: 'Push notification log' },
  { name: 'notification_preferences', icon: '🔔', group: 'Users',       desc: 'Per-user notification preferences' },
  { name: 'global_messages',          icon: '📢', group: 'Users',       desc: 'Admin broadcast banners posted to the site' },
  { name: 'truck_subscriptions',      icon: '📲', group: 'Users',       desc: 'User subscriptions to truck status changes' },
  { name: 'chat_rooms',               icon: '💬', group: 'Chat',        desc: 'Chat room definitions and role permissions' },
  { name: 'messages',                 icon: '💬', group: 'Chat',        desc: 'Chat messages (last 200)' },
  { name: 'ptt_messages',             icon: '🎙️', group: 'Chat',        desc: 'Push-to-talk voice message log' },
  { name: 'reset_log',                icon: '⚠️', group: 'System',      desc: 'History of manual data resets' },
  { name: 'route_imports',            icon: '📄', group: 'System',      desc: 'Route CSV import history' },
]

const GROUPS = ['Monitoring', 'Operations', 'Fleet', 'Config', 'Users', 'Chat', 'System']

const LEVEL_COLORS: Record<string, string> = {
  INFO: 'text-blue-400', ERROR: 'text-red-400', WARN: 'text-yellow-400',
  DEBUG: 'text-purple-400', OK: 'text-green-400',
}
const LEVEL_BG: Record<string, string> = {
  ERROR: 'bg-red-950/30 border-l-2 border-red-500/50',
  WARN: 'bg-yellow-950/20 border-l-2 border-yellow-500/30',
}

type TableCounts = Record<string, number | string>

export default function AdminApiPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'explorer' | 'docs' | 'live'>('explorer')

  // Explorer state
  const [selectedTable, setSelectedTable] = useState('debug_logs')
  const [tableData, setTableData]         = useState<Record<string, unknown>[]>([])
  const [tableCounts, setTableCounts]     = useState<TableCounts>({})
  const [loadingData, setLoadingData]     = useState(false)
  const [filterText, setFilterText]       = useState('')
  const [limitVal, setLimitVal]           = useState('100')
  const [jsonMode, setJsonMode]           = useState(false)
  const [copied, setCopied]               = useState(false)
  const [sessionToken, setSessionToken]   = useState('')

  // Live monitor state
  const [liveLevel, setLiveLevel]         = useState('')
  const [liveTag, setLiveTag]             = useState('')
  const [liveDevice, setLiveDevice]       = useState('')
  const [liveLogs, setLiveLogs]           = useState<Record<string, unknown>[]>([])
  const [liveRunning, setLiveRunning]     = useState(false)
  const liveRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const apiBase = `${BASE_URL}/api/badger`

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/')
  }, [authLoading, isAdmin, router])

  // Get session token for API calls
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setSessionToken(session.access_token)
    })
  }, [])

  // Load table counts on mount
  useEffect(() => {
    if (!sessionToken) return
    fetch(`${apiBase}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then(r => r.json())
      .then(d => { if (d.counts) setTableCounts(d.counts) })
      .catch(() => {})
  }, [sessionToken, apiBase])

  const loadTable = useCallback(async (table: string) => {
    if (!sessionToken) return
    setLoadingData(true)
    setTableData([])
    const params = new URLSearchParams({ table, limit: limitVal })
    if (filterText) params.set('filter', filterText)
    const res = await fetch(`${apiBase}?${params}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
    const d = await res.json()
    setTableData(d.data || [])
    setLoadingData(false)
  }, [sessionToken, limitVal, filterText, apiBase])

  useEffect(() => {
    if (tab === 'explorer' && sessionToken) loadTable(selectedTable)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, tab, sessionToken])

  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doSubscribeLive = useCallback(() => {
    if (liveRef.current) {
      supabase.removeChannel(liveRef.current)
      liveRef.current = null
    }
    const ch = supabase.channel(`api-live-debug-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debug_logs' }, (payload) => {
        const row = payload.new as Record<string, unknown>
        setLiveLogs(prev => [...prev.slice(-499), row])
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
    ch.subscribe((status) => {
      console.log('[LiveMonitor] channel status:', status)
    })
    liveRef.current = ch
  }, [])

  const startLive = useCallback(() => {
    setLiveLogs([])
    setLiveRunning(true)
    doSubscribeLive()
    watchdogRef.current = setInterval(() => {
      const status = liveRef.current?.status
      // @ts-expect-error status value check
      if (status !== 'SUBSCRIBED') {
        console.warn('[LiveMonitor] watchdog reconnecting, status=', status)
        doSubscribeLive()
      }
    }, 15_000)
  }, [doSubscribeLive])

  const stopLive = useCallback(() => {
    if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null }
    if (liveRef.current) { supabase.removeChannel(liveRef.current); liveRef.current = null }
    setLiveRunning(false)
  }, [])

  useEffect(() => {
    if (tab === 'live') startLive()
    else stopLive()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => () => stopLive(), [stopLive])

  const filteredLive = liveLogs.filter(l => {
    if (liveLevel && l.level !== liveLevel) return false
    if (liveTag && !(String(l.tag || '').toLowerCase().includes(liveTag.toLowerCase()))) return false
    if (liveDevice && !(String(l.device_name || l.device_id || '').toLowerCase().includes(liveDevice.toLowerCase()))) return false
    return true
  })

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tableData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const buildCurlExample = (table: string) =>
    `curl "${apiBase}?table=${table}&limit=50" \\\n  -H "Authorization: Bearer <your-session-token>"\n\n# Or with API key (set BADGER_API_KEY in .env):\ncurl "${apiBase}?table=${table}" \\\n  -H "x-badger-api-key: <BADGER_API_KEY>"`

  if (authLoading || !isAdmin) return <div className="text-center py-20 text-gray-500">Loading...</div>

  const grouped = GROUPS.map(g => ({
    group: g,
    tables: TABLES.filter(t => t.group === g),
  }))

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">🔌 Badger API</h1>
          <p className="text-xs text-gray-500 mt-1">Read all Supabase data, monitor live device logs, and explore the full database</p>
        </div>
        <div className="flex gap-1 bg-[#111] rounded-lg p-1">
          {(['explorer', 'live', 'docs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
              {t === 'explorer' ? '🔍 Explorer' : t === 'live' ? '📡 Live Monitor' : '📖 Docs'}
            </button>
          ))}
        </div>
      </div>

      {/* ── EXPLORER TAB ── */}
      {tab === 'explorer' && (
        <div className="flex gap-4 items-start">
          {/* Left sidebar — table list */}
          <div className="w-52 flex-shrink-0 space-y-3">
            {grouped.map(({ group, tables }) => (
              <div key={group}>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1 mb-1">{group}</div>
                {tables.map(t => (
                  <button key={t.name} onClick={() => setSelectedTable(t.name)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-1 ${
                      selectedTable === t.name ? 'bg-amber-500/15 text-amber-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}>
                    <span className="truncate">{t.icon} {t.name}</span>
                    {tableCounts[t.name] !== undefined && (
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{tableCounts[t.name]}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Right — data view */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-sm font-bold text-amber-500">{TABLES.find(t => t.name === selectedTable)?.icon} {selectedTable}</span>
              <span className="text-xs text-gray-500 flex-1">{TABLES.find(t => t.name === selectedTable)?.desc}</span>
              <input value={filterText} onChange={e => setFilterText(e.target.value)}
                placeholder="filter: level=eq.ERROR"
                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs w-44 focus:border-amber-500 outline-none font-mono" />
              <select value={limitVal} onChange={e => setLimitVal(e.target.value)}
                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs focus:border-amber-500 outline-none">
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
                <option value="250">250 rows</option>
                <option value="500">500 rows</option>
              </select>
              <button onClick={() => loadTable(selectedTable)} disabled={loadingData}
                className="bg-amber-500 text-black px-3 py-1 rounded text-xs font-bold hover:bg-amber-400 disabled:opacity-50">
                {loadingData ? '...' : '▶ Run'}
              </button>
              <button onClick={() => setJsonMode(m => !m)}
                className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${jsonMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-[#333] text-gray-500 hover:text-white'}`}>
                {'{}'} JSON
              </button>
              <button onClick={copyJson} className="px-3 py-1 rounded text-xs font-bold border border-[#333] text-gray-500 hover:text-white transition-colors">
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>

            {/* URL preview */}
            <div className="bg-[#111] rounded-lg px-3 py-2 mb-3 font-mono text-[11px] text-gray-500 flex items-center gap-2 overflow-x-auto">
              <span className="text-green-500 flex-shrink-0">GET</span>
              <span className="truncate">{apiBase}?table={selectedTable}&limit={limitVal}{filterText ? `&filter=${filterText}` : ''}</span>
            </div>

            {/* Data */}
            {loadingData ? (
              <div className="text-center py-20 text-gray-500 text-sm">Loading {selectedTable}...</div>
            ) : tableData.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-sm">No rows returned</div>
            ) : jsonMode ? (
              <pre className="bg-[#111] border border-[#333] rounded-xl p-4 text-[11px] text-green-400 overflow-auto max-h-[600px] font-mono">
                {JSON.stringify(tableData, null, 2)}
              </pre>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#111] border-b border-[#333]">
                        {Object.keys(tableData[0]).map(col => (
                          <th key={col} className="px-3 py-2 text-left font-bold text-amber-500 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, i) => (
                        <tr key={i} className={`border-b border-white/5 hover:bg-white/[0.02] ${
                          selectedTable === 'debug_logs' ? (LEVEL_BG[String(row.level)] || '') : ''
                        }`}>
                          {Object.entries(row).map(([col, val]) => {
                            let display = val === null ? <span className="text-gray-600">null</span>
                              : val === true ? <span className="text-green-400">true</span>
                              : val === false ? <span className="text-red-400">false</span>
                              : typeof val === 'object' ? <span className="text-blue-400">{JSON.stringify(val)}</span>
                              : String(val)

                            if (col === 'level' && typeof val === 'string') {
                              display = <span className={`font-bold ${LEVEL_COLORS[val] || 'text-gray-400'}`}>{val}</span>
                            }
                            if (col === 'created_at' || col === 'updated_at' || col === 'reset_at') {
                              display = <span className="text-gray-500">{new Date(String(val)).toLocaleString()}</span>
                            }
                            if ((col === 'status_color' || col === 'avatar_color') && typeof val === 'string') {
                              display = (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: val }} />
                                  {val}
                                </span>
                              )
                            }

                            return (
                              <td key={col} className="px-3 py-1.5 align-top max-w-[300px]">
                                <div className="truncate">{display}</div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-2 border-t border-[#333] text-[10px] text-gray-500">
                  {tableData.length} rows shown
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIVE MONITOR TAB ── */}
      {tab === 'live' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${liveRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-sm font-bold">{liveRunning ? 'Live — watching debug_logs' : 'Stopped'}</span>
            </div>
            <button onClick={liveRunning ? stopLive : startLive}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${liveRunning ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-green-700 text-white hover:bg-green-600'}`}>
              {liveRunning ? '⏹ Stop' : '▶ Start'}
            </button>
            <button onClick={() => setLiveLogs([])}
              className="px-4 py-1.5 rounded-lg text-xs font-bold border border-[#333] text-gray-500 hover:text-white transition-colors">
              🗑 Clear
            </button>
            <span className="text-xs text-gray-600">{liveLogs.length} events captured</span>

            {/* Filters */}
            <div className="flex gap-2 ml-auto flex-wrap">
              <select value={liveLevel} onChange={e => setLiveLevel(e.target.value)}
                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs focus:border-amber-500 outline-none">
                <option value="">All levels</option>
                {['DEBUG', 'INFO', 'WARN', 'ERROR', 'OK'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input value={liveTag} onChange={e => setLiveTag(e.target.value)}
                placeholder="Filter tag..." className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs w-32 focus:border-amber-500 outline-none" />
              <input value={liveDevice} onChange={e => setLiveDevice(e.target.value)}
                placeholder="Filter device..." className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs w-32 focus:border-amber-500 outline-none" />
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333] rounded-xl overflow-hidden">
            <div className="h-[600px] overflow-y-auto font-mono text-[11px] p-3 space-y-0.5">
              {filteredLive.length === 0 && (
                <div className="text-center text-gray-600 py-20">
                  {liveRunning ? 'Waiting for device events...' : 'Start live monitor to capture logs'}
                </div>
              )}
              {filteredLive.map((log, i) => (
                <div key={i} className={`flex gap-2 px-2 py-1 rounded ${LEVEL_BG[String(log.level)] || 'hover:bg-white/[0.02]'}`}>
                  <span className="text-gray-600 flex-shrink-0 w-20 truncate">
                    {new Date(String(log.created_at)).toLocaleTimeString()}
                  </span>
                  <span className={`font-bold flex-shrink-0 w-12 ${LEVEL_COLORS[String(log.level)] || 'text-gray-400'}`}>
                    {String(log.level)}
                  </span>
                  <span className="text-amber-500/70 flex-shrink-0 w-28 truncate">{String(log.tag || '')}</span>
                  <span className="text-gray-300 flex-1 break-all">{String(log.message || '')}</span>
                  <span className="text-gray-600 flex-shrink-0 truncate max-w-[120px]">{String(log.device_name || log.device_id || '')}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            <div className="border-t border-[#333] px-3 py-2 text-[10px] text-gray-600 flex gap-4">
              {['DEBUG','INFO','WARN','ERROR','OK'].map(l => (
                <span key={l} className={LEVEL_COLORS[l]}>
                  {l}: {liveLogs.filter(x => x.level === l).length}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DOCS TAB ── */}
      {tab === 'docs' && (
        <div className="space-y-6 max-w-3xl">

          {/* Overview */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h2 className="text-lg font-bold mb-1">📖 Badger API</h2>
            <p className="text-sm text-gray-400 mb-3">
              A read-only REST API that gives full access to all Badger Supabase data. Requires admin authentication.
            </p>
            <div className="bg-[#111] rounded-lg px-4 py-3 font-mono text-sm text-green-400">
              {apiBase}
            </div>
          </div>

          {/* Auth */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-3">🔑 Authentication</h3>
            <p className="text-sm text-gray-400 mb-3">Two methods supported:</p>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-bold text-gray-300 mb-1">1. Session token (from browser)</div>
                <pre className="bg-[#111] rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`Authorization: Bearer <your-session-token>

// Get your token in the browser console:
const { data } = await supabase.auth.getSession()
console.log(data.session.access_token)`}</pre>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-300 mb-1">2. API key (server-to-server)</div>
                <pre className="bg-[#111] rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`x-badger-api-key: <BADGER_API_KEY>

// Add to .env on server:
BADGER_API_KEY=your-secret-key-here`}</pre>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-4">📡 Endpoints</h3>
            <div className="space-y-5">

              {/* GET / */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-green-800 text-green-300 px-2 py-0.5 rounded">GET</span>
                  <code className="text-sm font-mono text-white">/api/badger</code>
                  <span className="text-xs text-gray-500">— Schema overview + row counts</span>
                </div>
                <pre className="bg-[#111] rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`curl "${apiBase}" \\
  -H "Authorization: Bearer <token>"

// Response:
{
  "ok": true,
  "tables": ["trucks", "tractors", ...],
  "counts": { "trucks": 45, "debug_logs": 1280, ... },
  "generated_at": "2026-03-01T00:00:00.000Z"
}`}</pre>
              </div>

              {/* GET ?table= */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-green-800 text-green-300 px-2 py-0.5 rounded">GET</span>
                  <code className="text-sm font-mono text-white">/api/badger?table=&lt;name&gt;</code>
                  <span className="text-xs text-gray-500">— Query a specific table</span>
                </div>
                <pre className="bg-[#111] rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`curl "${apiBase}?table=debug_logs&limit=50&filter=level=eq.ERROR" \\
  -H "Authorization: Bearer <token>"

// Response:
{
  "ok": true,
  "table": "debug_logs",
  "count": 12,
  "data": [ { "id": 1, "level": "ERROR", ... }, ... ],
  "generated_at": "2026-03-01T00:00:00.000Z"
}`}</pre>
              </div>
            </div>
          </div>

          {/* Query params */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-4">⚙️ Query Parameters</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#333]">
                    <th className="pb-2 text-xs text-gray-500 uppercase font-bold pr-4">Param</th>
                    <th className="pb-2 text-xs text-gray-500 uppercase font-bold pr-4">Type</th>
                    <th className="pb-2 text-xs text-gray-500 uppercase font-bold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-300">
                  {[
                    ['table', 'string', 'Table name to query. If omitted, returns schema overview.'],
                    ['limit', 'number', 'Max rows to return. Default varies per table (usually 100–500).'],
                    ['filter', 'string', 'PostgREST-style filter. e.g. level=eq.ERROR or truck_number=eq.170. Chain with &.'],
                    ['select', 'string', 'Comma-separated columns. Default is * (all).'],
                    ['all', 'boolean', 'Set to true to bypass the row limit. Use carefully on large tables.'],
                  ].map(([p, t, d]) => (
                    <tr key={p} className="border-b border-white/5">
                      <td className="py-2 pr-4 font-mono text-amber-400 text-xs">{p}</td>
                      <td className="py-2 pr-4 text-xs text-blue-400">{t}</td>
                      <td className="py-2 text-xs text-gray-400">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filter examples */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-4">🔍 Filter Examples</h3>
            <div className="space-y-2">
              {[
                ['Only ERROR logs', `?table=debug_logs&filter=level=eq.ERROR`],
                ['Specific device', `?table=debug_logs&filter=device_name=eq.Samsung Galaxy`],
                ['Specific truck in movement', `?table=live_movement&filter=truck_number=eq.170`],
                ['Trucks at a door', `?table=printroom_entries&filter=loading_door_id=eq.2`],
                ['Active automation rules', `?table=automation_rules&filter=is_active=eq.true`],
                ['Recent resets only', `?table=reset_log&limit=10`],
                ['Select specific columns', `?table=trucks&select=id,truck_number,truck_type`],
              ].map(([label, url]) => (
                <div key={label} className="flex gap-3 items-start">
                  <span className="text-xs text-gray-500 w-44 flex-shrink-0 pt-1">{label}</span>
                  <code className="text-xs font-mono text-green-400 bg-[#111] px-2 py-1 rounded flex-1 break-all">{apiBase}{url}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Android integration */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-3">📱 Android Debug Integration</h3>
            <p className="text-sm text-gray-400 mb-3">
              The Android app uses <code className="text-amber-400 text-xs bg-[#111] px-1 py-0.5 rounded">RemoteLogger</code> to write logs directly to the <code className="text-amber-400 text-xs bg-[#111] px-1 py-0.5 rounded">debug_logs</code> table. View them here or on the Live Monitor tab.
            </p>
            <pre className="bg-[#111] rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`// In any Kotlin screen:
RemoteLogger.i("PrintRoomScreen", "upsert OK — door=\${door.id}")
RemoteLogger.e("PrintRoomScreen", "upsert FAILED: \${e.message}")
RemoteLogger.d("BadgerRepo", "getLiveMovement OK — \${result.size} trucks")

// Automatically includes:
//   device_id    (Android ID)
//   device_name  (Manufacturer + Model)
//   level        (INFO / ERROR / WARN / DEBUG)
//   tag          (your tag)
//   message      (your message)
//   created_at   (auto by Supabase)`}</pre>
          </div>

          {/* All tables reference */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-4">🗄️ Table Reference</h3>
            <div className="space-y-1">
              {grouped.map(({ group, tables }) => (
                <div key={group} className="mb-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group}</div>
                  {tables.map(t => (
                    <div key={t.name} className="flex items-start gap-3 py-1.5 border-b border-white/5">
                      <code className="text-xs font-mono text-amber-400 w-48 flex-shrink-0">{t.icon} {t.name}</code>
                      <span className="text-xs text-gray-400">{t.desc}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* cURL quick reference */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <h3 className="font-bold text-amber-500 mb-3">⚡ Quick cURL Reference</h3>
            <pre className="bg-[#111] rounded-lg p-4 text-xs text-green-400 overflow-x-auto whitespace-pre">{buildCurlExample(selectedTable)}</pre>
          </div>

        </div>
      )}
    </div>
  )
}
