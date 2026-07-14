'use client'
import { supabase } from '@/lib/supabase'

export default function ClosedPage() {
  const signOut = async () => {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    window.location.href = '/login'
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6">
      <div className="bg-card border border-red-900 rounded-2xl p-10 w-full max-w-md shadow-2xl text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-red-400 mb-2">Closed till further notice</h1>
        <p className="text-sm text-muted mb-8">
          Badger is temporarily unavailable.
        </p>
        <button
          onClick={signOut}
          className="px-6 py-2.5 rounded-xl border border-[#444] text-sm font-bold text-muted hover:text-white hover:border-[#666] transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
