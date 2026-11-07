import { Link, useSearchParams, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Plus, Search } from 'lucide-react'
import { api } from '../../lib/api'
import { money } from '../../lib/format'
import { useCart, useToast } from '../../app/state'
import { Empty, ErrorState, Loading, Pagination, ProductArt } from '../../components/ui'
import type { Product } from '../../types/api'
import { useState } from 'react'

function AddButton({ product, full = false }: { product: Product; full?: boolean }) {
  const cart = useCart()
  const { notify } = useToast()
  return (
    <button
      className={full ? 'button' : 'product-add'}
      aria-label={`Adicionar ${product.name} ao carrinho`}
      onClick={() => {
        try {
          cart.add(product)
          notify(`${product.name} adicionado ao carrinho.`)
        } catch (error) {
          notify(error instanceof Error ? error.message : 'Não foi possível adicionar.')
        }
      }}
    >
      <Plus size={full ? 18 : 20} />
      {full && 'Adicionar ao carrinho'}
    </button>
  )
}
function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        className="product-image-link"
        to={`/produtos/${product.id}`}
        aria-label={`Ver ${product.name}`}
      >
        <ProductArt sku={product.sku} name={product.name} />
        <span className="view-product">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="product-info">
        <span className="sku">{product.sku}</span>
        <Link to={`/produtos/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <div className="product-bottom">
          <span>{money(product.price)}</span>
          <AddButton product={product} />
        </div>
      </div>
    </article>
  )
}
export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const name = params.get('name') ?? ''
  const sku = params.get('sku') ?? ''
  const sort = params.get('sort') ?? 'name,asc'
  const [search, setSearch] = useState(name)
  const products = useQuery({
    queryKey: ['products', { page, name, sku, sort }],
    queryFn: ({ signal }) => api.products({ page, size: 12, name, sku, sort }, false, signal),
  })
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" />
            UM UNIVERSO DE POSSIBILIDADES
          </span>
          <h1>
            Boas escolhas.
            <br />
            Tudo em <em>órbita.</em>
          </h1>
          <p>
            Explore o catálogo, encontre seus próximos essenciais e acompanhe cada escolha em um só
            lugar.
          </p>
          <a href="#catalogo" className="button">
            Explorar catálogo <ArrowDown size={17} />
          </a>
          <div className="hero-note">
            <span className="mini-orbits">◎</span> Descubra. Escolha. Acompanhe.
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit-line orbit-one" />
          <div className="orbit-line orbit-two" />
          <div className="sphere" />
          <div className="floating-object object-one" />
          <div className="floating-object object-two" />
          <div className="visual-label">
            <span>OS / 02</span>
            <strong>Em boa companhia.</strong>
          </div>
          <span className="visual-coordinate">UMA NOVA PERSPECTIVA ↗</span>
        </div>
      </section>
      <section className="catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ENCONTRE SUA PRÓXIMA ESCOLHA</span>
            <h2>
              Dentro da sua esfera<span className="title-dot">.</span>
            </h2>
          </div>
          <span className="catalog-total">
            {products.data
              ? `${products.data.page.totalElements} produtos no catálogo`
              : 'Explore o catálogo'}
          </span>
        </div>
        <div className="catalog-toolbar">
          <form
            className="search-box"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              change({ name: search, page: '0' })
            }}
          >
            <Search size={19} />
            <label className="sr-only" htmlFor="catalog-search">
              Buscar produtos por nome
            </label>
            <input
              id="catalog-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="O que você está procurando?"
            />
            <button aria-label="Pesquisar produtos" type="submit">
              <ArrowRight size={19} />
            </button>
          </form>
          <div className="sort-field">
            <label htmlFor="catalog-sort">Ordenar por</label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(event) => change({ sort: event.target.value, page: '0' })}
            >
              <option value="name,asc">Nome A–Z</option>
              <option value="name,desc">Nome Z–A</option>
              <option value="price,asc">Menor preço</option>
              <option value="price,desc">Maior preço</option>
              <option value="createdAt,desc">Mais recentes</option>
            </select>
          </div>
        </div>
        <details className="advanced-search">
          <summary>Buscar por código SKU</summary>
          <form
            className="search-box"
            onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              setSearch('')
              change({ sku: String(data.get('sku') ?? '').trim(), name: '', page: '0' })
            }}
          >
            <label className="sr-only" htmlFor="catalog-sku">
              SKU exato do produto
            </label>
            <input
              id="catalog-sku"
              name="sku"
              defaultValue={sku}
              key={sku}
              placeholder="Digite o SKU completo"
            />
            <button aria-label="Pesquisar SKU" type="submit">
              <Search size={18} />
            </button>
          </form>
        </details>
        {sku && (
          <p className="filter-note">
            SKU: {sku}{' '}
            <button className="text-button" onClick={() => change({ sku: '', page: '0' })}>
              Limpar filtro
            </button>
          </p>
        )}
        {products.isPending ? (
          <Loading />
        ) : products.error ? (
          <ErrorState
            error={products.error}
            retry={() => {
              void products.refetch()
            }}
          />
        ) : products.data.content.length === 0 ? (
          <Empty title="Nenhum produto por aqui">
            <p>
              {name || sku
                ? 'Tente outro nome ou limpe os filtros.'
                : 'O catálogo está sendo preparado. Volte em breve.'}
            </p>
            {(name || sku) && (
              <button
                className="button secondary"
                onClick={() => {
                  setSearch('')
                  setParams({})
                }}
              >
                Limpar busca
              </button>
            )}
          </Empty>
        ) : (
          <>
            <div className="product-grid">
              {products.data.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={products.data.page.totalPages}
              total={products.data.page.totalElements}
              change={(next) => change({ page: String(next) })}
            />
          </>
        )}
      </section>
      <section className="experience-strip">
        <div>
          <span>01 / DESCUBRA</span>
          <h3>Encontre o que faz sentido.</h3>
          <p>Um catálogo direto, sem distrações.</p>
        </div>
        <div>
          <span>02 / ESCOLHA</span>
          <h3>Seu ritmo. Suas escolhas.</h3>
          <p>Revise tudo antes de confirmar.</p>
        </div>
        <div>
          <span>03 / ACOMPANHE</span>
          <h3>Cada pedido, em ordem.</h3>
          <p>Histórico e controle na sua conta.</p>
        </div>
      </section>
    </>
  )
}
export function ProductDetail() {
  const { id = '' } = useParams()
  const product = useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => api.product(id, false, signal),
  })
  if (product.isPending) return <Loading />
  if (product.error)
    return (
      <ErrorState
        error={product.error}
        retry={() => {
          void product.refetch()
        }}
      />
    )
  const p = product.data
  return (
    <div className="detail-page">
      <nav className="breadcrumbs" aria-label="Localização">
        <Link to="/">Catálogo</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <section className="product-detail">
        <ProductArt sku={p.sku} name={p.name} large />
        <div className="detail-copy">
          <span className="eyebrow">CATÁLOGO ORDERSPHERE</span>
          <span className="sku">SKU {p.sku}</span>
          <h1>{p.name}</h1>
          <p className="detail-price">{money(p.price)}</p>
          <p className="product-description">
            {p.description ||
              'Os detalhes desta escolha estão no essencial: simplicidade e praticidade.'}
          </p>
          <p className="availability">
            <Check size={16} />
            Produto ativo no catálogo
          </p>
          <AddButton product={p} full />
          <p className="field-hint">
            Disponibilidade e preço final confirmados no checkout. Compra simulada, sem cobrança.
          </p>
          <Link to="/carrinho" className="text-link">
            Ver meu carrinho <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
