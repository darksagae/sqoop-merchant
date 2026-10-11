import { db, newId, nowIso } from '../db'
import { NotFoundError, UserError } from '../errors'

export type Product = {
  id: string
  sku: string
  name: string
  price: number
  stock: number
  reorderLevel: number
  archived: boolean
  updatedAt: string
}

type Row = {
  id: string
  sku: string
  name: string
  price: number
  stock: number
  reorder_level: number
  archived: number
  updated_at: string
}

export type ProductInput = { name: string; sku: string; price: number; stock: number; reorderLevel: number }
export type ProductFilter = 'active' | 'low' | 'archived'

const toProduct = (row: Row): Product => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  price: row.price,
  stock: row.stock,
  reorderLevel: row.reorder_level,
  archived: row.archived === 1,
  updatedAt: row.updated_at,
})

export const isLowStock = (product: Pick<Product, 'stock' | 'reorderLevel'>) => product.stock <= product.reorderLevel

export function listProducts(
  workspaceId: string,
  { filter = 'active', q = '' }: { filter?: ProductFilter; q?: string } = {},
) {
  const where = ['workspace_id = ?']
  const params: (string | number)[] = [workspaceId]
  if (filter === 'archived') where.push('archived = 1')
  else where.push('archived = 0')
  if (filter === 'low') where.push('stock <= reorder_level')
  if (q.trim()) {
    where.push("(name LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\')")
    const like = `%${q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    params.push(like, like)
  }
  return (
    db()
      .prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY name COLLATE NOCASE`)
      .all(...params) as Row[]
  ).map(toProduct)
}

export function getProduct(workspaceId: string, productId: string) {
  const row = db().prepare('SELECT * FROM products WHERE id = ? AND workspace_id = ?').get(productId, workspaceId) as
    Row | undefined
  if (!row) throw new NotFoundError('Product')
  return toProduct(row)
}

function duplicateSku(error: unknown): never {
  if (String(error).includes('UNIQUE')) throw new UserError('Another product already uses this SKU.')
  throw error
}

export function createProduct(workspaceId: string, input: ProductInput) {
  const id = newId()
  const time = nowIso()
  try {
    db()
      .prepare(
        `INSERT INTO products (id, workspace_id, sku, name, price, stock, reorder_level, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, workspaceId, input.sku, input.name, input.price, input.stock, input.reorderLevel, time, time)
  } catch (error) {
    duplicateSku(error)
  }
  return id
}

export function updateProduct(workspaceId: string, productId: string, input: ProductInput) {
  try {
    const result = db()
      .prepare(
        `UPDATE products SET sku = ?, name = ?, price = ?, stock = ?, reorder_level = ?, updated_at = ?
         WHERE id = ? AND workspace_id = ?`,
      )
      .run(input.sku, input.name, input.price, input.stock, input.reorderLevel, nowIso(), productId, workspaceId)
    if (result.changes === 0) throw new NotFoundError('Product')
  } catch (error) {
    duplicateSku(error)
  }
}

export function setArchived(workspaceId: string, productId: string, archived: boolean) {
  const result = db()
    .prepare('UPDATE products SET archived = ?, updated_at = ? WHERE id = ? AND workspace_id = ?')
    .run(archived ? 1 : 0, nowIso(), productId, workspaceId)
  if (result.changes === 0) throw new NotFoundError('Product')
}
