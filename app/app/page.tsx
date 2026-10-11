import { AlertTriangle, ArrowDownRight, ArrowUpRight, Package, Plus, ReceiptText, Sparkles, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { RevenueChart } from '@/components/revenue-chart'
import { SubmitButton } from '@/components/submit-button'
import { PageHeader, StatusBadge } from '@/components/ui'
import { loadSampleData } from '@/lib/actions/catalog'
import { requireUser } from '@/lib/auth'
import { count, ugx } from '@/lib/money'
import { listProducts } from '@/lib/repo/products'
import { dashboard } from '@/lib/repo/stats'

export const metadata: Metadata = { title: 'Dashboard' }

const time = (iso: string) =>
  new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )

export default async function DashboardPage() {
  const user = await requireUser()
  const stats = dashboard(user.workspaceId)
  const hasProducts = listProducts(user.workspaceId).length > 0
  const firstName = user.name.split(' ')[0]

  if (!hasProducts && stats.recentOrders.length === 0) {
    return <Welcome name={firstName} />
  }

  const change = stats.revenueChange
  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description="Here’s how your shop is doing this month."
        actions={
          <Link href="/app/orders/new" className="btn btn-primary">
            <Plus className="size-4" aria-hidden="true" /> New order
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Revenue this month" value={ugx(stats.revenue)}>
          {change !== null && (
            <span className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? 'text-good' : 'text-bad'}`}>
              {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(Math.round(change * 100))}% vs last month
            </span>
          )}
        </Kpi>
        <Kpi label="Paid orders" value={count(stats.paidOrders)} />
        <Kpi label="Average order" value={ugx(stats.averageOrder)} />
        <Kpi label="Open orders" value={count(stats.openOrders)}>
          <Link href="/app/orders?status=pending" className="text-xs font-semibold text-brand-strong hover:underline">
            View pending
          </Link>
        </Kpi>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="card p-5 sm:p-6" aria-labelledby="revenue-title">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 id="revenue-title" className="font-semibold">
              Revenue, last 14 days
            </h2>
            <span className="num text-sm text-ink-soft">{ugx(stats.daily.reduce((sum, d) => sum + d.revenue, 0))}</span>
          </div>
          <RevenueChart data={stats.daily} />
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="stock-title">
          <h2 id="stock-title" className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" /> Low stock
          </h2>
          {stats.lowStock.length ? (
            <ul className="mt-4 space-y-1">
              {stats.lowStock.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/app/products/${p.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-sunken"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="num shrink-0 font-semibold text-amber-700 dark:text-amber-300">
                      {p.stock} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">Everything is above its reorder level.</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="card overflow-hidden" aria-labelledby="recent-title">
          <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
            <h2 id="recent-title" className="font-semibold">
              Recent orders
            </h2>
            <Link href="/app/orders" className="text-sm font-semibold text-brand-strong hover:underline">
              All orders
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {stats.recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/app/orders/${o.id}`}
                  className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-sunken sm:px-6"
                >
                  <span className="num w-14 font-semibold">#{o.number}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-soft">
                    {o.customerName || 'Walk-in customer'} · {o.storeName}
                  </span>
                  <span className="hidden text-ink-soft md:block">{time(o.createdAt)}</span>
                  <span className="flex flex-col-reverse items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <StatusBadge status={o.status} />
                    <span className="num text-right font-semibold sm:w-28">{ugx(o.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="top-title">
          <h2 id="top-title" className="font-semibold">
            Best sellers this month
          </h2>
          {stats.topProducts.length ? (
            <ol className="mt-4 space-y-3">
              {stats.topProducts.map((p, index) => (
                <li key={p.sku} className="flex items-center gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-sunken text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="num text-ink-soft">{count(p.units)} sold</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">No paid orders yet this month.</p>
          )}
        </section>
      </div>
    </>
  )
}

function Kpi({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col gap-1.5 p-4 sm:p-5">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      <span className="num text-xl font-bold tracking-tight sm:text-2xl">{value}</span>
      {children}
    </div>
  )
}

function Welcome({ name }: { name: string }) {
  const steps = [
    {
      icon: Package,
      title: 'Add your products',
      body: 'Name, price and how many you have in stock.',
      href: '/app/products/new',
    },
    {
      icon: ReceiptText,
      title: 'Record your first order',
      body: 'Stock updates automatically as you sell.',
      href: '/app/orders/new',
    },
    {
      icon: Store,
      title: 'Add branches and staff',
      body: 'Track every location and who sold what.',
      href: '/app/settings',
    },
  ]
  return (
    <>
      <PageHeader title={`Welcome, ${name}`} description="Three steps to get your shop running on Sqoop." />
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body, href }, index) => (
          <li key={title}>
            <Link href={href} className="card flex h-full flex-col p-6 transition-colors hover:border-brand">
              <span className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-ink-soft">Step {index + 1}</span>
              </span>
              <span className="mt-5 font-semibold">{title}</span>
              <span className="mt-1 text-sm text-ink-soft">{body}</span>
            </Link>
          </li>
        ))}
      </ol>
      <form
        action={loadSampleData}
        className="card mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center"
      >
        <Sparkles className="size-6 shrink-0 text-brand" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold">Just exploring?</p>
          <p className="text-sm text-ink-soft">Fill this workspace with a sample catalogue and two weeks of orders.</p>
        </div>
        <SubmitButton className="btn btn-secondary" pending="Loading…">
          Load sample data
        </SubmitButton>
      </form>
    </>
  )
}
