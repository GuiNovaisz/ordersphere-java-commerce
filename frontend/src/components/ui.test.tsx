import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/api'
import { Empty, ErrorState, Pagination } from './ui'
describe('async and pagination states', () => {
  it('explains empty results', () => {
    render(
      <Empty title="Nenhum produto encontrado">
        <p>Ajuste os filtros.</p>
      </Empty>,
    )
    expect(screen.getByRole('heading', { name: 'Nenhum produto encontrado' })).toBeInTheDocument()
  })
  it('shows a readable error instead of a Problem JSON object', () => {
    render(<ErrorState error={new ApiError(403, { detail: 'SQL hidden detail' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Acesso não permitido')
    expect(screen.queryByText('SQL hidden detail')).not.toBeInTheDocument()
  })
  it('disables navigation outside the available page range', () => {
    render(<Pagination page={0} pages={1} total={2} change={() => {}} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })
})
