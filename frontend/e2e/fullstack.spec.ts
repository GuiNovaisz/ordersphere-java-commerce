import { test, expect, request } from '@playwright/test'
import type { APIRequestContext, Browser, Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import axe from 'axe-core'
import {
  inventorySchema,
  orderSchema,
  pageSchema,
  productSchema,
  csrfSchema,
} from '../src/types/api'
import type { Product } from '../src/types/api'

declare global {
  interface Window {
    axe: typeof axe
  }
}

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@ordersphere.test'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD
const CUSTOMER_PASSWORD = 'UiTestOnly!2026'
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:8080'
let admin: APIRequestContext
let products: Product[]
let raceProduct: Product
const screens = resolve('../docs/screenshots')

async function mutate(context: APIRequestContext, path: string, data?: unknown, method = 'POST') {
  const csrfResponse = await context.get('/api/v1/auth/csrf')
  expect(csrfResponse.status()).toBe(200)
  const csrf = csrfSchema.parse(await csrfResponse.json())
  return context.fetch(`/api/v1${path}`, {
    method,
    data,
    headers: { [csrf.headerName]: csrf.token },
  })
}
async function loginApi(context: APIRequestContext, email: string, password: string) {
  const response = await mutate(context, '/auth/login', { email, password })
  expect(response.status()).toBe(200)
}
async function newCustomer(context: APIRequestContext) {
  const email = `ui-${crypto.randomUUID()}@example.test`
  const response = await mutate(context, '/auth/register', { email, password: CUSTOMER_PASSWORD })
  expect(response.status()).toBe(201)
  return email
}
async function loginUi(page: Page, email: string, password: string) {
  await page.goto('/entrar')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/entrar/)
}
async function addToCart(page: Page, product: Product) {
  await page.goto(`/produtos/${product.id}`)
  await page.getByRole('button', { name: `Adicionar ${product.name} ao carrinho` }).click()
}
async function seededProduct(index: number, name: string, price: number, initialStock = 20) {
  const sku = `OS-DEMO-${String(index).padStart(2, '0')}`
  const existing = await admin.get(`/api/v1/admin/products?sku=${sku}`)
  const list = pageSchema(productSchema).parse(await existing.json())
  let product = list.content[0]
  if (!product) {
    const response = await mutate(admin, '/admin/products', {
      name,
      sku,
      description: `Uma escolha para o dia a dia. ${name}, com espaço para novas possibilidades. Dados de demonstração controlados.`,
      price,
      active: true,
    })
    expect(response.status()).toBe(201)
    product = productSchema.parse(await response.json())
  }
  const stockResponse = await admin.get(`/api/v1/admin/inventory/${product.id}`)
  const stock = inventorySchema.parse(await stockResponse.json())
  if (stock.quantity !== initialStock)
    expect(
      (
        await mutate(
          admin,
          `/admin/inventory/${product.id}`,
          { delta: initialStock - stock.quantity },
          'PATCH',
        )
      ).status(),
    ).toBe(200)
  return product
}
test.beforeAll(async () => {
  if (!ADMIN_PASSWORD) throw new Error('E2E_ADMIN_PASSWORD is required for a disposable test stack')
  mkdirSync(screens, { recursive: true })
  admin = await request.newContext({ baseURL })
  await loginApi(admin, ADMIN_EMAIL, ADMIN_PASSWORD)
  const fixtures: [string, number][] = [
    ['Luminária Arco', 189.9],
    ['Caderno Horizonte', 42.5],
    ['Garrafa Origem', 89],
    ['Organizador Prisma', 119.9],
    ['Suporte Estação', 159],
    ['Caneca Aurora', 54.9],
    ['Bolsa Essencial', 229],
    ['Relógio Órbita', 279.9],
    ['Kit Escrita', 69],
    ['Bandeja Forma', 79.9],
    ['Vaso Elemento', 98],
    ['Porta-objetos Nexo', 65],
    ['Copo Trama', 32.5],
    ['Caderno Linhas', 39.9],
  ]
  products = []
  for (let i = 0; i < fixtures.length; i++)
    products.push(await seededProduct(i + 1, ...fixtures[i], i === 13 ? 0 : 20))
  raceProduct = await seededProduct(99, 'Última unidade E2E', 15.5, 1)
})
test.afterAll(async () => {
  await admin?.dispose()
})

