'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

/* eslint-disable @typescript-eslint/no-unused-vars */

interface Message {
  id: number
  room_id: number
  sender_id: string
  content: string
  created_at: string
  profiles?: {
    username: string
    display_name: string | null
    avatar_color: string
    avatar_url: string | null
    role: string
  }
}

interface Room {
  id: number
  name: string
  type: string
  role_target: string | null
  allowed_roles: string[] | null
  description: string | null
  unread: number
}

const ALL_ROLES = ['admin', 'print_room', 'truck_mover', 'trainee', 'driver']
const ROLE_LABELS: Record<string, string> = {
  admin: '👑 Admin', print_room: '🖨️ Print Room', truck_mover: '🚛 Truck Mover',
  trainee: '📚 Trainee', driver: '🚚 Driver',
}
const ROLE_ICONS: Record<string, string> = {
  admin: '👑', print_room: '🖨️', truck_mover: '🚛', trainee: '📚', driver: '🚚',
}

function Avatar({ name, color, avatarUrl, size = 8 }: {
  name: string; color: string; avatarUrl?: string | null; size?: number
}) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
    )
  }
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

  const [rooms, setRooms]               = useState<Room[]>([])
  const [activeRoom, setActiveRoom]     = useState<Room | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [sending, setSending]           = useState(false)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [hoveredMsg, setHoveredMsg]     = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showManage, setShowManage]     = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Load rooms ────────────────────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase.from('chat_rooms').select('*').order('id')
    const visible = (data || []).filter((r: Room) => {
      if (profile.role === 'admin') return true          // admin sees everything
      if (r.allowed_roles) return r.allowed_roles.includes(profile.role)
      if (r.type === 'global') return true
      if (r.type === 'role') return r.role_target === profile.role
      return false
    })
    setRooms(visible.map((r: Room) => ({ ...r, unread: 0 })))
    if (visible.length > 0 && !activeRoom) setActiveRoom(visible[0])
  }, [profile, activeRoom])

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (roomId: number) => {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username,display_name,avatar_color,avatar_url,role)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(200)
    setMessages((data || []) as Message[])
    setLoadingMsgs(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  // ── Subscribe to room ─────────────────────────────────────────────────────
  const subscribeRoom = useCallback((roomId: number) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(username,display_name,avatar_color,avatar_url,role)')
            .eq('id', payload.new.id).single()
          if (data) {
            setMessages(prev => [...prev, data as Message])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          }
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => setMessages(prev => prev.filter(m => m.id !== payload.old.id)))
      .subscribe()
    channelRef.current = ch
  }, [])

  useEffect(() => {
    if (!authLoading && !profile) router.push('/login')
    if (profile) loadRooms()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [authLoading, profile, router, loadRooms])

  useEffect(() => {
    if (activeRoom) { loadMessages(activeRoom.id); subscribeRoom(activeRoom.id) }
  }, [activeRoom, loadMessages, subscribeRoom])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !profile || !activeRoom || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    await supabase.from('messages').insert({ room_id: activeRoom.id, sender_id: profile.id, content })
    setSending(false)
  }

  const deleteMessage = async (msg: Message) => {
    if (msg.sender_id !== profile?.id && !isAdmin) return
    await supabase.from('messages').delete().eq('id', msg.id)
    setMessages(prev => prev.filter(m => m.id !== msg.id))
  }

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
        <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
          <div className="text-sm font-bold text-amber-500">💬 Chat</div>
          {isAdmin && (
            <button onClick={() => setShowManage(true)}
              className="text-xs text-muted hover:text-amber-500 transition-colors" title="Manage rooms">
              ⚙️
            </button>
          )}
        </div>
        <div className="px-3 py-2 border-b border-[#222] flex items-center gap-2">
          <Avatar name={profile.display_name || profile.username} color={profile.avatar_color}
            avatarUrl={(profile as unknown as { avatar_url?: string | null }).avatar_url} size={7} />
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{profile.display_name || profile.username}</div>
            <div className="text-[10px] text-muted">{ROLE_ICONS[profile.role]} {profile.role.replace('_', ' ')}</div>
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

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-3 border-b border-[#333] flex items-center gap-3">
          <div className="font-bold">{activeRoom?.name}</div>
          <div className="text-xs text-muted flex-1">
            {activeRoom?.allowed_roles
              ? activeRoom.allowed_roles.map(r => ROLE_ICONS[r]).join(' ')
              : activeRoom?.type === 'global' ? 'Everyone'
              : activeRoom?.type === 'role' ? `${activeRoom.role_target?.replace('_', ' ')} only` : 'Direct'}
          </div>
          {isAdmin && activeRoom && messages.length > 0 && (
            <button onClick={() => setConfirmClear(true)}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded border border-red-400/20 hover:border-red-400/50">
              🗑 Clear Room
            </button>
          )}
        </div>

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
                  <Avatar
                    name={sender?.display_name || sender?.username || '?'}
                    color={sender?.avatar_color || '#666'}
                    avatarUrl={sender?.avatar_url}
                    size={8}
                  />
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!grouped && (
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold">{isMe ? 'You' : (sender?.display_name || sender?.username)}</span>
                      <span className="text-[10px] text-muted">{ROLE_ICONS[sender?.role || '']}</span>
                      <span className="text-[10px] text-muted">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      isMe ? 'bg-amber-500 text-black rounded-tr-sm' : 'bg-[#222] text-white rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {canDelete && hoveredMsg === msg.id && (
                      <button onClick={() => deleteMessage(msg)}
                        className="text-red-400/50 hover:text-red-400 transition-colors text-xs p-1 rounded">✕</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

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

      {/* Clear room modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setConfirmClear(false)}>
          <div className="bg-[#1a1a1a] border border-red-500 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🗑️</div>
              <h3 className="text-lg font-bold text-red-400">Clear Room?</h3>
              <p className="text-sm text-muted mt-1">Delete all messages in <span className="text-white font-semibold">{activeRoom?.name}</span>?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 bg-[#333] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#444]">Cancel</button>
              <button onClick={clearRoom} className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-500">Clear All</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Manage Rooms modal */}
      {showManage && isAdmin && (
        <ManageRoomsModal rooms={rooms} onClose={() => { setShowManage(false); loadRooms() }} />
      )}
    </div>
  )
}

