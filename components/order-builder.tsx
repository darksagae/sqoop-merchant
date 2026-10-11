'use client'

import { Minus, Plus, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import { placeOrder } from '@/lib/actions/orders'
import type { FormState } from '@/lib/actions/state'
import { ugx } from '@/lib/money'
import { PAYMENT_METHODS, paymentLabel } from '@/lib/validation'
import { Field, FormMessage } from './ui'
import { SubmitButton } from './submit-button'

type Option = { id: string; name: string; sku: string; price: number; stock: number }
type Line = { productId: string; quantity: number }

export function OrderBuilder({ products, stores }: { products: Option[]; stores: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(placeOrder, undefined)
  const [lines, setLines] = useState<Line[]>([])
  const [query, setQuery] = useState('')
  const [payment, setPayment] = useState<string>('pending')
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => !lines.some((l) => l.productId === p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8)
  }, [products, lines, query])

  const total = lines.reduce((sum, l) => sum + (byId.get(l.productId)?.price ?? 0) * l.quantity, 0)
  const units = lines.reduce((sum, l) => sum + l.quantity, 0)

  const setQuantity = (productId: string, quantity: number) => {
    const max = byId.get(productId)?.stock ?? 1
    setLines((current) =>
      current.map((l) =>
        l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(max, quantity || 1)) } : l,
      ),
    )
  }

  return (
    <form action={action} className="grid items-start gap-6 lg:grid-cols-[1fr_21rem]">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />
      <input type="hidden" name="payment" value={payment} />

      <div className="space-y-6">
        <section className="card p-5 sm:p-6" aria-labelledby="items-title">
          <h2 id="items-title" className="font-semibold">
            Items
          </h2>
          <div className="relative mt-4">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products to add"
              aria-label="Search products to add"
              className="input pl-9"
            />
          </div>
          {matches.length > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => (setLines((c) => [...c, { productId: p.id, quantity: 1 }]), setQuery(''))}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left text-sm transition-colors hover:border-brand hover:bg-brand-soft/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="num text-xs text-ink-soft">
                        {ugx(p.price)} · {p.stock} in stock
                      </span>
                    </span>
                    <Plus className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
                    <span className="sr-only">Add {p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              {products.length === 0 ? (
                <>
                  No products in stock.{' '}
                  <Link href="/app/products/new" className="font-semibold text-brand-strong hover:underline">
                    Add a product
                  </Link>
                </>
              ) : (
                'No more matching products in stock.'
              )}
            </p>
          )}

          {lines.length > 0 && (
            <ul className="mt-6 divide-y divide-line border-t border-line">
              {lines.map((line) => {
                const p = byId.get(line.productId)!
                return (
                  <li key={line.productId} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="num text-xs text-ink-soft">
                        {ugx(p.price)} each · {p.stock} available
                      </p>
                    </div>
                    <div className="flex items-center rounded-xl border border-line-strong">
                      <button
                        type="button"
                        onClick={() => setQuantity(p.id, line.quantity - 1)}
                        className="grid size-9 place-items-center text-ink-soft hover:text-ink"
                        aria-label={`Decrease ${p.name}`}
                      >
                        <Minus className="size-4" />
                      </button>
                      <input
                        value={line.quantity}
                        onChange={(e) => setQuantity(p.id, Number(e.target.value.replace(/\D/g, '')))}
                        inputMode="numeric"
                        aria-label={`Quantity of ${p.name}`}
                        className="num w-12 bg-transparent text-center text-sm font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(p.id, line.quantity + 1)}
                        disabled={line.quantity >= p.stock}
                        className="grid size-9 place-items-center text-ink-soft hover:text-ink disabled:opacity-30"
                        aria-label={`Increase ${p.name}`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <span className="num ml-auto w-28 text-right text-sm font-semibold">
                      {ugx(p.price * line.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLines((c) => c.filter((l) => l.productId !== p.id))}
                      className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-bad-soft hover:text-bad"
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-6" aria-labelledby="customer-title">
          <h2 id="customer-title" className="font-semibold sm:col-span-2">
            Customer <span className="font-normal text-ink-soft">(optional)</span>
          </h2>
          <Field
            label="Name"
            name="customerName"
            defaultValue={state?.values?.customerName}
            error={state?.fields?.customerName}
            maxLength={80}
            autoComplete="off"
          />
          <Field
            label="Phone"
            name="customerPhone"
            type="tel"
            defaultValue={state?.values?.customerPhone}
            error={state?.fields?.customerPhone}
            placeholder="+256 7XX XXX XXX"
            maxLength={30}
            autoComplete="off"
          />
          <div className="sm:col-span-2">
            <label htmlFor="note" className="mb-1.5 block text-sm font-semibold">
              Note
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              maxLength={500}
              defaultValue={state?.values?.note}
              className="input"
              placeholder="Delivery details, special requests…"
            />
          </div>
        </section>
      </div>

      <aside className="card space-y-5 p-5 sm:p-6 lg:sticky lg:top-6">
        <div>
          <label htmlFor="storeId" className="mb-1.5 block text-sm font-semibold">
            Store
          </label>
          <select id="storeId" name="storeId" defaultValue={state?.values?.storeId ?? stores[0]?.id} className="input">
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Payment</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['pending', ...PAYMENT_METHODS] as const).map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-brand ${
                  payment === option
                    ? 'border-brand bg-brand-soft text-brand-strong'
                    : 'border-line-strong hover:bg-sunken'
                }`}
              >
                <input
                  type="radio"
                  name="paymentChoice"
                  value={option}
                  checked={payment === option}
                  onChange={() => setPayment(option)}
                  className="sr-only"
                />
                {option === 'pending' ? 'Not paid yet' : paymentLabel[option]}
              </label>
            ))}
          </div>
        </fieldset>
        <dl className="space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between text-ink-soft">
            <dt>Items</dt>
            <dd className="num">{units}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="font-semibold">Total</dt>
            <dd className="num text-2xl font-bold tracking-tight">{ugx(total)}</dd>
          </div>
        </dl>
        <FormMessage error={state?.error && (state.fields?.items ?? state.error)} />
        <SubmitButton className="btn btn-primary min-h-12 w-full" disabled={!lines.length} pending="Saving order…">
          {payment === 'pending' ? 'Create order' : `Create paid order · ${ugx(total)}`}
        </SubmitButton>
        <p className="text-xs text-ink-soft">
          Stock is taken out as soon as the order is created and returned if it is cancelled. No money is charged.
        </p>
      </aside>
    </form>
  )
}