test('public catalog: search, URL, pagination, detail and persistent cart', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dentro da sua esfera.' })).toBeVisible()
  await expect(page.locator('.product-card')).toHaveCount(12)
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL(/page=1/)
  await page.getByLabel('Buscar produtos por nome').fill('Arco')
  await page.getByRole('button', { name: 'Pesquisar produtos' }).click()
  await expect(page).toHaveURL(/name=Arco/)
  await expect(page.locator('.product-card')).toHaveCount(1)
  await page.getByLabel('Ordenar por').selectOption('price,desc')
  await page.reload()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await page.getByRole('link', { name: 'Ver Luminária Arco', exact: true }).click()
  await expect(
    page.getByText('Disponibilidade e preço final confirmados no checkout.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar Luminária Arco ao carrinho' }).click()
  await page.goto('/carrinho')
  await page.getByRole('button', { name: 'Aumentar quantidade de Luminária Arco' }).click()
  await page.reload()
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade de Luminária Arco', exact: true }),
  ).toHaveValue('2')
  const quantity = page.getByRole('spinbutton', {
    name: 'Quantidade de Luminária Arco',
    exact: true,
  })
  await quantity.fill('3')
  await quantity.blur()
  await page.reload()
  await expect(quantity).toHaveValue('3')
  await quantity.fill('0')
  await quantity.blur()
  await expect(quantity).toHaveValue('3')
  await page.getByRole('button', { name: 'Remover Luminária Arco', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Sua próxima escolha está por vir' }),
  ).toBeVisible()
})

test('customer UI: register, login, checkout, historical order, cancel and logout', async ({
  page,
}) => {
  const email = `ui-${crypto.randomUUID()}@example.test`
  await page.goto('/cadastro')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(CUSTOMER_PASSWORD)
  await page.getByRole('button', { name: 'Criar minha conta' }).click()
  await expect(page).toHaveURL(/\/entrar/)
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(CUSTOMER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/pedidos/)
  const session = (await page.context().cookies()).find((cookie) => cookie.name === 'JSESSIONID')
  expect(session?.httpOnly).toBe(true)
  expect(session?.sameSite).toBe('Lax')
  expect(await page.evaluate(() => document.cookie)).not.toContain('JSESSIONID')
  await addToCart(page, products[0])
  await page.goto('/carrinho')
  await page.getByRole('button', { name: 'Ir para checkout' }).click()
  const requestPromise = page.waitForRequest(
    (r) => r.url().endsWith('/api/v1/orders') && r.method() === 'POST',
  )
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  const orderRequest = await requestPromise
  expect(orderRequest.postDataJSON()).toEqual({
    items: [{ productId: products[0].id, quantity: 1 }],
  })
  await expect(page).toHaveURL(/\/pedidos\/[a-f0-9-]+$/)
  await expect(page.getByText('Confirmado', { exact: true })).toBeVisible()
  await expect(page.getByText('Valores históricos', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Cancelar pedido', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar pedido', exact: true }).click()
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Voltar', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: 'Cancelar pedido', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar cancelamento' }).click()
  await expect(page.getByText('Cancelado', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(page.locator('.product-card')).toHaveCount(12)
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }))
  expect(
    storage.local.every((key) => ['ordersphere:cart:v1', 'ordersphere:theme'].includes(key)),
  ).toBe(true)
  expect(storage.session).toEqual([])
})

