import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth-forms'
import { SubmitButton } from '@/components/submit-button'
import { startDemo } from '@/lib/actions/auth'
import { currentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  if (await currentUser()) redirect('/app')
  const demoBusy = (await searchParams).demo === 'busy'
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Sign in</h1>
      <SignInForm />
      <form action={startDemo} className="mt-6 border-t border-line pt-6">
        <SubmitButton className="btn btn-secondary w-full" pending="Setting up demo…">
          Try the demo shop
        </SubmitButton>
        {demoBusy && (
          <p role="alert" className="mt-2 text-sm font-semibold text-bad">
            Too many demos from this network. Try again later.
          </p>
        )}
      </form>
    </>
  )
}
