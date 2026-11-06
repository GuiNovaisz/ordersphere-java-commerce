import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react'
import { api } from '../../lib/api'
import { dateTime, money, orderStatus } from '../../lib/format'
import { useAuth, useToast } from '../../app/state'
import {
  ConfirmDialog,
  Empty,
  ErrorState,
  Loading,
  PageTitle,
  Pagination,
} from '../../components/ui'

export function Orders() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(0, Math.trunc(Number(params.get('page')) || 0))
  const { user } = useAuth()
  const orders = useQuery({
    queryKey: ['orders', user?.id, page],
    queryFn: ({ signal }) => api.orders(page, signal),
  })
  return (
    <section className="page-section">
      <PageTitle eyebrow="SUA CONTA" title="Meus pedidos">
        Suas escolhas, com todos os detalhes preservados.
      </PageTitle>
      {orders.isPending ? (
        <Loading />
      ) : orders.error ? (
        <ErrorState
          error={orders.error}
          retry={() => {
            void orders.refetch()
          }}
        />
      ) : !orders.data.content.length ? (
        <Empty title="Seu histórico começa com uma escolha">
          <p>Quando você confirmar uma compra, o pedido aparecerá aqui.</p>
          <Link className="button" to="/">
            Explorar catálogo <ArrowRight size={17} />
          </Link>
        </Empty>
      ) : (
        <>
          <div className="orders-list">
            {orders.data.content.map((order) => (
              <Link className="order-list-row" to={`/pedidos/${order.id}`} key={order.id}>
                <span className="order-icon">
                  <ClipboardList size={22} />
                </span>
                <div>
                  <strong>Pedido #{order.id.slice(0, 8).toUpperCase()}</strong>
                  <p>
                    {dateTime(order.createdAt)} · {order.items.length} produto
                    {order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className={`badge ${order.status === 'CANCELLED' ? 'neutral' : ''}`}>
                  {orderStatus(order.status)}
                </span>
                <strong>{money(order.total)}</strong>
                <ArrowRight size={20} />
              </Link>
            ))}
          </div>
          <Pagination
            page={page}
            pages={orders.data.page.totalPages}
            total={orders.data.page.totalElements}
            change={(value) => setParams({ page: String(value) })}
          />
        </>
      )}
    </section>
  )
}
export function OrderDetail() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const client = useQueryClient()
  const { notify } = useToast()
  const [confirm, setConfirm] = useState(false)
  const order = useQuery({
    queryKey: ['order', user?.id, id],
    queryFn: ({ signal }) => api.order(id, signal),
  })
  const cancel = useMutation({
    mutationFn: () => api.cancelOrder(id),
    retry: false,
    onSuccess: (result) => {
      client.setQueryData(['order', user?.id, id], result)
      void client.invalidateQueries({ queryKey: ['orders'] })
      void client.invalidateQueries({ queryKey: ['inventory'] })
      setConfirm(false)
      notify('Pedido cancelado. O estoque foi devolvido uma única vez.')
    },
    onError: () => setConfirm(false),
  })
  if (order.isPending) return <Loading />
  if (order.error)
    return (
      <ErrorState
        error={order.error}
        retry={() => {
          void order.refetch()
        }}
      />
    )
  const data = order.data
  return (
    <section className="page-section">
      <Link to="/pedidos" className="text-link">
        <ArrowLeft size={16} />
        Meus pedidos
      </Link>
      <PageTitle
        eyebrow="DETALHES DA SUA ESCOLHA"
        title={`Pedido #${data.id.slice(0, 8).toUpperCase()}`}
        action={
          <span className={`badge ${data.status === 'CANCELLED' ? 'neutral' : ''}`}>
            {orderStatus(data.status)}
          </span>
        }
      >
        {dateTime(data.createdAt)}
      </PageTitle>
      {cancel.error && <ErrorState error={cancel.error} />}
      <div className="cart-layout">
        <div className="panel">
          <div className="panel-heading">
            <h2>Itens do pedido</h2>
            <span className="muted small-text">Valores históricos</span>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Itens e preços registrados neste pedido</caption>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Preço unitário</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <strong>{item.productName}</strong>
                      <span className="cell-detail">{item.sku}</span>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{money(item.unitPrice)}</td>
                    <td>{money(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="panel-note">
            Os nomes e valores acima foram registrados na compra. Alterações posteriores no catálogo
            não modificam este histórico.
          </p>
        </div>
        <aside className="order-summary">
          <span className="eyebrow">PEDIDO REGISTRADO</span>
          <div className="summary-total">
            <span>Total confirmado</span>
            <strong>{money(data.total)}</strong>
          </div>
          <p className="summary-note">Moeda: BRL · Compra simulada, sem cobrança.</p>
          {data.cancelledAt && (
            <p className="status-note">Cancelado em {dateTime(data.cancelledAt)}.</p>
          )}
          {data.status === 'CONFIRMED' && (
            <button
              className="button secondary wide"
              onClick={() => setConfirm(true)}
              disabled={cancel.isPending}
            >
              Cancelar pedido
            </button>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={confirm}
        close={() => setConfirm(false)}
        title="Cancelar este pedido?"
        pending={cancel.isPending}
        confirm={() => cancel.mutate()}
        label="Confirmar cancelamento"
      >
        <p>
          O pedido será cancelado e os itens voltarão ao estoque. Esta ação não pode ser desfeita.
        </p>
      </ConfirmDialog>
    </section>
  )
}
export function Account() {
  const { user } = useAuth()
  return (
    <section className="page-section narrow">
      <PageTitle eyebrow="SEU ESPAÇO" title="Minha conta">
        Tudo que você precisa para continuar escolhendo.
      </PageTitle>
      <div className="panel account-panel">
        <dl>
          <dt>E-mail</dt>
          <dd>{user?.email}</dd>
          <dt>Perfil</dt>
          <dd>{user?.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</dd>
        </dl>
        <Link className="button" to="/pedidos">
          Ver meus pedidos <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  )
}
