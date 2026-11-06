import { describe, expect, it } from 'vitest'
import { adjustmentSchema, productInputSchema, registerSchema } from './api'
describe('request validation', () => {
  const valid = { name: 'Objeto', description: '', sku: 'OS-1', price: 12.5, active: true }
  it('accepts the real product contract', () => {
    expect(productInputSchema.parse(valid)).toEqual(valid)
  })
  it('rejects invalid SKU, negative prices and fractions of cents', () => {
    for (const change of [{ sku: 'bad sku' }, { price: -1 }, { price: 1.234 }])
      expect(productInputSchema.safeParse({ ...valid, ...change }).success).toBe(false)
  })
  it('enforces password length and BCrypt UTF-8 byte limit', () => {
    expect(registerSchema.safeParse({ email: 'a@example.test', password: 'short' }).success).toBe(
      false,
    )
    expect(
      registerSchema.safeParse({ email: 'a@example.test', password: 'é'.repeat(40) }).success,
    ).toBe(false)
  })
  it('validates signed nonzero integer stock deltas', () => {
    expect(adjustmentSchema.parse({ delta: -3 }).delta).toBe(-3)
    for (const delta of [0, 0.5, 1000000001])
      expect(adjustmentSchema.safeParse({ delta }).success).toBe(false)
  })
})
