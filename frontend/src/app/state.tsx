import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import { addLine, CART_KEY, readCart } from '../features/cart/model'
import type { CartLine } from '../features/cart/model'
import type { Product, User } from '../types/api'

type AuthState = { user: User | null; loading: boolean; error: unknown; reload: () => void }
export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  reload: () => {},
})
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const identity = useQuery({
    queryKey: ['identity'],
    queryFn: async ({ signal }) => {
      try {
        return await api.me(signal)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    staleTime: 60000,
    retry: false,
  })
  useEffect(() => {
    const unauthorized = () => {
      client.removeQueries({
        predicate: (query) =>
          !['identity', 'products', 'product'].includes(String(query.queryKey[0])),
      })
      client.setQueryData(['identity'], null)
    }
    window.addEventListener('ordersphere:unauthorized', unauthorized)
    return () => window.removeEventListener('ordersphere:unauthorized', unauthorized)
  }, [client])
  return (
    <AuthContext
      value={{
        user: identity.data ?? null,
        loading: identity.isPending,
        error: identity.error,
        reload: () => {
          void identity.refetch()
        },
      }}
    >
      {children}
    </AuthContext>
  )
}
export const useAuth = () => useContext(AuthContext)

type CartState = {
  lines: CartLine[]
  add: (product: Product, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
}
const CartContext = createContext<CartState | null>(null)
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState(readCart)
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines))
    } catch {
      /* Cart remains usable when browser storage is unavailable. */
    }
  }, [lines])
  return (
    <CartContext
      value={{
        lines,
        add: (product, quantity = 1) => setLines(addLine(lines, product, quantity)),
        setQuantity: (id, quantity) => {
          if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 1000000)
            setLines((previous) =>
              previous.map((line) => (line.productId === id ? { ...line, quantity } : line)),
            )
        },
        remove: (id) => setLines((previous) => previous.filter((line) => line.productId !== id)),
        clear: () => setLines([]),
      }}
    >
      {children}
    </CartContext>
  )
}
export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('CartProvider missing')
  return value
}

type ToastState = { notify: (message: string) => void }
const ToastContext = createContext<ToastState>({ notify: () => {} })
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!message) return
    const timeout = setTimeout(() => setMessage(''), 6000)
    return () => clearTimeout(timeout)
  }, [message])
  return (
    <ToastContext value={{ notify: setMessage }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {message && (
          <div className="toast">
            {message}
            <button aria-label="Dispensar aviso" onClick={() => setMessage('')}>
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext>
  )
}
export const useToast = () => useContext(ToastContext)
