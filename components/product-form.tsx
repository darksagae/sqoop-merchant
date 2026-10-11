'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { saveProduct } from '@/lib/actions/catalog'
import type { FormState } from '@/lib/actions/state'
import type { Product } from '@/lib/repo/products'
import { Field, FormMessage } from './ui'
import { SubmitButton } from './submit-button'

export function ProductForm({ product }: { product?: Product }) {
  const [state, action] = useActionState<FormState, FormData>(saveProduct.bind(null, product?.id ?? null), undefined)
  const value = (key: keyof Product & string, fallback = '') =>
    state?.values?.[key] ?? (product ? String(product[key]) : fallback)
  const f = state?.fields ?? {}
  return (
    <form action={action} className="card space-y-5 p-6" noValidate>
      <FormMessage error={state?.error} />
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <Field label="Product name" name="name" defaultValue={value('name')} error={f.name} required maxLength={120} />
        <Field
          label="SKU"
          name="sku"
          defaultValue={value('sku')}
          error={f.sku}
          required
          maxLength={40}
          hint="Your own short code, e.g. SUG-1KG"
          className="[&_input]:uppercase"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Price (UGX)"
          name="price"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={value('price')}
          error={f.price}
          required
        />
        <Field
          label="In stock"
          name="stock"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={value('stock', '0')}
          error={f.stock}
          required
        />
        <Field
          label="Reorder level"
          name="reorderLevel"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={value('reorderLevel', '5')}
          error={f.reorderLevel}
          hint="Flag as low stock at or below this"
          required
        />
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Link href="/app/products" className="btn btn-ghost">
          Cancel
        </Link>
        <SubmitButton pending="Saving…">{product ? 'Save changes' : 'Add product'}</SubmitButton>
      </div>
    </form>
  )
}
