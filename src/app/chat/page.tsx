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
  read_only_roles: string[] | null
  description: string | null
  unread: number
}

// ALL_ROLES is now loaded dynamically from the database
// Fallback in case DB hasn't loaded yet
const FALLBACK_ROLES = ['admin', 'print_room', 'truck_mover', 'trainee', 'driver']
const ROLE_LABELS_MAP: Record<string, string> = {
  admin: '👑 Admin', print_room: '🖨️ Print Room', truck_mover: '🚛 Truck Mover',
  trainee: '📚 Trainee', driver: '🚚 Driver',
}
const ROLE_ICONS_MAP: Record<string, string> = {
  admin: '👑', print_room: '🖨️', truck_mover: '🚛', trainee: '📚', driver: '🚚',
}
function getRoleLabel(role: string) { return ROLE_LABELS_MAP[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function getRoleIcon(role: string)  { return ROLE_ICONS_MAP[role] || '👤' }
// Keep as objects for backward compat
const ROLE_LABELS = new Proxy(ROLE_LABELS_MAP, { get: (t, k) => typeof k === 'string' ? getRoleLabel(k) : (t as Record<string,string>)[k as unknown as string] }) as Record<string,string>
const ROLE_ICONS  = new Proxy(ROLE_ICONS_MAP,  { get: (t, k) => typeof k === 'string' ? getRoleIcon(k)  : (t as Record<string,string>)[k as unknown as string] }) as Record<string,string>

function canWriteInRoom(room: Room, role: string): boolean {
  if (role === 'admin') return true
  if (!room.read_only_roles) return true
  return !room.read_only_roles.includes(role)
}

function canSeeRoom(room: Room, role: string): boolean {
  if (role === 'admin') return true
  // allowed_roles = null means global (everyone)
  if (room.allowed_roles === null) return true
  // allowed_roles = [] means hidden from everyone except admin
  if (room.allowed_roles.length === 0) return false
  return room.allowed_roles.includes(role)
}

function Avatar({ name, color, avatarUrl, size = 8 }: {
  name: string; color: string; avatarUrl?: string | null; size?: number
}) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} width={size * 4} height={size * 4}
      style={{ width: size * 4, height: size * 4, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size * 4, height: size * 4, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function ChatPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const isAdmin = profile?.role === 'admin'

  const [rooms, setRooms]               = useState<Room[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allRoles, setAllRoles]           = useState<string[]>(FALLBACK_ROLES)
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [input, setInput]               = useState('')
  const [sending, setSending]           = useState(false)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [hoveredMsg, setHoveredMsg]     = useState<number | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showManage, setShowManage]     = useState(false)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const activeRoomRef  = useRef<number | null>(null)
  const roomsRef       = useRef<Room[]>([])

  // Keep refs in sync so realtime handlers always see current values
  useEffect(() => { activeRoomRef.current = activeRoomId }, [activeRoomId])
  useEffect(() => { roomsRef.current = rooms }, [rooms])

  const activeRoom = rooms.find(r => r.id === activeRoomId) ?? null

  // ── Load rooms ──────────────────────────────────────────────────────────
  const loadRooms = useCallback(async (keepActive = false) => {
    if (!profile) return
    // Load dynamic roles from DB
    const { data: roleData } = await supabase.from('role_permissions').select('role_name').order('role_name')
    if (roleData && roleData.length > 0) setAllRoles(roleData.map(r => r.role_name))
    const { data } = await supabase.from('chat_rooms').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('id')
    const visible = (data || []).filter((r: Room) => canSeeRoom(r, profile.role))
    setRooms(prev => {
      const merged = visible.map((r: Room) => {
        const existing = prev.find(p => p.id === r.id)
        return { ...r, unread: existing?.unread ?? 0 }
      })
      return merged
    })
    if (!keepActive && visible.length > 0) {
      setActiveRoomId(prev => prev ?? visible[0].id)
    }
  }, [profile])

  // ── Load messages ───────────────────────────────────────────────────────
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

  // ── Subscribe to ALL visible rooms for unread + active room messages ────
  const subscribeAll = useCallback((visibleRoomIds: number[]) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    if (visibleRoomIds.length === 0) return

    const ch = supabase.channel('chat-all')

    visibleRoomIds.forEach(roomId => {
      ch.on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const currentActive = activeRoomRef.current

          if (roomId === currentActive) {
            // Fetch full message with profile data
            const { data } = await supabase
              .from('messages')
              .select('*, profiles(username,display_name,avatar_color,avatar_url,role)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setMessages(prev => {
                // Deduplicate
                if (prev.find(m => m.id === data.id)) return prev
                return [...prev, data as Message]
              })
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
            }
          } else {
            // Increment unread badge for other rooms
            setRooms(prev => prev.map(r =>
              r.id === roomId ? { ...r, unread: r.unread + 1 } : r
            ))
          }
        })

      ch.on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (roomId === activeRoomRef.current) {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id))
          }
        })
    })

    ch.subscribe((status) => {
      console.log('[chat] realtime status:', status)
    })
    channelRef.current = ch
  }, [])

  // Init: load rooms, then subscribe
  useEffect(() => {
    if (!authLoading && !profile) { router.push('/login'); return }
    if (!profile) return
    supabase.from('chat_rooms').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('id').then(({ data }) => {
      const visible = (data || []).filter((r: Room) => canSeeRoom(r, profile.role))
      const withUnread = visible.map((r: Room) => ({ ...r, unread: 0 }))
      setRooms(withUnread)
      if (visible.length > 0) setActiveRoomId(visible[0].id)
      subscribeAll(visible.map((r: Room) => r.id))
    })
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile?.id])

  // Load messages + clear unread when active room changes
  useEffect(() => {
    if (!activeRoomId) return
    loadMessages(activeRoomId)
    setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, unread: 0 } : r))
  }, [activeRoomId, loadMessages])

  // ── Send / delete / clear ───────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !profile || !activeRoomId || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    await supabase.from('messages').insert({ room_id: activeRoomId, sender_id: profile.id, content })
    setSending(false)
  }

  const deleteMessage = async (msg: Message) => {
    if (msg.sender_id !== profile?.id && !isAdmin) return
    await supabase.from('messages').delete().eq('id', msg.id)
    setMessages(prev => prev.filter(m => m.id !== msg.id))
  }

  const clearRoom = async () => {
    if (!activeRoomId || !isAdmin) return
    await supabase.from('messages').delete().eq('room_id', activeRoomId)
    setMessages([])
    setConfirmClear(false)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (authLoading) return <div className="text-center py-20 text-muted">Loading...</div>
  if (!profile) return null

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0 bg-[#0f0f0f] rounded-2xl overflow-hidden border border-[#333]">

      {/* ── Sidebar ── */}
      <div className="w-60 flex-shrink-0 border-r border-[#333] flex flex-col bg-[#111]">
        <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
          <div className="text-sm font-bold text-amber-500">💬 Chat</div>
          {isAdmin && (
            <button onClick={() => setShowManage(true)} title="Manage rooms"
              className="text-xs text-muted hover:text-amber-500 transition-colors">⚙️</button>
          )}
        </div>

        {/* Self avatar */}
        <div className="px-3 py-2 border-b border-[#222] flex items-center gap-2">
          <Avatar name={profile.display_name || profile.username} color={profile.avatar_color}
            avatarUrl={(profile as unknown as { avatar_url?: string | null }).avatar_url} size={7} />
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">{profile.display_name || profile.username}</div>
            <div className="text-[10px] text-muted">{ROLE_ICONS[profile.role]} {profile.role.replace('_', ' ')}</div>
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-muted uppercase tracking-wider">Rooms</div>
          {rooms.map(room => (
            <button key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 rounded-lg mx-1 mb-0.5 ${
                room.id === activeRoomId
                  ? 'bg-amber-500/10 text-amber-400 font-medium'
                  : 'text-muted hover:text-white hover:bg-[#1a1a1a]'
              }`}>
              <span className="truncate">{room.name}</span>
              {room.unread > 0 && room.id !== activeRoomId && (
                <span style={{
                  background: '#f59e0b', color: '#000', borderRadius: 9999,
                  fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px', flexShrink: 0,
                }}>
                  {room.unread > 99 ? '99+' : room.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-3 border-b border-[#333] flex items-center gap-3">
          <div className="font-bold">{activeRoom?.name}</div>
          <div className="text-xs text-muted flex-1">
            {activeRoom?.allowed_roles === null
              ? 'Everyone'
              : activeRoom?.allowed_roles?.length === 0
              ? 'Admins only'
              : activeRoom?.allowed_roles?.map(r => ROLE_ICONS[r]).join(' ')}
          </div>
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

                {!grouped
                  ? <Avatar name={sender?.display_name || sender?.username || '?'}
                      color={sender?.avatar_color || '#666'} avatarUrl={sender?.avatar_url} size={8} />
                  : <div style={{ width: 32, flexShrink: 0 }} />}

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
                    }`}>{msg.content}</div>
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

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#333]">
          {activeRoom && !canWriteInRoom(activeRoom, profile.role) ? (
            <div className="text-center text-xs text-muted py-2 bg-[#1a1a1a] rounded-xl border border-[#333]">
              👁 Read-only — you can view but not send messages in this room
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Clear room confirm */}
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

      {/* Admin manage rooms */}
      {showManage && isAdmin && (
        <ManageRoomsModal
          onClose={async () => {
            setShowManage(false)
            await loadRooms(true)
            // Re-subscribe with potentially updated room list
            // Load dynamic roles from DB
    const { data: roleData } = await supabase.from('role_permissions').select('role_name').order('role_name')
    if (roleData && roleData.length > 0) setAllRoles(roleData.map(r => r.role_name))
    const { data } = await supabase.from('chat_rooms').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('id')
            const visible = (data || []).filter((r: Room) => canSeeRoom(r, profile.role))
            subscribeAll(visible.map((r: Room) => r.id))
          }}
        />
      )}
    </div>
  )
}

// ── Role toggle button ──────────────────────────────────────────────────────
function RoleToggleBtn({ label, active, disabled, onClick, activeColor }: {
  label: string; active: boolean; disabled?: boolean; onClick: () => void; activeColor?: string
}) {
  const ac = activeColor || '#4ade80'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: active ? `${ac}25` : 'rgba(239,68,68,0.1)',
      border: `1px solid ${active ? `${ac}80` : 'rgba(239,68,68,0.4)'}`,
      color: active ? ac : '#f87171',
      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
      whiteSpace: 'nowrap',
    }}>
      {active ? '✓' : '✗'} {label}
    </button>
  )
}

