'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn, signUp } from '@/lib/actions/auth'
import type { FormState } from '@/lib/actions/state'
import { Field, FormMessage } from './ui'
import { SubmitButton } from './submit-button'

export function SignInForm() {
  const [state, action] = useActionState<FormState, FormData>(signIn, undefined)
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state?.fields ? undefined : state?.error} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state?.values?.email}
        error={state?.fields?.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state?.fields?.password}
        required
      />
      <SubmitButton className="btn btn-primary min-h-11 w-full" pending="Signing in…">
        Sign in
      </SubmitButton>
      <p className="text-center text-sm text-ink-soft">
        New to Sqoop?{' '}
        <Link href="/signup" className="font-semibold text-brand-strong hover:underline">
          Create a workspace
        </Link>
      </p>
    </form>
  )
}

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, undefined)
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state?.fields ? undefined : state?.error} />
      <Field
        label="Business name"
        name="businessName"
        autoComplete="organization"
        defaultValue={state?.values?.businessName}
        error={state?.fields?.businessName}
        placeholder="e.g. Nakato General Store"
        required
      />
      <Field
        label="Your name"
        name="name"
        autoComplete="name"
        defaultValue={state?.values?.name}
        error={state?.fields?.name}
        required
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state?.values?.email}
        error={state?.fields?.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        error={state?.fields?.password}
        hint="At least 10 characters"
        required
      />
      <SubmitButton className="btn btn-primary min-h-11 w-full" pending="Creating workspace…">
        Create workspace
      </SubmitButton>
      <p className="text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-strong hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
