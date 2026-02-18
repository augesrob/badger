'use client'
import { useEffect, useRef, useCallback } from 'react'

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

  // Cancel any current speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.volume = settings.volume
  utterance.rate = settings.rate
  utterance.pitch = 1

  window.speechSynthesis.speak(utterance)
}

// Hook for movement page TTS
export function useMovementTTS(
  doors: { id: number; door_name: string; door_status: string }[],
  trucks: { truck_number: string; status_name?: string }[],
  settings: TTSSettings,
) {
  const prevDoorStatus = useRef<Record<number, string>>({})
  const prevTruckStatus = useRef<Record<string, string>>({})
  const initialized = useRef(false)

  // Initialize refs on first load without announcing
  const initRefs = useCallback(() => {
    if (initialized.current) return
    if (doors.length === 0 && trucks.length === 0) return

    const doorMap: Record<number, string> = {}
    doors.forEach(d => { doorMap[d.id] = d.door_status })
    prevDoorStatus.current = doorMap

    const truckMap: Record<string, string> = {}
    trucks.forEach(t => { truckMap[t.truck_number] = t.status_name || '' })
    prevTruckStatus.current = truckMap

    initialized.current = true
  }, [doors, trucks])

  useEffect(() => {
    initRefs()
  }, [initRefs])

  // Watch for door status changes
  useEffect(() => {
    if (!initialized.current || !settings.enabled || !settings.doorStatus) return

    doors.forEach(d => {
      const prev = prevDoorStatus.current[d.id]
      if (prev !== undefined && prev !== d.door_status) {
        speak(`Door ${d.door_name} is now ${d.door_status}`, settings)
      }
      prevDoorStatus.current[d.id] = d.door_status
    })
  }, [doors, settings])

  // Watch for truck status changes
  useEffect(() => {
    if (!initialized.current || !settings.enabled || !settings.truckStatus) return

    trucks.forEach(t => {
      const prev = prevTruckStatus.current[t.truck_number]
      if (prev !== undefined && prev !== (t.status_name || '')) {
        const statusName = t.status_name || 'unknown'
        speak(`Truck ${t.truck_number}, ${statusName}`, settings)
      }
      prevTruckStatus.current[t.truck_number] = t.status_name || ''
    })
  }, [trucks, settings])
}
