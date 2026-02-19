'use client'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Keeps the app alive on mobile:
// 1. Wake Lock API - prevents screen/tab from sleeping
// 2. Visibility change - reconnects Supabase when tab comes back
// 3. Silent audio loop - keeps audio context alive for TTS on iOS/Android
// 4. Periodic ping - prevents WebSocket timeout

export function KeepAlive() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioUnlocked = useRef(false)

  // Request Wake Lock
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        wakeLockRef.current.addEventListener('release', () => {
          // Re-acquire on release (e.g. tab switch)
        })
      }
    } catch {
      // Wake Lock not supported or denied
    }
  }, [])

  // Create silent audio to keep audio context alive for TTS
  const initSilentAudio = useCallback(() => {
    if (audioRef.current) return
    // Tiny silent WAV (44 bytes of silence)
    const silentDataUri = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    const audio = new Audio(silentDataUri)
    audio.loop = true
    audio.volume = 0.01 // Nearly silent
    audioRef.current = audio
  }, [])

  // Unlock audio on first user interaction (required by iOS/Android)
  const unlockAudio = useCallback(() => {
    if (audioUnlocked.current) return
    if (!audioRef.current) initSilentAudio()
    
    const audio = audioRef.current
    if (!audio) return

    audio.play().then(() => {
      audioUnlocked.current = true
      // Also prime speechSynthesis on user gesture
      if (window.speechSynthesis) {
        const primer = new SpeechSynthesisUtterance('')
        primer.volume = 0
        window.speechSynthesis.speak(primer)
      }
    }).catch(() => {
      // Will retry on next interaction
    })
  }, [initSilentAudio])

  // Reconnect Supabase realtime
  const reconnect = useCallback(() => {
    supabase.realtime.disconnect()
    supabase.realtime.connect()
  }, [])

  useEffect(() => {
    initSilentAudio()
    requestWakeLock()

    // Unlock audio on ANY user interaction
    const events = ['touchstart', 'click', 'keydown'] as const
    events.forEach(e => document.addEventListener(e, unlockAudio, { once: false, passive: true }))

    // Visibility change — reconnect when tab comes back
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        reconnect()
        requestWakeLock()
        // Re-unlock audio in case context was killed
        if (audioRef.current) {
          audioRef.current.play().catch(() => {})
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Periodic keep-alive ping every 25s to keep WebSocket alive
    pingIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        // Light query to keep connection warm
        supabase.from('loading_doors').select('id').limit(1).then(() => {})
      }
    }, 25000)

    // iOS Safari fix: speechSynthesis can pause after ~15s of silence
    const speechKeepAlive = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel() // Reset any stuck state
      }
    }, 10000)

    return () => {
      events.forEach(e => document.removeEventListener(e, unlockAudio))
      document.removeEventListener('visibilitychange', handleVisibility)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      clearInterval(speechKeepAlive)
      if (wakeLockRef.current) wakeLockRef.current.release()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    }
  }, [initSilentAudio, requestWakeLock, unlockAudio, reconnect])

  return null // Invisible component
}
