'use client'
import { useEffect, useState } from 'react'

interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  body: string
  assets: { name: string; browser_download_url: string; size: number }[]
  html_url: string
}

export default function DownloadPage() {
  const [release, setRelease] = useState<GitHubRelease | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/release')
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'No releases found' : `GitHub API error ${r.status}`)
        return r.json()
      })
      .then(data => { setRelease(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [])

  const apk = release?.assets.find(a => a.name.endsWith('.apk'))
  const sizeMb = apk ? (apk.size / 1024 / 1024).toFixed(1) : null

  const publishedDate = release?.published_at
    ? new Date(release.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-12 gap-8">

      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">🦡</div>
        <h1 className="text-3xl font-bold text-foreground">Badger Android App</h1>
        <p className="text-muted mt-2 text-sm">Access badge — live movement, PTT, voice commands &amp; more</p>
      </div>

      {/* Release card */}
      <div className="w-full max-w-lg bg-nav border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Checking latest release…</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
            <div className="text-3xl">⚠️</div>
            <p className="text-muted text-sm">Could not load release info.</p>
            <p className="text-muted/60 text-xs">{error}</p>
          </div>
        )}

        {release && (
          <>
            {/* Version banner */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-amber-500 font-bold text-lg">{release.name || release.tag_name}</div>
                <div className="text-muted text-xs mt-0.5">{publishedDate}</div>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
                {release.tag_name}
              </span>
            </div>

            {/* Release notes */}
            {release.body && (
              <div className="px-6 py-4 border-b border-white/5">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">What&apos;s new</p>
                <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                  {release.body.trim()}
                </pre>
              </div>
            )}

            {/* Download button */}
            <div className="px-6 py-5 flex flex-col gap-3">
              {apk ? (
                <a href={apk.browser_download_url}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors text-sm shadow-lg">
                  📲 Download APK
                  {sizeMb && <span className="font-normal opacity-70">({sizeMb} MB)</span>}
                </a>
              ) : (
                <p className="text-center text-sm text-muted py-2">No APK available for this release yet.</p>
              )}


            </div>
          </>
        )}
      </div>

      {/* Install instructions */}
      <div className="w-full max-w-lg bg-nav border border-white/10 rounded-2xl px-6 py-5">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">How to install</p>
        <ol className="flex flex-col gap-2.5 text-sm text-foreground/80">
          <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">1.</span>Tap the <strong>Download APK</strong> button above on your Android device.</li>
          <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">2.</span>Open the downloaded file from your notifications or Downloads folder.</li>
          <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">3.</span>If prompted, allow installation from unknown sources in your device settings.</li>
          <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">4.</span>Open Badger, sign in, and enjoy live warehouse visibility!</li>
        </ol>
      </div>

    </main>
  )
}