test('admin UI: create/edit product, change status and adjust stock using delta', async ({
  page,
}) => {
  await loginUi(page, ADMIN_EMAIL, ADMIN_PASSWORD!)
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('link', { name: 'Novo produto', exact: true }).click()
  const name = `Organizador UI ${crypto.randomUUID().slice(0, 6)}`
  await page.getByLabel('Nome do produto', { exact: true }).fill(name)
  await page.getByLabel('SKU', { exact: true }).fill(`UI-${crypto.randomUUID().slice(0, 8)}`)
  await page.getByLabel('Preço em BRL').fill('29.90')
  await page
    .getByLabel('Descrição', { exact: true })
    .fill('Produto criado e editado pelo teste E2E real.')
  await page.getByRole('button', { name: 'Salvar produto' }).click()
  await expect(page).toHaveURL(/\/admin\/produtos$/)
  await page.getByLabel('Buscar produto', { exact: true }).fill(name)
  await page.getByRole('link', { name: `Editar ${name}` }).click()
  await page.getByLabel('Preço em BRL').fill('31.90')
  await page.getByRole('button', { name: 'Salvar produto' }).click()
  await page.getByLabel('Buscar produto', { exact: true }).fill(name)
  const row = page.getByRole('row').filter({ hasText: name })
  await row.getByRole('button', { name: 'Desativar', exact: true }).click()
  await expect(row.getByText('Inativo', { exact: true })).toBeVisible()
  await row.getByRole('button', { name: 'Ativar', exact: true }).click()
  await expect(row.getByText('Ativo', { exact: true })).toBeVisible()
  await row.getByRole('link', { name: 'Estoque', exact: true }).click()
  await expect(page.locator('.current-stock strong')).toHaveText('0')
  await page.getByLabel('Adicionar (+) ou remover (−) unidades').fill('5')
  await expect(page.locator('.predicted-stock strong')).toHaveText('5')
  await page.getByRole('button', { name: 'Revisar ajuste' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Aplicar ajuste' }).click()
  await expect(page.locator('.current-stock strong')).toHaveText('5')
  await page.getByLabel('Adicionar (+) ou remover (−) unidades').fill('-2')
  await page.getByRole('button', { name: 'Revisar ajuste' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Aplicar ajuste' }).click()
  await expect(page.locator('.current-stock strong')).toHaveText('3')
  await page.getByLabel('Adicionar (+) ou remover (−) unidades').fill('-4')
  await expect(page.getByRole('button', { name: 'Revisar ajuste' })).toBeDisabled()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.locator('.product-card')).toHaveCount(12)
})

test('security: anonymous/admin guards and server RBAC', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/entrar\?next=/)
  const email = await newCustomer(page.request)
  await loginUi(page, email, CUSTOMER_PASSWORD)
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Área restrita à administração' })).toBeVisible()
  expect((await page.request.get('/api/v1/admin/inventory')).status()).toBe(403)
})

test('security: another customer cannot read or cancel an order through UI or API', async ({
  browser,
}) => {
  const owner = await browser.newContext({ baseURL })
  const ownerEmail = await newCustomer(owner.request)
  await loginApi(owner.request, ownerEmail, CUSTOMER_PASSWORD)
  const create = await mutate(owner.request, '/orders', {
    items: [{ productId: products[2].id, quantity: 1 }],
  })
  expect(create.status()).toBe(201)
  const order = orderSchema.parse(await create.json())
  const other = await browser.newContext({ baseURL })
  const email = await newCustomer(other.request)
  await loginApi(other.request, email, CUSTOMER_PASSWORD)
  const page = await other.newPage()
  await page.goto(`/pedidos/${order.id}`)
  await expect(page.getByRole('alert')).toContainText('não pertence à sua conta')
  expect((await other.request.get(`/api/v1/orders/${order.id}`)).status()).toBe(404)
  expect((await mutate(other.request, `/orders/${order.id}/cancel`)).status()).toBe(404)
  await owner.close()
  await other.close()
})

async function checkoutBuyer(browser: Browser) {
  const context = await browser.newContext({ baseURL })
  const email = await newCustomer(context.request)
  await loginApi(context.request, email, CUSTOMER_PASSWORD)
  const page = await context.newPage()
  await addToCart(page, raceProduct)
  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  return { context, page }
}
test('real UI concurrency: two buyers cannot purchase one unit; loser retains cart', async ({
  browser,
}) => {
  const one = await checkoutBuyer(browser)
  const two = await checkoutBuyer(browser)
  const responseOne = one.page.waitForResponse(
    (r) => r.url().endsWith('/api/v1/orders') && r.request().method() === 'POST',
  )
  const responseTwo = two.page.waitForResponse(
    (r) => r.url().endsWith('/api/v1/orders') && r.request().method() === 'POST',
  )
  await Promise.all([
    one.page.getByRole('button', { name: 'Confirmar compra simulada' }).click(),
    two.page.getByRole('button', { name: 'Confirmar compra simulada' }).click(),
  ])
  const responses = await Promise.all([responseOne, responseTwo])
  expect(responses.map((r) => r.status()).sort()).toEqual([201, 409])
  const loser = responses[0].status() === 409 ? one : two
  await expect(loser.page.getByRole('alert')).toContainText('Conflito')
  await expect(loser.page.locator('.cart-row')).toHaveCount(1)
  const stockResponse = await admin.get(`/api/v1/admin/inventory/${raceProduct.id}`)
  expect(inventorySchema.parse(await stockResponse.json()).quantity).toBe(0)
  let count = 0
  for (const buyer of [one, two]) {
    const result = await buyer.context.request.get('/api/v1/orders')
    count += pageSchema(orderSchema).parse(await result.json()).page.totalElements
  }
  expect(count).toBe(1)
  await one.context.close()
  await two.context.close()
})

test('security: invalid CSRF does not replay checkout and HTTP401 clears identity', async ({
  page,
}) => {
  const email = await newCustomer(page.request)
  await loginUi(page, email, CUSTOMER_PASSWORD)
  await addToCart(page, products[3])
  await page.goto('/checkout')
  let posts = 0
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    posts++
    await route.continue({
      headers: { ...route.request().headers(), 'x-csrf-token': 'deliberately-invalid-test-value' },
    })
  })
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('alert')).toContainText('Acesso não permitido')
  expect(posts).toBe(1)
  await page.unroute('**/api/v1/orders')
  expect((await mutate(page.request, '/auth/logout')).status()).toBe(204)
  await page.goto('/pedidos')
  await expect(page).toHaveURL(/\/entrar/)
})

