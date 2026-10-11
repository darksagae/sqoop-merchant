import { Package, Plus, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, Empty, PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { count, ugx } from '@/lib/money'
import { isLowStock, listProducts, type ProductFilter } from '@/lib/repo/products'

export const metadata: Metadata = { title: 'Products' }

const FILTERS: { id: ProductFilter; label: string }[] = [
  { id: 'active', label: 'All' },
  { id: 'low', label: 'Low stock' },
  { id: 'archived', label: 'Archived' },
]

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const user = await requireUser()
  const params = await searchParams
  const filter = FILTERS.find((f) => f.id === params.filter)?.id ?? 'active'
  const q = (params.q ?? '').slice(0, 80)
  const products = listProducts(user.workspaceId, { filter, q })
  const stockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

  return (
    <>
      <PageHeader
        title="Products"
        description={`${count(products.length)} ${filter === 'archived' ? 'archived ' : ''}products · stock value ${ugx(stockValue)}`}
        actions={
          <Link href="/app/products/new" className="btn btn-primary">
            <Plus className="size-4" aria-hidden="true" /> Add product
          </Link>
        }
      />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter products" className="flex gap-1">
            {FILTERS.map((f) => (
              <Link
                key={f.id}
                href={`/app/products${f.id === 'active' ? '' : `?filter=${f.id}`}`}
                aria-current={filter === f.id ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  filter === f.id ? 'bg-ink text-canvas' : 'text-ink-soft hover:bg-sunken'
                }`}
              >
                {f.label}
              </Link>
            ))}
          </nav>
          <form className="relative sm:w-72" role="search">
            {filter !== 'active' && <input type="hidden" name="filter" value={filter} />}
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or SKU"
              aria-label="Search products"
              className="input pl-9"
            />
          </form>
        </div>
        {products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-ink-soft">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">In stock</th>
                  <th className="px-5 py-3 text-right">Stock value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-sunken">
                    <td className="px-5 py-3">
                      <Link href={`/app/products/${p.id}`} className="font-semibold hover:text-brand-strong">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{p.sku}</td>
                    <td className="num px-5 py-3 text-right">{ugx(p.price)}</td>
                    <td className="num px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-2">
                        {!p.archived && isLowStock(p) && <Badge tone="warn">Low</Badge>}
                        {count(p.stock)}
                      </span>
                    </td>
                    <td className="num px-5 py-3 text-right text-ink-soft">{ugx(p.price * p.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={<Package className="size-6" aria-hidden="true" />}
            title={
              q
                ? 'No matching products'
                : filter === 'active'
                  ? 'No products yet'
                  : `No ${filter === 'low' ? 'low-stock' : 'archived'} products`
            }
            body={q ? 'Try a different name or SKU.' : 'Products you add appear here with their stock levels.'}
            action={
              filter === 'active' && !q ? (
                <Link href="/app/products/new" className="btn btn-primary">
                  Add your first product
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </>
  )
}