// ── Admin: Manage Rooms modal ───────────────────────────────────────────────
function ManageRoomsModal({ onClose }: { onClose: () => void }) {
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [saving, setSaving]     = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newRoom, setNewRoom]   = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const reload = useCallback(async () => {
    // Load dynamic roles from DB
    const { data: roleData } = await supabase.from('role_permissions').select('role_name').order('role_name')
    if (roleData && roleData.length > 0) setAllRoles(roleData.map(r => r.role_name))
    const { data } = await supabase.from('chat_rooms').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('id')
    setAllRooms((data || []).map((r: Room) => ({ ...r, unread: 0 })))
    setLoaded(true)
  }, [])

  useEffect(() => { reload() }, [reload])

  const adminRoomApi = async (body: object) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/api/admin/update-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  const toggleRole = async (roomId: number, role: string) => {
    setSaving(roomId)
    setSaveError(null)
    const current = allRooms.find(r => r.id === roomId)!
    let next: string[] | null

    if (current.allowed_roles === null) {
      next = allRoles.filter(r => r !== role && r !== 'admin')
    } else if (current.allowed_roles.includes(role)) {
      next = current.allowed_roles.filter(r => r !== role)
    } else {
      next = [...current.allowed_roles, role]
      const nonAdmin = allRoles.filter(r => r !== 'admin')
      if (nonAdmin.every(r => next!.includes(r))) next = null
    }

    setAllRooms(prev => prev.map(r => r.id === roomId ? { ...r, allowed_roles: next } : r))
    const result = await adminRoomApi({ action: 'update_roles', roomId, allowed_roles: next })
    if (result.error) {
      setSaveError(`Save failed: ${result.error}`)
      setAllRooms(prev => prev.map(r => r.id === roomId ? { ...r, allowed_roles: current.allowed_roles } : r))
    }
    setSaving(null)
  }

  const toggleReadOnly = async (roomId: number, role: string) => {
    setSaving(roomId)
    setSaveError(null)
    const current = allRooms.find(r => r.id === roomId)!
    const currentRO = current.read_only_roles || []
    const next = currentRO.includes(role)
      ? currentRO.filter(r => r !== role)
      : [...currentRO, role]
    setAllRooms(prev => prev.map(r => r.id === roomId ? { ...r, read_only_roles: next } : r))
    const result = await adminRoomApi({ action: 'update_read_only', roomId, read_only_roles: next })
    if (result.error) {
      setSaveError(`Save failed: ${result.error}`)
      setAllRooms(prev => prev.map(r => r.id === roomId ? { ...r, read_only_roles: current.read_only_roles } : r))
    }
    setSaving(null)
  }

  const makeGlobal = async (roomId: number) => {
    setSaving(roomId)
    setSaveError(null)
    const prevRoles = allRooms.find(r => r.id === roomId)?.allowed_roles
    setAllRooms(p => p.map(r => r.id === roomId ? { ...r, allowed_roles: null } : r))
    const result = await adminRoomApi({ action: 'update_roles', roomId, allowed_roles: null })
    if (result.error) {
      setSaveError(`Save failed: ${result.error}`)
      setAllRooms(p => p.map(r => r.id === roomId ? { ...r, allowed_roles: prevRoles ?? null } : r))
    }
    setSaving(null)
  }

  const createRoom = async () => {
    if (!newRoom.name.trim()) return
    setCreating(true)
    const result = await adminRoomApi({ action: 'create', name: newRoom.name, description: newRoom.description })
    if (result.error) setSaveError(`Create failed: ${result.error}`)
    setNewRoom({ name: '', description: '' })
    setCreating(false)
    reload()
  }

  const deleteRoom = async (room: Room) => {
    if (!confirm(`Delete room "${room.name}"? All messages will be lost.`)) return
    const result = await adminRoomApi({ action: 'delete', roomId: room.id })
    if (result.error) setSaveError(`Delete failed: ${result.error}`)
    else reload()
  }

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return
    }
    const reordered = [...allRooms]
    const from = dragItem.current
    const to = dragOver.current
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    dragItem.current = null; dragOver.current = null
    setAllRooms(reordered)
    await adminRoomApi({ action: 'reorder', orderedIds: reordered.map(r => r.id) })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#333] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <h2 className="text-lg font-bold">⚙️ Manage Chat Rooms</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!loaded && <div className="text-center text-muted py-8">Loading...</div>}
          {saveError && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-xl px-4 py-3">
              ⚠️ {saveError} — check browser console for details. You may need an RLS policy allowing admins to update chat_rooms.
            </div>
          )}

          {allRooms.map((room, idx) => (
            <div key={room.id}
              draggable
              onDragStart={() => { dragItem.current = idx }}
              onDragEnter={() => { dragOver.current = idx }}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 cursor-grab active:cursor-grabbing active:opacity-60 active:border-amber-500/50 transition-opacity select-none">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted text-sm flex-shrink-0" title="Drag to reorder">⠿⠿</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{room.name}</div>
                    {room.description && <div className="text-xs text-muted mt-0.5">{room.description}</div>}
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  {room.allowed_roles !== null && (
                    <button onClick={() => makeGlobal(room.id)} disabled={saving === room.id}
                      className="text-[10px] text-amber-500 border border-amber-500/30 rounded px-2 py-0.5 hover:bg-amber-500/10">
                      Make Global
                    </button>
                  )}
                  <button onClick={() => deleteRoom(room)} className="text-red-500/50 hover:text-red-400 text-sm">🗑️</button>
                </div>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{
                color: room.allowed_roles === null ? '#6ee7b7' : room.allowed_roles.length === 0 ? '#f87171' : '#fbbf24'
              }}>
                {room.allowed_roles === null
                  ? '🌐 Everyone can see this'
                  : room.allowed_roles.length === 0
                  ? '🔒 Hidden (admins only)'
                  : `👁 Visible to: ${room.allowed_roles.map(r => ROLE_LABELS[r]).join(', ')}`}
              </div>

              {/* Can see */}
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1 mt-2">Can See Room</div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span style={{
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                  color: '#fbbf24', padding: '6px 12px', borderRadius: 8, fontSize: 11,
                  fontWeight: 500, whiteSpace: 'nowrap',
                }}>👑 Admin 🔒</span>
                {allRoles.filter(r => r !== 'admin').map(role => {
                  const active = room.allowed_roles === null || room.allowed_roles.includes(role)
                  return (
                    <RoleToggleBtn key={role} label={ROLE_LABELS[role] || role} active={active}
                      disabled={saving === room.id}
                      onClick={() => toggleRole(room.id, role)} />
                  )
                })}
              </div>

              {/* Read-only */}
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Read-Only Roles <span className="text-[9px] normal-case font-normal">(can see but not send)</span></div>
              <div className="flex flex-wrap gap-2">
                {allRoles.filter(r => r !== 'admin').map(role => {
                  const canSee = room.allowed_roles === null || room.allowed_roles.includes(role)
                  if (!canSee) return null
                  const readOnly = room.read_only_roles?.includes(role) ?? false
                  return (
                    <RoleToggleBtn key={role}
                      label={(ROLE_LABELS[role] || role) + (readOnly ? ' 👁' : ' ✏️')}
                      active={readOnly}
                      activeColor="#6366f1"
                      disabled={saving === room.id}
                      onClick={() => toggleReadOnly(room.id, role)} />
                  )
                })}
              </div>

              {/* Read-only permissions per role */}
              {(room.allowed_roles === null || room.allowed_roles.length > 0) && (
                <div className="mt-3 pt-3 border-t border-[#333]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">🔏 Read-Only Roles <span className="font-normal normal-case">(can view but not post)</span></div>
                  <div className="flex flex-wrap gap-2">
                    {allRoles.filter(r => r !== 'admin').map(role => {
                      const canSee = room.allowed_roles === null || room.allowed_roles.includes(role)
                      if (!canSee) return null
                      const isReadOnly = room.read_only_roles?.includes(role) ?? false
                      return (
                        <button key={role}
                          disabled={saving === room.id}
                          onClick={() => toggleReadOnly(room.id, role)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isReadOnly
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                              : 'bg-[#222] border-[#444] text-gray-500 hover:border-[#666]'
                          }`}>
                          {isReadOnly ? '👁 ' : ''}{ROLE_LABELS[role]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Create room */}
          <div className="bg-[#1a1a1a] border border-dashed border-[#444] rounded-xl p-4">
            <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">+ Create New Room</div>
            <div className="flex gap-2">
              <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                placeholder="Room name" onKeyDown={e => e.key === 'Enter' && createRoom()}
                className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
              <input value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
                placeholder="Description (optional)"
                className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
              <button onClick={createRoom} disabled={creating || !newRoom.name.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#333]">
          <button onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
