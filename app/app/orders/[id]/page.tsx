import { ArrowLeft, Printer } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrderActions } from '@/components/order-actions'
import { PrintButton } from '@/components/print-button'
import { StatusBadge } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { NotFoundError } from '@/lib/errors'
import { count, ugx } from '@/lib/money'
import { getOrder, nextActions } from '@/lib/repo/orders'
import { paymentLabel } from '@/lib/validation'

export const metadata: Metadata = { title: 'Order' }

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  let order
  try {
    order = getOrder(user.workspaceId, (await params).id)
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }

  return (
    <>
      <Link href="/app/orders" className="btn btn-ghost mb-4 -ml-3 print:hidden">
        <ArrowLeft className="size-4" aria-hidden="true" /> Orders
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="num text-2xl font-bold tracking-tight sm:text-3xl">Order #{order.number}</h1>
          <StatusBadge status={order.status} />
        </div>
        <PrintButton>
          <Printer className="size-4" aria-hidden="true" /> Print receipt
        </PrintButton>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="card overflow-hidden" aria-labelledby="items-title">
          <h2 id="items-title" className="px-5 pt-5 font-semibold sm:px-6">
            {count(order.itemCount)} items
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-soft">
                <th className="px-5 py-2 sm:px-6">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="hidden px-3 py-2 text-right sm:table-cell">Price</th>
                <th className="px-5 py-2 text-right sm:px-6">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((item) => (
                <tr key={item.sku}>
                  <td className="px-5 py-3 sm:px-6">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-ink-soft">{item.sku}</p>
                  </td>
                  <td className="num px-3 py-3 text-right">{item.quantity}</td>
                  <td className="num hidden px-3 py-3 text-right text-ink-soft sm:table-cell">{ugx(item.unitPrice)}</td>
                  <td className="num px-5 py-3 text-right font-semibold sm:px-6">
                    {ugx(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line">
                <td colSpan={2} className="px-5 py-4 font-semibold sm:px-6">
                  Total
                </td>
                <td className="hidden sm:table-cell" />
                <td className="num px-5 py-4 text-right text-lg font-bold sm:px-6">{ugx(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <div className="space-y-6">
          <div className="print:hidden">
            <OrderActions orderId={order.id} actions={nextActions(order.status)} />
          </div>
          <section className="card p-5" aria-labelledby="details-title">
            <h2 id="details-title" className="font-semibold">
              Details
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Store">{order.storeName}</Row>
              <Row label="Customer">{order.customerName || 'Walk-in customer'}</Row>
              {order.customerPhone && <Row label="Phone">{order.customerPhone}</Row>}
              <Row label="Created">{when(order.createdAt)}</Row>
              {order.paidAt && (
                <Row label="Paid">
                  {when(order.paidAt)}
                  {order.paymentMethod && ` · ${paymentLabel[order.paymentMethod]}`}
                </Row>
              )}
              {order.note && <Row label="Note">{order.note}</Row>}
            </dl>
          </section>
        </div>
      </div>
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  )
}
