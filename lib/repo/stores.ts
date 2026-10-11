import { db, newId, nowIso } from '../db'
import { NotFoundError } from '../errors'

export type Store = { id: string; name: string; location: string; orderCount: number }

export function listStores(workspaceId: string): Store[] {
  return (
    db()
      .prepare(
        `SELECT s.id, s.name, s.location, COUNT(o.id) AS order_count
         FROM stores s LEFT JOIN orders o ON o.store_id = s.id
         WHERE s.workspace_id = ? GROUP BY s.id ORDER BY s.created_at`,
      )
      .all(workspaceId) as { id: string; name: string; location: string; order_count: number }[]
  ).map((row) => ({ id: row.id, name: row.name, location: row.location, orderCount: row.order_count }))
}

export function addStore(workspaceId: string, input: { name: string; location: string }) {
  const id = newId()
  db()
    .prepare('INSERT INTO stores (id, workspace_id, name, location, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, workspaceId, input.name, input.location, nowIso())
  return id
}

export function updateStore(workspaceId: string, storeId: string, input: { name: string; location: string }) {
  const result = db()
    .prepare('UPDATE stores SET name = ?, location = ? WHERE id = ? AND workspace_id = ?')
    .run(input.name, input.location, storeId, workspaceId)
  if (result.changes === 0) throw new NotFoundError('Store')
}
