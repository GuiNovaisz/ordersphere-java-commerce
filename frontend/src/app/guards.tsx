import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './state'
import { Empty, ErrorState, Loading } from '../components/ui'
import type { Role } from '../types/api'

export function Guard({ role }: { role?: Role }) {
  const { user, loading, error, reload } = useAuth()
  const location = useLocation()
  if (loading) return <Loading label="Restaurando sessão" />
  if (error) return <ErrorState error={error} retry={reload} />
  if (!user)
    return (
      <Navigate
        to={`/entrar?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  if (role && user.role !== role)
    return (
      <Empty title="Área restrita à administração">
        <p>Sua conta não possui acesso a esta área.</p>
        <a className="button" href="/">
          Voltar ao catálogo
        </a>
      </Empty>
    )
  return <Outlet />
}
export function safeNext(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    ? value
    : '/pedidos'
}
