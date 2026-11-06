# Backend Foundation — auditoria final / final audit

## Português

**Data:** 2026-11-06. **Prontidão funcional: READY para revisão e PR futuro em dev.** A integração ainda não foi realizada. Esta avaliação não autoriza merges ou publicação. A tag/release histórica v0.1.0 já existente foi preservada; não foi criada ou movida nesta etapa.

### Auditoria inicial do código real

Todos os requisitos funcionais abaixo já estavam implementados na entrada desta tarefa. Não havia módulos obrigatórios não iniciados, nem lacuna funcional comprovada que justificasse reimplementar ou refatorar. O trabalho restante era revalidar a fundação, atualizar o fluxo de integração solicitado e registrar evidências atuais. Perfis adicionais não foram criados: variáveis de ambiente e propriedades dinâmicas dos testes cobrem os ambientes atuais.

| Área | Implementação e verificação |
| --- | --- |
| Fundação | Spring Boot 4.1.2; alvo Java 21; Maven Wrapper 3.9.12; build local com JDK 25.0.5, sem alterar Java global |
| Arquitetura | Monólito modular; auth, user, catalog, inventory, order, shared; controllers delegam, services coordenam, entidades preservam regras e repositories persistem |
| Modelo | AppUser, Product, Inventory, CustomerOrder e OrderItem; entidades JPA comuns, DTOs records, status enum |
| Auth/RBAC | Cadastro CUSTOMER, BCrypt custo 12, login, identidade por AuthenticationPrincipal, logout; ADMIN restrito; sessão HttpOnly, CSRF e rotação sessão/token; sem JWT manual |
| Catálogo | Listagem pública ativa, consulta, criação/atualização/status ADMIN; paginação limitada, filtros nome/SKU/status e ordenação permitida; SKU normalizado e único no banco |
| Estoque | Domínio próprio, consulta e ajuste ADMIN; consumo atômico; saldo entre 0 e 1 bilhão, protegido também por CHECK PostgreSQL |
| Pedidos | Criação transacional com 1–50 produtos distintos; quantidades válidas; status CONFIRMED → CANCELLED; cancelamento repetido/concorrente repõe somente uma vez |
| Dinheiro/snapshot | BigDecimal BRL, escala 2, UNNECESSARY: rejeita fração de centavo; subtotal e soma no domínio; snapshots productId, SKU, nome, preço, quantidade e subtotal preservam histórico |
| Ownership | Queries incluem id do proprietário; pedido alheio retorna 404 tanto em consulta quanto cancelamento; teste explícito Alice/Bob |
| Transações | create inclui consumo de todos os produtos e persistência; falha posterior desfaz consumo anterior; cancelamento inclui estado e reposição; rollback testado também no teto de reposição |
| Concorrência | UPDATE condicional quantity >= pedido; ordem estável UUID; lock pessimista no pedido ao cancelar; sem retry automático perigoso; ADR002 compara optimistic/pessimistic/atomic |
| PostgreSQL/Flyway | PG17 real nos testes e Compose; V1 em banco vazio; JPA validate; PKs, FKs, unicidade SKU/e-mail, saldo não negativo, subtotal e estado de cancelamento protegidos |
| OpenAPI | Contratos, sessão, CSRF, paginação e Problem Details; JSON OpenAPI 3.1 acessível; Swagger HTTP 200 no Compose novo |
| Docker | Multi-stage Java21, usuário ordersphere sem root; API loopback, DB sem porta publicada; volume novo e health checks saudáveis |
| Testes | 5 unitários + 16 integração, zero falhas/erros/ignorados; PostgreSQL via Testcontainers, sem H2; autenticação, CSRF, RBAC, IDOR, constraints, snapshot, rollback e concorrência |
| CI | Workflow executa clean verify, PostgreSQL real, imagem Docker e relatórios; preparado também para dev. O push final da feature é conferido antes da entrega; [execuções da branch](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions?query=branch%3Afeature%2Fbackend-foundation) |
| Documentação | README PT-BR/EN, quatro ADRs, Mermaid, API, operação, conceitos, entrevistas e exercícios já existentes; sem funcionalidades inexistentes anunciadas |

### Evidências reproduzíveis

- `.\mvnw.cmd -B -ntp clean verify`: BUILD SUCCESS. [5 unitários](verification/unit-tests.txt), [16 integração](verification/integration-tests.txt).
- Duas execuções adicionais de `.\mvnw.cmd -B -ntp "-Dit.test=BackendIT#twoSimultaneousHttpPurchasesCannotOversellOneUnit" failsafe:integration-test failsafe:verify`: ambas BUILD SUCCESS. [Resumo das três execuções](verification/concurrency-repetitions.txt).
- Em cada disputa: duas chamadas HTTP, usuários/sessões independentes, CyclicBarrier sem sleep, retornos 201 + 409, exatamente um pedido persistido, saldo final zero. Não é prova de ausência universal de deadlocks nem teste de carga.
- Compose com nome de projeto exclusivo, porta host alocada pelo Docker e volume novo: ambos healthy; SQL Flyway retornou versão 1 / success true; container API uid100 ordersphere. [Smoke](verification/compose-smoke.json): cadastro/login, catálogo ADMIN, ajuste, compra, cancelamento duplo e logout aprovados.
- `/v3/api-docs` retornou OpenAPI 3.1.0 e `/swagger-ui/index.html` HTTP200. Os containers exclusivos foram encerrados e o volume preservado. Nenhum serviço preexistente foi interrompido.
- Credenciais temporárias ficaram fora do Git; varredura dos arquivos rastreados contra essas credenciais passou. `.env` e target são ignorados. Revisão de logs: sem corpos completos, senhas/tokens; logger de erro SQL detalhado desabilitado para não expor e-mails por violação de constraint.

