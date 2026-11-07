import { beforeEach, describe, expect, it } from 'vitest'
import {
  addLine,
  CART_KEY,
  cartSchema,
  estimatedTotal,
  orderPayload,
  readCart,
  totalCents,
} from './model'
import type { Product } from '../../types/api'
const product: Product = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Objeto',
  sku: 'OS-1',
  description: '',
  price: 0.1,
  active: true,
  createdAt: '',
  updatedAt: '',
}
beforeEach(() => localStorage.clear())
describe('cart behavior', () => {
  it('merges repeated products instead of creating duplicate order lines', () => {
    expect(addLine(addLine([], product), product, 2)).toMatchObject([{ quantity: 3 }])
  })
  it('calculates estimates in integer cents', () => {
    const lines = addLine([], product, 3)
    expect(totalCents(lines)).toBe(30n)
    expect(estimatedTotal(lines)).toBe(0.3)
  })
  it('sends identifiers and quantities only, never client prices', () => {
    expect(orderPayload(addLine([], product, 2))).toEqual([{ productId: product.id, quantity: 2 }])
  })
  it('rejects noninteger and excessive quantities', () => {
    expect(() => addLine([], product, 1.5)).toThrow()
    expect(() => addLine([], product, 1000001)).toThrow()
  })
  it('rejects more than fifty distinct products', () => {
    const lines = Array.from({ length: 50 }, (_, i) => ({
      productId: String(i),
      name: 'a',
      sku: 'a',
      unitPrice: 1,
      quantity: 1,
    }))
    expect(() => addLine(lines, product)).toThrow()
  })
  it('restores valid persisted state and discards malformed or duplicate state', () => {
    const lines = addLine([], product)
    localStorage.setItem(CART_KEY, JSON.stringify(lines))
    expect(readCart()).toEqual(lines)
    localStorage.setItem(CART_KEY, '{')
    expect(readCart()).toEqual([])
    expect(cartSchema.safeParse([...lines, ...lines]).success).toBe(false)
  })
})
