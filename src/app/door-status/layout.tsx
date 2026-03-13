import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Door Status',
}

// Bare layout — no nav, no padding, no chrome. Renders like a native popup window.
export default function DoorStatusLayout({ children }: { children: React.ReactNode }) {
  return children
}
