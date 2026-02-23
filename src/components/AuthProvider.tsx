'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export type Role = 'admin' | 'print_room' | 'truck_mover' | 'trainee' | 'driver'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  role: Role
  phone: string | null
  carrier: string | null
  sms_enabled: boolean
  avatar_color: string
  avatar_url: string | null
}

interface AuthCtx {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Role helpers
  isAdmin: boolean
  can: (page: PageKey) => boolean
}

export type PageKey = 'printroom' | 'routesheet' | 'cheatsheet' | 'preshift' | 'movement' | 'admin' | 'fleet' | 'chat' | 'profile'

// What each role can access
const ACCESS: Record<Role, PageKey[]> = {
  admin:       ['printroom','routesheet','cheatsheet','preshift','movement','admin','fleet','chat','profile'],
  print_room:  ['printroom','routesheet','cheatsheet','preshift','movement','fleet','chat','profile'],
  truck_mover: ['printroom','routesheet','cheatsheet','preshift','movement','fleet','chat','profile'],
  trainee:     ['movement','preshift','chat','profile'],
  driver:      ['movement','chat','profile'],
}

const Ctx = createContext<AuthCtx>({
  user: null, profile: null, session: null, loading: true,
  signIn: async () => null, signUp: async () => null,
  signOut: async () => {}, refreshProfile: async () => {},
  isAdmin: false, can: () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data as Profile)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (email: string, password: string, username: string, displayName: string): Promise<string | null> => {
    // Check username not taken
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing) return 'Username already taken'
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username, display_name: displayName } }
    })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const isAdmin = profile?.role === 'admin'
  const can = (page: PageKey) => {
    if (!profile) return false
    return ACCESS[profile.role]?.includes(page) ?? false
  }

  return (
    <Ctx.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, refreshProfile, isAdmin, can }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() { return useContext(Ctx) }
