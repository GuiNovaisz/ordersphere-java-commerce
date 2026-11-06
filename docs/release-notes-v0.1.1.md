# OrderSphere v0.1.1 — Backend Foundation Consolidated

## 🇧🇷 Português

A v0.1.0 foi a publicação inicial do OrderSphere e permanece preservada com sua tag e seus artefatos originais. A v0.1.1 consolida a Backend Foundation após auditoria adicional, adoção do fluxo `feature → dev → main` e revisão de CI/dependências. Não há alteração incompatível do contrato REST que justifique minor/major. Esta versão encerra oficialmente a fase backend v0.1.x; a próxima milestone planejada é v0.2.0 Full Stack, ainda não iniciada.

### Funcionalidades

- Monólito modular Java 21/Spring Boot com PostgreSQL 17 e Flyway.
- Cadastro, login, logout, BCrypt, sessão HttpOnly e proteção CSRF.
- Autorização CUSTOMER/ADMIN e isolamento dos pedidos por proprietário.
- Catálogo ativo público; gestão administrativa de produtos, SKU único, filtros e paginação.
- Inventário com ajustes administrativos e consumo seguro; criação/consulta de pedidos e cancelamento idempotente.
- Snapshots de produto e preço preservam o histórico das compras.

### Consistência e evidências

Consumo de estoque, pedido e itens compartilham uma transação. A atualização condicional atômica no PostgreSQL impede overselling; cancelamento bloqueia o pedido e repõe estoque uma vez. Falhas revertem o conjunto.

O teste com PostgreSQL real, duas sessões HTTP e barreira de sincronização confirma:

```text
stock = 1
simultaneous buyers = 2
successful orders = 1
rejected orders = 1
persisted orders = 1
final stock = 0
```

Outro teste provoca rejeição na persistência de OrderItem usando uma constraint temporária somente no banco descartável: o pedido e os itens não persistem, e o estoque é restaurado. Também são testados snapshot histórico, ownership, RBAC, CSRF, constraints e cancelamentos repetidos/concorrentes.

### Qualidade e execução

5 testes unitários e 17 de integração PostgreSQL/Testcontainers, sem falhas, erros ou skips. Build limpo e CI validam a consolidação. Docker Compose foi auditado com banco/volume novos, migrations automáticas e health checks. API em container sem root; Swagger/OpenAPI e documentação arquitetural/educacional bilíngue disponíveis.

Execução: copie `.env.example`, defina credenciais locais e execute `docker compose up --build -d`. Swagger: `/swagger-ui/index.html`; health: `/actuator/health`. O JAR anexado exige Java 21+ e PostgreSQL configurado por variáveis de ambiente. Confira o download com `SHA256SUMS.txt`.

### Limitações conhecidas

Somente BRL; sessões em memória; sem pagamentos e frontend; criação de pedidos sem Idempotency-Key; rate limiting de login delegado à infraestrutura/proxy. Não foram incluídas novas funcionalidades ou refatorações nesta promoção.

**🇺🇸 The complete English version follows immediately below.**

## 🇺🇸 English

Version 0.1.0 was the initial OrderSphere publication and remains preserved with its original tag and assets. Version 0.1.1 consolidates the Backend Foundation after additional audit, adoption of `feature → dev → main`, and CI/dependency review. No incompatible REST change calls for a minor/major bump. This release officially closes backend v0.1.x; the next planned milestone is v0.2.0 Full Stack, which has not started.

### Features

Java 21/Spring Boot modular monolith with PostgreSQL 17/Flyway; registration/login/logout, BCrypt, HttpOnly sessions and CSRF; CUSTOMER/ADMIN authorization and owner-scoped orders; active public catalog, administrative product/inventory management, SKU uniqueness, filtering and pagination; transactional orders, historical product/price snapshots and idempotent cancellation.

### Consistency and evidence

Inventory consumption, order and items share one transaction. Conditional atomic PostgreSQL updates prevent overselling; cancellation locks the order and restores inventory once. The real PostgreSQL/HTTP concurrency test produces the exact six results shown above: one unit, two simultaneous buyers, one success, one rejection, one persisted order and zero remaining stock.

A separate test forces OrderItem persistence rejection using a temporary constraint only in a disposable database, proving rollback of the order/items and restoration of stock. Historical snapshots, ownership, RBAC, CSRF, database constraints and repeated/concurrent cancellation are also covered.

### Quality and execution

5 unit and 17 PostgreSQL/Testcontainers integration tests, with zero failures/errors/skips. Clean builds and CI validate consolidation. Docker Compose was audited against a fresh database/volume with automatic migrations and health checks; the API runs as non-root. Swagger/OpenAPI and bilingual architecture/learning documentation are included.

Copy `.env.example`, set local credentials and run `docker compose up --build -d`. Swagger: `/swagger-ui/index.html`; health: `/actuator/health`. The attached executable JAR requires Java 21+ and environment-configured PostgreSQL; verify downloads using `SHA256SUMS.txt`.

### Known limitations

BRL only, in-memory sessions, no payments/frontend, no Idempotency-Key for order creation, infrastructure/proxy login rate limiting. This promotion introduces no new features or refactoring and does not rewrite the historical release.
