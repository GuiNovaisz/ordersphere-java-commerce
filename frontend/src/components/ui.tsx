import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, PackageOpen, RefreshCw, TriangleAlert, X } from 'lucide-react'
import { errorMessage } from '../lib/api'

export function Loading({ label = 'Carregando conteúdo' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="skeleton-grid">
      {[1, 2, 3, 4].map((n) => (
        <div className="skeleton" key={n} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}
export function ErrorState({
  error,
  retry,
  message,
}: {
  error: unknown
  retry?: () => void
  message?: string
}) {
  return (
    <div className="error-box" role="alert">
      <TriangleAlert size={22} />
      <div>
        <strong>Não foi possível concluir</strong>
        <p>{message ?? errorMessage(error)}</p>
        {retry && (
          <button className="button secondary small" onClick={retry}>
            <RefreshCw size={15} />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <PackageOpen size={42} strokeWidth={1.3} />
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  )
}
export function Pagination({
  page,
  pages,
  total,
  change,
}: {
  page: number
  pages: number
  total: number
  change: (page: number) => void
}) {
  return (
    <nav className="pagination" aria-label="Paginação">
      <span>
        {total} resultado{total !== 1 ? 's' : ''} · Página {page + 1} de {Math.max(1, pages)}
      </span>
      <div className="inline">
        <button
          className="icon-button"
          aria-label="Página anterior"
          disabled={page === 0}
          onClick={() => change(page - 1)}
        >
          <ArrowLeft size={18} />
        </button>
        <button
          className="icon-button"
          aria-label="Próxima página"
          disabled={page + 1 >= pages}
          onClick={() => change(page + 1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </nav>
  )
}
export function PageTitle({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {children && <p className="muted">{children}</p>}
      </div>
      {action}
    </div>
  )
}
export function Field({
  label,
  error,
  id,
  children,
}: {
  label: string
  error?: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
export function ConfirmDialog({
  open,
  close,
  title,
  children,
  confirm,
  pending,
  label = 'Confirmar',
}: {
  open: boolean
  close: () => void
  title: string
  children: ReactNode
  confirm: () => void
  pending: boolean
  label?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (open && !ref.current?.open) {
      ref.current?.showModal()
      cancelRef.current?.focus()
    } else if (!open) ref.current?.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirmation-title"
      onCancel={(event) => {
        if (pending) event.preventDefault()
        else close()
      }}
      onClose={close}
    >
      <div className="dialog-title">
        <h2 id="confirmation-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Fechar confirmação"
          disabled={pending}
          onClick={close}
        >
          <X size={18} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      <div className="dialog-actions">
        <button ref={cancelRef} className="button secondary" disabled={pending} onClick={close}>
          Voltar
        </button>
        <button className="button" disabled={pending} onClick={confirm}>
          {pending ? 'Processando…' : label}
        </button>
      </div>
    </dialog>
  )
}

export function ProductArt({
  sku,
  name,
  large = false,
}: {
  sku: string
  name: string
  large?: boolean
}) {
  const hash = [...sku].reduce((value, char) => value + char.charCodeAt(0), 0)
  return (
    <div
      className={`product-art palette-${hash % 5}${large ? ' art-large' : ''}`}
      aria-hidden="true"
    >
      <span className="art-orbit" />
      <span className="art-object">
        <span className="art-label">
          OS<span>OBJECT SERIES</span>
        </span>
        <span className="art-dot" />
      </span>
      <span className="art-caption">
        {name.slice(0, 1).toUpperCase()} / {sku}
      </span>
    </div>
  )
}
