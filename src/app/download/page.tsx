'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  body: string
  assets: { name: string; browser_download_url: string; size: number }[]
  html_url: string
}

interface VersionInfo {
  versionCode: number
  tagName: string
  downloadUrl: string
}

export default function DownloadPage() {
  const [release,   setRelease]   = useState<GitHubRelease | null>(null)
  const [wearInfo,  setWearInfo]  = useState<VersionInfo | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/release').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/version-wear').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([rel, wear]) => {
      setRelease(rel)
      setWearInfo(wear)
      setLoading(false)
    }).catch(() => {
      setError('Could not load release info')
      setLoading(false)
    })
  }, [])

  const phoneApk  = release?.assets.find(a => a.name.includes('access') && !a.name.includes('wear') && a.name.endsWith('.apk'))
  const phoneSizeMb = phoneApk ? (phoneApk.size / 1024 / 1024).toFixed(1) : null

  const publishedDate = release?.published_at
    ? new Date(release.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-12 gap-8">

      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Image src="/icon-192.png" alt="Badger" width={80} height={80} className="rounded-full" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Badger Downloads</h1>
        <p className="text-muted mt-2 text-sm">Live movement, PTT, voice commands &amp; more</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Checking latest releases…</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="text-3xl">⚠️</div>
          <p className="text-muted text-sm">{error}</p>
        </div>
      )}

      {!loading && (
        <div className="w-full max-w-2xl flex flex-col gap-6">

          {/* ── Phone App Card ─────────────────────────────────────── */}
          <div className="bg-nav border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
              <div className="text-4xl">📱</div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Badger — Android Phone</h2>
                <p className="text-muted text-xs mt-0.5">Samsung, Pixel, and all Android devices</p>
              </div>
              {release && (
                <span className="ml-auto px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30 shrink-0">
                  {release.tag_name}
                </span>
              )}
            </div>

            {release && (
              <>
                <div className="px-6 py-3 border-b border-white/5 flex items-center gap-4 text-xs text-muted">
                  <span>Released {publishedDate}</span>
                </div>

                {release.body && (
                  <div className="px-6 py-4 border-b border-white/5">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">What&apos;s new</p>
                    <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto">
                      {release.body.trim()}
                    </pre>
                  </div>
                )}

                <div className="px-6 py-5">
                  {phoneApk ? (
                    <a href={phoneApk.browser_download_url}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors text-sm shadow-lg w-full">
                      📲 Download Phone APK
                      {phoneSizeMb && <span className="font-normal opacity-70">({phoneSizeMb} MB)</span>}
                    </a>
                  ) : (
                    <p className="text-center text-sm text-muted py-2">No phone APK on this release yet.</p>
                  )}
                </div>
              </>
            )}

            {!release && !loading && (
              <div className="px-6 py-8 text-center text-muted text-sm">Could not load release info.</div>
            )}
          </div>

          {/* ── Galaxy Watch Card ──────────────────────────────────── */}
          <div className="bg-nav border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
              <div className="text-4xl">⌚</div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Badger — Galaxy Watch</h2>
                <p className="text-muted text-xs mt-0.5">Galaxy Watch 4, 5, 6, 7, 8 (Wear OS)</p>
              </div>
              {wearInfo && (
                <span className="ml-auto px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 shrink-0">
                  {wearInfo.tagName}
                </span>
              )}
            </div>

            {/* Feature list */}
            <div className="px-6 py-4 border-b border-white/5 grid grid-cols-2 gap-2">
              {[
                ['🚚', 'Live truck & door status'],
                ['🔄', 'Tap to change status'],
                ['📢', 'TTS announcements'],
                ['🎙️', 'Push to talk'],
                ['📳', 'Vibrate on changes'],
                ['📡', 'Standalone LTE mode'],
              ].map(([emoji, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs text-foreground/70">
                  <span>{emoji}</span><span>{label}</span>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 flex flex-col gap-3">
              {wearInfo ? (
                <a href={wearInfo.downloadUrl}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm shadow-lg w-full">
                  ⌚ Download Galaxy Watch APK
                </a>
              ) : (
                <p className="text-center text-sm text-muted py-2">
                  {loading ? 'Loading…' : 'No watch APK on this release yet.'}
                </p>
              )}

              {/* Watch install instructions inline */}
              <div className="bg-black/20 rounded-xl px-4 py-3 mt-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">How to install on watch</p>
                <ol className="flex flex-col gap-1.5 text-xs text-foreground/70">
                  <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">1.</span>Download the APK to your phone</li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">2.</span>Enable <strong className="text-foreground/90">Wireless Debugging</strong> on the watch</li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">3.</span>Run <code className="bg-white/10 px-1 rounded text-blue-300">adb pair</code> then <code className="bg-white/10 px-1 rounded text-blue-300">adb install</code></li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">4.</span>Future updates install automatically from the watch</li>
                </ol>
              </div>
            </div>
          </div>

          {/* ── Phone install instructions ─────────────────────────── */}
          <div className="w-full bg-nav border border-white/10 rounded-2xl px-6 py-5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">How to install on phone</p>
            <ol className="flex flex-col gap-2.5 text-sm text-foreground/80">
              <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">1.</span>Tap <strong>Download Phone APK</strong> above on your Android device.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">2.</span>Open the downloaded file from your notifications or Downloads folder.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">3.</span>If prompted, allow installation from unknown sources in your device settings.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold shrink-0">4.</span>Open Badger, sign in, and enjoy live warehouse visibility!</li>
            </ol>
          </div>

        </div>
      )}
    </main>
  )
}
