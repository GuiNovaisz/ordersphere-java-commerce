# OrderSphere v0.1.0 — Backend Foundation

Notas oficiais da v0.1.0 / Official v0.1.0 release notes. Consulte a [auditoria](audit.md) e a [GitHub Release](https://github.com/GuiNovaisz/ordersphere-java-commerce/releases/tag/v0.1.0).

## 🇧🇷 Português

### Objetivo e funcionalidades

Fundação backend de gerenciamento de catálogo, estoque e pedidos. Inclui cadastro/login/logout por sessão, identidade autenticada, papéis CUSTOMER/ADMIN, catálogo ativo público, gestão administrativa de produtos e saldo, criação de pedido com preço histórico e consulta/cancelamento por proprietário.

### Arquitetura e concorrência

Java 21 e Spring Boot em monólito modular por domínio, PostgreSQL com Flyway e DTOs independentes das entidades JPA. Estoque é consumido por atualização condicional atômica na mesma transação que persiste o pedido. Falhas revertem todos os itens. Cancelamento bloqueia o pedido e devolve estoque apenas uma vez. Preço, nome e SKU são preservados em snapshots.

### Segurança

Spring Security, senha com hash BCrypt, cookie HttpOnly, CSRF para mutações, RBAC e isolamento de pedidos pelo usuário autenticado. Cadastro não aceita atribuição de ADMIN. Erros não expõem stack traces ou credenciais. Bootstrap administrativo é opcional e controlado por ambiente.

### Testes e execução

Validação: 5 testes unitários e 16 de integração aprovados, sem falhas ou testes ignorados; PostgreSQL real e build Docker aprovados localmente e na CI. JUnit Jupiter 6 é a versão compatível gerenciada pelo Spring Boot atual.

Testes unitários para regras e integração com PostgreSQL/Testcontainers para API, autorização, constraints, rollback, histórico e concorrência real. O cenário central exige uma compra aceita e uma rejeitada para uma unidade. A [auditoria](audit.md) contém o resultado executado. GitHub Actions executa o build verificável; não há deploy automático.

Execução: copie `.env.example`, configure credenciais locais e use `docker compose up --build -d`. API local na porta 8080, Swagger UI em `/swagger-ui/index.html`. Verificação: `.\mvnw.cmd clean verify` ou `./mvnw clean verify`.

### Limitações e próximos passos

Somente BRL, sem pagamentos, frontend, reserva temporária ou descontos. Sessões em memória. Criação de pedido não tem chave de idempotência. Reposição de cancelamento respeita o teto de estoque. A v0.2.0 pode adicionar experiência Full Stack sobre os contratos REST existentes.

## 🇺🇸 English

### Purpose and features

A backend foundation for catalog, inventory and order management. It provides session registration/login/logout, authenticated identity, CUSTOMER/ADMIN roles, an active public catalog, administrative product/inventory management, purchase snapshots and owner-scoped order queries/cancellation.

### Architecture and concurrency

Java 21 and Spring Boot form a feature-oriented modular monolith with PostgreSQL/Flyway and DTOs separate from JPA entities. Conditional atomic updates consume inventory inside the order transaction; failures roll back all items. Cancellation locks the order and restores inventory once. Item snapshots retain historical price, name and SKU.

### Security

Spring Security provides BCrypt password hashing, HttpOnly session cookies, CSRF protection, RBAC and owner-scoped order access. Registration cannot assign ADMIN. Errors avoid stack traces and credentials. Optional administrator bootstrap is environment-controlled.

### Testing and execution

Validation: 5 unit and 16 integration tests passed without failures or skips; real PostgreSQL verification and Docker builds passed locally and in CI. JUnit Jupiter 6 is the compatible version managed by the current Spring Boot release.

Unit tests target domain rules. PostgreSQL/Testcontainers integration tests target API, access control, constraints, rollback, snapshots and real concurrency. The central scenario requires one accepted purchase and one rejection for one unit. Consult the [audit](audit.md) for actual results. GitHub Actions performs verification without automatic deployment.

Copy `.env.example`, set local credentials and run `docker compose up --build -d`. The local API uses port 8080; Swagger UI is `/swagger-ui/index.html`. Verify with `.\mvnw.cmd clean verify` or `./mvnw clean verify`.

### Limitations and next steps

BRL only; no payments, frontend, temporary reservations or discounts. Sessions are in memory. Order creation has no idempotency key. Cancellation restoration respects the stock cap. A future v0.2.0 may add a Full Stack experience on the existing REST contracts.
