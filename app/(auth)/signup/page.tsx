import type { Metadata } from 'next'
import { SignUpForm } from '@/components/auth-forms'

export const metadata: Metadata = { title: 'Create a workspace' }

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Create your shop</h1>
      <SignUpForm />
    </>
  )
}
