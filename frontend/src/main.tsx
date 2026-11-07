import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider, CartProvider, ToastProvider } from './app/state'
import './styles/app.css'

const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
})
const root = document.getElementById('root')
if (!root) throw new Error('Application root missing')
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
