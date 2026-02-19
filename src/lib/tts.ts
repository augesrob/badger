'use client'
import { useEffect, useRef } from 'react'

interface TTSSettings {
  enabled: boolean
  volume: number // 0-1
  rate: number   // 0.5-2
  doorStatus: boolean
  truckStatus: boolean
}

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: false,
  volume: 0.8,
  rate: 1,
  doorStatus: true,
  truckStatus: true,
}

function getSettingsKey(page: string) {
  return `badger-tts-${page}`
}

export function getTTSSettings(page: string): TTSSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(getSettingsKey(page))
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

export function saveTTSSettings(page: string, settings: TTSSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getSettingsKey(page), JSON.stringify(settings))
}

export function speak(text: string, settings: TTSSettings) {
  if (!settings.enabled) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Cancel any current/stuck speech
  window.speechSynthesis.cancel()

  // Small delay to let cancel complete (iOS fix)
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = settings.volume
    utterance.rate = settings.rate
    utterance.pitch = 1
    
    // iOS fix: force voice selection
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
      utterance.voice = englishVoice
    }

    window.speechSynthesis.speak(utterance)
  }, 50)
}

// Hook for movement page TTS
export function useMovementTTS(
  doors: { id: number; door_name: string; door_status: string }[],
  trucks: { truck_number: string; status_name?: string }[],
  settings: TTSSettings,
) {
  const prevDoorSnapshot = useRef<string>('')
  const prevTruckSnapshot = useRef<string>('')
  const initialized = useRef(false)

  useEffect(() => {
    const doorSnap = JSON.stringify(doors.map(d => [d.id, d.door_status]))
    const truckSnap = JSON.stringify(trucks.map(t => [t.truck_number, t.status_name || '']))

    // First load — store snapshot without announcing
    if (!initialized.current) {
      if (doors.length > 0 || trucks.length > 0) {
        prevDoorSnapshot.current = doorSnap
        prevTruckSnapshot.current = truckSnap
        initialized.current = true
      }
      return
    }

    if (!settings.enabled) {
      prevDoorSnapshot.current = doorSnap
      prevTruckSnapshot.current = truckSnap
      return
    }

    // Detect door changes
    if (settings.doorStatus && doorSnap !== prevDoorSnapshot.current) {
      const prevDoors: [number, string][] = prevDoorSnapshot.current ? JSON.parse(prevDoorSnapshot.current) : []
      const prevMap = new Map(prevDoors)
      doors.forEach(d => {
        const prev = prevMap.get(d.id)
        if (prev !== undefined && prev !== d.door_status) {
          speak(`Door ${d.door_name} is now ${d.door_status}`, settings)
        }
      })
    }

    // Detect truck changes
    if (settings.truckStatus && truckSnap !== prevTruckSnapshot.current) {
      const prevTrucks: [string, string][] = prevTruckSnapshot.current ? JSON.parse(prevTruckSnapshot.current) : []
      const prevMap = new Map(prevTrucks)
      trucks.forEach(t => {
        const prev = prevMap.get(t.truck_number)
        const curr = t.status_name || ''
        if (prev !== undefined && prev !== curr) {
          speak(`Truck ${t.truck_number}, ${curr || 'unknown'}`, settings)
        }
      })
    }

    prevDoorSnapshot.current = doorSnap
    prevTruckSnapshot.current = truckSnap
  }, [doors, trucks, settings])
}
