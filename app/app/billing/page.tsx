import { Info } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { count, ugx } from '@/lib/money'
import { PLAN, quote, type Cycle } from '@/lib/pricing'
import { monthStart, usage } from '@/lib/repo/stats'

export const metadata: Metadata = { title: 'Billing' }

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ cycle?: string }> }) {
  const user = await requireUser()
  const cycle: Cycle = (await searchParams).cycle === 'annual' ? 'annual' : 'monthly'
  const current = usage(user.workspaceId)
  const estimate = quote(current, cycle)
  const month = new Intl.DateTimeFormat('en-UG', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    monthStart(),
  )

  const meters = [
    { label: 'Stores', used: current.stores, included: PLAN.included.stores },
    { label: 'Team members', used: current.users, included: PLAN.included.users },
    { label: `Orders in ${month.split(' ')[0]}`, used: current.orders, included: PLAN.included.orders },
  ]

  return (
    <>
      <PageHeader title="Billing" description={`Usage and estimated charges for ${month}.`} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="usage-title">
            <h2 id="usage-title" className="font-semibold">
              Usage this month
            </h2>
            <ul className="mt-5 space-y-5">
              {meters.map(({ label, used, included }) => {
                const over = used > included
                return (
                  <li key={label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold">{label}</span>
                      <span className="num">
                        <span className={over ? 'font-bold text-brand-strong' : ''}>{count(used)}</span>
                        <span className="text-ink-soft"> / {count(included)} included</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
                      <div
                        className={`h-full rounded-full ${over ? 'bg-brand' : 'bg-ink/70'}`}
                        style={{ width: `${Math.min(100, (used / Math.max(included, 1)) * 100)}%` }}
                      />
                    </div>
                    {over && (
                      <p className="mt-1.5 text-xs text-ink-soft">
                        {count(used - included)} above the allowance, billed as extras.
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <aside className="card p-5 sm:p-6" aria-labelledby="estimate-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="estimate-title" className="font-semibold">
              Estimate
            </h2>
            <nav aria-label="Billing cycle" className="flex rounded-lg bg-sunken p-1 text-xs font-semibold">
              {(['monthly', 'annual'] as const).map((c) => (
                <Link
                  key={c}
                  href={c === 'monthly' ? '/app/billing' : '/app/billing?cycle=annual'}
                  aria-current={cycle === c ? 'page' : undefined}
                  className={`rounded-md px-2.5 py-1 capitalize ${cycle === c ? 'bg-surface shadow-sm' : 'text-ink-soft'}`}
                >
                  {c}
                </Link>
              ))}
            </nav>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            {estimate.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-4">
                <dt className="text-ink-soft">
                  {line.label}
                  {line.quantity > 1 && line.label.startsWith('Extra') && (
                    <span className="num block text-xs">
                      {count(line.quantity)} × {ugx(line.unitPrice)}
                    </span>
                  )}
                </dt>
                <dd className="num font-semibold">{ugx(line.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-3">
              <dt className="font-semibold">Monthly</dt>
              <dd className="num font-semibold">{ugx(estimate.monthly)}</dd>
            </div>
            {cycle === 'annual' && (
              <div className="flex justify-between text-good">
                <dt>Yearly saving</dt>
                <dd className="num font-semibold">−{ugx(estimate.savings)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 rounded-xl bg-ink p-4 text-canvas">
            <p className="text-xs opacity-70">{cycle === 'annual' ? 'Billed yearly' : 'Billed monthly'}</p>
            <p className="num text-3xl font-bold tracking-tight">{ugx(estimate.total)}</p>
          </div>
          <p className="mt-4 flex gap-2 text-xs text-ink-soft">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            Estimate only — no payments are collected. Cancelled orders are not counted.
          </p>
        </aside>
      </div>
    </>
  )
}
