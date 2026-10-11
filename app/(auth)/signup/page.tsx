import type { Metadata } from 'next'
import { SignUpForm } from '@/components/auth-forms'

export const metadata: Metadata = { title: 'Create a workspace' }

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
      <p className="mt-1 mb-8 text-sm text-ink-soft">No card needed — this prototype never charges.</p>
      <SignUpForm />
    </>
  )
}
