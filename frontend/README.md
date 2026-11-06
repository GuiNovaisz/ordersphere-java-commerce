# OrderSphere Web

## Português

SPA React/TypeScript da v0.2.0. Java/Spring é o único backend. A API real e seus DTOs são a fonte de verdade. [Arquitetura](../docs/architecture/frontend.md) · [Auditoria](../docs/fullstack-audit.md) · [Aprendizado](../docs/learning/fullstack.md).

### Desenvolvimento

Requer Node24+ e npm, backend acessível (Compose ou execução Maven) e Docker Linux para a stack real.

```powershell
cd frontend
npm ci
npm run dev
```

Acesse `http://localhost:5173`; `/api` é encaminhado a `http://localhost:8080`. Opcional: `$env:API_PROXY_TARGET='http://localhost:outra-porta'` antes de iniciar. Não coloque segredo em `VITE_*`; não há variável frontend com senha/token. Para rodar tudo, use o Compose na raiz com `.env` local. O proxy Nginx entrega o build e a API na mesma origem. Um banco novo é vazio: ADMIN cria produtos e seus saldos; cadastro público cria apenas CUSTOMER.

### Verificações

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

`npm run typecheck` verifica aplicação, configuração e E2E em strict. Vitest/Testing Library testam comportamento de carrinho, validação, API e guards. Build gera `dist`, não versionado. `npm run preview` inspeciona assets, mas não fornece o proxy API de desenvolvimento; use Compose para uma experiência completa com o build de produção.

### E2E real e dados controlados

**Use somente stack descartável.** A suíte registra clientes, cria produtos e modifica estoque via endpoints reais com CSRF. Não usa mocks para provar transações nem altera SQL diretamente. O prefixo `OS-DEMO-*` identifica os produtos de teste; seu estoque é normalizado pela suíte. Outros produtos têm identificadores aleatórios próprios. Os testes não conhecem contas antigas; ADMIN vem de bootstrap da stack isolada.

Exemplo em PowerShell, na raiz, após definir senhas sintéticas somente no ambiente do processo:

```powershell
$env:DB_PASSWORD = '<senha sintética do banco de teste>'
$env:ORDERSPHERE_ADMIN_EMAIL = 'admin@ordersphere.test'
$env:ORDERSPHERE_ADMIN_PASSWORD = '<senha sintética de 12 a 64 caracteres>'
$env:WEB_PORT = '18080'
docker compose -p ordersphere-e2e up -d --build --wait --wait-timeout 180
if ($LASTEXITCODE -ne 0) { throw 'Stack indisponível' }
cd frontend
npm ci
$env:PLAYWRIGHT_SKIP_BROWSER_GC = '1'
npx playwright install chromium
$env:E2E_BASE_URL = 'http://localhost:18080'
$env:E2E_ADMIN_EMAIL = $env:ORDERSPHERE_ADMIN_EMAIL
$env:E2E_ADMIN_PASSWORD = $env:ORDERSPHERE_ADMIN_PASSWORD
npm run e2e
cd ..
# Somente o projeto descartável acima: remove os dados de teste dele.
docker compose -p ordersphere-e2e down -v
```

Escolha porta livre e nome de projeto exclusivo se `ordersphere-e2e` já existir. Não reutilize volume com um ADMIN diferente: bootstrap não altera senhas existentes. Senhas e cookies não são versionados; Playwright não salva storageState, vídeo ou trace. Screenshots de falha podem conter dados da tela, portanto use só fixtures sintéticas. A CI usa credenciais públicas exclusivamente no ambiente efêmero do runner, nunca como segredo real.

Playwright executa headless, contexto isolado, um worker e zero retries. Cobre catálogo/carrinho, CUSTOMER completo, ADMIN completo, RBAC, ownership, CSRF/401 e duas compras concorrentes pela última unidade. Quatro auditorias capturam telas em desktop1440×1000, notebook1280×800, tablet768×1024 e mobile390×844, com ambos os temas e detecção de overflow. Axe verifica o catálogo nos viewports; inspeção visual humana complementa automação. `playwright-report`/`test-results` são ignorados. Capturas de documentação ficam em `docs/screenshots`; imagens selecionadas são versionadas, demais podem ser artefatos de CI.

### Decisões e limites

- TanStack Query: estado remoto, invalidação e cancelamento; context: carrinho/feedback. Nenhum Redux necessário.
- Sessão HttpOnly e CSRF em memória; sem JWT, senha ou token em local/sessionStorage. Apenas carrinho/tema persistem.
- Checkout envia IDs/quantidades. Preço local é estimado, não reserva saldo. Sem pagamento real e sem retry automático de POST.
- Produtos não possuem imagens na API; arte CSS determinística não representa fotografia real.
- Dashboard identifica o escopo carregado; API não oferece analytics global nem pedidos administrativos globais.
- CSS próprio com tokens e dialog nativo reduz dependências; acessibilidade automatizada não substitui teste com leitor de tela.
- `minimatch` usa override transitivo corrigido; justificativa na [ADR005](../docs/architecture/decisions/005-react-frontend.md). Lockfile fixa a árvore reproduzível.

The complete English version follows below.

## English

React/strict TypeScript SPA for v0.2.0. Java/Spring remains the only backend. See [architecture](../docs/architecture/frontend.md), [audit](../docs/fullstack-audit.md) and [learning](../docs/learning/fullstack.md).

Use Node24+/npm. Run `npm ci` and `npm run dev` in this directory; localhost5173 proxies `/api` to localhost8080, configurable by `API_PROXY_TARGET`. The target may be Compose or the host Spring application. No frontend environment variable contains credentials. Use root Compose for the complete built application; fresh databases start empty and ADMIN creates products/inventory.

Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm audit`. Strict checking includes browser tests. `dist` is generated/ignored. `preview` serves assets, not the documented API proxy; Compose validates the production build.

**Real E2E modifies data: use a disposable Compose project/volume and synthetic credentials only.** The PowerShell procedure above starts `ordersphere-e2e` on18080, installs isolated Chromium, sets `E2E_BASE_URL`, `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, then runs tests and removes only that disposable project's volume. Choose another project name/port if already in use. Existing ADMIN credentials are never reset by bootstrap. Fixtures use real API/CSRF, no SQL mocks. CI credentials are public test-only values inside an ephemeral runner.

Playwright runs headless with one worker, zero retries and isolated contexts. Tests cover customer/admin journeys, RBAC/ownership, CSRF/401 and competing purchases for one remaining unit. Visual audits use desktop1440×1000, notebook1280×800, tablet768×1024 and mobile390×844, both themes, overflow assertions and catalog axe checks. Visual inspection complements automation. Reports are ignored; documentation screenshots may be versioned. No storageState, trace or video is saved; screenshots require synthetic data.

TanStack Query owns server state, context owns cart/feedback and RHF/Zod owns forms. Session cookies are HttpOnly; CSRF stays in memory, no JWT/password/session token in browser storage. Only cart/theme persist. Cart prices are estimates; checkout sends IDs/quantities and never automatically retries POST. CSS artwork is a deterministic placeholder. Dashboard metrics explicitly state their loaded-page scope. The minimatch override is explained in ADR005. There are no real payments, fake analytics, image API fields or second backend.
