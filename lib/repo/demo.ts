// Seeds a realistic two-week history so the product can be explored
// without typing in a catalogue first. Deterministic for a given seed.
import { db, nowIso, transaction } from '../db'
import { createWorkspace } from './accounts'
import { createOrder, transitionOrder } from './orders'
import { createProduct } from './products'
import { addStore, listStores } from './stores'
import type { PaymentMethod } from '../validation'

const CATALOGUE: [sku: string, name: string, price: number, stock: number, reorder: number][] = [
  ['SUG-1KG', 'Sugar 1 kg', 4_500, 120, 20],
  ['RICE-5KG', 'Rice, super grade 5 kg', 24_000, 40, 8],
  ['OIL-1L', 'Cooking oil 1 L', 8_500, 60, 10],
  ['FLOUR-2KG', 'Maize flour 2 kg', 6_000, 80, 15],
  ['BEANS-1KG', 'Dry beans 1 kg', 5_500, 70, 12],
  ['MILK-500', 'Fresh milk 500 ml', 1_500, 90, 24],
  ['BREAD-600', 'Bread 600 g', 4_000, 45, 10],
  ['SOAP-BAR', 'Laundry soap bar', 2_500, 150, 30],
  ['SALT-500', 'Salt 500 g', 1_000, 100, 20],
  ['TEA-100', 'Tea leaves 100 g', 3_500, 55, 10],
  ['WATER-1L', 'Drinking water 1.5 L', 2_000, 140, 24],
  ['EGGS-TRAY', 'Eggs, tray of 30', 13_500, 18, 6],
]

const CUSTOMERS = ['', '', 'Grace N.', 'Okello J.', 'Aisha K.', 'Brian M.', 'Sarah A.', '', 'Peter W.', 'Joan T.']

function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

export function seedDemoData(workspaceId: string, userId: string, seed = 42, now = new Date()) {
  const rand = random(seed)
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)]
  const [main] = listStores(workspaceId)
  db().prepare('UPDATE stores SET name = ?, location = ? WHERE id = ?').run('Main store', 'Kampala Road', main.id)
  const branch = addStore(workspaceId, { name: 'Ntinda branch', location: 'Ntinda' })
  const stores = [main.id, main.id, branch]

  const products = CATALOGUE.map(([sku, name, price, stock, reorder]) =>
    createProduct(workspaceId, { sku, name, price, stock: 100_000, reorderLevel: reorder }),
  )

  const payments: PaymentMethod[] = ['mobile_money', 'mobile_money', 'cash', 'cash', 'card']
  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const ordersToday = 2 + Math.floor(rand() * 5)
    for (let n = 0; n < ordersToday; n++) {
      const at = new Date(now.getTime() - daysAgo * 86_400_000 - Math.floor(rand() * 8 * 3_600_000)).toISOString()
      const lineCount = 1 + Math.floor(rand() * 3)
      const items = Array.from({ length: lineCount }, () => ({
        productId: pick(products),
        quantity: 1 + Math.floor(rand() * 4),
      }))
      const fresh = daysAgo === 0 && n >= ordersToday - 2
      const { id } = createOrder(
        workspaceId,
        userId,
        {
          storeId: pick(stores),
          customerName: pick(CUSTOMERS),
          customerPhone: '',
          note: '',
          payment: fresh ? 'pending' : pick(payments),
          items,
        },
        at,
      )
      if (!fresh) {
        if (rand() < 0.05) transitionOrder(workspaceId, id, 'cancel', undefined, at)
        else if (daysAgo > 0 || rand() < 0.5) transitionOrder(workspaceId, id, 'fulfil', undefined, at)
      }
    }
  }

  // Bring stock back to believable levels, leaving a couple of items low.
  transaction(() => {
    const restock = db().prepare('UPDATE products SET stock = ? WHERE id = ?')
    CATALOGUE.forEach(([, , , stock], index) => restock.run(index % 5 === 4 ? 3 : stock, products[index]))
  })
}

// Every new visitor gets a demo shop, so old ones are cleared out (with their data) after a week.
const DEMO_LIFETIME_MS = 7 * 24 * 60 * 60_000

export async function createDemoWorkspace() {
  const expired = new Date(Date.now() - DEMO_LIFETIME_MS).toISOString()
  db().prepare('DELETE FROM workspaces WHERE is_demo = 1 AND created_at < ?').run(expired)
  const suffix = crypto.randomUUID().slice(0, 8)
  const { workspaceId, userId } = await createWorkspace({
    businessName: 'Demo Mart',
    name: 'Demo Owner',
    email: `demo-${suffix}@demo.sqoop.invalid`,
    password: crypto.randomUUID(),
    isDemo: true,
  })
  seedDemoData(workspaceId, userId)
  db().prepare('UPDATE workspaces SET created_at = ? WHERE id = ?').run(nowIso(), workspaceId)
  return { workspaceId, userId }
}
