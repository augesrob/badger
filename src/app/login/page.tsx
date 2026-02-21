'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [username, setUsername]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const submit = async () => {
    setError('')
    if (!email || !password) { setError('Email and password required'); return }
    if (mode === 'signup' && !username.trim()) { setError('Username required'); return }
    setLoading(true)
    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, username.trim().toLowerCase(), displayName.trim() || username.trim())
    setLoading(false)
    if (err) { setError(err); return }
    router.push('/')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-card border border-[#333] rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🦡</div>
          <h1 className="text-2xl font-bold text-amber-500">Badger</h1>
          <p className="text-xs text-muted mt-1">Truck Management System</p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-[#333] mb-6">
          {(['signin','signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                mode === m ? 'bg-amber-500 text-black' : 'text-muted hover:text-white'
              }`}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs text-muted font-medium mb-1 block">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="truckdriver42"
                  className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
                <p className="text-[10px] text-muted mt-1">Lowercase, no spaces. Used to @mention you in chat.</p>
              </div>
              <div>
                <label className="text-xs text-muted font-medium mb-1 block">Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="John D."
                  className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs text-muted font-medium mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted font-medium mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-input border border-[#333] rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm mt-2">
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {mode === 'signup' && (
          <p className="text-xs text-muted text-center mt-4">
            New accounts default to Driver role. An admin will update your access level.
          </p>
        )}
      </div>
    </div>
  )
}
