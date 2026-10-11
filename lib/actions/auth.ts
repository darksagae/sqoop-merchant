'use server'

import { redirect } from 'next/navigation'
import { clientAddress, endSession, startSession } from '../auth'
import { allow } from '../rate-limit'
import { authenticate, createWorkspace } from '../repo/accounts'
import { createDemoWorkspace } from '../repo/demo'
import { loginSchema, signupSchema } from '../validation'
import { failure, invalid, values, type FormState } from './state'

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return invalid(form, parsed.error)
  if (!allow(`signup:${await clientAddress()}`, 10, 60 * 60_000)) {
    return { error: 'Too many sign-ups from this network. Try again later.', values: values(form) }
  }
  try {
    const { userId } = await createWorkspace(parsed.data)
    await startSession(userId)
  } catch (error) {
    return failure(form, error)
  }
  redirect('/app')
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return invalid(form, parsed.error)
  const key = `login:${await clientAddress()}:${parsed.data.email}`
  if (!allow(key, 8, 15 * 60_000)) {
    return { error: 'Too many attempts. Wait 15 minutes and try again.', values: values(form) }
  }
  const userId = await authenticate(parsed.data.email, parsed.data.password)
  if (!userId) return { error: 'That email and password don’t match an account.', values: values(form) }
  await startSession(userId)
  redirect('/app')
}

export async function signOut() {
  await endSession()
  redirect('/')
}

export async function startDemo() {
  if (!allow(`demo:${await clientAddress()}`, 10, 60 * 60_000)) redirect('/?demo=busy')
  const { userId } = await createDemoWorkspace()
  await startSession(userId)
  redirect('/app')
}
