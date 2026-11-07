import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext } from './state'
import { Guard, safeNext } from './guards'
import type { User } from '../types/api'
function mount(user: User | null, admin = false, loading = false) {
  return render(
    <AuthContext value={{ user, loading, error: null, reload: () => {} }}>
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/entrar" element={<h1>Entrar</h1>} />
          <Route element={<Guard role={admin ? 'ADMIN' : undefined} />}>
            <Route path="/private" element={<h1>Conteúdo protegido</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )
}
describe('route guard UX', () => {
  it('redirects anonymous visitors to login', () => {
    mount(null)
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
  it('does not reveal protected contents while restoring identity', () => {
    mount(null, false, true)
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
  it('blocks a CUSTOMER from administration', () => {
    mount({ id: 'a', email: 'a@example.test', role: 'CUSTOMER' }, true)
    expect(screen.getByText('Área restrita à administração')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })
  it('allows ADMIN to enter an ADMIN route', () => {
    mount({ id: 'a', email: 'a@example.test', role: 'ADMIN' }, true)
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })
  it('rejects external redirect destinations', () => {
    expect(safeNext('//example.com')).toBe('/pedidos')
    expect(safeNext('https://example.com')).toBe('/pedidos')
    expect(safeNext('/checkout')).toBe('/checkout')
  })
})
