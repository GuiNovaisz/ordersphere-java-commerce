# v0.2.0 — Full Stack Experience: auditoria e relatório / audit and report

Data: 2026-11-06. Branch: `feature/fullstack-experience`. Este documento descreve a implementação da feature; não anuncia release nem integração em dev/main.

## Português

### Status e escopo

**READY FOR REVIEW.** Validação local concluída e implementação publicada com os três jobs remotos aprovados inicialmente na [execução42311349958](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/runs/42311349958), commit713f98b. A revisão acrescentou uma correção de cache no logout e nova asserção de regressão; a CI do HEAD final também é acompanhada até concluir antes da entrega. A execução exata do fechamento consta no relatório de entrega e na [lista filtrada da feature](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions?query=branch%3Afeature%2Ffullstack-experience). A fundação publicada v0.1.1 permanece a base (`a5f2174c61c5661e97d9824c008effa874c3902d`). Nenhum arquivo Java, migration, teste backend ou pom foi alterado. Não houve merge, PR, tag, release ou deploy público.

### Sumário de evidências

- [README bilíngue e entrada do produto](../README.md).
- [Frontend e comandos reproduzíveis](../frontend/README.md).
- [Arquitetura, sessão/CSRF, estado e proxy](architecture/frontend.md).
- [ADR005: React SPA](architecture/decisions/005-react-frontend.md), [ADR006: mesma origem](architecture/decisions/006-same-origin-proxy.md).
- [Galeria de capturas reais](screenshots/README.md).
- [Aprendizado full-stack](learning/fullstack.md), [entrevista](learning/interview-guide.md), [operação](operations.md).
- [CI](../.github/workflows/ci.yml), [E2E real](../frontend/e2e/fullstack.spec.ts), [backend existente](../src/test).

### Stack e escolhas

| Área | Versão instalada | Papel |
| --- | --- | --- |
| React / React DOM |19.3.1| Interface por componentes |
| TypeScript |6.0.3| Strict na aplicação/configuração/E2E |
| Vite / plugin React |8.3.6 /6.2.1| Desenvolvimento e build estático |
| React Router |7.18.5| Rotas públicas, autenticadas e ADMIN |
| TanStack Query |5.106.1| Estado remoto/cache/invalidação/AbortSignal |
| RHF / resolvers |7.91.0 /7.0.3| Estado e integração de formulários |
| Zod |4.6.7| Schemas de entrada/resposta e tipos inferidos |
| Lucide |1.70.0| Ícones leves/consistentes |
| ESLint / hooks |10.14.0 /7.1.1| Regras TS e ordem/dependências de hooks |
| Prettier |3.9.10| Formatação reproduzível |
| Vitest / Testing Library React |5.1.0 /16.3.3| Testes unitários/componentes |
| Playwright / axe-core |1.65.0 /4.14.0| Chromium headless e acessibilidade automatizada |

CSS próprio com tokens atende à identidade sem biblioteca visual pesada. Não há Redux, SSR ou backend Node. Docker constrói frontend com Node24 e executa Nginx unprivileged; Java21/SpringBoot4.1.2/PostgreSQL17 continuam intactos. Lockfile versionado e `npm ci` foram verificados. Override minimatch11.0.5 corrige advisory transitivo; `npm audit` retornou0 vulnerabilidades, incluindo dev, na verificação local.

### Arquitetura e funcionalidades

`app` compõe providers/guards/layout; `features` separa auth, catálogo, carrinho, pedidos e admin; `components/ui` compartilha estados/dialog/paginação; `lib/api` centraliza HTTP; `types/api` valida contratos. TanStack Query mantém dados remotos, Context carrinho/feedback e RHF campos. Queries paginadas e rotas lazy reduzem carregamento; build principal cerca de472kB bruto/146kB gzip, CSS cerca de35kB, com chunks separados de auth/carrinho/pedidos/admin.

| CUSTOMER | Resultado implementado/verificado |
| --- | --- |
| Storefront e catálogo | Público, paginação zero-based, nome parcial, SKU exato, sort permitido e URL compartilhável |
| Produto | Campos reais e placeholder por SKU; sem estoque público inventado |
| Carrinho | Adicionar/remover/limpar, +/- e quantidade manual validada, persistência, badge e estimativas |
| Cadastro/login/logout | CUSTOMER sem escolha de papel; cadastro não autentica; retorno local, restauração e saída |
| Checkout | Compra simulada; payload somente IDs/quantidades; backend decide preço/saldo; sem retry de POST |
| Pedidos | Próprios pedidos paginados, detalhes/snapshots históricos e estado confirmado/cancelado |
| Cancelamento | Dialog com foco inicial seguro/Escape, feedback e atualização de queries; servidor idempotente |

