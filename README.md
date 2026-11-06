# OrderSphere

Full Stack Experience v0.2.0 em revisão / under review: [arquitetura frontend](docs/architecture/frontend.md) · [operação](docs/operations.md) · [auditoria](docs/fullstack-audit.md). Fundação publicada: [v0.1.1](docs/backend-foundation-final-audit.md).

Licença: [MIT](LICENSE) — Copyright (c) 2026 Guilherme Novais.
License: [MIT](LICENSE) — Copyright (c) 2026 Guilherme Novais.

[![Backend CI](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/workflows/ci.yml/badge.svg)](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/workflows/ci.yml)

> 🇧🇷 **Documentação em Português (Brasil)**
>
> 🇺🇸 **The complete English version follows below.**

OrderSphere combina uma experiência full-stack moderna com um backend Java transacional que mantém consistência de estoque mesmo sob compras concorrentes. A **v0.2.0 — Full Stack Experience** adiciona React e TypeScript à fundação publicada [v0.1.1](https://github.com/GuiNovaisz/ordersphere-java-commerce/releases/tag/v0.1.1), preservando a API e suas transações.

![Catálogo OrderSphere](docs/screenshots/catalog-desktop.png)

## Sumário

| Português | English |
| --- | --- |
| [Experiência full-stack](#fullstack-pt) | [Full-stack experience](#fullstack-en) |
| [Visão geral](#visao-geral) | [Overview](#overview) |
| [Por que este projeto existe](#objetivo) | [Purpose](#purpose) |
| [Funcionalidades e domínios](#funcionalidades) | [Features and domains](#features) |
| [Stack](#stack-pt) | [Tech stack](#tech-stack) |
| [Arquitetura e modelagem](#arquitetura) | [Architecture and data model](#architecture) |
| [Concorrência](#concorrencia) | [Concurrency](#concurrency) |
| [Segurança](#seguranca) | [Security](#security) |
| [Banco](#banco) | [Database](#database) |
| [API e endpoints](#api-pt) | [API and endpoints](#api-en) |
| [Testes e CI](#testes) | [Testing and CI](#testing) |
| [Docker e execução](#execucao) | [Docker and local setup](#running) |
| [Documentação e estudo](#documentacao) | [Documentation and learning](#documentation) |
| [Limitações](#limitacoes) | [Limitations](#limitations) |
| [Roadmap](#roadmap-pt) | [Roadmap](#roadmap-en) |

<a id="visao-geral"></a>
## Visão geral

O OrderSphere gerencia um catálogo comercializável, saldo de estoque e pedidos de usuários autenticados. Uma compra registra os dados comerciais daquele momento e consome estoque na mesma transação. Duas compras simultâneas não podem vender uma unidade duas vezes.

<a id="objetivo"></a>
## Por que este projeto existe

Este projeto de portfólio demonstra Java, API REST, modelagem, autorização, PostgreSQL, transações e concorrência com exemplos verificáveis. A interface torna essas garantias demonstráveis, sem assumir autoridade sobre preço ou estoque. A documentação educacional conecta Java, React e segurança web ao código real.

<a id="fullstack-pt"></a>
## Experiência full-stack

**CUSTOMER:** catálogo público com busca parcial por nome, SKU exato, ordenação e paginação; detalhes; carrinho persistido; cadastro/login; checkout simulado; histórico, detalhe e cancelamento dos próprios pedidos. O carrinho envia somente IDs e quantidades. O servidor decide preços, disponibilidade e total. Conflitos preservam o carrinho e nunca repetem automaticamente uma compra.

**ADMIN:** workspace protegido, dashboard com escopo explícito dos dados carregados, produtos com criação/edição/status/filtros e estoque por delta com prévia e confirmação. Não existem analytics, categorias ou reviews inventados. As ilustrações são placeholders determinísticos por SKU, não fotografias dos produtos.

**Frontend:** React 19, TypeScript strict, Vite 8, React Router 7, TanStack Query 5, React Hook Form 7 e Zod 4. CSS próprio com tokens, SVG da marca e Lucide mantém o visual consistente sem framework de UI. Rotas administrativas, autenticação e pedidos usam code splitting. Tema claro/escuro persiste com fallback do sistema; navegação por teclado, foco, labels e dialogs nativos acompanham layouts responsivos.

**Sessão:** o cookie HttpOnly pertence ao Spring; a identidade vem de `/auth/me`. O cliente HTTP centraliza credenciais, valida respostas com Zod, usa o header CSRF informado pela API e renova o token após login. 401 limpa identidade e consultas privadas. Guards são UX; RBAC e ownership são impostos pelo backend. Não há JWT nem senha/token em localStorage. Apenas carrinho não sensível e preferência de tema são persistidos.

```mermaid
flowchart LR
    Browser[Browser / React SPA] --> Web[Nginx / mesma origem]
    Web -->|/api e cookie de sessão| Spring[Spring Security e REST]
    Spring --> Tx[Services / transações]
    Tx --> PG[(PostgreSQL)]
```

O Compose serve a aplicação em `http://localhost:8080`; Vite usa proxy `/api` durante desenvolvimento. Node é ferramenta de build/teste, sem segundo backend. Veja [frontend](frontend/README.md), [arquitetura](docs/architecture/frontend.md), [ADR 005](docs/architecture/decisions/005-react-frontend.md), [ADR 006](docs/architecture/decisions/006-same-origin-proxy.md) e [conceitos full-stack](docs/learning/fullstack.md).

<a id="funcionalidades"></a>
## Funcionalidades e domínios

| Domínio | Implementação | Código |
| --- | --- | --- |
| Auth / User | Cadastro CUSTOMER, login, logout, identidade e senha com hash | [`auth`](src/main/java/com/ordersphere/auth), [`user`](src/main/java/com/ordersphere/user) |
| Catalog | Criar/atualizar produto, ativar/desativar, SKU único e filtros paginados | [`catalog`](src/main/java/com/ordersphere/catalog) |
| Inventory | Consultar, adicionar/remover saldo administrativo e consumir atomicamente | [`inventory`](src/main/java/com/ordersphere/inventory) |
| Orders | Criar, listar/consultar próprios pedidos, snapshot e cancelamento idempotente | [`order`](src/main/java/com/ordersphere/order) |
| Shared | Segurança HTTP, validação, configuração e erros consistentes | [`shared`](src/main/java/com/ordersphere/shared) |

O catálogo público mostra apenas produtos ativos. Administradores consultam produtos inativos e gerenciam estoque; clientes acessam somente seus pedidos. A API não oferece exclusão física de produtos.

<a id="stack-pt"></a>
## Stack

Java 21, Spring Boot 4.1.2, Spring MVC, Spring Security, Spring Data JPA/Hibernate, Bean Validation, PostgreSQL 17, Flyway, springdoc OpenAPI 3.2.0, Actuator, Maven Wrapper 3.9.12, JUnit Jupiter 6, Testcontainers, Docker Compose e GitHub Actions. As versões gerenciadas pelo Spring Boot constam no [`pom.xml`](pom.xml).

<a id="arquitetura"></a>
## Arquitetura e modelagem

Monólito modular: uma aplicação, um banco e organização por feature. Controllers recebem DTOs; services orquestram casos de uso e transações; entidades preservam invariantes; repositories persistem dados.

```mermaid
flowchart LR
    Client[Cliente REST] --> Security[Spring Security]
    Security --> API[Controllers e DTOs]
    API --> Services[Services por domínio]
    Services --> Domain[Regras e entidades]
    Services --> Repositories[Repositories JPA]
    Repositories --> DB[(PostgreSQL)]
```

`app_users` possui pedidos; `orders` possui `order_items`. Cada produto possui um saldo em `inventory`. O item copia SKU, nome e preço unitário para preservar o histórico. Pedidos nascem `CONFIRMED` após consumo bem-sucedido e podem passar para `CANCELLED`; não há reabertura. Veja [arquitetura](docs/architecture/overview.md) e [ADRs](docs/architecture/decisions).

<a id="concorrencia"></a>
## Concorrência

O PostgreSQL consome saldo com um `UPDATE` condicional: subtrai somente quando a quantidade disponível cobre a solicitada. Saldo inicial 1 e duas compras de 1 devem produzir **um sucesso, um conflito, um pedido persistido e saldo final zero**. Todos os itens e a persistência do pedido estão na mesma transação; uma falha faz rollback completo.

Produtos são processados em ordem estável de UUID. Cancelar bloqueia a linha do pedido e repõe estoque apenas na primeira transição; chamadas repetidas não repõem novamente. A [ADR de concorrência](docs/architecture/decisions/002-inventory-concurrency-strategy.md) compara optimistic locking, pessimistic locking e atualização atômica. O resultado executado do teste real está na [auditoria](docs/audit.md).

<a id="seguranca"></a>
## Segurança

Spring Security mantém sessão de servidor com cookie HttpOnly. Login estabelece a identidade; logout invalida a sessão. Requisições que alteram estado exigem token CSRF, inclusive cadastro e login. Obtenha-o em `GET /api/v1/auth/csrf`, preserve o cookie e use o header retornado; renove o token após login/logout.

Cadastro sempre atribui `CUSTOMER`; campos desconhecidos/administrativos não fazem parte da entrada aceita. Rotas `/api/v1/admin/**` exigem `ADMIN`. O usuário autenticado restringe consultas e cancelamentos aos próprios pedidos; ID alheio resulta em 404. Senhas nunca são devolvidas. Consulte [autenticação](docs/architecture/decisions/004-authentication-strategy.md) e [exemplos](docs/api.md).

Um administrador inicial pode ser criado com `ORDERSPHERE_ADMIN_EMAIL` e `ORDERSPHERE_ADMIN_PASSWORD`, definidos juntos. O bootstrap só atua se não existir ADMIN e não modifica uma conta administrativa existente. Use senha de 12 a 64 caracteres, com no máximo 72 bytes UTF-8. Em produção, use HTTPS e `SESSION_COOKIE_SECURE=true`.

<a id="banco"></a>
## Banco

PostgreSQL é o banco de execução e de integração; Flyway aplica [migrations versionadas](src/main/resources/db/migration). JPA valida o schema e não o recria. Constraints cobrem SKU/e-mail únicos, chaves estrangeiras e limites de quantidade/valor.

Dinheiro usa `BigDecimal`, BRL e duas casas. Valores que exigiriam arredondamento são rejeitados com `RoundingMode.UNNECESSARY`. Preço permitido: 0 a 999.999.999,99; estoque: 0 a 1.000.000.000; delta administrativo não zero de até ±1.000.000.000. Pedidos aceitam até 50 produtos distintos e quantidade de 1 a 1.000.000 por item. SKU é normalizado para maiúsculas, com 1–64 caracteres em `[A-Z0-9][A-Z0-9_-]{0,63}`.

<a id="api-pt"></a>
## API e endpoints

Base: `/api/v1`. [Contrato e chamadas PowerShell](docs/api.md). OpenAPI em `/v3/api-docs`; Swagger UI em `/swagger-ui/index.html`.

| Método | Rota | Acesso / finalidade |
| --- | --- | --- |
| GET | `/auth/csrf` | Público; token CSRF |
| POST | `/auth/register` | Público com CSRF; cadastro |
| POST | `/auth/login` | Público com CSRF; sessão |
| POST | `/auth/logout` | Sessão e CSRF; invalidação |
| GET | `/auth/me` | Identidade autenticada |
| GET | `/products`, `/products/{id}` | Catálogo ativo |
| GET | `/admin/products`, `/admin/products/{id}` | ADMIN; catálogo completo |
| POST | `/admin/products` | ADMIN; criação |
| PUT | `/admin/products/{id}` | ADMIN; atualização completa |
| PATCH | `/admin/products/{id}/status` | ADMIN; ativação |
| GET | `/admin/inventory`, `/admin/inventory/{productId}` | ADMIN; saldo |
| PATCH | `/admin/inventory/{productId}` | ADMIN; ajuste por delta |
| POST | `/orders` | Autenticado; compra |
| GET | `/orders`, `/orders/{id}` | Próprios pedidos |
| POST | `/orders/{id}/cancel` | Próprio pedido e CSRF; cancelamento |

Listagens usam `page` a partir de zero e `size` de 1 a 100, padrão 20. Catálogo aceita `name` parcial, `sku` exato e `sort=campo,asc|desc`; campos: `name`, `sku`, `price`, `createdAt`, `id`. Administração aceita também filtro `active`. Pedidos ordenam por criação decrescente e ID. Erros seguem Problem Details, sem stack traces ou detalhes internos de SQL.

<a id="testes"></a>
## Testes e CI

```powershell
.\mvnw.cmd clean verify
```

No Linux/macOS: `./mvnw clean verify`. O Docker precisa estar ativo para PostgreSQL/Testcontainers. Surefire executa testes unitários; Failsafe executa testes `*IT` na fase de integração. A suíte cobre regras, API, constraints, auth, CSRF, RBAC, ownership, rollback, snapshots, cancelamento e compra concorrente. Não substitui PostgreSQL por H2 nem considera mock uma prova de locking.

[Código de testes](src/test), [auditoria com resultados reais](docs/audit.md) e [pipeline](.github/workflows). O CI configura Java, usa cache Maven e executa `verify` com Docker no runner. Dependabot acompanha dependências; não há deploy automático. Execução remota só deve ser considerada aprovada após o workflow concluir com sucesso.

Frontend: em `frontend/`, execute `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`. Vitest/Testing Library cobrem formulários, carrinho, erros HTTP e guards. Playwright usa a stack real descartável para CUSTOMER, ADMIN, CSRF, ownership, concorrência e layouts; [instruções e dados controlados](frontend/README.md). A CI mantém o job backend `verify` e acrescenta `frontend` e `e2e` com Chromium, Docker e artefatos visuais. Confira as evidências atuais na [auditoria full-stack](docs/fullstack-audit.md).

<a id="execucao"></a>
## Docker e como executar

Pré-requisitos: Docker com engine Linux e Docker Compose; Java 21+ apenas para build local fora do container. Não é necessário instalar Maven globalmente.

```powershell
Copy-Item .env.example .env
# Edite .env e defina DB_PASSWORD e as credenciais ADMIN exigidas pelo Compose.
docker compose up --build -d
docker compose ps
```

Aplicação local: `http://localhost:8080`; API: `/api/v1`; health: `/actuator/health`. Compose usa `web` (Nginx non-root), `api` (Spring non-root) e `db` (PostgreSQL), volume persistente, rede interna e health checks. Somente o frontend publica porta em loopback; API e banco ficam internos. `WEB_PORT` altera a porta do host. O Compose exige credenciais de bootstrap para o primeiro acesso administrativo; fora dele, o bootstrap da aplicação é opcional. Um banco novo inicia sem produtos: crie-os e ajuste seus saldos pelo ADMIN. Não há dados fictícios injetados na execução normal.

Para editar a UI, execute `npm ci` e `npm run dev` em `frontend/`. Vite atende `http://localhost:5173` e encaminha `/api` à API em `http://localhost:8080`; `API_PROXY_TARGET` permite outra origem de desenvolvimento. Use a API no host conforme abaixo ou a stack Compose como destino. Não é necessário habilitar CORS amplo.

Para build local, forneça `JDBC_DATABASE_URL`, `DB_USERNAME` e `DB_PASSWORD` apontando para um PostgreSQL acessível e execute:

```powershell
.\mvnw.cmd clean verify
.\mvnw.cmd spring-boot:run
```

`JDBC_DATABASE_URL` padrão é `jdbc:postgresql://localhost:5432/ordersphere`; `DB_USERNAME` padrão é `ordersphere`. Variáveis no arquivo `.env` são lidas pelo Compose, não automaticamente pelo processo Maven. [Configuração e operação](docs/operations.md) detalham o fluxo e a preservação do volume.

<a id="documentacao"></a>
## Documentação e estudo

- [Arquitetura, diagrama e domínios](docs/architecture/overview.md).
- [ADR 001: monólito modular](docs/architecture/decisions/001-modular-monolith.md).
- [ADR 002: estoque concorrente](docs/architecture/decisions/002-inventory-concurrency-strategy.md).
- [ADR 003: snapshot do pedido](docs/architecture/decisions/003-order-price-snapshot.md).
- [ADR 004: autenticação por sessão](docs/architecture/decisions/004-authentication-strategy.md).
- [API e exemplos](docs/api.md), [operação](docs/operations.md) e [auditoria](docs/audit.md).
- [Conceitos com código real](docs/learning/concepts.md), [guia de entrevista](docs/learning/interview-guide.md) e [exercícios sem solução pronta](docs/learning/exercises.md).
- [Notas bilíngues da v0.1.0](docs/release-notes-v0.1.0.md).

<a id="limitacoes"></a>
## Limitações

Somente BRL; sem pagamentos, frete, impostos ou descontos. Não há microsserviços, mensagens ou cache externo. Sessões ficam em memória e se perdem ao reiniciar. Criação de pedido não possui chave de idempotência: repetir POST pode criar nova compra. A UI não faz retry automático; em uma falha de rede, consulte pedidos antes de confirmar novamente. O cancelamento é idempotente, mas pode reverter se a reposição exceder o limite após reabastecimento. Não há reserva temporária, recuperação de senha ou limitação distribuída de login. Dashboard não é analytics global; catálogo público não revela saldo. Acessibilidade automatizada não substitui auditoria com tecnologias assistivas. É um portfólio, sem certificação comercial.

<a id="roadmap-pt"></a>
## Roadmap

**v0.2.0:** implementação full-stack na feature, aguardando revisão; sem merge, tag ou release nesta missão. Próximas evoluções dependem de avaliação e necessidade observada; não há compromisso antecipado com infraestrutura distribuída.

## 🇺🇸 English

<a id="fullstack-en"></a>
### Full-stack experience

OrderSphere combines a modern full-stack experience with a transactional Java backend that keeps inventory consistent during concurrent purchases. The v0.2.0 feature adds React/TypeScript to released v0.1.1 without changing its Java contracts.

**CUSTOMER:** public searchable/sortable/paginated catalog, product details, persistent cart, registration/login, simulated checkout, own order history/details and cancellation. Cart totals are estimates; only product IDs and quantities reach checkout. The server determines prices and inventory. Conflicts retain cart contents and order POSTs are never retried automatically.

**ADMIN:** protected workspace, explicitly scoped operational dashboard, product creation/editing/status/filtering and inventory delta adjustments with preview and confirmation. No invented analytics, reviews or categories. Product illustrations are deterministic SKU placeholders, not product photos.

**Frontend:** React 19, strict TypeScript, Vite 8, React Router 7, TanStack Query 5, React Hook Form 7, Zod 4 and Lucide. Custom CSS tokens and an SVG wordmark avoid a large UI framework. Lazy routes split admin/auth/order code. Persistent light/dark themes, system fallback, keyboard focus, labels and native dialogs support responsive layouts.

**Security:** Spring owns the HttpOnly session cookie. Identity comes from `/auth/me`; one API client validates responses and centralizes credentials and server-provided CSRF headers. Login refreshes CSRF. HTTP401 clears identity/private queries; guards provide UX while Spring enforces RBAC and ownership. No JWT, password or session token is stored in browser storage; only a nonsensitive cart and theme preference persist.

The diagram in the Portuguese section shows Browser/React → same-origin Nginx → Spring Security/REST → transactional services → PostgreSQL. Node builds/tests the UI; Java remains the only backend. See [frontend instructions](frontend/README.md), [architecture](docs/architecture/frontend.md), [ADR 005](docs/architecture/decisions/005-react-frontend.md), [ADR 006](docs/architecture/decisions/006-same-origin-proxy.md), [learning](docs/learning/fullstack.md) and [full-stack audit](docs/fullstack-audit.md).

<a id="overview"></a>
### Overview

OrderSphere manages a product catalog, inventory and authenticated users' orders. Purchases preserve historical values and consume inventory in one transaction. Two simultaneous buyers cannot both purchase the same remaining unit. All 22 tests passed and Docker execution was verified; see the [audit](docs/audit.md) and [implementation report](docs/implementation-report.md). [v0.1.1 release](https://github.com/GuiNovaisz/ordersphere-java-commerce/releases/tag/v0.1.1).

<a id="purpose"></a>
### Purpose

This portfolio demonstrates Java, React, REST, domain modeling, authorization and PostgreSQL transactions/concurrency through verifiable examples. The frontend makes the backend guarantees visible while leaving price and inventory authority on the server.

<a id="features"></a>
### Features and domains

| Domain | Implemented behavior | Source |
| --- | --- | --- |
| Auth / User | CUSTOMER registration, password hashing, login, logout and identity | [`auth`](src/main/java/com/ordersphere/auth), [`user`](src/main/java/com/ordersphere/user) |
| Catalog | Create/update, activate/deactivate, unique normalized SKU and paginated filters | [`catalog`](src/main/java/com/ordersphere/catalog) |
| Inventory | Administrative balance queries/deltas and atomic consumption | [`inventory`](src/main/java/com/ordersphere/inventory) |
| Orders | Own-order creation/list/detail, price snapshots and idempotent cancellation | [`order`](src/main/java/com/ordersphere/order) |
| Shared | HTTP security, configuration, validation and consistent errors | [`shared`](src/main/java/com/ordersphere/shared) |

Public catalog requests return active products only. Administrators manage inactive products and inventory. Orders are scoped to the authenticated owner. Products are not physically deleted through the API.

<a id="tech-stack"></a>
### Tech stack

Java 21, Spring Boot 4.1.2, Spring MVC, Spring Security, Spring Data JPA/Hibernate, Bean Validation, PostgreSQL 17, Flyway, springdoc OpenAPI 3.2.0, Actuator, Maven Wrapper 3.9.12, JUnit Jupiter 6, Testcontainers, Docker Compose and GitHub Actions. The [`pom.xml`](pom.xml) defines dependency management.

<a id="architecture"></a>
### Architecture and data model

A modular monolith uses one application and one database, organized by feature. Controllers handle HTTP and DTOs; services coordinate use cases and transactions; entities preserve rules; repositories handle persistence. The diagram in the Portuguese section shows the same request path.

`app_users` owns `orders`; `orders` owns `order_items`. Each product has one inventory balance. Items snapshot SKU, product name and unit price. Successfully created orders are `CONFIRMED`; cancellation transitions to `CANCELLED` without reopening. See the [architecture overview](docs/architecture/overview.md) and [ADRs](docs/architecture/decisions).

<a id="concurrency"></a>
### Concurrency

A conditional PostgreSQL `UPDATE` subtracts inventory only when sufficient quantity remains. With one unit and two simultaneous requests for one unit, the expected result is **one success, one conflict, one stored order and zero remaining stock**. All item consumptions and order persistence belong to the same transaction, so any failure rolls back the whole purchase.

Products are processed in stable UUID order. Cancellation locks the order row and restores inventory only on the first state transition. The [concurrency ADR](docs/architecture/decisions/002-inventory-concurrency-strategy.md) compares atomic updates with optimistic and pessimistic locking; the [audit](docs/audit.md) records actual execution results.

<a id="security"></a>
### Security

Spring Security maintains a server-side session with an HttpOnly cookie. Login establishes identity and logout invalidates the session. State-changing requests, including registration and login, require CSRF tokens. Fetch the token/header name from `GET /api/v1/auth/csrf`, retain the cookie and fetch a fresh token after login/logout.

Registration always assigns `CUSTOMER`; administrative/unknown fields are outside the accepted input contract. `/api/v1/admin/**` requires `ADMIN`. Order access is scoped by owner and identifier; another user's order returns 404. Passwords are never returned. See [authentication](docs/architecture/decisions/004-authentication-strategy.md) and [API examples](docs/api.md).

Optional `ORDERSPHERE_ADMIN_EMAIL` and `ORDERSPHERE_ADMIN_PASSWORD` must be supplied together. Bootstrap creates an administrator only when none exists; it does not modify an existing administrator. Passwords require 12–64 characters and at most 72 UTF-8 bytes. Production requires HTTPS and `SESSION_COOKIE_SECURE=true`.

<a id="database"></a>
### Database

PostgreSQL is used both at runtime and in integration tests. Flyway applies [versioned migrations](src/main/resources/db/migration); JPA validates rather than recreates the schema. Constraints reinforce unique email/SKU, foreign keys and amount/quantity bounds.

Money is BRL `BigDecimal` with two decimal places; inputs requiring rounding are rejected. Price range is 0–999,999,999.99; inventory is 0–1,000,000,000; nonzero administrative deltas are bounded by ±1,000,000,000. Orders accept up to 50 distinct products and 1–1,000,000 units per line. SKU is uppercased and matches `[A-Z0-9][A-Z0-9_-]{0,63}`.

<a id="api-en"></a>
### API and endpoints

The base path is `/api/v1`. The [API guide](docs/api.md) documents requests and errors. OpenAPI is available at `/v3/api-docs`; Swagger UI at `/swagger-ui/index.html`.

| Method | Route | Access / purpose |
| --- | --- | --- |
| GET | `/auth/csrf` | Public; CSRF token |
| POST | `/auth/register`, `/auth/login` | Public with CSRF; registration/session |
| POST | `/auth/logout` | Session and CSRF; invalidation |
| GET | `/auth/me` | Authenticated identity |
| GET | `/products`, `/products/{id}` | Active catalog |
| GET | `/admin/products`, `/admin/products/{id}` | ADMIN; full catalog |
| POST | `/admin/products` | ADMIN; create |
| PUT | `/admin/products/{id}` | ADMIN; full update |
| PATCH | `/admin/products/{id}/status` | ADMIN; activation |
| GET | `/admin/inventory`, `/admin/inventory/{productId}` | ADMIN; balances |
| PATCH | `/admin/inventory/{productId}` | ADMIN; delta adjustment |
| POST | `/orders` | Authenticated purchase |
| GET | `/orders`, `/orders/{id}` | Own orders |
| POST | `/orders/{id}/cancel` | Own order and CSRF; cancellation |

Pagination uses zero-based `page` and `size` from 1 to 100, default 20. Catalog filters support partial `name`, exact `sku` and `sort=field,asc|desc` over `name`, `sku`, `price`, `createdAt`, `id`; administrators may also filter `active`. Orders use descending creation time then ID. Errors use Problem Details without SQL internals or stack traces.

<a id="testing"></a>
### Testing and CI

Run `.\mvnw.cmd clean verify` on Windows or `./mvnw clean verify` on Linux/macOS. Docker must be running for PostgreSQL/Testcontainers. Surefire runs unit tests; Failsafe runs `*IT` integration tests. Coverage targets domain rules, API, constraints, sessions, CSRF, RBAC, ownership, rollback, snapshots, cancellation and simultaneous purchases.

See [test source](src/test), [actual audit results](docs/audit.md) and [CI definitions](.github/workflows). GitHub Actions configures Java, caches Maven dependencies and runs `verify` with Docker available. Dependabot tracks dependencies. There is no automatic deployment; remote CI is approved only after a successful completed run.

Inside `frontend/`, run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. Vitest/Testing Library exercise validation, cart behavior, API errors and guards. Playwright uses a disposable real stack for customer/admin/security/concurrency and responsive visual checks. CI adds `frontend` and `e2e` jobs with Chromium and visual artifacts; see the [frontend guide](frontend/README.md) and [current evidence](docs/fullstack-audit.md).

<a id="running"></a>
### Docker and running locally

Requirements: Docker with Linux engine and Compose. Java 21+ is needed only for builds outside the container; a global Maven installation is unnecessary.

```powershell
Copy-Item .env.example .env
# Set DB_PASSWORD and the ADMIN bootstrap credentials required by Compose.
docker compose up --build -d
docker compose ps
```

The application listens at `http://localhost:8080`, API at `/api/v1`, health at `/actuator/health`. Compose runs non-root Nginx `web`, non-root Spring `api` and PostgreSQL `db`, with health checks, an internal network and a persistent volume. Only web publishes a loopback port, configured by `WEB_PORT`. Compose requires bootstrap credentials; a fresh database has no products. Use ADMIN to create products and adjust inventory. Normal startup never injects demo records.

For UI development, run `npm ci` and `npm run dev` inside `frontend/`. Vite serves port5173 and proxies `/api` to localhost8080 (override with `API_PROXY_TARGET`). Use the host API below or Compose as the proxy target, without broad CORS.

For a local Maven run, supply `JDBC_DATABASE_URL`, `DB_USERNAME` and `DB_PASSWORD` for a reachable PostgreSQL instance, then run the verification command followed by `.\mvnw.cmd spring-boot:run`. Default URL: `jdbc:postgresql://localhost:5432/ordersphere`; default username: `ordersphere`. Compose reads `.env`; Maven does not load that file automatically. See the [operations guide](docs/operations.md).

<a id="documentation"></a>
### Documentation and learning

- [Architecture overview and diagrams](docs/architecture/overview.md).
- ADRs: [modular monolith](docs/architecture/decisions/001-modular-monolith.md), [inventory concurrency](docs/architecture/decisions/002-inventory-concurrency-strategy.md), [price snapshots](docs/architecture/decisions/003-order-price-snapshot.md), [session authentication](docs/architecture/decisions/004-authentication-strategy.md).
- [API examples](docs/api.md), [operations](docs/operations.md), [audit](docs/audit.md).
- [Concepts grounded in code](docs/learning/concepts.md), [interview guide](docs/learning/interview-guide.md), [exercises](docs/learning/exercises.md).
- [Bilingual v0.1.0 release notes](docs/release-notes-v0.1.0.md).

<a id="limitations"></a>
### Limitations

BRL only; no payments, shipping, taxes, discounts, microservices, messaging or external cache. Sessions are in memory and lost on restart. Order creation has no idempotency key; the UI never automatically retries it. After a network failure, inspect orders before submitting again. Cancellation is idempotent but can roll back if stock restoration exceeds the cap. No temporary reservations, password recovery or distributed login limiting. The dashboard is not global analytics; public catalog responses do not reveal stock. Automated accessibility checks do not replace assistive-technology testing. This portfolio is not a commercially certified operation.

<a id="roadmap-en"></a>
### Roadmap

**v0.2.0:** full-stack implementation on the feature branch for review; no merge, tag or release in this mission. Future work requires evaluation and observed needs rather than premature distributed infrastructure.
