import type { Metadata } from 'next'
import '../globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Door Status — Badger',
  other: {
    // Disable Vercel toolbar on popup windows
    'vercel-toolbar': 'false',
  },
}

// Bare popup layout — NO Nav, NO padding, NO KeepAlive
export default function PopupLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#0f0f0f' }}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