| ADMIN | Resultado implementado/verificado |
| --- | --- |
| Acesso | Guard aguarda identidade e exige ADMIN; API nega CUSTOMER diretamente |
| Dashboard | Total de produtos da API; ativos/alertas limitados aos dados carregados e escopo explícito |
| Produtos | Busca, SKU, status, paginação, sort, criação, edição, ativação/desativação |
| Formulários | RHF/Zod, labels/erros associados e regras compatíveis com DTOs |
| Estoque | Página real de saldos, consulta por ID, delta positivo/negativo, prévia, limites e confirmação |

O dashboard não declara receita, conversão, vendas globais ou analytics que não existam. Produtos novos começam com estoque zero. Nomes não retornados na listagem de estoque não são inventados; detalhe consulta o produto real. O painel de ajuste fica antes da lista em telas menores e seleção leva ao painel, evitando uma operação escondida após dezenas de cards.

### Segurança e tratamento de falhas

- Sessão Spring com cookie HttpOnly/SameSite=Lax; HttpOnly confirmado no browser e invisível a `document.cookie`. Secure é falso somente no HTTP local; produção futura exige HTTPS/configuração deliberada.
- Identidade vem de `/api/v1/auth/me`. Login renova CSRF e preserva a query observada de identidade; logout navega à rota pública antes de limpar identidade. Logout remove consultas privadas e preserva as públicas recém-abertas; E2E verifica que os produtos voltam a aparecer sem recarregar o navegador.
- Token CSRF fica só em memória; headerName vem da API. Registro/login e todas as mutações usam o mecanismo central. 401/403/logout descartam o token. Mutação não é repetida automaticamente.
- 401 limpa identidade/consultas privadas, preservando consultas públicas em andamento. Guards são UX; Spring continua a autoridade de RBAC/ownership.
- CUSTOMER recebe403 na API administrativa e não abre tela admin. Outro usuário recebe404 ao consultar/cancelar pedido alheio, inclusive chamada direta.
- CSRF inválido gera403 legível, exatamente um POST e carrinho preservado. Falha de proxy503 mostra alert e permite repetir apenas a consulta. Compra de resultado incerto orienta consultar pedidos antes de reenviar.
- Problem Details permanece modelado no erro técnico; a tela não exibe JSON/SQL/stack trace. Erros críticos de operação permanecem em alert; sucesso usa notificação.
- LocalStorage contém somente `ordersphere:cart:v1` e tema; sessionStorage vazio. Sem JWT, senha, sessão ou cache administrativo persistido.
- Nginx aplica CSP self, frame-ancestors none, nosniff e referrer policy. Sem origem externa de imagens/fontes, CORS amplo ou API paralela.

### Testes e resultados locais

| Verificação | Resultado |
| --- | --- |
| Instalação limpa `npm ci` | Aprovada; árvore do lock reproduzida |
| Prettier, ESLint e TypeScript strict | Aprovados, sem warnings de lint |
| Vitest / Testing Library |24 testes,6 arquivos;0 falhas |
| Frontend production build | Aprovado; sem aviso de chunk grande |
| `npm audit` |0 vulnerabilidades na árvore completa |
| Maven `clean verify` |5 unitários +17 integração =22;0 failures/errors/skips |
| Docker full-stack | Clean-start com volume novo, migrations e três serviços saudáveis |
| Playwright real |12 cenários aprovados,1 worker,0 retries |
| YAML da CI | Parse local com js-yaml, sem duplicações; jobs verify/frontend/e2e |

Os24 testes cobrem carrinho/cálculo/serialização/limites, schemas/formulário, header CSRF/credentials/rotação/logout, erros401/409/proxy, redirects/guards e estados/paginação. Os22 testes Java existentes continuam provando regras, persistência, rollback, locking/concorrência, snapshots, segurança e cancelamento com PostgreSQL real.

Os12 E2Es são: catálogo/carrinho persistente e quantidade manual; CUSTOMER completo; ADMIN completo; guard/RBAC; ownership; dois compradores/última unidade; CSRF inválido/401; vazio/404/login inválido/proxy503/recuperação/SKU; e quatro auditorias visuais (desktop/notebook/tablet/mobile). Apenas a falha de proxy é injetada deliberadamente para testar resiliência; compra, autorização e concorrência usam HTTP/Spring/PostgreSQL reais.

Na corrida: duas sessões independentes enviam checkout, respostas201/409, exatamente um pedido persistido, saldo final0 e carrinho intacto para quem recebeu conflito. Nenhum mock representa essa garantia. Os testes também verificam foco/Escape do dialog, cookie/storage e ausência de erros JavaScript nas auditorias visuais.

### Visual e acessibilidade

