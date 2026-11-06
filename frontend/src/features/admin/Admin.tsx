import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  CircleAlert,
  Package,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import { api } from '../../lib/api'
import { money, number } from '../../lib/format'
import { adjustmentSchema, productInputSchema } from '../../types/api'
import type { ProductInput } from '../../types/api'
import { useToast } from '../../app/state'
import {
  ConfirmDialog,
  Empty,
  ErrorState,
  Field,
  Loading,
  PageTitle,
  Pagination,
  ProductArt,
} from '../../components/ui'

export function Dashboard() {
  const products = useQuery({
    queryKey: ['admin-products', 'dashboard'],
    queryFn: ({ signal }) => api.products({ size: 20 }, true, signal),
  })
  const stock = useQuery({
    queryKey: ['inventory', 0],
    queryFn: ({ signal }) => api.inventory(0, signal),
  })
  const low = stock.data?.content.filter((row) => row.quantity > 0 && row.quantity <= 5) ?? []
  const zero = stock.data?.content.filter((row) => row.quantity === 0) ?? []
  return (
    <>
      <PageTitle
        eyebrow="WORKSPACE / VISÃO GERAL"
        title="Tudo no seu lugar."
        action={
          <Link className="button" to="/admin/produtos/novo">
            <Plus size={17} />
            Novo produto
          </Link>
        }
      >
        Acompanhe o catálogo e cuide das próximas escolhas.
      </PageTitle>
      {products.error ? (
        <ErrorState
          error={products.error}
          retry={() => {
            void products.refetch()
          }}
        />
      ) : products.isPending ? (
        <Loading />
      ) : (
        <div className="metric-grid">
          <div className="metric">
            <Package size={21} />
            <span>Produtos cadastrados</span>
            <strong>{number(products.data.page.totalElements)}</strong>
            <small>Total informado pelo catálogo</small>
          </div>
          <div className="metric">
            <Box size={21} />
            <span>Ativos nesta consulta</span>
            <strong>{products.data.content.filter((item) => item.active).length}</strong>
            <small>Entre os {products.data.content.length} produtos carregados</small>
          </div>
          <div className="metric">
            <CircleAlert size={21} />
            <span>Sem estoque nesta página</span>
            <strong>{stock.data ? zero.length : '—'}</strong>
            <small>Entre os {stock.data?.content.length ?? 0} saldos carregados</small>
          </div>
        </div>
      )}
      {stock.error && (
        <ErrorState
          error={stock.error}
          retry={() => {
            void stock.refetch()
          }}
        />
      )}
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ATENÇÃO AOS DETALHES</span>
              <h2>Estoque em foco</h2>
            </div>
            <Link className="text-link" to="/admin/estoque">
              Gerenciar <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="panel-note">
            {stock.data
              ? `Página inicial do estoque: ${zero.length} zerados e ${low.length} com até 5 unidades.`
              : 'Aguardando consulta do estoque.'}{' '}
            Os dados desta seção não são métricas globais.
          </p>
          {stock.isPending ? (
            <Loading />
          ) : stock.error ? (
            <p className="muted">Os alertas de estoque não estão disponíveis nesta consulta.</p>
          ) : [...zero, ...low].length ? (
            <ul className="stock-attention">
              {[...zero, ...low].slice(0, 8).map((row) => (
                <li key={row.productId}>
                  <span className="stock-dot" />
                  <div>
                    <Link to={`/admin/produtos/${row.productId}`}>
                      Produto #{row.productId.slice(0, 8)}
                    </Link>
                    <span>
                      {row.quantity === 0 ? 'Sem estoque' : `${row.quantity} unidades disponíveis`}
                    </span>
                  </div>
                  <Link
                    aria-label={`Ajustar estoque ${row.productId.slice(0, 8)}`}
                    className="icon-button"
                    to={`/admin/estoque?product=${row.productId}`}
                  >
                    <ArrowRight size={17} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty compact">
              <Box size={30} />
              <p>Nenhum alerta entre os saldos carregados.</p>
            </div>
          )}
        </section>
        <section className="operations-note">
          <span className="eyebrow">CONTROLE COM CLAREZA</span>
          <div className="orbit-icon">◎</div>
          <h2>O próximo pedido começa aqui.</h2>
          <p>Mantenha produtos ativos e saldos atualizados para receber novas compras.</p>
          <Link className="button secondary" to="/admin/produtos">
            Explorar produtos <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  )
}

export function AdminProducts() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(0, Math.trunc(Number(params.get('page')) || 0))
  const name = params.get('name') ?? ''
  const active = params.get('active') ?? ''
  const sku = params.get('sku') ?? ''
  const sort = params.get('sort') ?? 'createdAt,desc'
  const client = useQueryClient()
  const { notify } = useToast()
  const products = useQuery({
    queryKey: ['admin-products', { page, name, active, sku, sort }],
    queryFn: ({ signal }) =>
      api.products(
        { page, size: 12, name, sku, active: active === '' ? undefined : active, sort },
        true,
        signal,
      ),
  })
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => api.productStatus(id, value),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin-products'] })
      void client.invalidateQueries({ queryKey: ['products'] })
      void client.invalidateQueries({ queryKey: ['product'] })
      notify('Status atualizado.')
    },
    retry: false,
  })
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '0')
    setParams(next, { replace: true })
  }
  return (
    <>
      <PageTitle
        eyebrow="WORKSPACE / CATÁLOGO"
        title="Produtos"
        action={
          <Link to="/admin/produtos/novo" className="button">
            <Plus size={17} />
            Novo produto
          </Link>
        }
      >
        Organize cada escolha do seu catálogo.
      </PageTitle>
      <div className="admin-filters">
        <div className="search-box">
          <Search size={17} />
          <label className="sr-only" htmlFor="admin-name">
            Buscar produto
          </label>
          <input
            id="admin-name"
            placeholder="Buscar produto…"
            value={name}
            onChange={(event) => filter('name', event.target.value)}
          />
        </div>
        <label>
          SKU
          <input
            placeholder="SKU exato"
            value={sku}
            onChange={(event) => filter('sku', event.target.value)}
          />
        </label>
        <label>
          Status
          <select value={active} onChange={(event) => filter('active', event.target.value)}>
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </label>
        <label>
          Ordenar
          <select value={sort} onChange={(event) => filter('sort', event.target.value)}>
            <option value="createdAt,desc">Mais recentes</option>
            <option value="name,asc">Nome A–Z</option>
            <option value="price,asc">Menor preço</option>
            <option value="price,desc">Maior preço</option>
          </select>
        </label>
      </div>
      {status.error && <ErrorState error={status.error} />}
      {products.isPending ? (
        <Loading />
      ) : products.error ? (
        <ErrorState
          error={products.error}
          retry={() => {
            void products.refetch()
          }}
        />
      ) : !products.data.content.length ? (
        <Empty title="Nenhum produto encontrado">
          <p>Crie o primeiro produto ou ajuste os filtros.</p>
        </Empty>
      ) : (
        <>
          <div className="panel table-wrap">
            <table className="admin-table">
              <caption className="sr-only">Produtos do catálogo administrativo</caption>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.data.content.map((product) => (
                  <tr key={product.id}>
                    <td data-label="Produto">
                      <div className="table-product">
                        <ProductArt sku={product.sku} name={product.name} />
                        <div>
                          <Link to={`/admin/produtos/${product.id}`}>
                            <strong>{product.name}</strong>
                          </Link>
                          <span className="cell-detail">{product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Preço">{money(product.price)}</td>
                    <td data-label="Status">
                      <span className={`badge ${product.active ? '' : 'neutral'}`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <div className="inline">
                        <Link
                          to={`/admin/produtos/${product.id}`}
                          className="icon-button"
                          aria-label={`Editar ${product.name}`}
                        >
                          <Pencil size={17} />
                        </Link>
                        <button
                          className="text-button"
                          disabled={status.isPending}
                          onClick={() => status.mutate({ id: product.id, value: !product.active })}
                        >
                          {product.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <Link className="text-button" to={`/admin/estoque?product=${product.id}`}>
                          Estoque
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pages={products.data.page.totalPages}
            total={products.data.page.totalElements}
            change={(value) => {
              const next = new URLSearchParams(params)
              next.set('page', String(value))
              setParams(next)
            }}
          />
        </>
      )}
    </>
  )
}

export function ProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()
  const { notify } = useToast()
  const product = useQuery({
    queryKey: ['admin-product', id],
    queryFn: ({ signal }) => api.product(id ?? '', true, signal),
    enabled: !!id,
  })
  const form = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: { name: '', sku: '', description: '', price: 0, active: true },
  })
  const { reset } = form
  useEffect(() => {
    if (product.data) {
      const { name, description, sku, price, active } = product.data
      reset({ name, description, sku, price, active })
    }
  }, [product.data, reset])
  const save = useMutation({
    mutationFn: (data: ProductInput) => api.saveProduct(data, id),
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin-products'] })
      void client.invalidateQueries({ queryKey: ['admin-product'] })
      void client.invalidateQueries({ queryKey: ['products'] })
      void client.invalidateQueries({ queryKey: ['product'] })
      notify(
        id
          ? 'Produto atualizado.'
          : 'Produto criado. Adicione estoque para disponibilizar compras.',
      )
      navigate('/admin/produtos')
    },
  })
  if (id && product.isPending) return <Loading />
  if (id && product.error)
    return (
      <ErrorState
        error={product.error}
        retry={() => {
          void product.refetch()
        }}
      />
    )
  const errors = form.formState.errors
  return (
    <>
      <PageTitle eyebrow="WORKSPACE / PRODUTOS" title={id ? 'Editar produto' : 'Uma nova escolha.'}>
        {id
          ? 'Atualize os dados do catálogo. Pedidos antigos mantêm seu histórico.'
          : 'Adicione os detalhes e depois ajuste o estoque.'}
      </PageTitle>
      <div className="form-layout">
        <form
          className="panel product-form"
          noValidate
          onSubmit={form.handleSubmit((data) => save.mutate(data))}
        >
          {save.error && <ErrorState error={save.error} />}
          <Field id="product-name" label="Nome do produto" error={errors.name?.message}>
            <input
              id="product-name"
              {...form.register('name')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'product-name-error' : undefined}
            />
          </Field>
          <div className="form-grid">
            <Field id="product-sku" label="SKU" error={errors.sku?.message}>
              <input
                id="product-sku"
                {...form.register('sku')}
                aria-invalid={!!errors.sku}
                aria-describedby={errors.sku ? 'product-sku-error' : undefined}
              />
            </Field>
            <Field id="product-price" label="Preço em BRL" error={errors.price?.message}>
              <input
                id="product-price"
                type="number"
                min="0"
                max="999999999.99"
                step="0.01"
                {...form.register('price', { valueAsNumber: true })}
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? 'product-price-error' : undefined}
              />
            </Field>
          </div>
          <Field id="product-description" label="Descrição" error={errors.description?.message}>
            <textarea
              id="product-description"
              rows={5}
              {...form.register('description')}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'product-description-error' : undefined}
            />
          </Field>
          <label className="checkbox">
            <input type="checkbox" {...form.register('active')} />
            Produto ativo no catálogo público
          </label>
          <div className="form-actions">
            <Link className="button secondary" to="/admin/produtos">
              Voltar
            </Link>
            <button className="button" disabled={save.isPending}>
              {save.isPending ? 'Salvando…' : 'Salvar produto'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <span className="eyebrow">CADA DETALHE CONTA</span>
          <h2>Clareza para escolher.</h2>
          <p>Use um nome objetivo, um SKU único e uma descrição que ajude na decisão.</p>
          <p>O novo produto começa com saldo zero. O estoque é ajustado separadamente.</p>
        </aside>
      </div>
    </>
  )
}