test('UI states: empty search, missing product, invalid credentials and recoverable proxy failure', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?name=missing-' + crypto.randomUUID())
  await expect(page.getByRole('heading', { name: 'Nenhum produto por aqui' })).toBeVisible()
  await page.screenshot({ path: resolve(screens, 'empty-mobile.png'), fullPage: true })
  await page.goto('/produtos/' + crypto.randomUUID())
  await expect(page.getByRole('alert')).toContainText('Este recurso não está disponível')
  await page.goto('/entrar')
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('missing-' + crypto.randomUUID() + '@example.test')
  await page.getByLabel('Senha', { exact: true }).fill(CUSTOMER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos')
  await page.route('**/api/v1/products?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'text/html',
      body: 'Simulated proxy outage for resilience testing',
    }),
  )
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('O serviço está indisponível')
  await page.screenshot({ path: resolve(screens, 'error-mobile.png'), fullPage: true })
  await page.unroute('**/api/v1/products?*')
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.locator('.product-card')).toHaveCount(12)
  await page.getByText('Buscar por código SKU', { exact: true }).click()
  await page.getByLabel('SKU exato do produto').fill(products[0].sku)
  await page.getByRole('button', { name: 'Pesquisar SKU', exact: true }).click()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await assertNoOverflow(page)
})

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'notebook', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`visual audit ${viewport.name}: public, customer and admin pages in both themes`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    await page.goto('/')
    await expect(page.locator('.product-card').first()).toBeVisible()
    await page.screenshot({
      path: resolve(screens, `catalog-${viewport.name}.png`),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Usar tema escuro' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.product-card')).toHaveCount(12)
    await assertNoOverflow(page)
    await page.screenshot({
      path: resolve(screens, `catalog-dark-${viewport.name}.png`),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Usar tema claro' }).click()
    const email = await newCustomer(page.request)
    await loginUi(page, email, CUSTOMER_PASSWORD)
    await addToCart(page, products[1])
    const created = await mutate(page.request, '/orders', {
      items: [{ productId: products[4].id, quantity: 1 }],
    })
    const order = orderSchema.parse(await created.json())
    const pages = [
      ['product', `/produtos/${products[0].id}`],
      ['cart', '/carrinho'],
      ['checkout', '/checkout'],
      ['orders', '/pedidos'],
      ['order', `/pedidos/${order.id}`],
      ['account', '/conta'],
    ]
    for (const [name, path] of pages) {
      await page.goto(path)
      await expect(page.locator('main h1')).toBeVisible()
      await expect(page.locator('[role=status]')).toHaveCount(0)
      await page.screenshot({
        path: resolve(screens, `${name}-${viewport.name}.png`),
        fullPage: true,
      })
      await assertNoOverflow(page)
    }
    await page.getByRole('button', { name: 'Sair da conta' }).click()
    await expect(page).toHaveURL('/')
    for (const [name, path] of [
      ['login', '/entrar'],
      ['register', '/cadastro'],
    ]) {
      await page.goto(path)
      await expect(page.locator('form')).toBeVisible()
      await page.screenshot({
        path: resolve(screens, `${name}-${viewport.name}.png`),
        fullPage: true,
      })
      await assertNoOverflow(page)
    }
    await loginUi(page, ADMIN_EMAIL, ADMIN_PASSWORD!)
    for (const [name, path] of [
      ['admin-dashboard', '/admin'],
      ['admin-products', '/admin/produtos'],
      ['admin-form', '/admin/produtos/novo'],
      ['admin-edit', `/admin/produtos/${products[0].id}`],
      ['admin-inventory', `/admin/estoque?product=${products[0].id}`],
    ]) {
      await page.goto(path)
      await expect(page.locator('main h1')).toBeVisible()
      await expect(page.locator('[role=status]')).toHaveCount(0)
      await page.screenshot({
        path: resolve(screens, `${name}-${viewport.name}.png`),
        fullPage: true,
      })
      await assertNoOverflow(page)
    }
    await page.getByRole('button', { name: 'Usar tema escuro' }).click()
    await page.screenshot({
      path: resolve(screens, `admin-dark-${viewport.name}.png`),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Usar tema claro' }).click()
    await page.goto('/')
    await expect(page.locator('.product-card').first()).toBeVisible()
    await page.evaluate(axe.source)
    const violations = await page.evaluate(async () =>
      (
        await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        })
      ).violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target),
      })),
    )
    expect(violations).toEqual([])
    expect(runtimeErrors).toEqual([])
  })
}
async function assertNoOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true)
}
