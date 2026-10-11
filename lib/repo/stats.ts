import { db } from '../db'
import type { Usage } from '../pricing'
import { isLowStock, listProducts } from './products'
import { listOrders } from './orders'

/** First instant of the calendar month containing `at` (UTC). */
export function monthStart(at = new Date()) {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1))
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

export function usage(workspaceId: string, at = new Date()): Usage {
  const start = monthStart(at).toISOString()
  const end = addMonths(monthStart(at), 1).toISOString()
  const one = (sql: string, ...params: string[]) =>
    (
      db()
        .prepare(sql)
        .get(...params) as { n: number }
    ).n
  return {
    stores: one('SELECT COUNT(*) AS n FROM stores WHERE workspace_id = ?', workspaceId),
    users: one('SELECT COUNT(*) AS n FROM users WHERE workspace_id = ?', workspaceId),
    orders: one(
      "SELECT COUNT(*) AS n FROM orders WHERE workspace_id = ? AND status != 'cancelled' AND created_at >= ? AND created_at < ?",
      workspaceId,
      start,
      end,
    ),
  }
}

function revenueBetween(workspaceId: string, from: string, to: string) {
  return db()
    .prepare(
      `SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders
       WHERE workspace_id = ? AND status IN ('paid', 'fulfilled') AND paid_at >= ? AND paid_at < ?`,
    )
    .get(workspaceId, from, to) as { revenue: number; orders: number }
}

export function dashboard(workspaceId: string, at = new Date()) {
  const start = monthStart(at)
  const thisMonth = revenueBetween(workspaceId, start.toISOString(), addMonths(start, 1).toISOString())
  const lastMonth = revenueBetween(workspaceId, addMonths(start, -1).toISOString(), start.toISOString())

  const days = 14
  const today = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()))
  const from = new Date(today.getTime() - (days - 1) * 86_400_000)
  const byDay = new Map(
    (
      db()
        .prepare(
          `SELECT substr(paid_at, 1, 10) AS day, SUM(total) AS revenue, COUNT(*) AS orders FROM orders
           WHERE workspace_id = ? AND status IN ('paid', 'fulfilled') AND paid_at >= ?
           GROUP BY day`,
        )
        .all(workspaceId, from.toISOString()) as { day: string; revenue: number; orders: number }[]
    ).map((row) => [row.day, row]),
  )
  const daily = Array.from({ length: days }, (_, index) => {
    const day = new Date(from.getTime() + index * 86_400_000).toISOString().slice(0, 10)
    return { day, revenue: byDay.get(day)?.revenue ?? 0, orders: byDay.get(day)?.orders ?? 0 }
  })

  const topProducts = db()
    .prepare(
      `SELECT i.name, i.sku, SUM(i.quantity) AS units, SUM(i.quantity * i.unit_price) AS revenue
       FROM order_items i JOIN orders o ON o.id = i.order_id
       WHERE o.workspace_id = ? AND o.status IN ('paid', 'fulfilled') AND o.paid_at >= ?
       GROUP BY i.sku, i.name ORDER BY units DESC LIMIT 5`,
    )
    .all(workspaceId, start.toISOString()) as { name: string; sku: string; units: number; revenue: number }[]

  const pending = (
    db()
      .prepare("SELECT COUNT(*) AS n FROM orders WHERE workspace_id = ? AND status IN ('pending', 'paid')")
      .get(workspaceId) as { n: number }
  ).n

  return {
    revenue: thisMonth.revenue,
    revenueChange: lastMonth.revenue ? (thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue : null,
    paidOrders: thisMonth.orders,
    averageOrder: thisMonth.orders ? Math.round(thisMonth.revenue / thisMonth.orders) : 0,
    openOrders: pending,
    lowStock: listProducts(workspaceId).filter(isLowStock),
    daily,
    topProducts,
    recentOrders: listOrders(workspaceId, { limit: 6 }),
  }
}

export type Dashboard = ReturnType<typeof dashboard>
