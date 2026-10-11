import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AutoDemo } from '@/components/auto-demo'
import { currentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Demo shop' }

// No marketing page: visitors land in a working demo shop, signed-in users on their dashboard.
export default async function Home() {
  if (await currentUser()) redirect('/app')
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Opening the demo shop…</h1>
      <AutoDemo />
      <p className="mt-6 border-t border-line pt-6 text-sm text-ink-soft">
        Have a shop?{' '}
        <Link href="/login" className="font-semibold text-brand-strong hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
