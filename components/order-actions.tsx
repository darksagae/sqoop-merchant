'use client'

import { Ban, CheckCircle2, PackageCheck } from 'lucide-react'
import { useActionState, useState } from 'react'
import { updateOrderStatus } from '@/lib/actions/orders'
import type { FormState } from '@/lib/actions/state'
import type { OrderAction } from '@/lib/repo/orders'
import { PAYMENT_METHODS, paymentLabel } from '@/lib/validation'
import { FormMessage } from './ui'
import { SubmitButton } from './submit-button'

export function OrderActions({ orderId, actions }: { orderId: string; actions: OrderAction[] }) {
  const [payState, pay] = useActionState<FormState, FormData>(updateOrderStatus.bind(null, orderId, 'pay'), undefined)
  const [fulfilState, fulfil] = useActionState<FormState, FormData>(
    updateOrderStatus.bind(null, orderId, 'fulfil'),
    undefined,
  )
  const [cancelState, cancel] = useActionState<FormState, FormData>(
    updateOrderStatus.bind(null, orderId, 'cancel'),
    undefined,
  )
  const [confirming, setConfirming] = useState(false)
  const error = payState?.error ?? fulfilState?.error ?? cancelState?.error

  if (!actions.length) return null
  return (
    <section className="card space-y-4 p-5" aria-labelledby="next-title">
      <h2 id="next-title" className="font-semibold">
        Next step
      </h2>
      <FormMessage error={error} />
      {actions.includes('pay') && (
        <form action={pay} className="space-y-3">
          <label htmlFor="paymentMethod" className="block text-sm font-semibold">
            Customer paid with
          </label>
          <select id="paymentMethod" name="paymentMethod" className="input" defaultValue="mobile_money">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {paymentLabel[m]}
              </option>
            ))}
          </select>
          <SubmitButton className="btn btn-primary w-full" pending="Saving…">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Mark as paid
          </SubmitButton>
        </form>
      )}
      {actions.includes('fulfil') && (
        <form action={fulfil}>
          <SubmitButton className="btn btn-primary w-full" pending="Saving…">
            <PackageCheck className="size-4" aria-hidden="true" /> Mark as fulfilled
          </SubmitButton>
        </form>
      )}
      {actions.includes('cancel') &&
        (confirming ? (
          <form action={cancel} className="space-y-2 rounded-xl bg-bad-soft p-3">
            <p className="text-sm text-bad">Cancel this order and return its items to stock?</p>
            <div className="flex gap-2">
              <SubmitButton className="btn btn-danger flex-1" pending="Cancelling…">
                Yes, cancel
              </SubmitButton>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                Keep
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-ghost w-full" onClick={() => setConfirming(true)}>
            <Ban className="size-4" aria-hidden="true" /> Cancel order
          </button>
        ))}
    </section>
  )
}
