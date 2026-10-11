import type { Metadata } from 'next'
import { ProductForm } from '@/components/product-form'
import { PageHeader } from '@/components/ui'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'New product' }

export default async function NewProductPage() {
  await requireUser()
  return (
    <div className="max-w-3xl">
      <PageHeader title="New product" description="Add an item you sell. You can change any of this later." />
      <ProductForm />
    </div>
  )
}
