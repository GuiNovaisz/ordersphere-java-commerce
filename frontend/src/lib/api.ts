import { z } from 'zod'
import {
  csrfSchema,
  inventorySchema,
  orderSchema,
  pageSchema,
  problemSchema,
  productSchema,
  userSchema,
} from '../types/api'
import type { Credentials, ProductInput, ProblemDetails } from '../types/api'

export class ApiError extends Error {
  status: number
  problem: ProblemDetails
  constructor(status: number, problem: ProblemDetails) {
    super(problem.detail || problem.title || 'Não foi possível concluir a operação.')
    this.status = status
    this.problem = problem
  }
}

let csrf: z.infer<typeof csrfSchema> | null = null
let csrfRequest: Promise<z.infer<typeof csrfSchema>> | null = null
export function resetCsrf() {
  csrf = null
  csrfRequest = null
}
export async function refreshCsrf() {
  if (!csrfRequest) {
    csrfRequest = fetch('/api/v1/auth/csrf', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível iniciar a sessão segura.')
        return csrfSchema.parse(await response.json())
      })
      .then((value) => {
        csrf = value
        return value
      })
      .finally(() => {
        csrfRequest = null
      })
  }
  return csrfRequest
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? 'GET'
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = csrf ?? (await refreshCsrf())
    headers.set(token.headerName, token.token)
  }
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
  if (!response.ok) {
    let problem: ProblemDetails = { status: response.status }
    try {
      const parsed = problemSchema.safeParse(await response.json())
      if (parsed.success) problem = parsed.data
    } catch {
      /* Non-JSON proxy failures still receive a safe UI message. */
    }
    if (response.status === 401 && !options.signal?.aborted) {
      resetCsrf()
      window.dispatchEvent(new Event('ordersphere:unauthorized'))
    }
    if (response.status === 403) resetCsrf()
    // Mutations are never replayed automatically, including CSRF failures and uncertain order outcomes.
    throw new ApiError(response.status, problem)
  }
  return schema.parse(response.status === 204 ? undefined : await response.json())
}

const query = (params: Record<string, string | number | boolean | undefined>) => {
  const result = new URLSearchParams()
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== '') result.set(key, String(value))
  return result.toString()
}
export const api = {
  me: (signal?: AbortSignal) => request('/auth/me', userSchema, { signal }),
  register: (credentials: Credentials) =>
    request('/auth/register', userSchema, { method: 'POST', body: JSON.stringify(credentials) }),
  login: async (credentials: Credentials) => {
    const user = await request('/auth/login', userSchema, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    resetCsrf()
    await refreshCsrf()
    return user
  },
  logout: async () => {
    await request('/auth/logout', z.undefined(), { method: 'POST' })
    resetCsrf()
  },
  products: (
    params: Record<string, string | number | boolean | undefined>,
    admin = false,
    signal?: AbortSignal,
  ) =>
    request(`/${admin ? 'admin/' : ''}products?${query(params)}`, pageSchema(productSchema), {
      signal,
    }),
  product: (id: string, admin = false, signal?: AbortSignal) =>
    request(`/${admin ? 'admin/' : ''}products/${encodeURIComponent(id)}`, productSchema, {
      signal,
    }),
  saveProduct: (data: ProductInput, id?: string) =>
    request(`/admin/products${id ? `/${encodeURIComponent(id)}` : ''}`, productSchema, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
  productStatus: (id: string, active: boolean) =>
    request(`/admin/products/${encodeURIComponent(id)}/status`, productSchema, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
  inventory: (page = 0, signal?: AbortSignal) =>
    request(`/admin/inventory?page=${page}&size=20`, pageSchema(inventorySchema), { signal }),
  stock: (id: string, signal?: AbortSignal) =>
    request(`/admin/inventory/${encodeURIComponent(id)}`, inventorySchema, { signal }),
  adjust: (id: string, delta: number) =>
    request(`/admin/inventory/${encodeURIComponent(id)}`, inventorySchema, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    }),
  orders: (page = 0, signal?: AbortSignal) =>
    request(`/orders?page=${page}&size=10`, pageSchema(orderSchema), { signal }),
  order: (id: string, signal?: AbortSignal) =>
    request(`/orders/${encodeURIComponent(id)}`, orderSchema, { signal }),
  createOrder: (items: { productId: string; quantity: number }[]) =>
    request('/orders', orderSchema, { method: 'POST', body: JSON.stringify({ items }) }),
  cancelOrder: (id: string) =>
    request(`/orders/${encodeURIComponent(id)}/cancel`, orderSchema, { method: 'POST' }),
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return 'Sua sessão não está disponível. Entre na conta para continuar.'
    if (error.status === 403)
      return 'Acesso não permitido ou sessão segura desatualizada. Atualize a página e tente novamente.'
    if (error.status === 404) return 'Este recurso não está disponível ou não pertence à sua conta.'
    if (error.status === 409)
      return 'Conflito ao concluir a operação. Confira o estoque, os dados ou o estado atual antes de tentar novamente.'
    if (error.status === 400 || error.status === 422)
      return 'Confira os dados informados e os limites de cada campo.'
    if (error.status >= 500)
      return 'O serviço está indisponível no momento. Tente novamente mais tarde.'
  }
  return 'Não foi possível comunicar com o serviço. Confira sua conexão. Se confirmou uma compra, consulte seus pedidos antes de reenviar.'
}
