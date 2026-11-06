import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
})
export type User = z.infer<typeof userSchema>
export type Role = User['role']
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  sku: z.string(),
  price: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Product = z.infer<typeof productSchema>
export const inventorySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
})
export type Inventory = z.infer<typeof inventorySchema>
export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  productName: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  subtotal: z.number(),
})
export type OrderItem = z.infer<typeof orderItemSchema>
export const orderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['CONFIRMED', 'CANCELLED']),
  total: z.number(),
  currency: z.literal('BRL'),
  items: z.array(orderItemSchema),
  createdAt: z.string(),
  cancelledAt: z.string().nullable(),
})
export type Order = z.infer<typeof orderSchema>
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    page: z.object({
      size: z.number(),
      number: z.number(),
      totalElements: z.number(),
      totalPages: z.number(),
    }),
  })
export type Page<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}
export const problemSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  detail: z.string().optional(),
  status: z.number().optional(),
  instance: z.string().optional(),
})
export type ProblemDetails = z.infer<typeof problemSchema>
export const csrfSchema = z.object({
  token: z.string(),
  headerName: z.string(),
  parameterName: z.string(),
})

export const productInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(160, 'Use até 160 caracteres.'),
  description: z.string().max(2000, 'Use até 2.000 caracteres.'),
  sku: z
    .string()
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/,
      'Use letras, números, hífen ou sublinhado (até 64).',
    ),
  price: z
    .number()
    .min(0, 'O preço não pode ser negativo.')
    .max(999999999.99, 'Preço acima do limite.')
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.0001,
      'Use no máximo duas casas decimais.',
    ),
  active: z.boolean(),
})
export type ProductInput = z.infer<typeof productInputSchema>
export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.').max(255),
  password: z.string().min(1, 'Informe a senha.').max(64, 'Use até 64 caracteres.'),
})
export const registerSchema = loginSchema.extend({
  password: z
    .string()
    .min(12, 'Use pelo menos 12 caracteres.')
    .max(64, 'Use até 64 caracteres.')
    .refine((v) => new TextEncoder().encode(v).length <= 72, 'A senha excede 72 bytes UTF-8.'),
})
export type Credentials = z.infer<typeof loginSchema>
export const adjustmentSchema = z.object({
  delta: z
    .number()
    .int('Use um número inteiro.')
    .min(-1000000000)
    .max(1000000000)
    .refine((v) => v !== 0, 'O ajuste não pode ser zero.'),
})
