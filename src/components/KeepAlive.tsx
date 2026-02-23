'use client'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Keeps the app alive on mobile iOS/Android:
// 1. Wake Lock API — prevents screen from sleeping
// 2. Silent audio loop — keeps AudioContext alive so iOS TTS works at any time
// 3. speechSynthesis.resume() on visibility — iOS pauses it when backgrounded
// 4. Supabase reconnect + forced reload on tab resume (catches missed events)
// 5. Periodic keep-alive ping every 25s

export function KeepAlive() {
  const wakeLockRef    = useRef<WakeLockSentinel | null>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const pingRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const speechRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioUnlocked  = useRef(false)

  // ── Wake Lock ────────────────────────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch { /* not supported or denied */ }
  }, [])

  // ── Silent Audio (keeps iOS AudioContext alive like a music app) ──────────
  // iOS only allows TTS if the AudioContext was started by a user gesture.
  // We loop a near-silent buffer so the context never gets suspended.
  const startSilentLoop = useCallback((ctx: AudioContext) => {
    // Create a 0.5s buffer of silence, loop it as a source node
    const buffer = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    // tiny gain so iOS doesn't treat it as truly silent and kill the context
    const gain = ctx.createGain()
    gain.gain.value = 0.001
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }, [])

  const unlockAudio = useCallback(() => {
    if (audioUnlocked.current) return

    // Also keep a plain <audio> loop for compatibility
    if (!audioRef.current) {
      const silentDataUri = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
      const audio = new Audio(silentDataUri)
      audio.loop = true
      audio.volume = 0.001
      audioRef.current = audio
    }
    audioRef.current.play().catch(() => {})

    // Web Audio API context — required for iOS TTS unlock
    try {
      if (!audioCtxRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        if (Ctx) {
          audioCtxRef.current = new Ctx()
          startSilentLoop(audioCtxRef.current)
        }
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          if (audioCtxRef.current) startSilentLoop(audioCtxRef.current)
        })
      }
    } catch { /* ignore */ }

    // Prime speechSynthesis on user gesture (required by iOS)
    if (window.speechSynthesis) {
      const primer = new SpeechSynthesisUtterance('')
      primer.volume = 0
      window.speechSynthesis.speak(primer)
    }

    audioUnlocked.current = true
  }, [startSilentLoop])

  // ── Visibility change — reconnect + resume audio/speech ─────────────────
  const handleVisibility = useCallback(() => {
    if (document.visibilityState !== 'visible') return

    // 1. Resume AudioContext if iOS suspended it
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    // 2. Resume speechSynthesis — iOS pauses it when backgrounded
    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume()
    }
    // 3. Re-play silent audio (iOS may have stopped it)
    if (audioRef.current?.paused) {
      audioRef.current.play().catch(() => {})
    }
    // 4. Reconnect Supabase WebSocket
    supabase.realtime.disconnect()
    setTimeout(() => supabase.realtime.connect(), 300)

    // 5. Re-acquire wake lock
    requestWakeLock()

    // 6. Dispatch a custom event so pages can force-reload their data
    //    (catches any realtime events that fired while backgrounded)
    window.dispatchEvent(new CustomEvent('badger:resume'))
  }, [requestWakeLock])

  useEffect(() => {
    requestWakeLock()

    // Unlock on any user interaction
    const events = ['touchstart', 'click', 'keydown'] as const
    events.forEach(e => document.addEventListener(e, unlockAudio, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibility)

    // Periodic WebSocket keep-alive every 25s
    pingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        supabase.from('loading_doors').select('id').limit(1).then(() => {})
      }
    }, 25000)

    // speechSynthesis keep-alive every 10s — iOS pauses synth after ~15s silence
    speechRef.current = setInterval(() => {
      if (!window.speechSynthesis) return
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      // Cancel any stuck utterance
      if (!window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
    }, 10000)

    return () => {
      events.forEach(e => document.removeEventListener(e, unlockAudio))
      document.removeEventListener('visibilitychange', handleVisibility)
      if (pingRef.current)   clearInterval(pingRef.current)
      if (speechRef.current) clearInterval(speechRef.current)
      if (wakeLockRef.current) wakeLockRef.current.release()
      if (audioRef.current)  { audioRef.current.pause(); audioRef.current = null }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    }
  }, [unlockAudio, handleVisibility, requestWakeLock])

  return null
}
