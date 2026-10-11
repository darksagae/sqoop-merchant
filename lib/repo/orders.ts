import { db, newId, nowIso, transaction } from '../db'
import { NotFoundError, UserError } from '../errors'
import type { PaymentMethod } from '../validation'

export const ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type OrderAction = 'pay' | 'fulfil' | 'cancel'

export type OrderSummary = {
  id: string
  number: number
  status: OrderStatus
  total: number
  customerName: string
  storeName: string
  itemCount: number
  createdAt: string
}

export type OrderItem = { productId: string | null; sku: string; name: string; unitPrice: number; quantity: number }

export type Order = OrderSummary & {
  storeId: string
  customerPhone: string
  note: string
  paymentMethod: PaymentMethod | null
  paidAt: string | null
  updatedAt: string
  createdBy: string | null
  items: OrderItem[]
}

export type NewOrder = {
  storeId: string
  customerName: string
  customerPhone: string
  note: string
  payment: 'pending' | PaymentMethod
  items: { productId: string; quantity: number }[]
}

type SummaryRow = {
  id: string
  number: number
  status: OrderStatus
  total: number
  customer_name: string
  store_name: string
  item_count: number
  created_at: string
}

const toSummary = (row: SummaryRow): OrderSummary => ({
  id: row.id,
  number: row.number,
  status: row.status,
  total: row.total,
  customerName: row.customer_name,
  storeName: row.store_name,
  itemCount: row.item_count,
  createdAt: row.created_at,
})

const SUMMARY_SELECT = `
  SELECT o.id, o.number, o.status, o.total, o.customer_name, o.created_at, s.name AS store_name,
         (SELECT COALESCE(SUM(quantity), 0) FROM order_items i WHERE i.order_id = o.id) AS item_count
  FROM orders o JOIN stores s ON s.id = o.store_id`

