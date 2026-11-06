import { z } from 'zod'
import type { Product } from '../../types/api'

export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().max(160),
  sku: z.string().max(64),
  unitPrice: z.number().min(0).max(999999999.99),
  quantity: z.number().int().min(1).max(1000000),
})
export type CartLine = z.infer<typeof cartLineSchema>
export const cartSchema = z
  .array(cartLineSchema)
  .max(50)
  .refine((lines) => new Set(lines.map((line) => line.productId)).size === lines.length)
export const CART_KEY = 'ordersphere:cart:v1'
export function readCart(): CartLine[] {
  try {
    const result = cartSchema.safeParse(JSON.parse(localStorage.getItem(CART_KEY) ?? '[]'))
    return result.success ? result.data : []
  } catch {
    return []
  }
}
export function addLine(lines: CartLine[], product: Product, quantity = 1): CartLine[] {
  const found = lines.find((line) => line.productId === product.id)
  if (!found && lines.length >= 50) throw new Error('O carrinho aceita até 50 produtos distintos.')
  const nextQuantity = (found?.quantity ?? 0) + quantity
  if (!Number.isInteger(nextQuantity) || nextQuantity < 1 || nextQuantity > 1000000)
    throw new Error('Quantidade fora do limite: 1 a 1.000.000.')
  return found
    ? lines.map((line) =>
        line.productId === product.id ? { ...line, quantity: nextQuantity } : line,
      )
    : [
        ...lines,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity,
        },
      ]
}
// Product cents fit safely in Number; integer multiplication uses BigInt to avoid rounding accumulation.
export const totalCents = (lines: CartLine[]) =>
  lines.reduce(
    (sum, line) => sum + BigInt(Math.round(line.unitPrice * 100)) * BigInt(line.quantity),
    0n,
  )
export const estimatedTotal = (lines: CartLine[]) => Number(totalCents(lines)) / 100
export const orderPayload = (lines: CartLine[]) =>
  lines.map(({ productId, quantity }) => ({ productId, quantity }))
