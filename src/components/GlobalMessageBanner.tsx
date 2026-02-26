'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GlobalMessage } from '@/lib/types'

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  info:    { bg: 'bg-blue-900/60',   border: 'border-blue-500/60',   text: 'text-blue-100',   icon: '💬' },
  warning: { bg: 'bg-yellow-900/60', border: 'border-yellow-500/60', text: 'text-yellow-100', icon: '⚠️' },
  success: { bg: 'bg-green-900/60',  border: 'border-green-500/60',  text: 'text-green-100',  icon: '✅' },
  error:   { bg: 'bg-red-900/70',    border: 'border-red-500/60',    text: 'text-red-100',    icon: '🚨' },
}

const DISMISSED_KEY = 'badger_dismissed_msgs'

function getDismissed(): number[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}
function addDismissed(id: number) {
  const list = getDismissed()
  if (!list.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...list, id]))
  }
}

export default function GlobalMessageBanner({ userRole }: { userRole?: string }) {
  const [messages, setMessages] = useState<GlobalMessage[]>([])
  const [dismissed, setDismissed] = useState<number[]>([])

  useEffect(() => {
    setDismissed(getDismissed())

    const load = async () => {
      const { data } = await supabase
        .from('global_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (data) setMessages(data)
    }
    load()

    // Realtime — messages update live without page refresh
    const channel = supabase
      .channel('global-messages-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_messages' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const dismiss = (id: number) => {
    addDismissed(id)
    setDismissed(prev => [...prev, id])
    // Also record in DB so admin can see dismiss count
    supabase.rpc('dismiss_global_message', { msg_id: id }).then(() => {})
  }

  const visible = messages.filter(m => {
    if (dismissed.includes(m.id)) return false
    if (m.expires_at && new Date(m.expires_at) < new Date()) return false
    if (userRole && !m.visible_roles.includes(userRole)) return false
    return true
  })

  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-0">
      {visible.map(m => {
        const s = TYPE_STYLES[m.message_type] || TYPE_STYLES.info
        return (
          <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 border-b ${s.bg} ${s.border} ${s.text}`}>
            <span className="text-base flex-shrink-0">{s.icon}</span>
            <p className="flex-1 text-sm font-medium">{m.message}</p>
            <button
              onClick={() => dismiss(m.id)}
              className="flex-shrink-0 text-white/50 hover:text-white text-lg leading-none ml-2 transition-colors"
              title="Dismiss"
              aria-label="Dismiss message">
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
