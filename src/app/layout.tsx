import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import { ToastProvider } from '@/components/Toast'
import { KeepAlive } from '@/components/KeepAlive'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'Badger Truck Management',
  description: 'Real-time warehouse truck operations',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    title: 'Badger Truck Management',
    description: 'Real-time warehouse truck operations',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
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
              <main className="max-w-[1400px] mx-auto p-4 badger-main">
                {children}
              </main>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