export function listOrders(
  workspaceId: string,
  { status, q = '', limit = 200 }: { status?: OrderStatus; q?: string; limit?: number } = {},
) {
  const where = ['o.workspace_id = ?']
  const params: (string | number)[] = [workspaceId]
  if (status) {
    where.push('o.status = ?')
    params.push(status)
  }
  const term = q.trim().replace(/^#/, '')
  if (term) {
    where.push(
      "(CAST(o.number AS TEXT) = ? OR o.customer_name LIKE ? ESCAPE '\\' OR o.customer_phone LIKE ? ESCAPE '\\')",
    )
    const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    params.push(term, like, like)
  }
  params.push(limit)
  return (
    db()
      .prepare(`${SUMMARY_SELECT} WHERE ${where.join(' AND ')} ORDER BY o.created_at DESC, o.number DESC LIMIT ?`)
      .all(...params) as SummaryRow[]
  ).map(toSummary)
}

export function getOrder(workspaceId: string, orderId: string): Order {
  const row = db()
    .prepare(
      `${SUMMARY_SELECT.replace('SELECT o.id', 'SELECT o.store_id, o.customer_phone, o.note, o.payment_method, o.paid_at, o.updated_at, o.created_by, o.id')}
       WHERE o.id = ? AND o.workspace_id = ?`,
    )
    .get(orderId, workspaceId) as
    | (SummaryRow & {
        store_id: string
        customer_phone: string
        note: string
        payment_method: PaymentMethod | null
        paid_at: string | null
        updated_at: string
        created_by: string | null
      })
    | undefined
  if (!row) throw new NotFoundError('Order')
  const items = (
    db()
      .prepare('SELECT product_id, sku, name, unit_price, quantity FROM order_items WHERE order_id = ? ORDER BY id')
      .all(orderId) as { product_id: string | null; sku: string; name: string; unit_price: number; quantity: number }[]
  ).map((item) => ({
    productId: item.product_id,
    sku: item.sku,
    name: item.name,
    unitPrice: item.unit_price,
    quantity: item.quantity,
  }))
  return {
    ...toSummary(row),
    storeId: row.store_id,
    customerPhone: row.customer_phone,
    note: row.note,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    items,
  }
}

/** Creates an order, takes the items out of stock and assigns the next order number. */
export function createOrder(workspaceId: string, userId: string | null, input: NewOrder, at = nowIso()) {
  const quantities = new Map<string, number>()
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)

  return transaction(() => {
    const store = db()
      .prepare('SELECT id FROM stores WHERE id = ? AND workspace_id = ?')
      .get(input.storeId, workspaceId)
    if (!store) throw new UserError('Choose one of your stores.')

    const lines = [...quantities].map(([productId, quantity]) => {
      const product = db()
        .prepare('SELECT id, sku, name, price, stock, archived FROM products WHERE id = ? AND workspace_id = ?')
        .get(productId, workspaceId) as
        { id: string; sku: string; name: string; price: number; stock: number; archived: number } | undefined
      if (!product || product.archived) throw new UserError('One of the products is no longer available.')
      if (product.stock < quantity) {
        throw new UserError(`Only ${product.stock} × ${product.name} left in stock.`)
      }
      return { ...product, quantity }
    })

    const { next_order_number: number } = db()
      .prepare('SELECT next_order_number FROM workspaces WHERE id = ?')
      .get(workspaceId) as { next_order_number: number }
    db().prepare('UPDATE workspaces SET next_order_number = next_order_number + 1 WHERE id = ?').run(workspaceId)

    const id = newId()
    const paid = input.payment !== 'pending'
    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
    db()
      .prepare(
        `INSERT INTO orders (id, workspace_id, number, store_id, customer_name, customer_phone, status, payment_method,
                             total, note, created_by, created_at, updated_at, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        workspaceId,
        number,
        input.storeId,
        input.customerName,
        input.customerPhone,
        paid ? 'paid' : 'pending',
        paid ? input.payment : null,
        total,
        input.note,
        userId,
        at,
        at,
        paid ? at : null,
      )
    const insertItem = db().prepare(
      'INSERT INTO order_items (order_id, product_id, sku, name, unit_price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
    )
    const takeStock = db().prepare('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?')
    for (const line of lines) {
      insertItem.run(id, line.id, line.sku, line.name, line.price, line.quantity)
      takeStock.run(line.quantity, at, line.id)
    }
    return { id, number }
  })
}

const ALLOWED: Record<OrderAction, OrderStatus[]> = {
  pay: ['pending'],
  fulfil: ['paid'],
  cancel: ['pending', 'paid'],
}

const PAST_TENSE: Record<OrderAction, string> = { pay: 'marked as paid', fulfil: 'fulfilled', cancel: 'cancelled' }

export function nextActions(status: OrderStatus): OrderAction[] {
  return (Object.keys(ALLOWED) as OrderAction[]).filter((action) => ALLOWED[action].includes(status))
}

/** Moves an order through pending → paid → fulfilled, or cancels it and returns stock. */
export function transitionOrder(
  workspaceId: string,
  orderId: string,
  action: OrderAction,
  paymentMethod?: PaymentMethod,
  at = nowIso(),
) {
  transaction(() => {
    const order = db()
      .prepare('SELECT status FROM orders WHERE id = ? AND workspace_id = ?')
      .get(orderId, workspaceId) as { status: OrderStatus } | undefined
    if (!order) throw new NotFoundError('Order')
    if (!ALLOWED[action].includes(order.status)) {
      throw new UserError(`A ${order.status} order cannot be ${PAST_TENSE[action]}.`)
    }
    if (action === 'pay') {
      if (!paymentMethod) throw new UserError('Choose how the customer paid.')
      db()
        .prepare("UPDATE orders SET status = 'paid', payment_method = ?, paid_at = ?, updated_at = ? WHERE id = ?")
        .run(paymentMethod, at, at, orderId)
    } else if (action === 'fulfil') {
      db().prepare("UPDATE orders SET status = 'fulfilled', updated_at = ? WHERE id = ?").run(at, orderId)
    } else {
      db().prepare("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?").run(at, orderId)
      db()
        .prepare(
          `UPDATE products SET stock = stock + (
             SELECT SUM(quantity) FROM order_items WHERE order_id = ? AND product_id = products.id
           ), updated_at = ?
           WHERE workspace_id = ? AND id IN (SELECT product_id FROM order_items WHERE order_id = ?)`,
        )
        .run(orderId, at, workspaceId, orderId)
    }
  })
}
