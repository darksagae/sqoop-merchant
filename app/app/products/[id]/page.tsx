import { Archive, ArchiveRestore } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/product-form'
import { SubmitButton } from '@/components/submit-button'
import { Badge, PageHeader } from '@/components/ui'
import { archiveProduct } from '@/lib/actions/catalog'
import { requireUser } from '@/lib/auth'
import { NotFoundError } from '@/lib/errors'
import { getProduct, isLowStock } from '@/lib/repo/products'

export const metadata: Metadata = { title: 'Edit product' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  let product
  try {
    product = getProduct(user.workspaceId, id)
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }
  return (
    <div className="max-w-3xl">
      <PageHeader
        title={product.name}
        description={
          <span className="flex items-center gap-2">
            {product.sku}
            {product.archived && <Badge>Archived</Badge>}
            {!product.archived && isLowStock(product) && <Badge tone="warn">Low stock</Badge>}
          </span>
        }
        actions={
          <form action={archiveProduct.bind(null, product.id, !product.archived)}>
            <SubmitButton className="btn btn-secondary" pending="Saving…">
              {product.archived ? (
                <>
                  <ArchiveRestore className="size-4" aria-hidden="true" /> Restore
                </>
              ) : (
                <>
                  <Archive className="size-4" aria-hidden="true" /> Archive
                </>
              )}
            </SubmitButton>
          </form>
        }
      />
      <ProductForm product={product} />
      <p className="mt-4 text-sm text-ink-soft">
        Archived products are hidden from new orders but stay on past orders and reports.
      </p>
    </div>
  )
}
