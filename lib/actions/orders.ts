'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '../auth'
import { UserError } from '../errors'
import { createOrder, transitionOrder, type OrderAction } from '../repo/orders'
import { PAYMENT_METHODS, orderSchema, type PaymentMethod } from '../validation'
import { failure, invalid, type FormState } from './state'

export async function placeOrder(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser()
  let items: unknown
  try {
    items = JSON.parse(String(form.get('items') ?? '[]'))
  } catch {
    items = []
  }
  const parsed = orderSchema.safeParse({ ...Object.fromEntries(form), items })
  if (!parsed.success) return invalid(form, parsed.error)
  let id: string
  try {
    id = createOrder(user.workspaceId, user.id, parsed.data).id
  } catch (error) {
    return failure(form, error)
  }
  revalidatePath('/app')
  redirect(`/app/orders/${id}`)
}

export async function updateOrderStatus(
  orderId: string,
  action: OrderAction,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser()
  const method = form.get('paymentMethod')
  if (action === 'pay' && !PAYMENT_METHODS.includes(method as PaymentMethod)) {
    return { error: 'Choose how the customer paid.' }
  }
  try {
    transitionOrder(user.workspaceId, orderId, action, (method as PaymentMethod) ?? undefined)
  } catch (error) {
    if (error instanceof UserError) return { error: error.message }
    throw error
  }
  revalidatePath(`/app/orders/${orderId}`)
  return undefined
}
