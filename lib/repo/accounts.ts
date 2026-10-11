import { db, newId, nowIso, transaction } from '../db'
import { UserError } from '../errors'
import { DUMMY_HASH, hashPassword, verifyPassword } from '../passwords'

export async function createWorkspace(input: {
  businessName: string
  name: string
  email: string
  password: string
  isDemo?: boolean
}) {
  const passwordHash = await hashPassword(input.password)
  const workspaceId = newId()
  const userId = newId()
  const created = nowIso()
  try {
    transaction(() => {
      db()
        .prepare('INSERT INTO workspaces (id, name, is_demo, created_at) VALUES (?, ?, ?, ?)')
        .run(workspaceId, input.businessName, input.isDemo ? 1 : 0, created)
      db()
        .prepare(
          `INSERT INTO users (id, workspace_id, name, email, password_hash, role, created_at)
           VALUES (?, ?, ?, ?, ?, 'owner', ?)`,
        )
        .run(userId, workspaceId, input.name, input.email, passwordHash, created)
      db()
        .prepare('INSERT INTO stores (id, workspace_id, name, location, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(newId(), workspaceId, 'Main store', '', created)
    })
  } catch (error) {
    if (String(error).includes('UNIQUE') && String(error).includes('email')) {
      throw new UserError('An account with this email already exists. Try signing in.')
    }
    throw error
  }
  return { workspaceId, userId }
}

export async function authenticate(email: string, password: string) {
  const row = db().prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as
    { id: string; password_hash: string } | undefined
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH)
  return ok && row ? row.id : null
}

export function renameWorkspace(workspaceId: string, name: string) {
  db().prepare('UPDATE workspaces SET name = ? WHERE id = ?').run(name, workspaceId)
}