Identidade esmeralda/creme, wordmark orbital SVG, hierarquia tipográfica, espaços consistentes e arte determinística. Tema escuro usa tokens próprios e preferência persistida com fallback do sistema. CSS trata reduced motion, foco visível, skip link, labels, erros associados e tabelas/cards responsivos.

Capturas automáticas cobrem home/catálogo, produto, login/cadastro, carrinho/checkout, pedidos/detalhe/conta, dashboard, lista/formulários/edição/inventário ADMIN e tema escuro. Viewports1440×1000,1280×800,768×1024,390×844 com asserts de overflow. Catálogo passa axe WCAG2A/AA/2.1AA nos quatro; isso não certifica toda aplicação. Navegação/foco/Escape do dialog é testada. Inspeção de capturas verificou hierarquia, alinhamento, recorte, campos, botões e legibilidade; corrigiu miniaturas ADMIN, margens do rodapé e localização mobile do ajuste.

Nove imagens selecionadas são versionadas; demais capturas ficam ignoradas localmente e em artefatos de CI. A [galeria](screenshots/README.md) explica fixtures e dimensões. Nenhum dado pessoal real foi usado.

### Docker, operação e CI

`web` Nginx8080 non-root (UID101) → `api` Spring8080 non-root (`ordersphere`) → `db` PostgreSQL5432. Só web publica loopback; API/banco sem host ports. Health checks seguem db → api → web; volume persiste dados. `WEB_PORT` substitui a antiga porta da API no Compose. `/api`, health e documentação usam a mesma origem, sem mudar contratos Java.

Execução padrão: copiar `.env.example`, definir credenciais locais e `docker compose up --build -d`, acessar localhost8080. A auditoria usa projeto/volume separado com porta dinâmica, sem tocar dados do usuário. O início do projeto novo foi validado antes do seed E2E. Node é etapa de build, não runtime de negócio. Desenvolvimento Vite/proxy e backend Maven estão documentados em operação/frontend.

A CI preserva `verify` (Java21,22 testes/PostgreSQL e imagem backend) e adiciona `frontend` (Node24, npmci, format/lint/type/test/build/audit prod) e `e2e` (Chromium, Compose novo,12cenários e artefatos). O nome histórico do workflow permanece Backend CI para preservar o contexto existente. Credenciais da CI são públicas e sintéticas apenas no runner descartável. O teardown remove apenas o projeto de teste. Resultado remoto: **verify/frontend/e2e success**, [execução42311349958](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/runs/42311349958), registrada em [evidência CI](verification/fullstack-ci.json). A [evidência local sanitizada](verification/fullstack-local.json) resume as verificações executadas sem credenciais.

### Auditoria e débitos

**Critical:** nenhum pendente identificado na validação local. Sessão, CSRF, autorização, checkout, ownership e concorrência foram executados.

**Important:** nenhum defeito de implementação pendente identificado na auditoria. A revisão humana do resultado precede qualquer integração; o HEAD final também é verificado na CI antes da entrega. A política desta missão mantém a feature isolada.

**Optional / limites conhecidos:** teste com leitor de tela e mais browsers (suíte atual Chromium); internacionalização completa; idempotência de criação no servidor para resultados incertos; imagens reais se houver evolução contratual; analytics somente com endpoint adequado; monitoramento de bundle e remoção futura do override transitivo. Valores monetários JSON são números no contrato atual; backend usa BigDecimal exato, mas exibição em JavaScript pode perder precisão em totais extremos além de Number seguro. Evolução para decimal string e formatação exata exigiria contrato específico; carrinho continua estimativa. Sem pagamentos, frete, impostos, reserva, recuperação de senha, armazenamento distribuído de sessão ou deploy de produção.

### Git e prontidão

Feature criada de dev na base da v0.1.1. Main continua padrão; main/dev/tags existentes não mudam. Upstream: `origin/feature/fullstack-experience`. Commits de implementação: `12d70e6` (frontend/testes/runtime web) e `713f98b` (Compose/proxy/CI); `32c12e5` reúne documentação/evidências/capturas. A auditoria final acrescentou uma correção de cache público no logout com teste de regressão que primeiro reproduziu a falha. O HEAD e sincronização exatos são informados no relatório de entrega e podem ser reproduzidos com `git log -4 --oneline`, `git status -sb` e `git rev-list --left-right --count origin/dev...HEAD`. Não abrir PR, fazer merge, criar v0.2.0 ou iniciar v0.3.0 nesta missão. A direção futura autorizável é `feature/fullstack-experience → dev`, após revisão.

The complete English version follows below.

## English

### Scope and architecture

