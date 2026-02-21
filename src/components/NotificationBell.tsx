'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

interface Notif {
  id: number
  truck_number: string | null
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const { profile } = useAuth()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen]     = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) return

    // Load recent unread
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifs((data || []) as Notif[])
    }
    load()

    // Subscribe to new notifications
    const ch = supabase.channel(`notifs-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        setNotifs(prev => [payload.new as Notif, ...prev].slice(0, 20))
      })
      .subscribe()

    // Close on outside click
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => { supabase.removeChannel(ch); document.removeEventListener('mousedown', handler) }
  }, [profile])

  const unreadCount = notifs.filter(n => !n.is_read).length

  const markAllRead = async () => {
    if (!profile || unreadCount === 0) return
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', profile.id).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(ts).toLocaleDateString()
  }

  if (!profile) return null

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(o => !o); if (!open) markAllRead() }}
        className="relative px-2 py-2 text-muted hover:text-amber-500 transition-colors">
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-nav border border-amber-500/30 rounded-xl shadow-2xl w-80 z-[100] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#333] flex items-center justify-between">
            <span className="text-sm font-bold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-amber-400 hover:text-amber-300">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center text-muted text-sm py-8">No notifications</div>
            ) : notifs.map(n => (
              <div key={n.id}
                className={`px-4 py-3 border-b border-[#222] text-sm transition-colors ${
                  !n.is_read ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : 'hover:bg-[#1a1a1a]'
                }`}>
                <div className="text-white leading-snug">{n.message}</div>
                <div className="text-[10px] text-muted mt-1">{formatTime(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
