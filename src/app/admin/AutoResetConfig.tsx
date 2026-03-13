'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const RESET_TYPES = [
  { key: 'printroom', icon: '🖨️', label: 'Print Room' },
  { key: 'preshift',  icon: '📋', label: 'PreShift'  },
  { key: 'movement',  icon: '🚚', label: 'Movement'  },
]

export default function AutoResetConfig() {
  const [config, setConfig] = useState<{
    enabled: boolean
    days: number[]
    reset_types: string[]
  } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('auto_reset_config').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setConfig({
            enabled:     data.enabled     ?? false,
            days:        data.days        ?? [1, 2, 3, 4, 5, 6],
            reset_types: data.reset_types ?? ['printroom', 'preshift', 'movement'],
          })
        }
      })
  }, [])

  const save = async (patch: Partial<{ enabled: boolean; days: number[]; reset_types: string[] }>) => {
    if (!config) return
    const updated = { ...config, ...patch }
    setConfig(updated)
    setSaving(true)
    await supabase.from('auto_reset_config').update({
      enabled:     updated.enabled,
      days:        updated.days,
      reset_types: updated.reset_types,
      updated_at:  new Date().toISOString(),
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

  const toggleType = (key: string) => {
    if (!config) return
    const types = config.reset_types.includes(key)
      ? config.reset_types.filter(t => t !== key)
      : [...config.reset_types, key]
    save({ reset_types: types })
  }

  if (!config) return (
    <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-xl p-4 mb-6 animate-pulse">
      <div className="h-4 bg-[#333] rounded w-48" />
    </div>
  )

  return (
    <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-xl p-4 mb-6">

      {/* Header + enable toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-amber-500">⏰ Auto-Reset Schedule</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Runs daily at <span className="text-amber-400 font-bold">12:00 PM CST (Noon)</span> on selected days. Select what to reset below.
          </p>
        </div>
        <button
          onClick={() => save({ enabled: !config.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${config.enabled ? 'bg-amber-500' : 'bg-[#333]'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className={config.enabled ? '' : 'opacity-50 pointer-events-none'}>

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
          {saving && <span className="text-xs text-amber-500 animate-pulse ml-2">Saving…</span>}
        </div>

        {/* What to reset */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <label className="text-xs text-gray-400 w-10">Reset</label>
          <div className="flex gap-1.5 flex-wrap">
            {RESET_TYPES.map(r => (
              <button
                key={r.key}
                onClick={() => toggleType(r.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  config.reset_types.includes(r.key)
                    ? 'bg-red-900/30 border-red-600/60 text-red-400'
                    : 'bg-[#222] border-[#333] text-gray-500 hover:border-gray-500'
                }`}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Status summary */}
      <div className={`text-xs px-3 py-2 rounded-lg border ${
        config.enabled
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-[#222] border-[#333] text-gray-500'
      }`}>
        {config.enabled
          ? `⏰ Resets ${config.reset_types.join(' + ')} at 12:00 PM CST on ${
              config.days.length === 7 ? 'every day' : config.days.map(d => DAY_LABELS[d]).join(', ')
            }`
          : '⏸ Auto-reset is disabled — toggle on to activate'}
      </div>
    </div>
  )
}
