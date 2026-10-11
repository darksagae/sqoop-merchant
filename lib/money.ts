const formatter = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
})
const plain = new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 })

export const ugx = (amount: number) => formatter.format(amount)
export const count = (value: number) => plain.format(value)

/** Short form for charts: 1.2M, 450K. */
export function compact(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`
  return String(amount)
}
