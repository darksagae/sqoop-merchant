import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth-forms'
import { currentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage() {
  if (await currentUser()) redirect('/app')
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-8 text-sm text-ink-soft">Sign in to your shop’s workspace.</p>
      <SignInForm />
    </>
  )
}
