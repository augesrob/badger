'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

export interface NotifPrefs {
  notify_truck_status: boolean
  notify_door_status:  boolean
  notify_chat_mention: boolean
  notify_preshift:     boolean
  notify_system:       boolean
  channel_app:         boolean
  channel_sms:         boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  notify_truck_status: true,
  notify_door_status:  true,
  notify_chat_mention: true,
  notify_preshift:     true,
  notify_system:       true,
  channel_app:         true,
  channel_sms:         true,
}

const EVENT_ITEMS: { key: keyof NotifPrefs; label: string; icon: string; desc: string }[] = [
  { key: 'notify_truck_status', icon: '🚚', label: 'Truck Status Change',   desc: 'When a truck you subscribe to changes status in Live Movement' },
  { key: 'notify_door_status',  icon: '🚪', label: 'Door Status Change',    desc: 'When a loading door status is updated in Print Room' },
  { key: 'notify_chat_mention', icon: '💬', label: 'Chat Mention',          desc: 'When someone @mentions you in a chat room' },
  { key: 'notify_preshift',     icon: '📋', label: 'PreShift Change',       desc: 'When a truck is added or moved in PreShift staging' },
  { key: 'notify_system',       icon: '📢', label: 'System / Admin Alerts', desc: 'Announcements and important system messages from admins' },
]

const CHANNEL_ITEMS: { key: keyof NotifPrefs; label: string; icon: string; desc: string }[] = [
  { key: 'channel_app', icon: '🔔', label: 'In-App Bell',   desc: 'Show in the notification bell inside Badger' },
  { key: 'channel_sms', icon: '📱', label: 'SMS Text',      desc: 'Send an SMS text message (requires phone + carrier in profile)' },
]

interface Props {
  userId: string
  compact?: boolean   // true = slim row style for admin user list
}

export default function NotificationPrefs({ userId, compact = false }: Props) {
  const toast = useToast()
  const [prefs, setPrefs]     = useState<NotifPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      setPrefs({
        notify_truck_status: data.notify_truck_status,
        notify_door_status:  data.notify_door_status,
        notify_chat_mention: data.notify_chat_mention,
        notify_preshift:     data.notify_preshift,
        notify_system:       data.notify_system,
        channel_app:         data.channel_app,
        channel_sms:         data.channel_sms,
      })
    } else {
      // Row doesn't exist yet — upsert defaults
      await supabase.from('notification_preferences').upsert({ user_id: userId, ...DEFAULT_PREFS })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const toggle = (key: keyof NotifPrefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs })
    setSaving(false)
    if (error) { toast('Failed to save: ' + error.message, 'error'); return }
    toast('Notification preferences saved ✓')
  }

  const allEventsOn  = EVENT_ITEMS.every(e => prefs[e.key])
  const allEventsOff = EVENT_ITEMS.every(e => !prefs[e.key])

  const setAllEvents = (val: boolean) => {
    setPrefs(p => ({
      ...p,
      notify_truck_status: val,
      notify_door_status:  val,
      notify_chat_mention: val,
      notify_preshift:     val,
      notify_system:       val,
    }))
  }

  if (loading) return <div className="text-xs text-gray-500 py-2">Loading preferences...</div>

  if (compact) {
    // Slim inline style for admin user list
    return (
      <div className="space-y-2">
        {/* Events row */}
        <div className="flex flex-wrap gap-2">
          {EVENT_ITEMS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => toggle(key)} title={label}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                prefs[key]
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#222] text-gray-500 border-[#333] line-through'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>
        {/* Channels row */}
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Via:</span>
          {CHANNEL_ITEMS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => toggle(key)} title={label}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                prefs[key]
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-[#222] text-gray-500 border-[#333]'
              }`}>
              {icon} {label}
            </button>
          ))}
          <button onClick={save} disabled={saving}
            className="ml-auto bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full hover:bg-amber-400 disabled:opacity-50 transition-colors">
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  // Full expanded style for profile page / admin notifications section
  return (
    <div className="space-y-4">
      {/* Section header with All On / All Off */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Event Notifications</span>
        <div className="flex gap-2">
          <button onClick={() => setAllEvents(true)} disabled={allEventsOn}
            className="text-xs px-2.5 py-1 rounded bg-[#222] text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
            All On
          </button>
          <button onClick={() => setAllEvents(false)} disabled={allEventsOff}
            className="text-xs px-2.5 py-1 rounded bg-[#222] text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
            All Off
          </button>
        </div>
      </div>

      {/* Event toggles */}
      <div className="space-y-1">
        {EVENT_ITEMS.map(({ key, icon, label, desc }) => (
          <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
            prefs[key] ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-[#111] border-[#1a1a1a] opacity-60'
          }`} onClick={() => toggle(key)}>
            <Toggle on={prefs[key]} />
            <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{label}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery channels */}
      <div>
        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Delivery Channels</span>
        <div className="mt-2 space-y-1">
          {CHANNEL_ITEMS.map(({ key, icon, label, desc }) => (
            <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              prefs[key] ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-[#111] border-[#1a1a1a] opacity-60'
            }`} onClick={() => toggle(key)}>
              <Toggle on={prefs[key]} />
              <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Notification Preferences'}
      </button>
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-10 h-5 rounded-full flex items-center flex-shrink-0 transition-colors ${on ? 'bg-amber-500' : 'bg-[#444]'}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  )
}