export function AdminInventory() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(0, Math.trunc(Number(params.get('page')) || 0))
  const selected = params.get('product') ?? ''
  const [selection, setSelection] = useState(selected)
  const client = useQueryClient()
  const { notify } = useToast()
  const inventory = useQuery({
    queryKey: ['inventory', page],
    queryFn: ({ signal }) => api.inventory(page, signal),
  })
  const product = useQuery({
    queryKey: ['admin-product', selected],
    queryFn: ({ signal }) => api.product(selected, true, signal),
    enabled: !!selected,
  })
  const stock = useQuery({
    queryKey: ['inventory-detail', selected],
    queryFn: ({ signal }) => api.stock(selected, signal),
    enabled: !!selected,
  })
  const form = useForm<{ delta: number }>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { delta: 0 },
  })
  const delta = form.watch('delta')
  const [pendingDelta, setPendingDelta] = useState<number | null>(null)
  useEffect(() => {
    if (selected && matchMedia('(max-width: 1150px)').matches) {
      document.getElementById('stock-adjustment')?.scrollIntoView({ block: 'start' })
    }
  }, [selected])
  const adjust = useMutation({
    mutationFn: (value: number) => api.adjust(selected, value),
    retry: false,
    onSuccess: (result) => {
      client.setQueryData(['inventory-detail', selected], result)
      void client.invalidateQueries({ queryKey: ['inventory'] })
      setPendingDelta(null)
      form.reset()
      notify('Estoque ajustado com sucesso.')
    },
    onError: () => setPendingDelta(null),
  })
  const predicted = (stock.data?.quantity ?? 0) + (Number.isFinite(delta) ? delta : 0)
  return (
    <>
      <PageTitle eyebrow="WORKSPACE / INVENTÁRIO" title="Estoque sob controle.">
        Ajustes claros, sempre por diferença de quantidade.
      </PageTitle>
      <div className="inventory-layout">
        <section>
          <form
            className="inventory-search"
            onSubmit={(event) => {
              event.preventDefault()
              setParams({ product: selection })
            }}
          >
            <label htmlFor="stock-product-id">Consultar produto por ID</label>
            <div className="inline">
              <input
                id="stock-product-id"
                value={selection}
                onChange={(event) => setSelection(event.target.value)}
                placeholder="UUID do produto"
              />
              <button className="button secondary" aria-label="Consultar estoque">
                <Search size={18} />
              </button>
            </div>
            <small className="muted">Você também pode escolher um produto na lista abaixo.</small>
          </form>
          {inventory.isPending ? (
            <Loading />
          ) : inventory.error ? (
            <ErrorState
              error={inventory.error}
              retry={() => {
                void inventory.refetch()
              }}
            />
          ) : !inventory.data.content.length ? (
            <Empty title="Nenhum saldo cadastrado">
              <p>Crie produtos para iniciar o controle de estoque.</p>
            </Empty>
          ) : (
            <>
              <div className="panel table-wrap">
                <table className="admin-table">
                  <caption className="sr-only">Página atual de saldos</caption>
                  <thead>
                    <tr>
                      <th>Produto / ID</th>
                      <th>Saldo</th>
                      <th>Situação</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.data.content.map((row) => (
                      <tr key={row.productId}>
                        <td data-label="Produto / ID">
                          <span className="mono">{row.productId.slice(0, 8)}…</span>
                        </td>
                        <td data-label="Saldo">
                          <strong>{number(row.quantity)}</strong>
                        </td>
                        <td data-label="Situação">
                          <span
                            className={`badge ${row.quantity === 0 ? 'warning' : row.quantity <= 5 ? 'neutral' : ''}`}
                          >
                            {row.quantity === 0
                              ? 'Sem estoque'
                              : row.quantity <= 5
                                ? 'Estoque baixo'
                                : 'Disponível'}
                          </span>
                        </td>
                        <td data-label="Ação">
                          <button
                            className="text-button"
                            onClick={() => {
                              setSelection(row.productId)
                              setParams({ product: row.productId, page: String(page) })
                              form.reset()
                              adjust.reset()
                            }}
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pages={inventory.data.page.totalPages}
                total={inventory.data.page.totalElements}
                change={(value) => {
                  const next = new URLSearchParams(params)
                  next.set('page', String(value))
                  setParams(next)
                }}
              />
            </>
          )}
        </section>
        <aside id="stock-adjustment" className="panel adjustment-panel">
          <span className="eyebrow">AJUSTE POR DELTA</span>
          <h2>{selected ? (product.data?.name ?? 'Produto selecionado') : 'Escolha um produto'}</h2>
          {!selected ? (
            <p className="muted">
              Selecione “Ajustar” na lista ou consulte o ID para visualizar o saldo.
            </p>
          ) : stock.isPending || product.isPending ? (
            <Loading />
          ) : stock.error || product.error ? (
            <ErrorState error={stock.error ?? product.error} />
          ) : (
            <>
              <span className="sku">{product.data?.sku}</span>
              <p className="current-stock">
                Saldo atual<strong>{number(stock.data.quantity)}</strong>
              </p>
              <form onSubmit={form.handleSubmit((data) => setPendingDelta(data.delta))} noValidate>
                <Field
                  id="stock-delta"
                  label="Adicionar (+) ou remover (−) unidades"
                  error={form.formState.errors.delta?.message}
                >
                  <input
                    id="stock-delta"
                    type="number"
                    step="1"
                    {...form.register('delta', { valueAsNumber: true })}
                    aria-invalid={!!form.formState.errors.delta}
                    aria-describedby={
                      form.formState.errors.delta ? 'stock-delta-error' : 'delta-hint'
                    }
                  />
                </Field>
                <p id="delta-hint" className="field-hint">
                  Informe a diferença, não o saldo final. Exemplo: +5 adiciona cinco unidades.
                </p>
                <div
                  className={`predicted-stock ${predicted < 0 || predicted > 1000000000 ? 'invalid' : ''}`}
                >
                  <span>Novo saldo previsto</span>
                  <strong>{number(predicted)}</strong>
                </div>
                {adjust.error && <ErrorState error={adjust.error} />}
                <button
                  className="button wide"
                  disabled={adjust.isPending || predicted < 0 || predicted > 1000000000}
                >
                  Revisar ajuste <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={pendingDelta !== null}
        close={() => setPendingDelta(null)}
        title="Confirmar ajuste de estoque?"
        pending={adjust.isPending}
        confirm={() => {
          if (pendingDelta !== null) adjust.mutate(pendingDelta)
        }}
        label="Aplicar ajuste"
      >
        <p>
          Produto: <strong>{product.data?.name}</strong>
        </p>
        <p>
          Saldo atual: {stock.data?.quantity}. Ajuste:{' '}
          {pendingDelta !== null && pendingDelta > 0 ? '+' : ''}
          {pendingDelta}. Saldo previsto: {(stock.data?.quantity ?? 0) + (pendingDelta ?? 0)}.
        </p>
        <p className="muted">
          O saldo pode mudar se houver compras simultâneas. O servidor valida o ajuste.
        </p>
      </ConfirmDialog>
    </>
  )
}
