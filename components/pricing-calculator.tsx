'use client'

import { useState } from 'react'
import { ugx } from '@/lib/money'
import { PLAN, quote, type Cycle, type Usage } from '@/lib/pricing'

const SLIDERS: { key: keyof Usage; label: string; min: number; max: number; step: number }[] = [
  { key: 'stores', label: 'Stores', min: 1, max: 10, step: 1 },
  { key: 'users', label: 'Team members', min: 1, max: 20, step: 1 },
  { key: 'orders', label: 'Orders a month', min: 0, max: 2000, step: 50 },
]

export function PricingCalculator() {
  const [usage, setUsage] = useState<Usage>({ stores: 2, users: 4, orders: 300 })
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const result = quote(usage, cycle)

  return (
    <div className="grid overflow-hidden rounded-3xl border border-line bg-surface shadow-(--shadow-card) lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-7 p-6 sm:p-8">
        {SLIDERS.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`calc-${key}`} className="text-sm font-semibold">
                {label}
              </label>
              <output htmlFor={`calc-${key}`} className="num text-lg font-bold">
                {usage[key].toLocaleString('en-UG')}
              </output>
            </div>
            <input
              id={`calc-${key}`}
              type="range"
              min={min}
              max={max}
              step={step}
              value={usage[key]}
              onChange={(e) => setUsage((u) => ({ ...u, [key]: Number(e.target.value) }))}
              className="mt-3 w-full accent-brand-strong"
            />
            <p className="mt-1 text-xs text-ink-soft">
              {PLAN.included[key]} included
              {key === 'stores' && `, then ${ugx(PLAN.extra.store)} each`}
              {key === 'users' && `, then ${ugx(PLAN.extra.user)} each`}
              {key === 'orders' && `, then ${ugx(PLAN.extra.order)} per order`}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-nav p-6 text-white sm:p-8">
        <div
          className="flex w-fit rounded-lg bg-white/10 p-1 text-xs font-semibold"
          role="group"
          aria-label="Billing cycle"
        >
          {(['monthly', 'annual'] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cycle === c}
              onClick={() => setCycle(c)}
              className={`rounded-md px-3 py-1.5 capitalize ${cycle === c ? 'bg-white text-nav' : 'text-white/70'}`}
            >
              {c}
              {c === 'annual' && ' · 2 months free'}
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm text-white/60">{cycle === 'annual' ? 'Per year' : 'Per month'}</p>
        <p className="num text-4xl font-bold tracking-tight sm:text-5xl" aria-live="polite">
          {ugx(result.total)}
        </p>
        {cycle === 'annual' && <p className="mt-1 text-sm text-emerald-300">You save {ugx(result.savings)}</p>}
        <dl className="mt-6 flex-1 space-y-2 border-t border-white/10 pt-5 text-sm">
          {result.lines
            .filter((line) => line.amount > 0)
            .map((line) => (
              <div key={line.label} className="flex justify-between gap-4">
                <dt className="text-white/70">
                  {line.label.startsWith('Base')
                    ? 'Base plan'
                    : `${line.label} × ${line.quantity.toLocaleString('en-UG')}`}
                </dt>
                <dd className="num font-semibold">{ugx(line.amount)}</dd>
              </div>
            ))}
        </dl>
        <a href="/signup" className="btn btn-primary mt-6 min-h-11">
          Start with this plan
        </a>
      </div>
    </div>
  )
}
