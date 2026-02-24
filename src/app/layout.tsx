import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import { ToastProvider } from '@/components/Toast'
import { KeepAlive } from '@/components/KeepAlive'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Badger Truck Management',
  description: 'Real-time warehouse truck operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <KeepAlive />
              <Nav />
              <main className="max-w-[1400px] mx-auto p-4">
                {children}
              </main>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
