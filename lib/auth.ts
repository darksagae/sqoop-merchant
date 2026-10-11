import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { UserError } from './errors'
import { createSession, deleteSession, userForSession } from './session'

export const SESSION_COOKIE = 'sqoop_session'

export const currentUser = cache(async () => userForSession((await cookies()).get(SESSION_COOKIE)?.value))

export async function requireUser() {
  const user = await currentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireOwner() {
  const user = await requireUser()
  if (user.role !== 'owner') throw new UserError('Only the workspace owner can do that.')
  return user
}

async function secureCookies() {
  if (process.env.SQOOP_SECURE_COOKIES) return process.env.SQOOP_SECURE_COOKIES === '1'
  return (await headers()).get('x-forwarded-proto') === 'https'
}

export async function startSession(userId: string) {
  const { token, expiresAt } = createSession(userId)
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await secureCookies(),
    path: '/',
    expires: expiresAt,
  })
}

export async function endSession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) deleteSession(token)
  jar.delete(SESSION_COOKIE)
}

export async function clientAddress() {
  const list = await headers()
  return list.get('x-forwarded-for')?.split(',')[0].trim() || list.get('x-real-ip') || 'local'
}
