// One transparent, usage-based plan. Shared by the public calculator and
// the in-app billing page so both always agree.

export const PLAN = {
  name: 'Sqoop Merchant',
  base: 25_000,
  included: { stores: 1, users: 3, orders: 100 },
  extra: { store: 10_000, user: 3_000, order: 100 },
  annualMonthsCharged: 10, // pay 10 months, get 12
  limits: { stores: 200, users: 500, orders: 1_000_000 },
} as const

export type Usage = { stores: number; users: number; orders: number }
export type Cycle = 'monthly' | 'annual'
export type QuoteLine = { label: string; quantity: number; unitPrice: number; amount: number }
export type Quote = { lines: QuoteLine[]; monthly: number; cycle: Cycle; total: number; savings: number }

export function validateUsage(usage: Usage): string | null {
  for (const key of ['stores', 'users', 'orders'] as const) {
    const value = usage[key]
    if (!Number.isInteger(value)) return `${key} must be a whole number.`
    if (value < (key === 'orders' ? 0 : 1)) return `${key} must be at least ${key === 'orders' ? 0 : 1}.`
    if (value > PLAN.limits[key]) return `For more than ${PLAN.limits[key]} ${key}, contact us for a custom plan.`
  }
  return null
}

export function quote(usage: Usage, cycle: Cycle = 'monthly'): Quote {
  const problem = validateUsage(usage)
  if (problem) throw new RangeError(problem)
  const extraStores = Math.max(0, usage.stores - PLAN.included.stores)
  const extraUsers = Math.max(0, usage.users - PLAN.included.users)
  const extraOrders = Math.max(0, usage.orders - PLAN.included.orders)
  const lines: QuoteLine[] = [
    {
      label: `Base plan (${PLAN.included.stores} store, ${PLAN.included.users} team members, ${PLAN.included.orders} orders)`,
      quantity: 1,
      unitPrice: PLAN.base,
      amount: PLAN.base,
    },
    {
      label: 'Extra stores',
      quantity: extraStores,
      unitPrice: PLAN.extra.store,
      amount: extraStores * PLAN.extra.store,
    },
    {
      label: 'Extra team members',
      quantity: extraUsers,
      unitPrice: PLAN.extra.user,
      amount: extraUsers * PLAN.extra.user,
    },
    {
      label: 'Extra orders',
      quantity: extraOrders,
      unitPrice: PLAN.extra.order,
      amount: extraOrders * PLAN.extra.order,
    },
  ]
  const monthly = lines.reduce((sum, line) => sum + line.amount, 0)
  const total = cycle === 'annual' ? monthly * PLAN.annualMonthsCharged : monthly
  return { lines, monthly, cycle, total, savings: cycle === 'annual' ? monthly * 12 - total : 0 }
}
