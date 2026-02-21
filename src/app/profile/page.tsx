'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { useRouter } from 'next/navigation'

const CARRIERS = [
  { label: 'Verizon',     value: 'verizon',    gateway: 'vtext.com' },
  { label: 'AT&T',        value: 'att',        gateway: 'txt.att.net' },
  { label: 'T-Mobile',    value: 'tmobile',    gateway: 'tmomail.net' },
  { label: 'Sprint',      value: 'sprint',     gateway: 'messaging.sprintpcs.com' },
  { label: 'Cricket',     value: 'cricket',    gateway: 'sms.cricketwireless.net' },
  { label: 'Boost',       value: 'boost',      gateway: 'sms.myboostmobile.com' },
  { label: 'Metro PCS',   value: 'metro',      gateway: 'mymetropcs.com' },
  { label: 'US Cellular', value: 'uscellular', gateway: 'email.uscc.net' },
]

const COLORS = ['#f59e0b','#3b82f6','#22c55e','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

const ROLE_LABELS: Record<string, string> = {
  admin: '👑 Admin', print_room: '🖨️ Print Room', truck_mover: '🚛 Truck Mover',
  trainee: '📚 Trainee', driver: '🚚 Driver',
}

export default function ProfilePage() {
  const { profile, refreshProfile, signOut, loading: authLoading } = useAuth()
  const toast = useToast()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone]             = useState('')
  const [carrier, setCarrier]         = useState('')
  const [smsEnabled, setSmsEnabled]   = useState(false)
  const [avatarColor, setAvatarColor] = useState('#f59e0b')
  const [saving, setSaving]           = useState(false)

  const [subscriptions, setSubscriptions] = useState<string[]>([])
  const [newTruck, setNewTruck]           = useState('')
  const [subLoading, setSubLoading]       = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setPhone(profile.phone || '')
      setCarrier(profile.carrier || '')
      setSmsEnabled(profile.sms_enabled)
      setAvatarColor(profile.avatar_color || '#f59e0b')
    }
  }, [profile])

  useEffect(() => {
    if (!profile) return
    supabase.from('truck_subscriptions').select('truck_number').eq('user_id', profile.id)
      .then(({ data }) => setSubscriptions((data || []).map(r => r.truck_number)))
  }, [profile])

  if (authLoading) return <div className="text-center py-20 text-muted">Loading...</div>
  if (!profile) {
    router.push('/login')
    return null
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim() || profile.username,
      phone: phone.trim() || null,
      carrier: carrier || null,
      sms_enabled: smsEnabled,
      avatar_color: avatarColor,
    }).eq('id', profile.id)
    if (error) { setSaving(false); toast('Failed to save: ' + error.message); return }

    // Sync notify_sms flag on all subscriptions to match current smsEnabled
    await supabase.from('truck_subscriptions')
      .update({ notify_sms: smsEnabled })
      .eq('user_id', profile.id)

    setSaving(false)
    await refreshProfile()
    toast('Profile saved ✓')
  }

  const addSubscription = async () => {
    if (!newTruck.trim()) return
    const truck = newTruck.trim().toUpperCase().replace(/^TR/i, '')
    if (subscriptions.includes(truck)) { toast('Already subscribed'); return }
    setSubLoading(true)
    const { error } = await supabase.from('truck_subscriptions').insert({
      user_id: profile.id, truck_number: truck, notify_sms: smsEnabled, notify_app: true,
    })
    setSubLoading(false)
    if (error) { toast('Error: ' + error.message); return }
    setSubscriptions(prev => [...prev, truck])
    setNewTruck('')
    toast(`Subscribed to TR${truck}`)
  }

  const removeSubscription = async (truck: string) => {
    await supabase.from('truck_subscriptions').delete().eq('user_id', profile.id).eq('truck_number', truck)
    setSubscriptions(prev => prev.filter(t => t !== truck))
    toast(`Unsubscribed from TR${truck}`)
  }

  const initials = (profile.display_name || profile.username).slice(0, 2).toUpperCase()

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      <h1 className="text-xl font-bold">👤 Profile</h1>

      {/* Avatar + role */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
          style={{ background: avatarColor }}>
          {initials}
        </div>
        <div>
          <div className="font-bold text-lg">{profile.display_name || profile.username}</div>
          <div className="text-sm text-muted">@{profile.username}</div>
          <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 inline-block">
            {ROLE_LABELS[profile.role] || profile.role}
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-muted uppercase tracking-wider">Edit Profile</h2>

        <div>
          <label className="text-xs text-muted mb-1 block">Display Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Avatar Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c} onClick={() => setAvatarColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${avatarColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* SMS / Notification settings */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-muted uppercase tracking-wider">📱 SMS Notifications</h2>
        <p className="text-xs text-muted">Get text messages when your subscribed trucks change status. Uses free carrier email-to-SMS — no cost.</p>

        <div>
          <label className="text-xs text-muted mb-1 block">Phone Number (10 digits)</label>
          <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="4145551234"
            className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none font-mono" />
        </div>

        <div>
          <label className="text-xs text-muted mb-1 block">Carrier</label>
          <select value={carrier} onChange={e => setCarrier(e.target.value)}
            className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none">
            <option value="">Select carrier...</option>
            {CARRIERS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${smsEnabled ? 'bg-amber-500' : 'bg-[#444]'}`}
            onClick={() => setSmsEnabled(!smsEnabled)}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${smsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm">Enable SMS notifications</span>
        </label>

        {phone && carrier && (
          <p className="text-xs text-green-400">
            Texts will go to: {phone}@{CARRIERS.find(c => c.value === carrier)?.gateway}
          </p>
        )}

        <button onClick={saveProfile} disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>

      {/* Truck subscriptions */}
      <div className="bg-card border border-[#333] rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-muted uppercase tracking-wider">🚚 Truck Subscriptions</h2>
        <p className="text-xs text-muted">Get notified when a truck&apos;s status changes in Live Movement. You can subscribe to multiple trucks.</p>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 space-y-1 text-xs text-muted">
          <div><span className="text-amber-400 font-mono">170</span> — all trailers on truck 170 <span className="text-muted/60">(TR170, TR170-1, TR170-2…)</span></div>
          <div><span className="text-amber-400 font-mono">170-1</span> — only trailer 1 on truck 170 <span className="text-muted/60">(specific)</span></div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted font-mono">TR</span>
            <input value={newTruck} onChange={e => setNewTruck(e.target.value.replace(/^TR/i,''))}
              onKeyDown={e => e.key === 'Enter' && addSubscription()}
              placeholder="170  or  170-1"
              className="w-full bg-input border border-[#333] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-amber-500 outline-none font-mono" />
          </div>
          <button onClick={addSubscription} disabled={subLoading}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            + Subscribe
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-xs text-muted">No subscriptions yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subscriptions.map(truck => (
              <div key={truck}
                className="flex items-center gap-1.5 bg-[#222] border border-[#444] rounded-full px-3 py-1.5 text-sm font-mono">
                <span className="text-amber-400">TR{truck}</span>
                <button onClick={() => removeSubscription(truck)}
                  className="text-muted hover:text-red-400 text-xs ml-1 transition-colors">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-card border border-[#333] rounded-2xl p-6">
        <button onClick={async () => { await signOut(); router.push('/login') }}
          className="w-full bg-red-900/40 hover:bg-red-900/70 text-red-400 font-bold py-2.5 rounded-xl text-sm transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  )
}