**READY FOR REVIEW.** The v0.2.0 feature adds a complete React/strict TypeScript SPA to v0.1.1 without changing Java source, migrations, backend tests or pom. Java remains the only backend. No PR, merge, tag, release or public deployment is performed. All three initial implementation jobs passed in [run42311349958](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/runs/42311349958), commit713f98b. Final review added the logout cache regression fix; the final HEAD is also watched through remote CI before delivery. Its exact run is in the delivery report and the [feature-filtered Actions list](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions?query=branch%3Afeature%2Ffullstack-experience).

The version table above records the installed stack. Features separate auth/catalog/cart/orders/admin; app owns providers/guards/layout; a single HTTP client centralizes credentials, CSRF, Problem Details and runtime Zod response validation. Query owns server state, context cart/feedback, RHF form state. Custom CSS tokens and SVG/Lucide provide identity without a large UI framework. Lazy routes split large features.

### Product/security results

CUSTOMER can browse/filter/sort/page, open products, persist/edit cart, register/login, complete simulated checkout, view own historical orders, cancel and log out. ADMIN can access a protected workspace, scoped dashboard, product creation/editing/status/filtering and inventory delta preview/confirmation. No fake reviews/categories/analytics or public stock counts. Cart sends IDs/quantities only; server prices, stock and snapshots remain authoritative.

Spring owns HttpOnly/SameSite=Lax sessions and `/auth/me`. Browser assertions verify HttpOnly and JS invisibility. CSRF uses the server-provided header, remains in memory and refreshes after login; logout/401/403 reset it. No mutation retries. 401 clears identity/private data while preserving public requests; login/logout avoid observed-query/guard races. Spring enforces RBAC and owner-scoped orders even through direct API calls. Local storage contains only cart/theme, session storage is empty, no JWT/password/session token persists. Nginx adds CSP/nosniff/referrer protection on the same origin.

### Verification

Reproducible npmci, format/lint/strict typecheck,24 Vitest/component tests, production build and npm audit (zero vulnerabilities) passed. Maven clean verify passed5unit +17integration =22, zero failures/errors/skips. Java21 remains the target; local Maven used a process-scoped JDK25, and CI runs21.

Twelve real Chromium E2Es pass with one worker/no retries: catalog/persistent cart/manual quantity, full customer journey, full admin journey, RBAC, ownership, concurrent final-unit checkout, invalid CSRF/401, UI empty/404/invalid-login/proxy-outage/recovery/SKU states, plus four responsive audits. Only the proxy outage is intentionally injected; transaction/security/concurrency use actual HTTP/Spring/PostgreSQL. Competing buyers yield201/409, one stored order, zero stock and a retained loser cart. Dialog focus/Escape, cookie/storage and uncaught runtime errors are asserted.

Visual captures cover all major public/customer/admin screens at1440×1000,1280×800,768×1024 and390×844. Light/dark persistence and overflow are checked. Catalog axe WCAG2A/AA/2.1AA checks pass in four viewports; this is not a full accessibility certification. Inspection corrected thumbnails, footer margins and mobile adjustment placement. Nine selected images are versioned; remaining captures are CI artifacts using synthetic data only.

### Infrastructure, documentation and limits

Compose runs non-root Nginx (UID101), non-root Spring and PostgreSQL, with database → API → web health dependencies and persistent storage. Only web publishes a loopback host port; API/database remain internal. A clean new project/volume started successfully before API fixture seeding. Default app URL is localhost8080 (`WEB_PORT`); audit uses a dynamic local port. Vite development proxies `/api`, and Node only builds/tests assets.

CI preserves Java21 `verify` and adds Node24 `frontend` plus real-stack `e2e`, browser artifacts and disposable teardown. YAML parsed locally without duplicate mappings. See root/frontend READMEs, architecture diagrams, ADR005/006, operations, learning/interview/exercises and screenshot gallery. MIT remains unchanged.

No Critical or Important implementation issue remains identified. Human review precedes integration and the final HEAD is also checked in CI. Optional/future work includes assistive-technology/multi-browser audits, full localization, server idempotency, real image contracts/analytics only when justified, bundle monitoring and retiring the minimatch override. Current numeric JSON can lose display precision for extreme totals beyond JavaScript safe precision, while backend BigDecimal remains exact; a decimal-string contract would require explicit evolution. No production payments/shipping/tax/reservations/password recovery/distributed sessions or public deployment.

The feature tracks `origin/feature/fullstack-experience` and remains isolated from main/dev/existing tags. Initial implementation commits are12d70e6 and713f98b;32c12e5 contains documentation/evidence/screenshots. Final audit added a public-query cache fix on logout, proven by a regression assertion that first failed and then passed; logout retains the newly opened catalog while clearing private state. The delivery report gives the final HEAD/CI/synchronization. See sanitized [local](verification/fullstack-local.json) and [CI](verification/fullstack-ci.json) evidence. Only after review may an authorized feature → dev integration proceed.
