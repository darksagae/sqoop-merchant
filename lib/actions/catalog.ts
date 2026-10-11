'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '../auth'
import { seedDemoData } from '../repo/demo'
import { listOrders } from '../repo/orders'
import { createProduct, listProducts, setArchived, updateProduct } from '../repo/products'
import { productSchema } from '../validation'
import { failure, invalid, type FormState } from './state'

export async function saveProduct(productId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = productSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return invalid(form, parsed.error)
  try {
    if (productId) updateProduct(user.workspaceId, productId, parsed.data)
    else createProduct(user.workspaceId, parsed.data)
  } catch (error) {
    return failure(form, error)
  }
  revalidatePath('/app/products')
  redirect('/app/products')
}

export async function archiveProduct(productId: string, archived: boolean) {
  const user = await requireUser()
  setArchived(user.workspaceId, productId, archived)
  revalidatePath('/app/products')
  redirect(archived ? '/app/products' : `/app/products/${productId}`)
}

export async function loadSampleData() {
  const user = await requireUser()
  if (
    listProducts(user.workspaceId, { filter: 'active' }).length ||
    listOrders(user.workspaceId, { limit: 1 }).length
  ) {
    redirect('/app')
  }
  seedDemoData(user.workspaceId, user.id)
  revalidatePath('/app', 'layout')
  redirect('/app')
}
