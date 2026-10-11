import { db, newId, nowIso } from '../db'
import { UserError } from '../errors'
import { hashPassword } from '../passwords'
import type { Role } from '../session'

export type Member = { id: string; name: string; email: string; role: Role; createdAt: string }

export function listMembers(workspaceId: string): Member[] {
  return (
    db()
      .prepare(
        `SELECT id, name, email, role, created_at FROM users WHERE workspace_id = ?
         ORDER BY role = 'owner' DESC, created_at`,
      )
      .all(workspaceId) as { id: string; name: string; email: string; role: Role; created_at: string }[]
  ).map((row) => ({ id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at }))
}

export async function addMember(workspaceId: string, input: { name: string; email: string; password: string }) {
  const passwordHash = await hashPassword(input.password)
  try {
    db()
      .prepare(
        `INSERT INTO users (id, workspace_id, name, email, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, ?, 'staff', ?)`,
      )
      .run(newId(), workspaceId, input.name, input.email, passwordHash, nowIso())
  } catch (error) {
    if (String(error).includes('UNIQUE')) throw new UserError('That email already belongs to an account.')
    throw error
  }
}

export function removeMember(workspaceId: string, userId: string) {
  const result = db()
    .prepare("DELETE FROM users WHERE id = ? AND workspace_id = ? AND role = 'staff'")
    .run(userId, workspaceId)
  if (result.changes === 0) throw new UserError('Only staff members can be removed.')
}
