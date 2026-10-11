import { z } from 'zod'

const text = (label: string, max: number, min = 1) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`)

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`).default('')

const email = z.email({ error: 'Enter a valid email address.' }).trim().toLowerCase().max(254)
const password = z
  .string({ error: 'Password is required.' })
  .min(10, 'Use at least 10 characters for your password.')
  .max(200, 'Password is too long.')

const wholeNumber = (label: string, max: number) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(0, `${label} cannot be negative.`)
    .max(max, `${label} is too large.`)

export const signupSchema = z.object({
  businessName: text('Business name', 80, 2),
  name: text('Your name', 80),
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(200),
})

export const productSchema = z.object({
  name: text('Product name', 120),
  sku: text('SKU', 40)
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-_.]*$/, 'SKU can use letters, numbers, dashes, dots and underscores.'),
  price: wholeNumber('Price', 1_000_000_000),
  stock: wholeNumber('Stock', 10_000_000),
  reorderLevel: wholeNumber('Reorder level', 10_000_000),
})

export const PAYMENT_METHODS = ['cash', 'mobile_money', 'card'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export const paymentLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile money',
  card: 'Card',
}

export const orderSchema = z.object({
  storeId: z.string().min(1, 'Choose a store.'),
  customerName: optionalText('Customer name', 80),
  customerPhone: optionalText('Customer phone', 30).refine(
    (value) => value === '' || /^\+?[0-9 ()-]{7,20}$/.test(value),
    'Enter a valid phone number.',
  ),
  note: optionalText('Note', 500),
  payment: z.enum(['pending', ...PAYMENT_METHODS], { error: 'Choose a payment status.' }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce
          .number()
          .int('Quantities must be whole numbers.')
          .min(1, 'Quantities must be at least 1.')
          .max(100_000),
      }),
      { error: 'Add at least one product.' },
    )
    .min(1, 'Add at least one product.')
    .max(100, 'An order can have at most 100 lines.'),
})

export const storeSchema = z.object({
  name: text('Store name', 80),
  location: optionalText('Location', 120),
})

export const memberSchema = z.object({
  name: text('Name', 80),
  email,
  password,
})

export const workspaceSchema = z.object({ name: text('Business name', 80, 2) })

export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    errors[key] ??= issue.message
  }
  return errors
}
