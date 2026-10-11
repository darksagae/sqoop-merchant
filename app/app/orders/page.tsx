import { Plus, ReceiptText, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Empty, PageHeader, StatusBadge } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { ugx } from '@/lib/money'
import { ORDER_STATUSES, listOrders, type OrderStatus } from '@/lib/repo/orders'

export const metadata: Metadata = { title: 'Orders' }

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await requireUser()
  const params = await searchParams
  const status = ORDER_STATUSES.find((s) => s === params.status) as OrderStatus | undefined
  const q = (params.q ?? '').slice(0, 80)
  const orders = listOrders(user.workspaceId, { status, q })
  const tabs: { id?: OrderStatus; label: string }[] = [
    { label: 'All' },
    ...ORDER_STATUSES.map((s) => ({ id: s, label: s })),
  ]

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every sale across your stores, newest first."
        actions={
          <Link href="/app/orders/new" className="btn btn-primary">
            <Plus className="size-4" aria-hidden="true" /> New order
          </Link>
        }
      />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.id ? `/app/orders?status=${tab.id}` : '/app/orders'}
                aria-current={status === tab.id ? 'page' : undefined}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${
                  status === tab.id ? 'bg-ink text-canvas' : 'text-ink-soft hover:bg-sunken'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          <form className="relative md:w-72" role="search">
            {status && <input type="hidden" name="status" value={status} />}
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Order #, customer or phone"
              aria-label="Search orders"
              className="input pl-9"
            />
          </form>
        </div>
        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-ink-soft">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Store</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-sunken">
                    <td className="px-5 py-3">
                      <Link href={`/app/orders/${o.id}`} className="num font-semibold hover:text-brand-strong">
                        #{o.number}
                      </Link>
                      <span className="ml-2 text-xs text-ink-soft">{o.itemCount} items</span>
                    </td>
                    <td className="px-5 py-3">{o.customerName || <span className="text-ink-soft">Walk-in</span>}</td>
                    <td className="px-5 py-3 text-ink-soft">{o.storeName}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-ink-soft">{when(o.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="num px-5 py-3 text-right font-semibold">{ugx(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={<ReceiptText className="size-6" aria-hidden="true" />}
            title={q || status ? 'No matching orders' : 'No orders yet'}
            body={q || status ? 'Try another filter or search.' : 'Orders you record appear here with their status.'}
            action={
              !q && !status ? (
                <Link href="/app/orders/new" className="btn btn-primary">
                  Record your first order
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </>
  )
}
