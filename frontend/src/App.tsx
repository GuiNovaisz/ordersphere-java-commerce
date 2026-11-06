import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom'
import Layout from './app/Layout'
import { Guard } from './app/guards'
import Catalog, { ProductDetail } from './features/catalog/Catalog'
import { Empty, Loading } from './components/ui'

const AuthPage = lazy(() => import('./features/auth/AuthPage'))
const CartPage = lazy(() => import('./features/cart/CartPage'))

const Orders = lazy(async () => ({ default: (await import('./features/orders/Orders')).Orders }))
const OrderDetail = lazy(async () => ({
  default: (await import('./features/orders/Orders')).OrderDetail,
}))
const Account = lazy(async () => ({ default: (await import('./features/orders/Orders')).Account }))
const Dashboard = lazy(async () => ({
  default: (await import('./features/admin/Admin')).Dashboard,
}))
const AdminProducts = lazy(async () => ({
  default: (await import('./features/admin/Admin')).AdminProducts,
}))
const ProductEditor = lazy(async () => ({
  default: (await import('./features/admin/Admin')).ProductEditor,
}))
const AdminInventory = lazy(async () => ({
  default: (await import('./features/admin/Admin')).AdminInventory,
}))
function Root() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = location.pathname.startsWith('/admin')
      ? 'Administração · OrderSphere'
      : 'OrderSphere · Seu universo de escolhas'
  }, [location.pathname])
  return <Layout />
}
const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: (
      <Empty title="Não foi possível abrir esta página">
        <p>
          Atualize a aplicação e tente novamente. Se confirmou uma compra, consulte seus pedidos
          antes de reenviar.
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          Atualizar aplicação
        </button>
      </Empty>
    ),
    children: [
      { index: true, element: <Catalog /> },
      { path: 'produtos/:id', element: <ProductDetail /> },
      { path: 'entrar', element: <AuthPage key="login" /> },
      { path: 'cadastro', element: <AuthPage key="register" registerMode /> },
      { path: 'carrinho', element: <CartPage /> },
      {
        element: <Guard />,
        children: [
          { path: 'checkout', element: <CartPage checkout /> },
          { path: 'pedidos', element: <Orders /> },
          { path: 'pedidos/:id', element: <OrderDetail /> },
          { path: 'conta', element: <Account /> },
        ],
      },
      {
        element: <Guard role="ADMIN" />,
        children: [
          { path: 'admin', element: <Dashboard /> },
          { path: 'admin/produtos', element: <AdminProducts /> },
          { path: 'admin/produtos/novo', element: <ProductEditor /> },
          { path: 'admin/produtos/:id', element: <ProductEditor /> },
          { path: 'admin/estoque', element: <AdminInventory /> },
        ],
      },
      {
        path: '*',
        element: (
          <Empty title="Esta página saiu de órbita">
            <a className="button" href="/">
              Voltar ao catálogo
            </a>
          </Empty>
        ),
      },
    ],
  },
])
export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
