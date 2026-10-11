// Database side of sessions. The cookie holds a random token; only its
// SHA-256 hash is stored, so a leaked database cannot be replayed.
import { createHash, randomBytes } from 'node:crypto'
import { db } from './db'

export const SESSION_DAYS = 30

export type Role = 'owner' | 'staff'
export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  workspaceId: string
  workspaceName: string
  isDemo: boolean
}

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  db()
    .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hash(token), userId, expiresAt.toISOString())
  if (Math.random() < 0.05) db().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString())
  return { token, expiresAt }
}

export function userForSession(token: string | undefined): SessionUser | null {
  if (!token) return null
  const row = db()
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, w.id AS workspace_id, w.name AS workspace_name, w.is_demo
       FROM sessions s JOIN users u ON u.id = s.user_id JOIN workspaces w ON w.id = u.workspace_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hash(token), new Date().toISOString()) as
    | {
        id: string
        name: string
        email: string
        role: Role
        workspace_id: string
        workspace_name: string
        is_demo: number
      }
    | undefined
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    workspaceId: row.workspace_id,
    workspaceName: row.workspace_name,
    isDemo: row.is_demo === 1,
  }
}

export function deleteSession(token: string) {
  db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash(token))
}
