'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// KeepAlive: only does what's actually needed.
// - On MOBILE (iOS/Android): silent audio + speechSynthesis resume + Supabase reconnect
// - On DESKTOP: just Supabase reconnect on tab visibility change. No audio, no timers.
// This was previously hammering desktop CPUs with audio contexts, wake locks, and
// 10-second speech synthesis pings — causing 90%+ memory usage on work computers.

function isMobile() {
  if (typeof navigator === 'undefined') return false
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function KeepAlive() {
  const audioRef      = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef   = useRef<AudioContext | null>(null)
  const speechRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const unlocked      = useRef(false)
  const mobile        = useRef(false)

  useEffect(() => {
    mobile.current = isMobile()

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return

      // Always reconnect Supabase WebSocket when tab comes back
      supabase.realtime.disconnect()
      setTimeout(() => supabase.realtime.connect(), 300)
      window.dispatchEvent(new CustomEvent('badger:resume'))

      if (!mobile.current) return

      // Mobile-only: resume audio + speech
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
      if (window.speechSynthesis?.paused) window.speechSynthesis.resume()
      if (audioRef.current?.paused) audioRef.current.play().catch(() => {})
    }

    document.addEventListener('visibilitychange', handleVisibility)

    // Mobile-only setup
    if (mobile.current) {
      // Unlock audio on first interaction
      const unlock = () => {
        if (unlocked.current) return
        unlocked.current = true

        // Silent audio element
        const silentDataUri = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
        const audio = new Audio(silentDataUri)
        audio.loop = true
        audio.volume = 0.001
        audioRef.current = audio
        audio.play().catch(() => {})

        // Web Audio context
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Ctx = window.AudioContext || (window as any).webkitAudioContext
          if (Ctx) {
            const ctx = new Ctx()
            audioCtxRef.current = ctx
            const buffer = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate)
            const src = ctx.createBufferSource()
            src.buffer = buffer
            src.loop = true
            const gain = ctx.createGain()
            gain.gain.value = 0.001
            src.connect(gain)
            gain.connect(ctx.destination)
            src.start()
          }
        } catch { /* ignore */ }

        // Prime speechSynthesis
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance('')
          u.volume = 0
          window.speechSynthesis.speak(u)
        }
      }

      const events = ['touchstart', 'click', 'keydown'] as const
      events.forEach(e => document.addEventListener(e, unlock, { passive: true, once: true }))

      // speechSynthesis keep-alive — only on mobile where iOS kills it
      speechRef.current = setInterval(() => {
        if (window.speechSynthesis?.paused) window.speechSynthesis.resume()
      }, 15000)

      return () => {
        events.forEach(e => document.removeEventListener(e, unlock))
        document.removeEventListener('visibilitychange', handleVisibility)
        if (speechRef.current) clearInterval(speechRef.current)
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
        if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return null
}
