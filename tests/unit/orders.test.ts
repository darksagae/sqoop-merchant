import { describe, expect, it } from 'vitest'
import { createWorkspace } from '@/lib/repo/accounts'
import { createOrder, getOrder, listOrders, transitionOrder } from '@/lib/repo/orders'
import { createProduct, getProduct, listProducts, setArchived, updateProduct } from '@/lib/repo/products'
import { createDemoWorkspace } from '@/lib/repo/demo'
import { dashboard, usage } from '@/lib/repo/stats'
import { addStore, listStores } from '@/lib/repo/stores'
import './setup'

async function shop(email = 'owner@example.com') {
  const { workspaceId, userId } = await createWorkspace({
    businessName: 'Shop',
    name: 'Owner',
    email,
    password: 'a long password',
  })
  const storeId = listStores(workspaceId)[0].id
  const sugar = createProduct(workspaceId, {
    name: 'Sugar 1 kg',
    sku: 'SUG-1',
    price: 4_500,
    stock: 10,
    reorderLevel: 3,
  })
  const oil = createProduct(workspaceId, { name: 'Oil 1 L', sku: 'OIL-1', price: 8_500, stock: 5, reorderLevel: 2 })
  return { workspaceId, userId, storeId, sugar, oil }
}

const base = { customerName: '', customerPhone: '', note: '', payment: 'pending' as const }

describe('orders and stock', () => {
  it('creates an order, totals it and takes stock', async () => {
    const { workspaceId, userId, storeId, sugar, oil } = await shop()
    const { id, number } = createOrder(workspaceId, userId, {
      ...base,
      storeId,
      items: [
        { productId: sugar, quantity: 2 },
        { productId: oil, quantity: 1 },
        { productId: sugar, quantity: 1 },
      ],
    })
    expect(number).toBe(1001)
    const order = getOrder(workspaceId, id)
    expect(order.total).toBe(3 * 4_500 + 8_500)
    expect(order.items).toHaveLength(2)
    expect(getProduct(workspaceId, sugar).stock).toBe(7)
    expect(
      createOrder(workspaceId, userId, { ...base, storeId, items: [{ productId: oil, quantity: 1 }] }).number,
    ).toBe(1002)
  })

  it('refuses to oversell or sell archived products', async () => {
    const { workspaceId, userId, storeId, oil } = await shop()
    expect(() =>
      createOrder(workspaceId, userId, { ...base, storeId, items: [{ productId: oil, quantity: 6 }] }),
    ).toThrow(/Only 5/)
    setArchived(workspaceId, oil, true)
    expect(() =>
      createOrder(workspaceId, userId, { ...base, storeId, items: [{ productId: oil, quantity: 1 }] }),
    ).toThrow(/no longer available/)
    expect(getProduct(workspaceId, oil).stock).toBe(5)
  })

  it('moves through pending → paid → fulfilled and blocks invalid moves', async () => {
    const { workspaceId, userId, storeId, sugar } = await shop()
    const { id } = createOrder(workspaceId, userId, { ...base, storeId, items: [{ productId: sugar, quantity: 1 }] })
    expect(() => transitionOrder(workspaceId, id, 'fulfil')).toThrow(/cannot be fulfilled/)
    expect(() => transitionOrder(workspaceId, id, 'pay')).toThrow(/how the customer paid/)
    transitionOrder(workspaceId, id, 'pay', 'mobile_money')
    expect(getOrder(workspaceId, id)).toMatchObject({ status: 'paid', paymentMethod: 'mobile_money' })
    transitionOrder(workspaceId, id, 'fulfil')
    expect(() => transitionOrder(workspaceId, id, 'cancel')).toThrow(/cannot be cancelled/)
    expect(dashboard(workspaceId).revenue).toBe(4_500)
  })

  it('returns stock when an order is cancelled', async () => {
    const { workspaceId, userId, storeId, sugar } = await shop()
    const { id } = createOrder(workspaceId, userId, {
      ...base,
      payment: 'cash',
      storeId,
      items: [{ productId: sugar, quantity: 4 }],
    })
    expect(getProduct(workspaceId, sugar).stock).toBe(6)
    transitionOrder(workspaceId, id, 'cancel')
    expect(getProduct(workspaceId, sugar).stock).toBe(10)
    expect(usage(workspaceId).orders).toBe(0)
  })

  it('keeps every workspace isolated', async () => {
    const a = await shop('a@example.com')
    const b = await shop('b@example.com')
    const order = createOrder(a.workspaceId, a.userId, {
      ...base,
      storeId: a.storeId,
      items: [{ productId: a.sugar, quantity: 1 }],
    })

    expect(() => getOrder(b.workspaceId, order.id)).toThrow(/not found/)
    expect(() => getProduct(b.workspaceId, a.sugar)).toThrow(/not found/)
    expect(() => transitionOrder(b.workspaceId, order.id, 'cancel')).toThrow(/not found/)
    expect(() =>
      updateProduct(b.workspaceId, a.sugar, { name: 'x', sku: 'X', price: 1, stock: 1, reorderLevel: 1 }),
    ).toThrow(/not found/)
    // B cannot sell A's product or use A's store.
    expect(() =>
      createOrder(b.workspaceId, b.userId, {
        ...base,
        storeId: b.storeId,
        items: [{ productId: a.sugar, quantity: 1 }],
      }),
    ).toThrow()
    expect(() =>
      createOrder(b.workspaceId, b.userId, {
        ...base,
        storeId: a.storeId,
        items: [{ productId: b.sugar, quantity: 1 }],
      }),
    ).toThrow(/your stores/)
    expect(listOrders(b.workspaceId)).toHaveLength(0)
    expect(
      listProducts(b.workspaceId)
        .map((p) => p.id)
        .sort(),
    ).toEqual([b.sugar, b.oil].sort())
    expect(getProduct(a.workspaceId, a.sugar).stock).toBe(9)
  })

  it('reports usage for billing', async () => {
    const { workspaceId, userId, storeId, sugar } = await shop()
    addStore(workspaceId, { name: 'Branch', location: '' })
    createOrder(workspaceId, userId, { ...base, storeId, items: [{ productId: sugar, quantity: 1 }] })
    expect(usage(workspaceId)).toEqual({ stores: 2, users: 1, orders: 1 })
  })

  it('searches products and orders safely', async () => {
    const { workspaceId, userId, storeId, sugar } = await shop()
    createOrder(workspaceId, userId, {
      ...base,
      customerName: 'Grace 100%',
      storeId,
      items: [{ productId: sugar, quantity: 1 }],
    })
    expect(listProducts(workspaceId, { q: 'sug' })).toHaveLength(1)
    expect(listProducts(workspaceId, { q: '%' })).toHaveLength(0)
    expect(listOrders(workspaceId, { q: '#1001' })).toHaveLength(1)
    expect(listOrders(workspaceId, { q: '100%' })).toHaveLength(1)
    expect(listProducts(workspaceId, { filter: 'low' })).toHaveLength(0)
  })

  it('seeds a believable demo workspace', async () => {
    const { workspaceId } = await createDemoWorkspace()
    const stats = dashboard(workspaceId)
    expect(stats.revenue).toBeGreaterThan(0)
    expect(stats.daily).toHaveLength(14)
    expect(stats.lowStock.length).toBeGreaterThan(0)
    expect(listStores(workspaceId)).toHaveLength(2)
    expect(listOrders(workspaceId, { status: 'pending' }).length).toBeGreaterThan(0)
  })
})
