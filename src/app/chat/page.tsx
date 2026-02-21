'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Message {
  id: number
  room_id: number
  sender_id: string
  content: string
  created_at: string
  profiles?: { username: string; display_name: string | null; avatar_color: string; role: string }
}

interface Room {
  id: number
  name: string
  type: string
  role_target: string | null
  unread: number
}

const ROLE_LABELS: Record<string, string> = {
  admin: '👑', print_room: '🖨️', truck_mover: '🚛', trainee: '📚', driver: '🚚',
}

function Avatar({ name, color, size = 8 }: { name: string; color: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
      style={{ background: color }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function ChatPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const isAdmin = profile?.role === 'admin'

  const [rooms, setRooms]             = useState<Room[]>([])
  const [activeRoom, setActiveRoom]   = useState<Room | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [sending, setSending]         = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [hoveredMsg, setHoveredMsg]   = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadRooms = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase.from('chat_rooms').select('*').order('id')
    const visible = (data || []).filter((r: Room) => {
      if (r.type === 'global') return true
      if (r.type === 'role') return r.role_target === profile.role || profile.role === 'admin'
      return false
    })
    setRooms(visible.map((r: Room) => ({ ...r, unread: 0 })))
    if (visible.length > 0 && !activeRoom) setActiveRoom(visible[0])
  }, [profile, activeRoom])

  const loadMessages = useCallback(async (roomId: number) => {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username,display_name,avatar_color,role)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(200)
    setMessages((data || []) as Message[])
    setLoadingMsgs(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  const subscribeRoom = useCallback((roomId: number) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(username,display_name,avatar_color,role)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => [...prev, data as Message])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          }
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id))
        })
      .subscribe()
    channelRef.current = ch
  }, [])

  useEffect(() => {
    if (!authLoading && !profile) router.push('/login')
    if (profile) loadRooms()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [authLoading, profile, router, loadRooms])

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom.id)
      subscribeRoom(activeRoom.id)
    }
  }, [activeRoom, loadMessages, subscribeRoom])

  const sendMessage = async () => {
    if (!input.trim() || !profile || !activeRoom || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    await supabase.from('messages').insert({ room_id: activeRoom.id, sender_id: profile.id, content })
    setSending(false)
  }

  // Delete single message — own messages always, any message if admin
  const deleteMessage = async (msg: Message) => {
    const canDelete = msg.sender_id === profile?.id || isAdmin
    if (!canDelete) return
    await supabase.from('messages').delete().eq('id', msg.id)
    setMessages(prev => prev.filter(m => m.id !== msg.id))
  }

  // Admin: clear all messages in the active room
  const clearRoom = async () => {
    if (!activeRoom || !isAdmin) return
    await supabase.from('messages').delete().eq('room_id', activeRoom.id)
    setMessages([])
    setConfirmClear(false)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    return sameDay
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (authLoading) return <div className="text-center py-20 text-muted">Loading...</div>
  if (!profile) return null

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0 bg-[#0f0f0f] rounded-2xl overflow-hidden border border-[#333]">

      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-[#333] flex flex-col bg-[#111]">
        <div className="px-4 py-3 border-b border-[#333]">
          <div className="text-sm font-bold text-amber-500">💬 Chat</div>
        </div>
        <div className="px-3 py-2 border-b border-[#222] flex items-center gap-2">
          <Avatar name={profile.display_name || profile.username} color={profile.avatar_color} size={7} />
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{profile.display_name || profile.username}</div>
            <div className="text-[10px] text-muted">{ROLE_LABELS[profile.role]} {profile.role.replace('_', ' ')}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-muted uppercase tracking-wider">Rooms</div>
          {rooms.map(room => (
            <button key={room.id} onClick={() => setActiveRoom(room)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 rounded-lg mx-1 ${
                activeRoom?.id === room.id ? 'bg-amber-500/10 text-amber-400 font-medium' : 'text-muted hover:text-white hover:bg-[#1a1a1a]'
              }`}>
              <span className="truncate">{room.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-3 border-b border-[#333] flex items-center gap-3">
          <div className="font-bold">{activeRoom?.name}</div>
          <div className="text-xs text-muted flex-1">
            {activeRoom?.type === 'global' ? 'Everyone' : activeRoom?.type === 'role' ? `${activeRoom.role_target?.replace('_', ' ')} only` : 'Direct'}
          </div>
          {/* Admin: clear room button */}
          {isAdmin && activeRoom && messages.length > 0 && (
            <button onClick={() => setConfirmClear(true)}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded border border-red-400/20 hover:border-red-400/50">
              🗑 Clear Room
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {loadingMsgs && <div className="text-center text-muted text-sm py-8">Loading...</div>}
          {!loadingMsgs && messages.length === 0 && (
            <div className="text-center text-muted text-sm py-8">No messages yet. Say something! 👋</div>
          )}
          {messages.map((msg, idx) => {
            const sender = msg.profiles
            const isMe = msg.sender_id === profile.id
            const canDelete = isMe || isAdmin
            const prev = messages[idx - 1]
            const grouped = prev?.sender_id === msg.sender_id &&
              new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 60000

            return (
              <div key={msg.id}
                className={`flex items-start gap-2.5 ${grouped ? 'mt-0.5' : 'mt-3'} ${isMe ? 'flex-row-reverse' : ''} group`}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => setHoveredMsg(null)}>

                {!grouped ? (
                  <Avatar name={sender?.display_name || sender?.username || '?'} color={sender?.avatar_color || '#666'} size={8} />
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!grouped && (
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold">{isMe ? 'You' : (sender?.display_name || sender?.username)}</span>
                      <span className="text-[10px] text-muted">{ROLE_LABELS[sender?.role || '']}</span>
                      <span className="text-[10px] text-muted">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      isMe ? 'bg-amber-500 text-black rounded-tr-sm' : 'bg-[#222] text-white rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {/* Delete button — shows on hover */}
                    {canDelete && hoveredMsg === msg.id && (
                      <button onClick={() => deleteMessage(msg)}
                        className="text-red-400/50 hover:text-red-400 transition-colors text-xs p-1 rounded"
                        title="Delete message">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#333]">
          <div className="flex gap-2 items-center">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={`Message ${activeRoom?.name || ''}...`}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 outline-none"
              maxLength={1000} />
            <button onClick={sendMessage} disabled={!input.trim() || sending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40">
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Confirm clear modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setConfirmClear(false)}>
          <div className="bg-[#1a1a1a] border border-red-500 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🗑️</div>
              <h3 className="text-lg font-bold text-red-400">Clear Room?</h3>
              <p className="text-sm text-muted mt-1">Delete all messages in <span className="text-white font-semibold">{activeRoom?.name}</span>? This cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)}
                className="flex-1 bg-[#333] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#444] transition-colors">
                Cancel
              </button>
              <button onClick={clearRoom}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-500 transition-colors">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