// ── Admin: Manage Rooms modal ────────────────────────────────────────────────
function ManageRoomsModal({ rooms, onClose }: { rooms: Room[]; onClose: () => void }) {
  const [allRooms, setAllRooms]   = useState<Room[]>(rooms)
  const [saving, setSaving]       = useState<number | null>(null)
  const [newRoom, setNewRoom]     = useState({ name: '', description: '' })
  const [creating, setCreating]   = useState(false)

  const reload = async () => {
    const { data } = await supabase.from('chat_rooms').select('*').order('id')
    setAllRooms((data || []).map((r: Room) => ({ ...r, unread: 0 })))
  }

  // Toggle a role on/off for a room
  const toggleRole = async (room: Room, role: string) => {
    setSaving(room.id)
    let next: string[] | null
    if (!room.allowed_roles) {
      // Currently unrestricted → restrict to all roles except this one (remove it)
      next = ALL_ROLES.filter(r => r !== role)
    } else if (room.allowed_roles.includes(role)) {
      next = room.allowed_roles.filter(r => r !== role)
      if (next.length === 0) next = null // empty = no one can see it (except admin)
    } else {
      next = [...room.allowed_roles, role]
      if (next.sort().join() === ALL_ROLES.sort().join()) next = null // all roles = unrestricted
    }
    await supabase.from('chat_rooms').update({ allowed_roles: next }).eq('id', room.id)
    setSaving(null)
    reload()
  }

  // Make unrestricted (all roles see it)
  const makeGlobal = async (room: Room) => {
    setSaving(room.id)
    await supabase.from('chat_rooms').update({ allowed_roles: null }).eq('id', room.id)
    setSaving(null)
    reload()
  }

  const createRoom = async () => {
    if (!newRoom.name.trim()) return
    setCreating(true)
    await supabase.from('chat_rooms').insert({
      name: newRoom.name.trim(),
      description: newRoom.description.trim() || null,
      type: 'global',
      allowed_roles: null,
    })
    setNewRoom({ name: '', description: '' })
    setCreating(false)
    reload()
  }

  const deleteRoom = async (room: Room) => {
    if (!confirm(`Delete room "${room.name}"? All messages will be lost.`)) return
    await supabase.from('messages').delete().eq('room_id', room.id)
    await supabase.from('chat_rooms').delete().eq('id', room.id)
    reload()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-[#333] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <h2 className="text-lg font-bold">⚙️ Manage Chat Rooms</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Role legend */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ALL_ROLES.map(r => (
              <span key={r} className="text-[10px] px-2 py-0.5 bg-[#222] rounded text-muted">{ROLE_LABELS[r]}</span>
            ))}
          </div>

          {allRooms.map(room => (
            <div key={room.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-white">{room.name}</div>
                  {room.description && <div className="text-xs text-muted mt-0.5">{room.description}</div>}
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  {room.allowed_roles && (
                    <button onClick={() => makeGlobal(room)} disabled={saving === room.id}
                      className="text-[10px] text-amber-500 border border-amber-500/30 rounded px-2 py-0.5 hover:bg-amber-500/10 transition-colors">
                      Make Global
                    </button>
                  )}
                  <button onClick={() => deleteRoom(room)}
                    className="text-red-500/40 hover:text-red-400 transition-colors text-sm">🗑️</button>
                </div>
              </div>

              <div className="text-xs text-muted mb-2 font-bold uppercase tracking-wider">
                {room.allowed_roles ? `Visible to: ${room.allowed_roles.length} role(s)` : '🌐 Visible to everyone'}
              </div>

              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map(role => {
                  const active = !room.allowed_roles || room.allowed_roles.includes(role)
                  // admin always sees everything — show as locked
                  if (role === 'admin') {
                    return (
                      <span key={role} className="text-[11px] px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 font-medium cursor-default" title="Admin always has access">
                        {ROLE_LABELS[role]} 🔒
                      </span>
                    )
                  }
                  return (
                    <button key={role}
                      onClick={() => toggleRole(room, role)}
                      disabled={saving === room.id}
                      className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                        active
                          ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
                          : 'bg-[#222] border-[#444] text-muted hover:bg-green-500/10 hover:border-green-500/40 hover:text-green-400'
                      }`}>
                      {active ? '✓' : '✗'} {ROLE_LABELS[role]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Create new room */}
          <div className="bg-[#1a1a1a] border border-dashed border-[#444] rounded-xl p-4">
            <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">+ Create New Room</div>
            <div className="flex gap-2">
              <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                placeholder="Room name" onKeyDown={e => e.key === 'Enter' && createRoom()}
                className="flex-1 bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
              <input value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
                placeholder="Description (optional)"
                className="flex-1 bg-input border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
              <button onClick={createRoom} disabled={creating || !newRoom.name.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#333]">
          <button onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
