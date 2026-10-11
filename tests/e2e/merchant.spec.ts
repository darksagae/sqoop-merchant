import { expect, test, type Page } from '@playwright/test'

async function signUp(page: Page, business: string) {
  const email = `${business.toLowerCase().replace(/\W/g, '')}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  await page.goto('/signup')
  await page.getByLabel('Business name').fill(business)
  await page.getByLabel('Your name').fill('Test Owner')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('a long test password')
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await page.waitForURL('**/app')
  return email
}

test('an owner sets up a shop, sells, and sees it in reports and billing', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('button', { name: 'Create workspace' }).click()
  await expect(page.getByText('Business name is required.')).toBeVisible()

  const email = await signUp(page, 'Nakato Store')
  await expect(page.getByRole('heading', { name: 'Welcome, Test' })).toBeVisible()

  await page.goto('/app/products/new')
  await page.getByLabel('Product name').fill('Sugar 1 kg')
  await page.getByLabel('SKU').fill('sug-1kg')
  await page.getByLabel('Price (UGX)').fill('4500')
  await page.getByLabel('In stock').fill('10')
  await page.getByRole('button', { name: 'Add product' }).click()
  await expect(page.getByRole('link', { name: 'Sugar 1 kg' })).toBeVisible()

  await page.goto('/app/orders/new')
  await page.getByRole('button', { name: /Add Sugar 1 kg/ }).click()
  await page.getByRole('button', { name: 'Increase Sugar 1 kg' }).click()
  await page.getByRole('button', { name: 'Increase Sugar 1 kg' }).click()
  await expect(page.getByText('UGX 13,500').first()).toBeVisible()
  await page.getByRole('button', { name: 'Create order' }).click()
  await expect(page.getByRole('heading', { name: /Order #1001/ })).toBeVisible()
  const orderUrl = page.url()

  await page.getByLabel('Customer paid with').selectOption('cash')
  await page.getByRole('button', { name: 'Mark as paid' }).click()
  await page.getByRole('button', { name: 'Mark as fulfilled' }).click()
  await expect(page.getByText('fulfilled', { exact: true })).toBeVisible()

  await page.goto('/app/products')
  await expect(page.getByRole('row', { name: /Sugar 1 kg/ })).toContainText('7')

  await page.goto('/app')
  await expect(page.getByText('UGX 13,500').first()).toBeVisible()

  await page.goto('/app/billing')
  await expect(page.getByText('UGX 25,000').first()).toBeVisible()

  // Another workspace cannot open this order.
  await page.getByRole('button', { name: 'Sign out' }).last().click()
  await signUp(page, 'Other Shop')
  const response = await page.goto(orderUrl)
  expect(response?.status()).toBe(404)

  // Wrong password is rejected; the right one works.
  await page.getByRole('link', { name: 'Back to dashboard' }).click()
  await page.getByRole('button', { name: 'Sign out' }).last().click()
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('wrong password!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('don’t match')
  await page.getByLabel('Password').fill('a long test password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/app')
  await expect(page.getByText('Nakato Store').filter({ visible: true })).toBeVisible()
})

test('the live demo opens a seeded workspace', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore the live demo' }).click()
  await page.waitForURL('**/app')
  await expect(page.getByText('demo shop with sample data')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent orders' })).toBeVisible()
})

test('signed-out visitors are sent to sign in', async ({ page }) => {
  await page.goto('/app/orders')
  await expect(page).toHaveURL(/\/login$/)
})