### Revisão específica

Não identifiquei overselling, IDOR, cálculo monetário com double/float, entidades expostas diretamente, parsing JWT nos controllers ou regras de estoque nos controllers. A coleção de itens é LAZY e usa BatchSize100 para evitar N+1 óbvio nas listagens paginadas até100; não foi realizada medição de performance ou auditoria de carga. Relações, transações e constraints foram conferidas junto dos testes, sem confundir revisão estática com medição.

### Git e integração

`main` e a nova `dev` permanecem em `685d7b3`. Dev foi criada da main estável, publicada com upstream origin/dev e proteção contra force push/exclusão. Não recebeu a feature. A branch ativa é feature/backend-foundation, upstream origin/feature/backend-foundation; todo trabalho atual permanece nela. Os commits anteriores foram preservados, sem reset/rebase/force push. CI e CONTRIBUTING agora descrevem `feature → dev → main`. A regra de push em dev entrará em seu conteúdo após futura integração; nenhum check foi exigido antecipadamente em dev de forma a bloquear seu bootstrap. Main conserva PR/check obrigatório e aprovação externa zero.

### Débitos e limites reais

Sessões em memória; sem rate limiter de login embutido (configurar proxy antes de exposição pública); sem recuperação de senha; criação de pedido sem Idempotency-Key pode duplicar compras em retries; cancelamento pode retornar409 se reposição exceder capacidade após reabastecimento. BRL apenas; sem pagamentos, frete, descontos ou frontend. São limites explícitos desta fundação, sem alegação de prontidão comercial irrestrita. JUnit Jupiter6 é a combinação compatível gerenciada pelo Spring atual, já documentada.

A configuração agrupada do Dependabot continua válida na feature e só será ativada após futura integração à branch padrão; não foi alterada nesta tarefa. A v0.1.0 histórica já existe: sua identidade não deve ser reutilizada para apontar outro commit. O versionamento de uma publicação futura precisará respeitar esse fato, sem apagar histórico.

**Ponto de parada:** critérios funcionais auditados; nenhuma nova funcionalidade necessária encontrada. Preparar revisão futura `feature/backend-foundation → dev`, revalidar após integração e promover `dev → main` somente com autorização. Nenhum PR, merge, tag ou release foi criado nesta auditoria.

## English

**Functional readiness: READY for review and a future PR into dev; not integrated.** All mandatory backend capabilities were already implemented. No missing feature or proven defect justified rewriting working code. This task revalidated the actual code, prepared the requested integration branch/CI route and recorded current evidence.

The feature-oriented Spring Boot monolith contains authentication/users, catalog, inventory, orders and shared concerns. JPA entities remain behind record DTOs. Session authentication uses BCrypt12, HttpOnly cookies, CSRF and rotation; CUSTOMER/ADMIN access and owner-scoped queries are tested. Product snapshots preserve historical BRL amounts using BigDecimal scale2. Atomic conditional stock decrements share one transaction with order persistence; sorted UUID processing reduces lock cycles. Cancellation locks the order and restores once. PostgreSQL constraints reinforce all critical invariants.

The clean Maven Wrapper build passed **5 unit and16 PostgreSQL17/Testcontainers integration tests**, with zero failures/errors/skips. The real two-purchase HTTP scenario passed in that suite and in two additional independent runs: one201, one409, one stored order and zero stock every time. Barriers, not sleeps, coordinate requests. Snapshot, rollback, RBAC, ownership, CSRF and concurrent cancellation checks passed. See the linked reports and concurrency summary above.

A fresh Compose project/volume passed migrations, health checks and the full smoke flow. The API runs as non-root, binds to loopback and leaves the database unexposed. OpenAPI3.1 and Swagger200 were confirmed. Only task-owned containers were stopped, preserving the volume. Temporary secrets stayed outside tracked files. Static review found no obvious overselling/IDOR, floating-point money, exposed JPA entities or controller business logic; batch fetching mitigates obvious order-item N+1. This was not a load test or a performance measurement.

Main and newly published dev remain at685d7b3; dev tracks origin/dev and blocks force push/deletion. All changes stay on feature/backend-foundation. CI is prepared for dev pushes and PRs, and CONTRIBUTING defines feature→dev→main. The final feature push is checked remotely before delivery. No PR, merge, tag or release was created; the historical v0.1.0 release remains untouched.

Known limits: process-local sessions, no built-in login rate limiter/password recovery, non-idempotent purchase POST retries, stock-cap cancellation conflicts, BRL only and no payments/frontend. Existing architecture, API/operations, learning/interview/exercise documentation remains applicable. Future integration requires review and revalidation on dev; promotion to main and any later release need explicit authorization and must not move the existing version tag.
