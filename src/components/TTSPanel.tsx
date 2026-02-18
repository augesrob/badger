'use client'
import { useState, useEffect } from 'react'
import { getTTSSettings, saveTTSSettings, speak } from '@/lib/tts'

export function TTSPanel({ page }: { page: string }) {
  const [settings, setSettings] = useState(() => getTTSSettings(page))
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setSupported(false)
    }
  }, [])

  const update = (partial: Partial<typeof settings>) => {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveTTSSettings(page, next)
  }

  if (!supported) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
        <p className="text-sm text-red-400">⚠️ Text-to-speech is not supported in this browser.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-white text-sm">🔊 TTS Announcements</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Settings saved per device for this page</p>
        </div>
        <button onClick={() => update({ enabled: !settings.enabled })}
          className={`w-12 h-6 rounded-full flex-shrink-0 transition-colors relative ${settings.enabled ? 'bg-green-500' : 'bg-[#333]'}`}>
          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${settings.enabled ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Volume */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">
              Volume: {Math.round(settings.volume * 100)}%
            </label>
            <input type="range" min="0" max="1" step="0.05"
              value={settings.volume}
              onChange={e => update({ volume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-2" />
          </div>

          {/* Speed */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold block mb-1">
              Speed: {settings.rate}x
            </label>
            <input type="range" min="0.5" max="2" step="0.1"
              value={settings.rate}
              onChange={e => update({ rate: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-2" />
          </div>

          {/* Category toggles */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase font-bold block">Announce</label>
            <Toggle label="Door status changes" emoji="🚪" checked={settings.doorStatus} onChange={v => update({ doorStatus: v })} />
            <Toggle label="Truck status changes" emoji="🚚" checked={settings.truckStatus} onChange={v => update({ truckStatus: v })} />
          </div>

          {/* Test */}
          <button onClick={() => speak('Door 13 A is now Done for Night', settings)}
            className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400 w-full">
            🔊 Test Voice
          </button>
        </>
      )}
    </div>
  )
}

function Toggle({ label, emoji, checked, onChange }: {
  label: string; emoji: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-300">{emoji} {label}</span>
      <button onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full flex-shrink-0 transition-colors relative ${checked ? 'bg-green-500' : 'bg-[#333]'}`}>
        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

// Inline mini toggle for page headers (compact version)
export function TTSMiniToggle({ page }: { page: string }) {
  const [settings, setSettings] = useState(() => getTTSSettings(page))

  const toggle = () => {
    const next = { ...settings, enabled: !settings.enabled }
    setSettings(next)
    saveTTSSettings(page, next)
  }

  return (
    <button onClick={toggle} title={settings.enabled ? 'TTS On - click to mute' : 'TTS Off - click to enable'}
      className={`text-lg transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}>
      {settings.enabled ? '🔊' : '🔇'}
    </button>
  )
}
