'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AutoResetConfig() {
  const [config, setConfig] = useState<{
    enabled: boolean; hour: number; minute: number; days: number[]
  } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('auto_reset_config').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setConfig({ enabled: data.enabled, hour: data.hour, minute: data.minute, days: data.days })
      })
  }, [])

  const save = async (patch: Partial<{ enabled: boolean; hour: number; minute: number; days: number[] }>) => {
    if (!config) return
    const updated = { ...config, ...patch }
    setConfig(updated)
    setSaving(true)
    await supabase.from('auto_reset_config').update({
      enabled: updated.enabled,
      hour: updated.hour,
      minute: updated.minute,
      days: updated.days,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setSaving(false)
  }

  const toggleDay = (d: number) => {
    if (!config) return
    const days = config.days.includes(d)
      ? config.days.filter(x => x !== d)
      : [...config.days, d].sort((a, b) => a - b)
    save({ days })
  }

  const scheduleLabel = config ? (() => {
    const h = config.hour
    const m = config.minute
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${String(m).padStart(2, '0')} ${ampm} CST`
  })() : ''

  if (!config) return (
    <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-xl p-4 mb-6 animate-pulse">
      <div className="h-4 bg-[#333] rounded w-48" />
    </div>
  )

  return (
    <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-xl p-4 mb-6">
      {/* Header + toggle */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-amber-500">🕐 Auto Reset All</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Automatically runs Reset All on a schedule. Truck &amp; tractor data is always protected.
          </p>
        </div>
        <button
          onClick={() => save({ enabled: !config.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${config.enabled ? 'bg-amber-500' : 'bg-[#333]'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Time picker */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <label className="text-xs text-gray-400 w-10">Time</label>
        <div className="flex items-center gap-1.5">
          <select
            value={config.hour}
            onChange={e => save({ hour: Number(e.target.value) })}
            className="bg-[#222] border border-[#333] rounded-lg px-2 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
          >
            {Array.from({ length: 24 }, (_, i) => {
              const ampm = i >= 12 ? 'PM' : 'AM'
              const h = i === 0 ? 12 : i > 12 ? i - 12 : i
              return <option key={i} value={i}>{String(h).padStart(2, '0')} {ampm}</option>
            })}
          </select>
          <span className="text-gray-500">:</span>
          <select
            value={config.minute}
            onChange={e => save({ minute: Number(e.target.value) })}
            className="bg-[#222] border border-[#333] rounded-lg px-2 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
          >
            {[0, 15, 30, 45].map(m => (
              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 ml-1">CST</span>
        </div>
        {saving && <span className="text-xs text-amber-500 animate-pulse">Saving…</span>}
      </div>

      {/* Day selector */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <label className="text-xs text-gray-400 w-10">Days</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                config.days.includes(i)
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                  : 'bg-[#222] border-[#333] text-gray-500 hover:border-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Status summary */}
      <div className={`text-xs px-3 py-2 rounded-lg border ${config.enabled ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#222] border-[#333] text-gray-500'}`}>
        {config.enabled
          ? `⏰ Auto-reset scheduled at ${scheduleLabel} on selected days`
          : '⏸ Auto-reset is disabled — toggle on to activate'}
      </div>
    </div>
  )
}
