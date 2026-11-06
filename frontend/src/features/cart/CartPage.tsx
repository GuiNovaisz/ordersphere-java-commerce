import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useAuth, useCart, useToast } from '../../app/state'
import { api } from '../../lib/api'
import { estimatedTotal, orderPayload } from './model'
import { money } from '../../lib/format'
import { Empty, ErrorState, PageTitle, ProductArt } from '../../components/ui'

export default function CartPage({ checkout = false }: { checkout?: boolean }) {
  const cart = useCart()
  const auth = useAuth()
  const navigate = useNavigate()
  const client = useQueryClient()
  const { notify } = useToast()
  const submitting = useRef(false)
  const mutation = useMutation({
    mutationFn: () => api.createOrder(orderPayload(cart.lines)),
    retry: false,
    onSuccess: (order) => {
      cart.clear()
      void client.invalidateQueries({ queryKey: ['orders'] })
      notify('Pedido confirmado. Veja os detalhes da sua compra.')
      navigate(`/pedidos/${order.id}`, { replace: true })
    },
    onSettled: () => {
      submitting.current = false
    },
  })
  function submit() {
    if (!auth.user) {
      navigate('/entrar?next=%2Fcheckout')
      return
    }
    if (!checkout) {
      navigate('/checkout')
      return
    }
    if (submitting.current || !cart.lines.length) return
    submitting.current = true
    mutation.mutate()
  }
  return (
    <section className="page-section">
      <PageTitle
        eyebrow={checkout ? 'ÚLTIMO PASSO' : 'SUAS ESCOLHAS'}
        title={checkout ? 'Tudo pronto para confirmar?' : 'Seu carrinho'}
      >
        {checkout
          ? 'Revise os itens. Esta compra é simulada e não gera cobrança.'
          : 'Guarde o que faz sentido para você.'}
      </PageTitle>
      {!cart.lines.length ? (
        <Empty title="Sua próxima escolha está por vir">
          <p>Explore o catálogo e adicione seus produtos favoritos ao carrinho.</p>
          <Link className="button" to="/">
            Explorar catálogo <ArrowRight size={17} />
          </Link>
        </Empty>
      ) : (
        <div className="cart-layout">
          <div>
            <div className="cart-list">
              {cart.lines.map((line) => (
                <article className="cart-row" key={line.productId}>
                  <Link to={`/produtos/${line.productId}`} tabIndex={-1} aria-hidden="true">
                    <ProductArt sku={line.sku} name={line.name} />
                  </Link>
                  <div className="cart-row-info">
                    <span className="sku">{line.sku}</span>
                    <Link to={`/produtos/${line.productId}`}>
                      <h2>{line.name}</h2>
                    </Link>
                    <span className="muted">{money(line.unitPrice)} / unidade estimada</span>
                    <div className="quantity">
                      <button
                        className="icon-button"
                        disabled={mutation.isPending || line.quantity === 1}
                        aria-label={`Diminuir quantidade de ${line.name}`}
                        onClick={() => cart.setQuantity(line.productId, line.quantity - 1)}
                      >
                        <Minus size={15} />
                      </button>
                      <label className="sr-only" htmlFor={`qty-${line.productId}`}>
                        Quantidade de {line.name}
                      </label>
                      <input
                        id={`qty-${line.productId}`}
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        key={line.quantity}
                        defaultValue={line.quantity}
                        disabled={mutation.isPending}
                        onBlur={(event) => {
                          const quantity = Number(event.target.value)
                          if (
                            event.target.validity.valid &&
                            Number.isInteger(quantity) &&
                            quantity >= 1
                          ) {
                            cart.setQuantity(line.productId, quantity)
                          } else {
                            event.target.value = String(line.quantity)
                          }
                        }}
                      />
                      <button
                        className="icon-button"
                        disabled={mutation.isPending || line.quantity === 1000000}
                        aria-label={`Aumentar quantidade de ${line.name}`}
                        onClick={() => cart.setQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-row-total">
                    <strong>{money(line.unitPrice * line.quantity)}</strong>
                    <button
                      className="text-button danger"
                      disabled={mutation.isPending}
                      aria-label={`Remover ${line.name}`}
                      onClick={() => cart.remove(line.productId)}
                    >
                      <Trash2 size={15} />
                      Remover
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-list-footer">
              <Link className="text-link" to="/">
                <ArrowLeft size={16} />
                Continuar explorando
              </Link>
              <button
                className="text-button muted"
                disabled={mutation.isPending}
                onClick={cart.clear}
              >
                Limpar carrinho
              </button>
            </div>
          </div>
          <aside className="order-summary">
            <span className="eyebrow">SEU RESUMO</span>
            <h2>Boas escolhas, reunidas.</h2>
            <div className="summary-line">
              <span>Produtos diferentes</span>
              <span>{cart.lines.length}</span>
            </div>
            <div className="summary-line">
              <span>Unidades</span>
              <span>{cart.lines.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="summary-total">
              <span>Total estimado</span>
              <strong>{money(estimatedTotal(cart.lines))}</strong>
            </div>
            <p className="summary-note">
              Os preços e a disponibilidade serão confirmados pelo servidor ao finalizar. O carrinho
              não reserva estoque.
            </p>
            {mutation.error && <ErrorState error={mutation.error} />}
            <button
              className="button wide"
              disabled={mutation.isPending || auth.loading}
              onClick={submit}
            >
              {mutation.isPending
                ? 'Confirmando pedido…'
                : checkout
                  ? 'Confirmar compra simulada'
                  : 'Ir para checkout'}
              <ArrowRight size={17} />
            </button>
            <p className="secure-note">
              <ShieldCheck size={16} />
              Sem pagamento. Sem cobrança.
            </p>
            {mutation.error && (
              <p className="field-hint">
                Os itens foram mantidos. Confira seus pedidos antes de reenviar caso tenha ocorrido
                uma falha de conexão.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}
