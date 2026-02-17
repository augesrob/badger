import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Badger Truck Management',
  description: 'Real-time warehouse truck operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Nav />
          <main className="max-w-[1400px] mx-auto p-4">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  )
}
