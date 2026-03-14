import { useEffect } from 'react'

/**
 * Locks page scroll on mount, restores on unmount.
 * Use on pages where only inner containers should scroll.
 */
export function useNoPageScroll() {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])
}
