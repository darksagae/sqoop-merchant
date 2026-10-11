import type { Metadata } from 'next'
import { OrderBuilder } from '@/components/order-builder'
import { PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { listProducts } from '@/lib/repo/products'
import { listStores } from '@/lib/repo/stores'

export const metadata: Metadata = { title: 'New order' }

export default async function NewOrderPage() {
  const user = await requireUser()
  const products = listProducts(user.workspaceId)
    .filter((p) => p.stock > 0)
    .map(({ id, name, sku, price, stock }) => ({ id, name, sku, price, stock }))
  const stores = listStores(user.workspaceId).map(({ id, name }) => ({ id, name }))
  return (
    <>
      <PageHeader title="New order" description="Add items, then record whether the customer has paid." />
      <OrderBuilder products={products} stores={stores} />
    </>
  )
}
