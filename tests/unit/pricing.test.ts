import { describe, expect, it } from 'vitest'
import { quote, validateUsage } from '@/lib/pricing'

describe('pricing', () => {
  it('charges only the base plan within the allowance', () => {
    expect(quote({ stores: 1, users: 3, orders: 100 }).monthly).toBe(25_000)
  })

  it('adds usage beyond the allowance line by line', () => {
    const result = quote({ stores: 2, users: 4, orders: 150 })
    expect(result.monthly).toBe(25_000 + 10_000 + 3_000 + 50 * 100)
    expect(result.lines.map((l) => l.quantity)).toEqual([1, 1, 1, 50])
  })

  it('gives two months free on annual billing', () => {
    const result = quote({ stores: 1, users: 1, orders: 0 }, 'annual')
    expect(result.total).toBe(250_000)
    expect(result.savings).toBe(50_000)
  })

  it('rejects impossible usage', () => {
    expect(validateUsage({ stores: 0, users: 1, orders: 0 })).toMatch(/at least 1/)
    expect(validateUsage({ stores: 1, users: 1.5, orders: 0 })).toMatch(/whole/)
    expect(() => quote({ stores: 1, users: 1, orders: -1 })).toThrow(RangeError)
  })
})
