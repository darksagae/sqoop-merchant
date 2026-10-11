import '@fontsource-variable/plus-jakarta-sans'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: { default: 'Sqoop Merchant · The simple back office for growing shops', template: '%s · Sqoop Merchant' },
  description:
    'Track stock, take orders and see sales across every branch. Built for small merchants in Uganda, priced in shillings.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f5f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f13' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection() // per-request rendering so the CSP nonce reaches every script
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
