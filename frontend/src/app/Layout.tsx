import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Box,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  ShoppingBag,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth, useCart, useToast } from './state'
import { api } from '../lib/api'
import { ErrorState, Loading } from '../components/ui'

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('ordersphere:theme')
      return saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  useEffect(() => {
    const system = matchMedia('(prefers-color-scheme: dark)')
    const change = () => {
      try {
        if (!localStorage.getItem('ordersphere:theme')) setDark(system.matches)
      } catch {
        setDark(system.matches)
      }
    }
    system.addEventListener('change', change)
    return () => system.removeEventListener('change', change)
  }, [])
  return (
    <button
      className="icon-button"
      aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      onClick={() => {
        setDark(!dark)
        try {
          localStorage.setItem('ordersphere:theme', dark ? 'light' : 'dark')
        } catch {
          /* Optional preference only. */
        }
      }}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}

export default function Layout() {
  const { user } = useAuth()
  const cart = useCart()
  const { notify } = useToast()
  const client = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [menu, setMenu] = useState(false)
  const admin = location.pathname.startsWith('/admin')
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      navigate('/', { replace: true, flushSync: true })
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'identity' })
      client.setQueryData(['identity'], null)
      notify('Você saiu da conta.')
    },
    retry: false,
  })
  const count = cart.lines.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="OrderSphere início">
            <span className="brand-mark">
              <i />
            </span>
            Order<span>Sphere</span>
            <span className="brand-period">·</span>
          </Link>
          <nav className="desktop-nav" aria-label="Principal">
            <NavLink to="/" end>
              Catálogo
            </NavLink>
            {user && <NavLink to="/pedidos">Meus pedidos</NavLink>}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin">
                Administração <ArrowUpRight size={13} />
              </NavLink>
            )}
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <Link to="/carrinho" className="cart-link" aria-label={`Carrinho, ${count} itens`}>
              <ShoppingBag size={20} />
              <span className="cart-count">{count > 99 ? '99+' : count}</span>
            </Link>
            {user ? (
              <>
                <Link className="icon-button desktop-only" to="/conta" aria-label="Minha conta">
                  <UserRound size={19} />
                </Link>
                <button
                  className="icon-button"
                  aria-label="Sair da conta"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  <LogOut size={19} />
                </button>
              </>
            ) : (
              <Link to="/entrar" className="button small desktop-only">
                Entrar <ArrowUpRight size={14} />
              </Link>
            )}
            <button
              className="icon-button mobile-only"
              aria-expanded={menu}
              aria-controls="mobile-nav"
              aria-label="Menu de navegação"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="Navegação móvel"
            onClick={() => setMenu(false)}
          >
            <Link to="/">Catálogo</Link>
            <Link to="/pedidos">Meus pedidos</Link>
            {user?.role === 'ADMIN' && <Link to="/admin">Administração</Link>}
            <Link to={user ? '/conta' : '/entrar'}>
              {user ? 'Minha conta' : 'Entrar / cadastrar'}
            </Link>
          </nav>
        )}
      </header>
      {logout.error && <ErrorState error={logout.error} retry={() => logout.mutate()} />}
      <div className={admin ? 'admin-shell' : ''}>
        {admin && (
          <aside className="admin-sidebar">
            <span className="eyebrow">WORKSPACE</span>
            <h2>
              Visão de controle
              <span className="status-dot" />
            </h2>
            <nav aria-label="Administração">
              <NavLink to="/admin" end>
                <LayoutDashboard size={19} />
                Visão geral
              </NavLink>
              <NavLink to="/admin/produtos">
                <Package size={19} />
                Produtos
              </NavLink>
              <NavLink to="/admin/estoque">
                <Box size={19} />
                Estoque
              </NavLink>
            </nav>
            <div className="sidebar-note">
              <span className="brand-mark mini">
                <i />
              </span>
              <p>
                Pequenos detalhes.
                <br />
                <strong>Grandes operações.</strong>
              </p>
              <Link to="/">
                Visitar catálogo <ArrowUpRight size={14} />
              </Link>
            </div>
          </aside>
        )}
        <main id="conteudo" className={admin ? 'admin-main' : 'main-container'} tabIndex={-1}>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <footer className="site-footer">
        <div>
          <Link to="/" className="footer-brand">
            OrderSphere<span>·</span>
          </Link>
          <p>Seu universo de escolhas, em ordem.</p>
        </div>
        <div>
          <span>BRL · Português (Brasil)</span>
          <span>Checkout simulado · Sem cobrança</span>
        </div>
      </footer>
    </>
  )
}
